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
    if (path !== "/account") return response;

    const headers = new Headers(response.headers);
    headers.set("Content-Security-Policy", ACCOUNT_CSP);
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};
