# Web roadmap — slice by slice

Same working agreement as the backend: each slice ships new/changed files + `CHANGES.md`,
you report compile errors, contract stays grounded in the OpenAPI spec (`npm run api:generate`
after every spec sync). A slice is done when it works on a phone-sized viewport in FR and EN.

## W1 ✅ Foundation
SPA conversion, router/query/i18n/PWA wiring, apiFetch pipeline, login, guarded dashboard.

## W2 — App shell + vault browsing (read-only)
The `_app` pathless layout: mobile-first nav (bottom bar on small screens, sidebar on desktop),
profile menu (`/me`), tenant switcher (`/tenants` + `/auth/switch-tenant`), language toggle.
Folder tree + contents (`/folders/{id}/contents`), document list with cursor pagination,
recent (`/recent`) and favorites (`/favorites`) on the dashboard home. Run orval for real and
consume generated hooks from here on.

## W3 — Upload + document detail
Multipart pipeline (`/documents/uploads` → parts → complete) with progress (small XHR helper),
document detail: metadata, type, tags, versions list, download/preview via presigned 302.
Offline-aware: queue-and-retry UX for failed uploads (explicit retry, idempotent by design).

## W4 — Search + organization
Search page (`/search`, saved queries), tag management, move/copy, trash/restore, pins.

## W5 — Sharing
Share-link CRUD on a document, link views analytics, and the public `/shared/:token`
surface (unlock + content). First public-surface slice — no auth, works logged out.

## W6 — Signatures
Envelope create/send/remind/cancel on a document + the guest `/sign/:signToken` flow
(verify → OTP → complete/decline). Evidence + signed-document download.

## W7 — Auth completion
Register + OTP verify, forgot/reset, MFA challenge screen (login already surfaces it),
TOTP setup, active sessions management. Problem-code-keyed error messages (INVALID_CREDENTIALS…).

## W8 — Lifecycle & compliance
Expiring-documents dashboard widget + full view, lifecycle rules + reminders + acknowledge,
obligations. This is a core differentiator for the Cameroonian legal/business market — high pilot value.

## W9 — Billing (mobile money)
Plans, subscription change, CamPay initiate with **USSD code surfaced prominently**, payment
status polling, invoices + PDF. Read-only-mode banner when SubscriptionGateMiddleware kicks in.

## W10 — Team & admin
Members, invitations (send + public accept page), roles, departments, tenant settings,
audit event viewer, `/verify/:documentHash` public integrity page.

## W11 — PWA/offline polish + hardening
Icons, install prompt, offline banner, persisted-query tuning, error boundary pass,
Caddy deploy block + CI build. Lighthouse pass on a throttled profile (low-end Android target).

---

**Deliberately deferred:** data rooms, workflows/approvals UI, reports suite, imports,
API keys/webhooks admin — post-pilot unless a customer forces them (same rule as OpenSearch).

**Standing definition of done per slice:** FR + EN strings, mobile viewport, loading/empty/error
states, ApiProblem surfaced honestly, CHANGES.md.
