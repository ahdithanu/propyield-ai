// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
    // Prerender the static routes to real HTML files in dist/client so the build
    // can be self-hosted from any static file server (no worker runtime required).
    // The parameterized /properties/$id route is not enumerated here — serve it
    // via an SPA fallback to /index.html (see instructions) for deep links/refresh.
    pages: [{ path: "/" }, { path: "/valuation" }, { path: "/market-hubs" }],
    prerender: { enabled: true, autoStaticPathsDiscovery: false },
  },
});
