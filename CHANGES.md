# Slice W5 — Sharing (first public capability surface)

## New files

- `src/components/share-panel.tsx` — on document detail: create link (view/download,
  optional password + expiry), one-time URL reveal with copy (never shown again —
  matches the backend's raw-token discipline), active-link list with view counts
  and revoke
- `src/routes/shared.$token.tsx` — the public guest page, REPLACING the W1
  placeholder: resolve → password unlock if required → view (object-URL tab) or
  download by permission. No auth guard; dead links show a uniform "not found".
  First real consumer of `publicApiFetch` + the /pub proxy alias.

## Modified

- `src/lib/api/{types,queries}.ts` — ShareLink/SharedMeta; shareLinksQuery,
  createShareLink, revokeShareLink; resolveShared, unlockShared, sharedContentBlob
- `src/routes/documents.$documentId.tsx` — SharePanel added
- i18n: `share.*`, `shared.*` (FR + EN)

## Backend touch (in kdbdocvault, rebuild needed)

- `LinkHandlers.cs` / `DataRooms.cs`: share URLs now built from
  `App:FrontendBaseUrl` (the web app, :3000 in dev) instead of `App:PublicBaseUrl`
  (the API) — copied links previously opened the wrong origin.

## Verify

Rebuild backend. On a document: create a view link with a password → copy the URL →
open it in a PRIVATE window (no session): title shows, password gate, unlock, view
opens the file. Create a download link without password → downloads directly.
Revoke a link → the private window now gets "link doesn't exist". View counts tick.

---

# Slice W8 — Lifecycle (expiring, rules, reminders, obligations)

Core differentiator for the legal/business market.

## New files

- `src/routes/lifecycle.tsx` — Lifecycle page, Tabs: Expiring (rules due ≤90d, doc-title
  links, type badges) and Obligations (list + mark-done). In main nav.
- `src/components/lifecycle-panel.tsx` — on document detail: add/confirm/delete lifecycle
  rules (expiry/renewal/review + date), per-rule reminders (offset days + channel, delete),
  OCR-detected rules show a Confirm action

## Modified

- `src/lib/api/types.ts` — LifecycleRule, Reminder, Obligation + unions
- `src/lib/api/queries.ts` — expiring, rules CRUD/confirm, reminders CRUD, obligations
- `src/routes/documents.$documentId.tsx` — LifecyclePanel mounted
- `src/components/app-shell.tsx` — Lifecycle nav entry
- i18n `lifecycle.*`, `nav.lifecycle` (FR + EN)

## Backend companion (B33, rebuild)

Expiring feed enriched with document_title; obligations list/create/update implemented.

## Verify

Rebuild backend. On a document: Lifecycle rules → add an Expiry with a date ~30d out →
add a reminder (7 days before, email). Lifecycle page → Expiring shows the document by
title. Create an obligation (via API/panel) → Obligations tab → mark done.

---

# Slice W7 — Auth completion (MFA, TOTP, sessions, password reset, profile)

## New routes

- `src/routes/mfa.tsx` — MFA challenge screen; login now routes here on `mfa_required`
  (challenge token held in memory via auth.ts, dropped on refresh → back to login)
- `src/routes/settings.tsx` — Tabs: Profile (name/phone/locale), Security (change password +
  TOTP enable with QR / disable), Sessions (list + revoke non-current). In profile menu.
- `src/routes/forgot-password.tsx`, `reset-password.tsx` — public, anti-enumeration copy;
  login "Forgot password?" now links here

## Modified

- `src/lib/auth.ts` — pending-challenge holder; `completeMfa` returns tenant scope
- `src/lib/api/queries.ts` — sessions, revokeSession, updateProfile, changePassword,
  totpSetup/confirm/disable, forgotPassword, resetPassword
- `src/routes/login.tsx` — mfa_required → /mfa; forgot-password link
- `src/components/app-shell.tsx` — Settings link in profile menu
- i18n `mfa.*`, `settings.*`, `forgot.*`, `reset.*` (FR + EN)

## New deps (npm install)

qrcode + @types/qrcode (TOTP QR rendering from the otpauth_uri).

## Backend companion (B32, rebuild)

PATCH /me and PUT /me/password implemented (were spec-only).

## Verify

Rebuild backend, `npm install`. Settings → Security → Set up 2FA → scan QR in an
authenticator → enter code → enabled. Log out, log in → MFA screen → code → in. Settings →
Sessions lists devices, revoke works. Forgot password → code from Mailpit → reset → sign in.

---

# Slice W6 — Signatures (envelopes + guest signing)

First feature slice on the shadcn design system.

## New files

- `src/components/signature-panel.tsx` — on document detail: list envelopes with
  per-signer status badges; create-envelope Dialog (message + repeatable signer rows);
  send / remind / cancel actions; signed-document download when completed
- `src/routes/sign.$signToken.tsx` — public guest flow (replaces W1 placeholder):
  resolve → OTP verify (if required) → type-to-sign with consent, or decline →
  confirmation. All via `publicApiFetch` (/pub alias).

## Modified

- `src/lib/api/types.ts` — Envelope, Signer, GuestSignView + status unions
- `src/lib/api/queries.ts` — envelopesForDocumentQuery, createEnvelope, send/remind/cancel;
  guest: guestSignView, guestRequestOtp, guestSubmitOtp, guestSign, guestDecline
- `src/routes/documents.$documentId.tsx` — SignaturePanel mounted
- i18n `sign.*` + `signGuest.*` (FR + EN)

## Backend touch (kdbdocvault, rebuild)

Guest-RLS pin applied to the Signatures module (fix B31) so /sign resolves — same class
as the shared-link B30.3 fix, applied pre-emptively.

## Verify

Rebuild backend. On a document with content: Signatures card → New → add a signer (use an
email you can read in Mailpit) → Create (draft) → Send. Open the /sign link from the
signer email in a private window → verify with the OTP → type name + consent → Sign.
Envelope flips to completed; "Signed document" downloads the sealed PDF.

---

# Slice D1 — shadcn/ui design system + retrofit

The house directive: expose the *complete* backend and make it genuinely polished,
with shadcn/ui used everywhere possible. This slice installs the primitives (they were
never actually added — only components.json existed) and retrofits every screen built so
far, so W6+ is built on a consistent design system.

## New dependencies (run `npm install`)

@radix-ui/react-{avatar,dialog,dropdown-menu,label,select,separator,slot,tabs,tooltip},
sonner. (cva/clsx/tailwind-merge were already present.)

## New files — src/components/ui/

button, input, label, card, badge, dialog, dropdown-menu, select, avatar, skeleton,
separator, sonner (Toaster + toast), tabs, table, tooltip. Canonical shadcn "new-york",
slate — tokens already in styles.css from W1.

## Retrofitted to shadcn + toasts

- `main.tsx` — `<Toaster richColors />` mounted
- app-shell — Avatar + DropdownMenu profile menu (tenant switch, trash, language, logout),
  branded sidebar
- login / register / onboarding — Card + Input + Label + Button; errors now `toast` instead
  of inline text
- dashboard — Card usage tiles + Skeleton loading
- vault rows — Card + status Badge (variant per status)
- upload button, new-folder (now a Dialog), document detail, document-actions (Select for
  move, Badge tag chips), share panel (Select/Input/Badge), search (Input + Skeleton),
  trash (Card rows + Skeleton), public shared page (Card/Button/Input/Badge)

## Verify

`npm install`, `npm run dev`. Every screen should render with consistent shadcn styling;
success/error feedback appears as top-right toasts (create folder, move, trash, restore,
share copy, auth errors).

## Next

Design system is in place → W6 (signatures) and all subsequent modules build on these
primitives. Remaining backend surfaces to expose per the "all functionality" directive:
signatures, auth completion (MFA/sessions/password reset), lifecycle, billing, team/admin,
then workflows, data rooms, reports, imports, API keys, webhooks, emergency access.

---

# Fix W5.1 — view-only links: in-app viewer instead of the browser's PDF tab

Opening a view-permission blob in a new tab handed the guest the browser's PDF
viewer, download button included. View-only now renders IN the page:

- `src/components/inline-pdf-viewer.tsx` — pdf.js canvas rendering, no toolbar,
  no blob URL in a tab, context menu suppressed (new dep: `pdfjs-dist` →
  **run `npm install`**)
- images render as a non-draggable `<img>`; other types get an honest
  "preview unavailable"
- download-permission links keep the direct download

Honesty note (also in code comments): this is DETERRENCE, not DRM — screenshots
cannot be prevented. The real control is server-side and already ships: every
watermarkable view is stamped with the link id + date, so a leak carries its
provenance. That's the industry-standard posture (Drive/DocSend-style).

Backend companion: ShareGuestSession now LOGS the reason for every guest 404
(unknown token / row invisible / revoked / expired / view-exhausted) while
guests keep seeing the uniform 404 — no more guessing whether a 404 is a bug
or a correctly-dead link.

---

# Slice W4 — Search + organization

Pairs with backend slice B30.

## New files

- `src/routes/search.tsx` — debounced search over `/search` (hits show snippet),
  in the main nav
- `src/routes/trash.tsx` — trash list with restore + purge dates (profile menu link)
- `src/components/new-folder-button.tsx` — inline create-folder (vault root + folders)
- `src/components/document-actions.tsx` — detail-page "Organize" card: tag chips
  (toggle set, create inline), move to folder, move to trash
- `src/lib/use-debounced-value.ts`

## Modified

- `src/lib/api/queries.ts` — searchQuery, tagsQuery, createTag, setDocumentTags,
  moveDocument, trashDocument, trashQuery, restoreDocument, createFolder
- `src/lib/api/types.ts` — SearchHit, TrashItem
- `src/components/app-shell.tsx` — Search in nav, Trash in profile menu
- `src/routes/vault.index.tsx`, `vault.$folderId.tsx` — New-folder button
- `src/routes/documents.$documentId.tsx` — Organize card
- i18n: `search.*`, `trash.*`, `vault.newFolder/folderName`, `document.organize/*`,
  `common.create` (FR + EN)

## Verify

Rebuild backend first (B30). Then: create a folder from the vault; search for an
uploaded document's title; open a document → toggle/create tags (persist across
reload), move it into the folder, trash it; find it in Trash → restore → it's back.

---

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
