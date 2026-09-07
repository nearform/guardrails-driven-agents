// The ONE place the generated Massimo client is built. Every other module
// must import `{ api }` from here — never `src/generated-client/*` directly.
// (Enforced by the `no-restricted-imports` rule in eslint.config.js.)
import buildClient from "../../../generated-client/generated-client.mjs";

// The SSR loader and the browser resolve the backend differently, so a single
// build-time URL can't serve both:
// - Server-side (inside the frontend container): reaches the backend over the
//   compose network at its service name, e.g. http://backend:8000. This must
//   NOT be a `VITE_`-prefixed var, or Vite would inline it into the client
//   bundle too and the browser would try (and fail) to resolve "backend".
// - Client-side (the host browser): needs a host-reachable URL, e.g.
//   http://localhost:8000 (the backend's published port). This one *is*
//   `VITE_`-prefixed so Vite inlines it into the browser bundle.
const publicBaseUrl =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:8000";

function resolveBaseUrl(): string {
  if (typeof window !== "undefined") {
    return publicBaseUrl;
  }
  // Server-only env var — never read on the client.
  return process.env.API_SERVER_BASE_URL ?? publicBaseUrl;
}

// Built exactly once, at module-evaluation time. A JS module is evaluated
// once per runtime, so every importer of `api` shares this same instance.
export const api = buildClient(resolveBaseUrl());
