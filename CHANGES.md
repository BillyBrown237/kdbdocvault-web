# Slice W1 — Convert TanStack Start scaffold to plain Vite SPA + wire the stack

The CTA template shipped **TanStack Start** (SSR + Netlify) — the locked decision was plain
Vite SPA with TanStack Router/Query, static files behind Caddy. This slice converts it and
wires Query (offline-persisted), i18n (FR-first), PWA, orval codegen, and the auth machinery
grounded in the OpenAPI spec (in-memory access token, httpOnly refresh cookie, single-flight
401 refresh, automatic `Idempotency-Key` on non-GET).

## New files

- `index.html` — SPA entry (`#app`, `lang="fr"`)
- `src/main.tsx` — React root, `PersistQueryClientProvider` + `RouterProvider`
- `src/lib/query.ts` — QueryClient (flaky-network defaults) + IndexedDB persister (idb-keyval)
- `src/lib/api/http.ts` — `apiFetch` (orval mutator): bearer header, single-flight refresh,
  one 401 retry, Idempotency-Key, RFC 7807 `ApiProblem`, `NetworkError`
- `src/lib/auth.ts` — login / completeMfa / logout / bootstrapSession
- `src/lib/utils.ts` — `cn()` (shadcn)
- `src/i18n/index.ts`, `src/i18n/locales/{fr,en}.json` — FR fallback, localStorage+navigator detection
- `src/routes/login.tsx` — RHF + zod form, `?redirect=` search param, MFA-aware
- `src/routes/sign.$signToken.tsx`, `shared.$token.tsx`, `verify.$documentHash.tsx` — public-surface placeholders
- `orval.config.ts` — tags-split react-query client, fetch httpClient, `apiFetch` mutator
- `components.json` — shadcn/ui (new-york, slate, Tailwind v4 CSS variables)
- `api/README.md` — where the synced spec goes
- `.env.example`

## Modified

- `package.json` — removed `@tanstack/react-start`, `@netlify/vite-plugin-tanstack-start`,
  `@tanstack/devtools-vite`, `@tanstack/react-devtools`; added react-query (+persist), i18next,
  RHF/zod, shadcn deps, `@tanstack/router-plugin`, `vite-plugin-pwa`, `orval`, `idb-keyval`;
  new scripts `api:generate`, `typecheck`
- `vite.config.ts` — plain SPA: router plugin (auto code-splitting), PWA manifest + app-shell
  Workbox (API never intercepted), dev proxy `/v1 → http://localhost:5057`
- `src/router.tsx` — `context: { queryClient }`
- `src/routes/__root.tsx` — plain root (`Outlet`), dev-only lazy router devtools (no SSR shell)
- `src/routes/index.tsx` — auth-guarded dashboard (`bootstrapSession` → redirect to /login), `/me` query
- `src/styles.css` — shadcn Tailwind v4 tokens (slate)
- `tsconfig.json` — `resolveJsonModule`
- `eslint.config.js`, `.prettierignore`, `.gitignore` — ignore generated code (`routeTree.gen.ts`,
  `src/api/generated`, `dev-dist`)
- `README.md` — rewritten

## Manual steps (do these once)

1. **Delete `netlify.toml`** — deploy target is the VPS/Caddy, not Netlify.
2. Copy the OpenAPI spec into `api/kdb-vault-openapi.yaml` (from project knowledge docs),
   then `npm run api:generate`.
3. `npm install` (lockfile will pin the `latest` ranges).
4. `npm run dev` — first run generates `src/routeTree.gen.ts`; the `routeTree.gen` import
   resolves after that.
5. PWA icons: drop `public/icons/icon-192.png`, `icon-512.png`, `icon-512-maskable.png`
   (any square logo export works for the pilot).

## Deferred

- MFA challenge screen (login surfaces the state, doesn't complete it)
- Offline mutation queue (Query persistence covers reads; queued writes come with the
  documents slice where they matter)
- `_app` pathless layout — introduce when the second authed page lands
