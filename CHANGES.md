# Slice W3 — Upload pipeline + document detail

## New files

- `src/lib/api/upload.ts` — the two upload paths from the spec, one entry point:
  direct multipart `POST /documents` for files ≤ 8 MB (XHR — fetch can't report
  upload progress; manual auth + Idempotency-Key + one 401 refresh-retry), and
  presigned `initiate → PUT → complete` above that (client-side SHA-256 via
  crypto.subtle; the PUT carries no auth — the signature is the auth)
- `src/components/upload-button.tsx` — multi-file picker + floating progress
  cards (error cards stay until dismissed), invalidates folders/documents/recent
- `src/routes/documents.$documentId.tsx` — detail: metadata card, versions card,
  download (follows the 302 to the signed URL, saves blob), favorite toggle

## Modified

- `src/lib/api/http.ts` — `API_V1` exported for the XHR path
- `src/lib/api/queries.ts` — `documentQuery`, `documentVersionsQuery`,
  `downloadDocumentBlob`, `addFavorite`/`removeFavorite`
- `src/components/vault-list.tsx` — DocumentRow now links to the detail page
- `src/routes/vault.index.tsx`, `vault.$folderId.tsx` — Upload button in header
  (folder uploads land in that folder)
- i18n: `upload.*`, `document.*` detail keys (FR + EN)
- `src/routes/onboarding.tsx` — beforeLoad now auto-switches into an existing
  membership instead of showing "create your organization" to users whose
  session is tenant-less but who already have a tenant (TENANT_UNRESOLVED
  recovery path)

## Verify

Upload a small file from /vault (progress bar → row appears), a >8 MB file
(presigned path → MinIO), click a document → detail with versions → download →
star it → appears in dashboard favorites.

## Dev notes / possible snags

- Large-file PUT and download redirects go browser → MinIO (localhost:9000).
  If the browser console shows CORS errors, allow http://localhost:3000 in
  MinIO's API CORS setting (MINIO_API_CORS_ALLOW_ORIGIN).
- Favorite state derives from the first favorites page (10) — fine for pilot,
  revisit if favorites grow.

## Deferred

Preview rendering (`/preview` pages), new-version upload from detail, move/copy,
create-folder UI (W4 with search/organization).

---

# Slice W2.5 — Onboarding (register → verify → create organization)

Pairs with backend slice B28. A new user now goes from nothing to a working vault
entirely in the UI. The token's `tenant_id` drives routing: authenticated but
tenant-less users are parked at `/onboarding` until they create an organization.

## New files

- `src/routes/register.tsx` — two-step: account form → OTP code (from email/Mailpit);
  on verify, auto-login and route by tenant state
- `src/routes/onboarding.tsx` — organization name + plan picker (live from `GET /plans`),
  region CM; creates tenant then `switch-tenant` and lands on the dashboard

## Modified

- `src/lib/api/http.ts` — tracks `currentTenantId` from login/refresh/switch responses
- `src/lib/auth.ts` — `register`, `verifyIdentifier`, `hasTenant`; `LoginResult.tenantId`
- `src/lib/route-guards.ts` — `requireAuth` (onboarding) vs `requireTenant` (app proper);
  dashboard + vault routes now use `requireTenant`
- `src/lib/api/queries.ts` — `plansQuery`, `createTenant`; `switchTenant` also updates tenant id
- `src/lib/api/types.ts` — `Plan`
- `src/routes/login.tsx` — tenant-less login → `/onboarding`; link to register
- i18n: `auth.register.*`, `onboarding.*`, `auth.login.noAccount` (FR + EN)

## Verify

Fresh browser, no seed SQL: register → code from Mailpit → auto-login → create org
(plans listed with XAF prices) → dashboard. Logout/login lands straight on the
dashboard (single membership auto-scopes).

---

# Slice W2 — App shell + vault browsing (read-only)

Mobile-first shell (bottom nav on phones, sidebar on desktop), profile menu with tenant
switcher and FR/EN toggle, dashboard (usage, recent, favorites), vault browsing with
cursor pagination. Data layer is hand-grounded in the spec (`types.ts` + queryOptions
factories) — swaps cleanly for orval output once you've synced the spec into `api/`.

## New files

- `src/lib/api/types.ts` — User, Tenant, TenantUsage, Folder, Document (+`isDocument` guard for the contents `oneOf`)
- `src/lib/api/queries.ts` — queryOptions/infiniteQueryOptions: me, tenant, usage, root folders, folder, contents, documents, recent, favorites; `switchTenant` (clears cache — new tenant scope)
- `src/lib/format.ts` — locale-aware bytes/date
- `src/lib/route-guards.ts` — shared `requireAuth` beforeLoad
- `src/components/app-shell.tsx` — nav, profile menu, tenant switch, language toggle, logout
- `src/components/vault-list.tsx` — FolderRow, DocumentRow (status badge), EmptyState, LoadMoreButton
- `src/routes/vault.index.tsx` — `/vault`: root folders + all documents
- `src/routes/vault.$folderId.tsx` — folder contents, breadcrumb path, parent back-link, loader preloads folder

## Modified

- `src/routes/index.tsx` — dashboard rebuilt inside AppShell (usage cards, recent, favorites)
- `src/i18n/locales/{fr,en}.json` — nav, common, usage, vault, document.status keys

## Verify

`npm run dev` → login → dashboard shows usage/recent/favorites; `/vault` browses folders;
folder rows navigate; pagination "load more" appears past 30 items; FR/EN toggle in the
profile menu; tenant switch (if you have 2+ memberships) reloads with wiped cache.

## Deferred to W3

Upload, document detail, create-folder, favorites toggle on rows.

---

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
