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

function applySecurityHeaders(headers, isAccount = false) {
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (isAccount) {
    headers.set("Content-Security-Policy", ACCOUNT_CSP);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const host = url.hostname.toLowerCase();
    if (REDIRECT_HOSTS.has(host)) {
      const target = new URL(url.pathname + url.search, APEX);
      return Response.redirect(target.toString(), 301);
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
