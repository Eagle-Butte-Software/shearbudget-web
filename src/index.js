const APEX = "https://shearbudget.com";

const REDIRECT_HOSTS = new Set([
  "www.shearbudget.com",
  "shearbudget.app",
  "www.shearbudget.app",
]);

const ACCOUNT_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "connect-src 'self' https://xunwcyhpnxlsoaucbscq.supabase.co",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
].join("; ");

export function redirectLocation(url) {
  const host = url.hostname.toLowerCase();
  if (!REDIRECT_HOSTS.has(host)) return null;
  return new URL(url.pathname + url.search, APEX).toString();
}

export function helpRedirectLocation(url) {
  const path = url.pathname.replace(/\/+$/, "") || "/";
  if (path === "/help" || path === "/help.html") {
    return new URL("/guide" + url.search, url.origin).toString();
  }
  return null;
}

// Plaid appends ?oauth_state_id= to the redirect URI. A 301/307 that drops
// that query (trailing-slash HTML handling, or /index.html canonicalization)
// breaks Link. Serve the document as 200 and leave the browser URL alone.
export function isPlaidOAuthDocument(pathname) {
  const path = pathname.replace(/\/+$/, "") || "/";
  return path === "/plaid-oauth" || path === "/plaid-oauth/index.html";
}

function applySecurityHeaders(headers, isAccount = false) {
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (isAccount) {
    headers.set("Content-Security-Policy", ACCOUNT_CSP);
  }
}

async function servePlaidOAuth(request, env) {
  const assetUrl = new URL(request.url);
  assetUrl.pathname = "/plaid-oauth";
  assetUrl.search = "";
  assetUrl.hash = "";

  let response = await env.ASSETS.fetch(new Request(assetUrl.toString(), { method: "GET" }));
  for (let hop = 0; hop < 2 && response.status >= 300 && response.status < 400; hop++) {
    const location = response.headers.get("Location");
    if (!location) break;
    const next = new URL(location, assetUrl);
    next.search = "";
    next.hash = "";
    response = await env.ASSETS.fetch(new Request(next.toString(), { method: "GET" }));
  }

  const headers = new Headers(response.headers);
  headers.delete("Location");
  applySecurityHeaders(headers, false);
  return new Response(response.body, {
    status: response.ok ? 200 : response.status,
    statusText: response.ok ? "OK" : response.statusText,
    headers,
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const redirectTo = redirectLocation(url);
    if (redirectTo) {
      return Response.redirect(redirectTo, 301);
    }

    const helpRedirect = helpRedirectLocation(url);
    if (helpRedirect) {
      return Response.redirect(helpRedirect, 301);
    }

    if (isPlaidOAuthDocument(url.pathname)) {
      return servePlaidOAuth(request, env);
    }

    const response = await env.ASSETS.fetch(request);
    const path = url.pathname.replace(/\/+$/, "") || "/";
    const headers = new Headers(response.headers);

    applySecurityHeaders(headers, path === "/account");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};
