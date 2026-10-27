# Shear Budget site

Static site for [shearbudget.com](https://shearbudget.com). Cloudflare Workers serves the built files. Eagle Butte’s company, software, and rental sites stay on Netlify.

`npm run build` copies `site/` to `dist/`. Pages are `/`, `/account`, `/privacy`, and `/terms`.

This folder is the whole site. It has its own `package.json`, build, and Wrangler config, and it does not import anything from a parent repository. Copied as-is, it is the root of [shearbudget-web](https://github.com/Eagle-Butte-Software/shearbudget-web).

## Workers Builds

In the Cloudflare dashboard, create a Worker and connect `Eagle-Butte-Software/shearbudget-web`. Under **Settings > Build**:

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Root directory | repository root (leave blank) |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |

Leave the API token on Cloudflare’s generated token. A push to `main` builds and deploys. Do not deploy by hand until that connection is in place.

`wrangler.jsonc` attaches the custom domains `shearbudget.com` and `www.shearbudget.com`. The Worker 301s `www.shearbudget.com` to `https://shearbudget.com` and keeps the path and query string.

## shearbudget.app

`shearbudget.app` is a separate zone and is not attached to this Worker. In that zone, add proxied DNS records for `shearbudget.app` and `www.shearbudget.app`, then a Single Redirect:

- When the hostname is `shearbudget.app` or `www.shearbudget.app`
- 301 to `https://shearbudget.com` plus the same path
- Preserve the query string

The Worker also 301s those two hostnames if a request for them reaches it.
