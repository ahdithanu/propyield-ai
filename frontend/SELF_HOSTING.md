# Self-Hosting the PropYield AI Frontend

This is a standard **Vite + TanStack Start** app. All data fetching is client-side
(TanStack Query hitting your FastAPI backend), so the production build can be
served from **any static file host** — no server runtime required.

## 1. Build the static bundle

```bash
bun install
bun run build
```

Output lands in **`dist/client/`**:

```
dist/client/
  index.html              ← Dashboard (prerendered)
  valuation/index.html    ← ML Valuation (prerendered)
  market-hubs/index.html  ← Graph Topology (prerendered)
  assets/                 ← JS, CSS, images (hashed)
  favicon.ico
  robots.txt
  _redirects              ← SPA fallback rules (Netlify / Cloudflare Pages)
```

`dist/server/` is the optional Cloudflare Worker bundle — ignore it for static hosting.

## 2. Point it at your backend

The frontend calls your FastAPI at the URL in `VITE_API_BASE_URL`, defaulting to
`http://localhost:8000/api/v1`. Because Vite embeds this at **build time**, set it
before building if your backend is not at the default:

```bash
# local dev alongside FastAPI (default — no action needed)
bun run build

# or point at a deployed backend
VITE_API_BASE_URL="https://your-api.example.com/api/v1" bun run build
```

> Note: `localhost:8000` resolves in the **visitor's browser**, so this default only
> works when the visitor runs FastAPI on their own machine. For a public deploy,
> set `VITE_API_BASE_URL` to your backend's public URL, and enable CORS on FastAPI
> for the frontend's origin.

## 3. Serve it

### Plain local server (quickest test)

```bash
bunx serve dist/client
# or:  python3 -m http.server 8080 --directory dist/client
```

### Nginx (own server)

```nginx
server {
  listen 80;
  root /var/www/propyield/dist/client;

  # Serve prerendered/static files when they exist, fall back to SPA shell
  location / { try_files $uri $uri/ /index.html; }

  # Cache hashed assets aggressively
  location /assets/ { expires 1y; add_header Cache-Control "public, immutable"; }
}
```

### Netlify / Cloudflare Pages

The included `public/_redirects` (copied to `dist/client/_redirects`) already
rewrites unknown paths to `/index.html` as a 200. Static files (the prerendered
pages, `/assets/*`) are served first, so only deep links like `/properties/123`
hit the fallback. Deploy `dist/client` (build command `bun run build`,
publish directory `dist/client`).

### Vercel

Add a `vercel.json` at the repo root:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Vercel checks the filesystem first, so prerendered pages and `/assets/*` are
served directly and only unmatched paths (e.g. `/properties/123`) fall back to
the SPA shell.

## 4. Routing notes

- `/`, `/valuation`, `/market-hubs` are **prerendered** to real HTML — they load
  instantly and are SEO/shareable.
- `/properties/$id` is a **client-side route** (parameterized). It works when
  navigated to from the dashboard, and on direct load/refresh via the SPA
  fallback (`try_files` / `_redirects` / Vercel rewrite) above.
- Filters live in URL search params, so search results are shareable and the
  back/forward buttons work.

## 5. Backend contract

The frontend expects these endpoints (tolerant of field-name variants):

| Method | Path                        | Purpose                         |
|--------|-----------------------------|--------------------------------|
| GET    | `/listings`                 | Filtered property listings      |
| POST   | `/ml/semantic-search`        | Vector search over the corpus  |
| POST   | `/ml/predict-price`         | ML fair-value prediction        |
| GET    | `/graph/market-hubs`         | PageRank market-hub topology    |
| GET    | `/analytics/market-summary`  | KPI market summary              |

When the backend is unreachable, the UI shows a "backend offline" banner and
renders demo fixture data so the dashboard is still reviewable.
