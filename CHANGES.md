# Slice W25 — Tenant export in settings (activates B52)

Owner-only fifth tab on `/settings`: **Export des données**.

- `createTenantExport()` (queries.ts) → `POST /tenant/export`; polling
  rides the existing `useJob` hook and shared `/audit/exports/{jobId}`
  surface — zero new plumbing.
- The card explains WHAT leaves in the ZIP (original files + folder tree,
  metadata.csv, full audit chain, signature evidence) and that none of it
  needs KDB DocVault to read — the §19 promise, stated where the button is.
- States: idle → running (with honest leave-the-page copy: the backend
  returns the same in-flight job on a re-POST, so "press again on return")
  → done (download button, 5-minute presign hint) → failed (error + retry).
- Tab gated by the same membership-role check the app shell uses (courtesy
  only; the backend's `owner` policy is the enforcement).
- i18n: `settings.export*` FR/EN.

# Slice W20 — Reports dashboard (activates B46)

The six on-demand reports become screens. New admin route `/reports`
(sidebar + gated by role like Imports), six tabs:

- **Vue d'ensemble** — eight stat cards from the one-round-trip overview;
  gold reserved for the number that should worry you (expiring ≤30 days —
  the north-star metric's inverse).
- **Échéances** — window select (30–365 days), rows linking to each
  document, J-`days_left` colored by urgency (red ≤7, amber ≤30), and the
  CSV download (fetched, not linked).
- **Conformité** — coverage % in gold + the auditor's checklist counts.
- **Exposition** — link weaknesses computed for the reader ("sans mot de
  passe" instead of raw counts), rooms, top-10 most-viewed documents.
- **Activité** — per-member totals with a compact action breakdown.
- **Circuits** — 90-day throughput, average duration, overdue steps in
  gold, per-template table.

Numbers are monospace throughout (the W22 evidence texture); every stat
label says what the number MEANS, not the column it came from.

i18n: `reports.*` + `nav.reports` (FR + EN).

## Verify

`npm run typecheck && npm run dev`, as an admin: /reports shows real
counts you can eyeball against the vault; the expiring rows link through;
CSV downloads; a Member doesn't see the nav entry (and the API would 403
them anyway).

# Slice W24 — Editing UI (activates B48 + B50)

The backend slices become human-usable.

## Document editing (B48)

- `apiFetchWithEtag` in http.ts — the If-Match contract done right: the
  ETag is FETCHED fresh when the edit dialog opens and echoed back;
  clients never compute server state. A 409 mid-edit says « rouvrez la
  fenêtre et réessayez ».
- Document detail: « Modifier » dialog (title + document type) via
  PATCH; move stays with the existing move select (PATCH folder_id is for
  API callers).

## Folder lifecycle (B48)

- `folder-actions.tsx` — per-row ⋮ menu on vault folder rows: rename,
  move (root-level target select), delete. The delete confirm names the
  subtree consequence, and a 423 refusal (held document inside) surfaces
  VERBATIM — that message is legal information, not noise.

## Versions (B48)

- versions-panel rows grow download (fetch-the-302, W16 rule — never
  `<a href>`) and restore (hidden on the current head); notes now display
  under each row, so "Restored from vN" reads as provenance.

## Legal holds (B50, admin)

- New route `/legal-holds` (profile menu, admin section): create hold,
  list with StatusBadge + item counts, and the two-admin release choreographed
  honestly — the requester sees « un autre administrateur doit approuver »
  with THEIR approve button disabled; the second admin sees « votre
  approbation la finalise ».
- Document detail (admin, unheld docs, when an active hold exists):
  « Placer sous gel » attaches the current document to a chosen hold.
- `ui/textarea.tsx` added (hold descriptions).

i18n: `vault.folder*`, `document.edit*`, `version.*`, `holds.*`,
`nav.holds` — FR + EN.

## Verify

`npm run typecheck && npm run dev`. Rename a folder from the vault →
children breadcrumbs update. Delete a folder holding a held document →
the 423 message appears as-is. Edit a title in two tabs → second save
shows the conflict message. Download v1 of a multi-version document →
old bytes; restore it → list grows "Restored from v1". As admin: create
a hold, attach a document from its detail page, request release, approve
from ANOTHER admin account.

# Slice W23 — Auth screens redesign (the split login + family)

Executes `docs/AUTH-SCREENS-DESIGN-PROMPT.md` in code. All logic (mutations,
guards, redirects) untouched — this is the presentation pass.

## New (`src/components/auth/`, `src/lib/flags.ts`)

- **`auth-layout.tsx`** — the split: left is the VAULT (navy gradient,
  wordmark with gradient "DocVault", rotating proof content — category line
  / gold FCFA stat / honest testimonial slot — 8s crossfade paused under
  `prefers-reduced-motion`, security line in mono, CSS-only vault-dial tick
  motif), right is the form on light gray with an FR/EN toggle. Mobile:
  compact navy header, form owns the screen.
- **`otp-input.tsx`** — six boxes: auto-advance, backspace-to-previous,
  paste distribution, WebOTP/keychain autofill (`one-time-code` on box 1),
  calm error styling (red border, nothing shakes).
- **`password-input.tsx`** — show/hide, CapsLock hint, and `StrengthMeter`:
  entropy-based, four levels, weakest tone is AMBER (never red-shaming),
  labels say what to do («visez une phrase»), composes cleanly with
  react-hook-form.
- **`flags.ts`** — `authPasskeys` / `authSso` / `authSms`, all false. The
  deferred methods' exact positions exist in the code behind these flags
  (login divider + buttons, MFA method switcher) — flip the flag, wire the
  handler, nothing moves. Design-once, kept.

## Refactored routes

- **login** — the fixed-direction screen: split layout, Callout errors
  (problem+json code + trace in fine print) instead of toasts,
  session-expired chip via `?expired`, no "remember me" by design.
- **mfa** — OtpInput with auto-submit on 6th digit, TOTP wording,
  lost-device support link, reserved switcher row.
- **register** — strength meter live on watch, consent line, verify step
  now OtpInput with a "wrong address?" escape hatch back to the form
  (values kept).
- **forgot / reset** — layout + Callout; reset gets PasswordInput+meter,
  token field in mono; success still lands on login with a chip.
- **onboarding** — wrapped in the layout (borderless card), plan picker
  untouched.
- Invitation-accept keeps its current look — public page, migrates with a
  later pass.

i18n: `auth.*` additions (proof lines, strength labels, capsLock, consent,
passkey/SSO labels), `mfa.{totpHint,lostDevice,useSms}` — FR + EN.

## Verify

`npm run typecheck && npm run dev` → /login shows the split (proof panel
rotates, screenshot-worthy alone), OTP boxes autofill from keychain on
/mfa and register-verify, CapsLock hint appears, strength meter reacts,
wrong password produces a calm callout with the problem code in fine
print, mobile (360px) reaches submit without scrolling.

# Slice W22 — Design-system foundation (component library, first slice)

Executes the foundation subset of `docs/COMPONENT-LIBRARY-DESIGN-PROMPT.md`.

## Tokens (`src/styles.css`)

- `--primary` realigned from slate-900 to the brand sheet's **Primary Blue**
  (#2563EB) in both modes — every existing `bg-primary` button/link takes
  the brand color with zero call-site changes.
- Brand tokens added to the Tailwind theme: `brand-navy`,
  `brand-navy-surface`, `brand-blue(-deep)`, `brand-azure`,
  `brand-teal(-deep)`, `brand-gold` (exact hex from the sheet) + two
  gradient utilities (`bg-brand-gradient`, `bg-brand-gradient-dark`) —
  reserved for primary CTAs and hero surfaces per the de-slop constraint.

## New components (`src/components/ui/`)

- **`status-badge.tsx`** — ONE rendering per backend enum value: 14 domains
  (document, processing, job, envelope, signer, connection, payment,
  subscription, invoice, workflow, obligation, reminder, hold, membership),
  five tones (slate=dormant, azure=in motion, emerald=good, amber=needs
  attention, red=bad), `motion-safe` pulse on the two states a user
  actively waits on (processing, awaiting_confirmation). Labels from a new
  central `status.*` i18n table (57 keys × FR/EN); unmapped values render
  their raw name — honest over pretty.
- **`banner.tsx`** — the three standing banners unified: offline (slate —
  a FACT: "waiting", never "failed", `role=status`), readonly (amber,
  action slot), notice (azure). Stacking order documented.
- **`callout.tsx`** — the problem+json renderer: calm form-level error
  with the machine facts (`code · trace`) in monospace fine print — what a
  user reads to support over the phone.

## Retrofits (ad-hoc variant maps deleted)

- `app-shell.tsx` — both inline banners → `<Banner>`
- `vault-list.tsx` — document status (STATUS_VARIANT map removed)
- `billing.tsx` — subscription + invoice statuses (map removed)
- `signature-panel.tsx` — envelope + signer statuses (both maps removed)
- `imports.tsx` — job + connection statuses (local StatusBadge removed)

Remaining Badge call sites (lifecycle, workflow, team, rooms, audit…)
migrate opportunistically as screens are touched; the domains are already
in the component. Per-screen status label keys (`sign.status.*`,
`imports.status.*`, `billing.status.*`, `document.status.*`) are now
unused by these call sites — prune in a later cleanup.

## Verify

`npm run typecheck && npm run dev`: primary buttons are brand blue; vault
rows, billing, signatures and imports show identical badge styling for
identical semantics; offline + read-only banners unchanged in behavior;
FR/EN labels come from `status.*`.

# Slice W21 — Front-office site implemented from the design file

`docs/KDB DocVault v2.dc.html` (Claude design export) → `site/`: a real
static site, no framework, no build step.

- **Transform, not rewrite:** the design's `{{ bindings }}`, `<sc-if>`
  views and refs were resolved mechanically (session script
  `build_site.py`) into three real pages — `index.html`, `produit.html`,
  `securite.html` — with per-page nav state, titles, descriptions and
  canonicals. Client-side "routing" became real URLs; everything else is
  byte-faithful to the design.
- `assets/site.js` — dependency-free port of the design component: FR↔EN
  toggle over `data-t` nodes (persisted, `<html lang>` synced),
  scroll-driven lifecycle timeline + hash-chain animation
  (`prefers-reduced-motion` → final state), FCFA exposure calculator,
  reminder-date checker. Initial values are baked into the HTML, so the
  page is complete without JS.
- `assets/site.css` (skip-link focus, print), `assets/favicon.svg`
  (shield + dial).
- Deploy: `kdbvault.com` block in `deploy/Caddyfile` (+ www redirect,
  asset caching) and the `./site` mount in compose — backend repo.
- Launch placeholders: phone/WhatsApp numbers, demo-certificate QR,
  reference slots, legal pages.

## Verify

`cd site && python3 -m http.server` → the three pages navigate, FR/EN
toggle persists across pages, the calculator recomputes, the date checker
follows the input, timeline/chain animate on scroll (and don't with
reduced motion), and view-source shows full FR content with no template
syntax.

# Slice W19.1 — Pick single Drive files, not just folders

Files in the picker are now checkboxes. Ticking any switches the footer from
"Import “{folder}”" to "Import N files" (+ a clear-selection escape) — one
job is one thing, a folder OR a list, never a blend. Selection survives
navigating between folders, so cherry-picking across subfolders works.
Companion to backend B42.2 (`mapping.drive_file_ids`).

- `src/routes/imports.tsx` — checkbox rows, selection map, footer switch
- `src/lib/api/queries.ts` — `startDriveImport` sends whichever mode was picked
- i18n: `imports.{driveEmpty,driveClearSelection,driveImportFiles}` (FR + EN);
  `driveFileCount`/`driveNoSubfolders` retired (files are rows now, not a count)

# Slice W19 — Google Drive imports UI

Companion to backend slice B42. The Sources tab stops apologizing: Google
Drive connects, browses, and imports. OneDrive/Dropbox/SharePoint remain a
sentence (still 501 server-side).

## Modified

- `src/routes/imports.tsx`
  - **Sources tab** — "Connect Google Drive" opens the consent screen in a
    popup (`window.open`, never navigation: the app keeps running and the
    callback page needs an opener to report to). A `message` listener —
    origin-pinned, since the callback rides the /pub alias onto our own
    origin — receives `{type:'kdb:import-connection', ok, reason}`, refetches
    the connections list, and toasts connected / cancelled / failed.
  - **New import tab** — with a live connection, an "Import from Google
    Drive" button joins the ZIP flow (same target-folder select, same
    ActiveImportCard progress polling — the job is the same shape). Without
    one, a sentence points at the Sources tab; no button that could only 501.
  - **`DriveFolderPicker`** — breadcrumb navigation from My Drive down,
    folders clickable, file count shown per level, `page_token` "load more",
    and an explicit "Import “{folder}”" confirm. Picking the root is
    "Import “My Drive”" — importing everything stays a deliberate act.
- `src/lib/api/types.ts` — `CreateImportConnectionResult`, `DriveBrowse`
- `src/lib/api/queries.ts` — `createImportConnection`, `browseConnection`
  (plain fetch: the picker owns its paging, and caching a seconds-old Drive
  listing helps nobody), `startDriveImport` (wraps `drive_folder_id` into
  `mapping`, per the B42 contract)
- i18n: `imports.{sourcesHint,connectDrive,driveConnected,driveDenied,
  driveFailed,driveExplainer,driveNotConnected,driveImport,drivePickFolder,
  driveRoot,driveNoSubfolders,driveFileCount,driveImportThis}` + updated
  `sourcesUnavailable` (FR + EN)

## Verify

1. Sources tab → Connect Google Drive → consent in the popup → popup closes
   itself, toast "Google Drive connected", row shows your Gmail + `connected`.
2. New import tab → Import from Google Drive → walk into a subfolder →
   Import “{name}” → 202, progress card counts up; Docs arrive as PDF,
   Sheets as XLSX; a Google Form produces one error-report line.
3. Deny the consent screen instead: popup closes, "Connection cancelled at
   Google", row stays `pending_auth`.
4. Sources tab → Disconnect → row `revoked`, and the grant disappears from
   myaccount.google.com/connections.

# Slice W18 — PWA/offline polish + hardening

The roadmap's original "W11" — displaced by workflows and never shipped. Four
gaps, one of which was silently breaking installation:

1. **The manifest pointed at icons that didn't exist.** `vite.config.ts` has
   referenced `/icons/icon-192.png` etc. since W1, but there was no `public/`
   directory at all. Browsers won't offer PWA install with unreachable icons,
   so the app has never actually been installable.
2. No error boundary — a render/loader throw produced a white screen.
3. No offline banner (`app.offline` existed in both locales, unused).
4. No install affordance, no web deploy block in Caddy, no CI.

## New files

- `public/icons/{icon-192,icon-512,icon-512-maskable,apple-touch-icon}.png`,
  `public/{favicon.svg,favicon.png}` — document + vault-dial mark in the brand
  slate/amber; maskable variant keeps the glyph inside the 80% safe zone
- `src/components/error-fallback.tsx` — `ErrorFallback` (honest tiering:
  ApiProblem detail shown as-is, NetworkError → `errors.network`, anything
  else → `errors.unknown` with the stack visible in dev only) and
  `NotFoundFallback`; both offer retry/home, both FR/EN
- `src/lib/pwa.ts` — `useOnline()` (useSyncExternalStore over online/offline
  events) and the `beforeinstallprompt` capture: module-scope, imported from
  `main.tsx`, because the browser fires that event once and usually before
  React mounts
- `.github/workflows/ci.yml` — typecheck + build on push/PR, dist artifact.
  Deploy stays manual (single-VPS pilot); CI's job is to make sure what gets
  copied is green

## Modified

- `src/router.tsx` — `defaultErrorComponent` + `defaultNotFoundComponent`
- `src/main.tsx` — imports `./lib/pwa` before first render
- `src/components/app-shell.tsx` — offline banner above the read-only banner
  (same pattern, slate not amber: offline is a fact, not a warning);
  "Install app" appears in the profile menu **only while the browser holds an
  install prompt** — no permanent dead menu item
- `index.html` — favicon + apple-touch-icon links
- i18n: `errors.{title,goHome,notFoundTitle,notFoundBody}`,
  `app.{install,installed}` (FR + EN)

### In `kdbdocvault` (deploy)

- `deploy/Caddyfile` — `app.kdbvault.com` block: same-origin `/v1` proxy (no
  CORS anywhere), `handle_path /pub/*` mirroring the vite dev proxy exactly,
  SPA `try_files` fallback, immutable caching for hashed `/assets/*` but
  **`no-cache` for `sw.js` + `index.html`** — otherwise installed PWAs never
  see another update
- `deploy/docker-compose.prod.yml` — `./web:/srv/web:ro` mount on caddy

## Notes / decisions

- **Install entry lives in the profile menu, not a banner.** A banner begs; a
  menu item is there when wanted. It renders only while `beforeinstallprompt`
  is captured, so it can never be a button that does nothing.
- **The service worker still never touches API calls** (W1 decision upheld):
  offline data is TanStack Query's IndexedDB persistence; the SW only caches
  the app shell.

## Verify

- `npm run build`, serve `dist/` — DevTools → Application: manifest shows all
  three icons, install prompt available on a second visit
- DevTools → Network → Offline: slate banner appears, cached vault still browses
- Throw inside any route component: fallback with retry, no white screen
- On the VPS: copy `dist/` to `deploy/web/`, `docker compose up -d caddy`,
  check `app.kdbvault.com/sign/x` deep-link returns the SPA and
  `app.kdbvault.com/pub/…` reaches the API unversioned surface

# Slice W17 — Imports UI

Companion to backend slice B37. **Imports** joins the sidebar with three tabs.

## New files

- `src/routes/imports.tsx`
  - **New import** — target folder, ZIP picker with upload progress, then live
    job progress (counters + bar), cancel, and the error-report download
  - **History** — past imports with status, counts and their error reports
  - **Connected sources** — states plainly that Drive/OneDrive/Dropbox/
    SharePoint aren't available yet, and lists/revokes any existing connection
    rows

## Modified

- `src/lib/api/upload.ts` — `runAsArchive()`: reserve + PUT, return the upload
  id, and deliberately **skip `/complete`** (completing would create one
  document out of the ZIP instead of importing its contents)
- `src/lib/api/{types,queries}.ts` — ImportJob, ImportConnection; imports list,
  get, start, cancel, connections list/revoke
- `src/components/app-shell.tsx` — Imports in the sidebar and the mobile menu
- i18n: `imports.*`, `nav.imports` (FR + EN)

## Notes / decisions

- **There is no "connect Drive" button.** The backend answers 501 by design, and
  a button that always errors is worse than a sentence explaining why it isn't
  there yet. The tab says what's missing and what to do instead.
- **Progress polls only while the job is unfinished** — `refetchInterval`
  returns false once status is done/failed/cancelled.
- **The CSV manifest is behind a `<details>`.** Most migrations are "a folder of
  scans", where the file name is the title; the mapping fields are there for the
  minority who have a spreadsheet, without taxing everyone else's first screen.
- Only `.zip` is accepted client-side, with a clear message — the worker can
  only read archives, and letting a stray PDF through to a 500 would be rude.

## Verify

Rebuild the API and Workers first (B37), then follow the verify steps in
`kdbdocvault/CHANGES.md`.

# Slice W16 — Signature completion, delegation, ownership transfer, delivery

## Fixed (a real defect, not a gap)

The "download signed document" button was a bare
`<a href="/v1/envelopes/{id}/signed-document">`. That endpoint is authenticated,
and the access token lives **in memory only** — a link navigation carries no
`Authorization` header, so the button could only ever have produced a 401. It
now fetches through `apiFetch` (which sends the bearer, follows the 302 to the
presigned URL, and hands back a blob) and triggers a real download.

**Rule worth keeping:** any authenticated endpoint that answers a redirect to
storage must be fetched, never linked. `<a href>` and `window.open` are
unauthenticated navigations.

## Modified

- `src/components/signature-panel.tsx` — the envelope surface is now complete:
  - sealed-PDF download (fixed, above)
  - **Evidence dialog** — document hash, sealed-at, and the frozen event trail
  - **ID review** — for signers whose ID is awaiting review: the image, and
    approve / reject with a reason
  - **Edit signer** — correct a typo'd email or phone while the signer is still
    pending
- `src/routes/approvals.tsx` — **delegate** a step to another member from the
  inbox
- `src/routes/team.tsx` — **transfer ownership**: move a member's documents to
  someone else and hand over the Owner role
- `src/components/notification-bell.tsx` — per-notification **delivery channels**
  (in-app / email / SMS), failures in red
- `src/lib/api/{types,queries}.ts` — `Signer.id_check_status`, SignatureEvidence;
  updateSigner, evidence, sealed-document blob, ID-document blob, id-review,
  delegateStep, transferOwnership, notification delivery

## Notes / decisions

- **The ID image is fetched into an object URL, never navigated to.** It's the
  most sensitive object in the system and the link is a 10-minute capability —
  it should not end up in browser history, a shared tab, or a bookmark. The
  object URL is revoked when the dialog closes, right-click is suppressed, and
  the dialog states the link is temporary and that IDs are excluded from
  evidence bundles.
- **Delegation reuses the step's comment box as the reason** rather than adding
  a second text field that would be empty most of the time.
- **Ownership transfer sits behind a dialog with an explicit recipient**, not a
  one-click button next to "Remove". It's irreversible and moves every document
  the person owns; the dialog says so. It answers 202 with a job shape, but the
  work is already done (`documents_moved` is final), so nothing is polled — the
  toast reports the count.
- **Delivery status is cached with `staleTime: Infinity`.** By the time a
  notification is in the bell, its delivery is settled history; refetching on
  every popover open would be pure waste.
- Editing a signer is offered only while that signer is `pending` — after they
  verify or sign, changing the address would undermine the evidence.

## Backend companion — slice B36

The ID-review endpoint was mapped but **unreachable**: the signer shape carried
no ID-check field, so no client could tell which signer was waiting. B36 adds
`id_check_status` / `id_checked_at` to the signer DTO. See `kdbdocvault/CHANGES.md`.

**This slice needs an API rebuild** — the first backend change in a while.

## Verify

1. Rebuild the API (`dotnet build` / restart) — B36 is a DTO change.
2. Create an envelope with an `id_check` signer → send → as the guest, upload an
   ID → back in the app, the signer row shows **ID awaiting review** and a
   Review ID button. Open it: the image renders in the dialog. Approve → badge
   flips to ID verified; the signer is marked verified.
3. On a completed envelope: **Download** now yields the sealed PDF (it 401'd
   before), and **Evidence** shows the hash and trail.
4. A pending signer shows a pencil → change the email → saved.
5. **Approvals** → a step in the inbox → Delegate to → pick a member → it leaves
   your inbox and the trail records the delegation.
6. **Team** → Transfer next to a member → choose a recipient → toast reports how
   many documents moved.
7. **Bell** → each notification shows small channel icons; a failed channel is red.

## Still open (post-pilot)

Workflow template builder (a visual step designer is its own project), and
imports — the backend maps no import endpoints at all. Backend-side: assigning a
document type to a document (`PATCH /documents/{id}` doesn't exist), and the
reports module.

# Slice W15 — Search facets, saved searches, pins, document types

## Modified

- `src/routes/search.tsx` — rebuilt: **type** and **tag** facets alongside the
  query box, **save this search** (inline naming), and a row of saved-search
  chips that run or delete. Selecting a chip switches the page to the *stored*
  criteria; typing or changing a facet drops back to the live search.
- `src/routes/documents.$documentId.tsx` — pin toggle in the header next to the
  favourite star
- `src/routes/index.tsx` — **Pinned** section, placed above Recent
- `src/routes/settings.tsx` — **Types** tab: list existing document types
  (system ones marked) and create new ones
- `src/lib/api/{types,queries}.ts` — SavedSearch, DocumentType; `searchQuery`
  now takes a `SearchFilters` object; saved-search list/save/run/delete,
  pins list/pin/unpin, document types list/create

## Notes / decisions

- **Saved searches live under `/search/queries`, not `/queries`.** The routes
  are registered inside the search group, so the flat `/queries` path I'd
  written in the roadmap doesn't exist. Worth remembering: the module's group
  prefix is part of the path even when the endpoint file doesn't show it. (The
  backend's own `Results.Created` location header already said `/v1/search/queries/{id}` —
  that was the tell.)
- **A saved search re-runs server-side**, `GET /search/queries/{id}`, rather than
  the client unpacking the stored JSON and rebuilding a query. The stored shape
  is parsed leniently backend-side so it can grow; duplicating that parsing here
  would guarantee the two drift.
- **Saving requires a non-empty `q`** (the backend 422s otherwise), so the button
  is disabled until there's a query. Facets alone aren't a saved search.
- **Pins vs favourites.** The backend has two per-user bookmark lists with
  near-identical behaviour — favourites, and pins ordered by when they were
  pinned. Rather than invent a distinction, the UI keeps both and labels them
  plainly: Pinned sits at the top of the dashboard because it's the list the
  user curates by hand; Recent curates itself.
- **Document types can be created but not assigned.** There is no
  `PATCH /documents/{id}` in the backend, so nothing in the API attaches a type
  to an existing document. Types are therefore a search facet and a taxonomy you
  can set up now; the Settings tab says so rather than offering a control that
  would silently do nothing. Assignment is a backend slice.
- `metadata_schema` is posted as `{}`. The column exists and the endpoint
  requires the key, but a JSON-schema editor is its own project and nothing
  currently reads the schema.

## Verify

No rebuild needed (web-only).

1. **Search** for something → narrow with the type or tag facet → results
   change. Save it with a name → a chip appears. Reload the page, click the
   chip: results come back without retyping. The ✕ on the chip deletes it.
2. **Document detail** → pin icon fills → the document appears under **Pinned**
   on the dashboard, newest pin first. Unpin removes it.
3. **Settings → Types** → create "Contrat" → it appears in the list and in the
   search type facet.

## Still open (post-pilot)

Signature evidence + signed-document download + ID review, workflow step
delegation, ownership transfer, notification delivery status, workflow template
builder, and imports (backend has no endpoints at all). Backend-side: assigning
a document type, `PATCH /documents/{id}`, and the reports module that doesn't
exist yet.

# Slice W14 — Extraction review, versions, document trail, audit exports

Before starting I diffed every mapped backend route against what the web
actually calls. That killed my own plan: there is **no Reports module** — the
"reports" I'd listed as the next slice don't exist server-side. What the diff
*did* surface was a much better target: the extraction pipeline, the product's
whole claim to being *intelligent*, had no UI at all.

## New files

- `src/components/extraction-panel.tsx` — review of what OCR/extraction found
  in the current version: entity type, value, confidence as a bar (a bare
  percentage reads as precision the model doesn't have), page number, and
  confirm / correct per row. Re-analyse button on the header.
- `src/components/versions-panel.tsx` — replaces the read-only versions card.
  Version list with a "current" badge **plus uploading a new version**, with an
  optional note and resumable retry.
- `src/components/document-trail-panel.tsx` — the document's slice of the
  hash-chained audit log, and the **evidence bundle** job (submit → poll →
  download).
- `src/lib/use-job.ts` — shared polling for 202-style jobs. Stops polling the
  moment the job is `done` or `failed`; a settled job never changes again, and
  a live interval is how a tab left open overnight quietly hammers the API.

## Modified

- `src/lib/api/upload.ts` — steps 1–2 factored into `reserveAndPut()`, shared by
  `run()` and the new `runAsVersion()`. Resumability and the 410 reset are
  preserved for both.
- `src/lib/api/{types,queries}.ts` — Extraction, Job, AuditAnchor; extractions
  list/confirm, reprocess, document audit, evidence bundle, audit export, job
  poll, anchors
- `src/routes/audit.tsx` — restructured into tabs (Events / **Anchors**) with an
  **export** control (CSV or JSON) in the header
- `src/routes/documents.$documentId.tsx` — ExtractionPanel, VersionsPanel and
  DocumentTrailPanel mounted; the inline versions card removed
- i18n: `extraction.*`, `version.*`, `docAudit.*`, `evidence.*`, `anchors.*`,
  `audit.export*`, `common.cancel` (FR + EN)

## Notes / decisions

- **Confirming an extraction is not cosmetic.** For `expiry_date` the backend
  creates or blesses the matching lifecycle rule, and the reminder scheduler
  picks it up on its next pass exactly as if a person had typed the date in.
  Correcting a date additionally deletes the machine's pending suggestion at the
  old one. The panel says so in a hint under unconfirmed dates, and invalidates
  the lifecycle and expiring queries on success — otherwise the user confirms a
  date and the Lifecycle panel above it stays stale.
- **`expiry_date` corrections must be ISO `yyyy-MM-dd` and in the future** — the
  backend 422s otherwise. The input shows the format as a placeholder; the error
  surfaces as a toast rather than being pre-validated, because the same endpoint
  owns the rule and duplicating its calendar logic client-side would drift.
- **Confidence under 70% renders amber.** An arbitrary line, but a visible one
  beats presenting every candidate as equally trustworthy.
- **New versions skip `/complete`.** `POST /documents/{id}/versions` consumes the
  reservation directly (it marks the upload completed itself) — calling both
  would try to spend the same upload twice.
- **Reprocess isn't polled.** It answers a job shape whose id *is* the document
  id, and that id isn't resolvable through `/audit/exports/{jobId}`. So the UI
  fires it and says results will appear shortly, rather than polling an endpoint
  that would 404.
- **Anchors got an explainer line.** "Chain head hash at sequence N" means
  nothing to the notary or bank manager this feature exists to convince.

## Verify

No rebuild needed (web-only).

1. Open a PDF document with dates in it. **Extracted data** lists candidates.
   Confirm one → badge flips to Confirmed. On an `expiry_date`, check the
   Lifecycle panel above: the rule is now active, and the document appears under
   Lifecycle → expiring.
2. Correct a date to a different future ISO date → saves, and the old pending
   suggestion disappears from the lifecycle rules.
3. **Versions** → add a note, pick a file → progress bar → v2 appears and becomes
   current. Kill the network mid-upload to check retry resumes.
4. **Document history** → events listed → Evidence bundle → button becomes
   "Building…" then a download link.
5. **Audit log** → Anchors tab (empty until the anchoring job has run) and
   Export → CSV → download link appears.

## Still open (post-pilot)

Saved searches (`/queries` CRUD), document types, pins, signature evidence +
signed-document download + ID review, step delegation, ownership transfer,
notification delivery status, workflow template builder, and imports (backend
has no endpoints at all).

# Slice W12/W13 — Data rooms, ACLs, room portal, notifications bell

Two slices landed together: W13 is small and the bell belongs in the shell that
W12 also touches.

## New files

- `src/routes/rooms.index.tsx` — room list (status/expiry badges, empty state)
  + create dialog (name, description, optional expiry)
- `src/routes/rooms.$roomId.tsx` — room detail in three tabs:
  - **Documents** — resolves the `document_ids` the API returns into titles with
    `useQueries` (cached already when the user came from the vault); add-documents
    dialog searches the vault and filters out what's in the room
  - **Visitors** — invite form + the engagement table (documents opened, reading
    time from the heartbeat counter, last visit)
  - **Settings** — rename / change expiry; disabled once the room is closed
  Closing a room is `DELETE /data-rooms/{id}` — soft, analytics survive.
- `src/components/acl-panel.tsx` — internal permissions on document detail:
  entry list with inline level change and remove, add row (member / department /
  role × view / comment / edit / manage, optional expiry), and an
  **effective-access checker** that renders the backend's resolution trace
  ("Direct grant: edit", "Via role 'Owner': manage", …).
- `src/routes/room.$token.tsx` — PUBLIC visitor portal, the fourth anonymous
  surface after /shared, /sign, /verify. Room header, curated document list,
  in-page rendering, and heartbeat pings while a document is open.
- `src/components/notification-bell.tsx` (W13) — bell in the top bar, unread
  count badge, list with unread markers, mark-one-on-open and mark-all, paged.

## Modified

- `src/lib/api/types.ts` — DataRoom, DataRoomDetail, RoomVisitorAnalytics,
  AclEntry/AclEntryInput, EffectiveAccess, RoomPortalView, Notification,
  Department; `ACCESS_LEVELS` / `PRINCIPAL_TYPES` as const tuples so the
  selects and the types can't drift apart
- `src/lib/api/queries.ts` — data-room CRUD + documents + visitors + analytics,
  ACL get/set, effective-access, the three public `/room/{token}` calls,
  notifications list + mark-read, and the missing `departmentsQuery`
- `src/lib/format.ts` — `formatDuration` for the reading-time column
- `src/components/app-shell.tsx` — NotificationBell in the top bar; Rooms in the
  sidebar (`NAV_SECONDARY`) and in the profile menu on mobile
- `src/routes/documents.$documentId.tsx` — AclPanel mounted
- i18n: `rooms.*`, `room.*`, `acl.*`, `notifications.*`, `nav.rooms` (FR + EN)

## Notes / decisions

- **The visitor's magic link is never returned by the API.** `POST
  /data-rooms/{id}/visitors` answers `{status:"invited"}`; the raw token appears
  exactly once, in `LoggingVisitorDelivery`, on its way to email. So the UI
  cannot offer a copy-link button — the invite hint says re-invite to issue a new
  link. In dev the link is in the API log (`…/room/{token}`).
- **Rooms are watermarked view-only by construction.** The portal renders through
  `InlinePdfViewer` (canvas) or an `<img>`, never a browser document tab — same
  reasoning as the view-only share link. The backend stamps per visitor and
  timestamp, so a leaked screenshot still carries an identity.
- **Heartbeat is paused when the tab is hidden** (20s cadence). A forgotten
  background tab shouldn't invent reading time; the backend clamps 1–120s per
  ping anyway, and inflating your *own* number is the worst a hostile guest can do.
- **The ACL API is set-replace, not row-edit** (`PUT` takes the whole array —
  the table has no `updated_at` because rows are never edited). Every action in
  the panel therefore rebuilds the full list from what's loaded and sends it back.
- **Notifications are polled at 60s, not pushed.** There's no SSE/WebSocket
  surface on the backend, and a socket per tab isn't worth a minute of latency
  on an in-app bell.
- **`/room/{token}` is unversioned** like the other capability surfaces, so it
  goes through `publicApiFetch` and the `/pub` alias — the SPA owns `/room/...`
  on the same origin.

## Fixed in passing

Pre-existing `tsc` errors that made `npm run typecheck` useless as a signal:
unused imports in `app-shell`, `ui/dropdown-menu`, `ui/select`, `approvals`, and
`page.render()` missing the `canvas` property required by the current
pdfjs-dist `RenderParameters`. Typecheck is now clean.

## Verify

No rebuild needed (web-only).

1. **Rooms** → New room → add documents from the vault → Visitors → invite
   yourself. Grab the `…/room/{token}` URL from the API log, open it in a private
   window: the portal lists the curated set; opening a document renders in-page.
   Back in the app, the Visitors tab shows documents opened and reading time
   climbing (leave a document open ~20s).
2. **Document detail → Internal permissions** → grant a member `edit`, then
   check access for that member: the trace should name the direct grant. Remove
   it and re-check.
3. **Bell** — appears in the top bar; the count reflects unread. Marking all read
   clears it.
4. Close the room → the visitor link 404s, the analytics stay.

## Still open (post-pilot)

Reports, API keys, webhooks, emergency access, imports (no backend endpoints
yet), retention policies + legal-holds admin, workflow template builder.

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

# Slice W11 — Workflows & approvals (first post-pilot slice)

Backend was fully mapped (templates, instances, steps, tasks) — pure web slice.

## New files

- `src/routes/approvals.tsx` — in main nav. Tabs: **To approve** (the step inbox —
  per-step approve / request-changes / reject with an optional comment, count badge on
  the tab) and **Tasks** (quick-add, list, mark done).
- `src/components/workflow-panel.tsx` — on document detail: start a workflow from an
  active template, see each instance with its step trail (decisions as badges), cancel a
  running one.

## Modified

- `src/lib/api/types.ts` — WorkflowTemplate, Workflow, WorkflowStep, TaskItem
- `src/lib/api/queries.ts` — templates, inbox, per-document workflows, start/cancel,
  decide/remind, tasks list/create/update
- `src/routes/documents.$documentId.tsx` — WorkflowPanel mounted
- `src/components/app-shell.tsx` — Approvals nav entry
- i18n `approvals.*`, `workflow.*`, `nav.approvals` (FR + EN)

## Note

Workflow **templates** are created via `POST /workflow-templates` with a JSON definition —
no template *builder* UI in this slice (a visual step designer is its own project). The
panel lists and starts whatever templates exist; create one via API/Postman to exercise
the flow end-to-end.

## Verify

No rebuild needed (web-only). Create a template via API, then: document → Approval
workflow → choose template → Start → step trail appears. Approvals → To approve shows the
step → Approve with a comment → trail updates to Approved. Tasks tab: add, mark done.

---

# Slice W10 — Team & admin (members, invitations, audit, public verify)

Final pilot-critical slice.

## New files

- `src/routes/team.tsx` — Tabs: Members (role change via Select, remove), Invitations
  (invite dialog → **invite URL surfaced for WhatsApp/SMS**, revoke), Organization
  (rename, plan/region/isolation tier)
- `src/routes/audit.tsx` — audit event table (shadcn Table), debounced action filter,
  cursor pagination
- `src/routes/verify.$documentHash.tsx` — PUBLIC integrity page (QR target on sealed
  PDFs): authentic/not-verified verdict, issuer, sealed date. Replaces the W1 placeholder.
- `src/routes/invitations.$token.accept.tsx` — PUBLIC invite acceptance; adopts returned
  tokens and lands in the app

## Modified

- `src/lib/api/types.ts` — Member, Invitation, Role, AuditEvent, PublicVerifyResult
- `src/lib/api/queries.ts` — members/invitations/roles, invite create+revoke, member
  update/remove, tenant rename, audit events, acceptInvitation, verifyDocumentHash
- `src/components/app-shell.tsx` — Team + Audit log in profile menu
- i18n `team.*`, `invite.*`, `audit.*`, `verify.*`, nav entries (FR + EN)

## Backend companion (B34, rebuild)

GET /roles, GET|POST /departments, PATCH /tenant implemented (were spec-only).

## Verify

Rebuild backend. Team → Invitations → invite an address you can read in Mailpit → copy the
invite URL → open in a private window → accept (name + password) → lands in the vault as a
member. Team → Members shows them; change role; remove. Audit log lists events (upload a
file, watch `document.created` appear). Open `/verify/<hash>` for a sealed doc → authentic.

---

# Slice W9 — Billing (mobile money, plans, invoices, read-only gate)

Pure web slice — the Billing module was already fully mapped.

## New files

- `src/routes/billing.tsx` — current subscription + usage, plan cards (current highlighted),
  invoice list with PDF download. In profile menu.
- `src/components/mobile-money-dialog.tsx` — CamPay flow: provider (MTN/Orange) + phone →
  initiate → **USSD dial code surfaced prominently** → polls `GET /payments/{id}` every 3s
  until succeeded/failed → invalidates subscription/usage/invoices

## Modified

- `src/lib/api/types.ts` — Subscription, Payment (purpose.ussd_hint), Invoice
- `src/lib/api/queries.ts` — subscription, invoices, changeSubscription, initiateMobileMoney,
  getPayment, invoicePdfUrl
- `src/lib/api/http.ts` — 402 → dispatches `kdb:read-only` window event
- `src/components/app-shell.tsx` — Billing menu item + **read-only banner** (listens for the
  402 event; links to billing)
- i18n `billing.*`, `nav.billing`, `common.done` (FR + EN)

## Notes

- USSD code comes from `payment.purpose.ussd_hint` (backend serializes it into purpose),
  not a top-level field — matches the CamPay adapter.
- Dev provider is `DevMobileMoneyProvider`; payments may auto-settle or need the
  reconciliation poller — if status stays `pending`, that's the dev provider, not the UI.

## Fix W9.1 (same slice)

- `/plans` is mapped on the backend's PUBLIC (unversioned) surface — `MapPublicEndpoints`,
  not the `/v1` group. The client was calling it via `apiFetch` (which prefixes `/v1`) →
  404. Now uses `publicApiFetch`. This also fixes the plan picker in **onboarding**, which
  reads the catalogue before a tenant exists.
- `GET /subscription` answers **404 when there's no subscription** (trial) — a legitimate
  state, not an error. `subscriptionQuery` maps 404 → `null` so the page renders the trial
  copy without an error path or retry noise.

## Verify

Rebuild not required (web-only). Billing page shows plans + current subscription + usage.
Choose a plan → Mobile Money dialog → enter phone → USSD code shows, polling spinner →
on settle, subscription updates. Invoices list + PDF. (Read-only banner appears if any
mutation 402s (cancelled subscription).)

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
