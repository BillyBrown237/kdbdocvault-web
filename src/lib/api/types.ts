/**
 * Hand-grounded types from kdb-vault-openapi.yaml (v1.1.0).
 * Interim layer until orval generation is adopted wholesale — keep field names
 * exactly as the spec's snake_case.
 */

export interface Pagination {
  next_cursor: string | null
  has_more: boolean
}

export interface Page<T> {
  data: T[]
  pagination?: Pagination
}

export interface MembershipSummary {
  tenant_id: string
  tenant_name: string
  role: string
}

export interface User {
  id: string
  email: string
  phone: string | null
  name: string
  locale: string
  mfa_enabled: boolean
  memberships: MembershipSummary[]
  created_at: string
}

export interface Tenant {
  id: string
  name: string
  plan: string
  region: string
  isolation_tier: 'shared' | 'dedicated' | 'sovereign'
  status: string
  created_at: string
}

export interface TenantUsage {
  storage_bytes_used: number
  storage_bytes_included: number
  seats_used: number
  seats_included: number
  ai_credits_used: number
  signature_envelopes_used: number
}

export interface Plan {
  id: string
  name: string
  price_minor_units: number
  currency: string
  billing_interval: 'month' | 'year'
  features?: string[]
  limits?: Record<string, number>
}

export interface Folder {
  id: string
  name: string
  parent_id: string | null
  path: string
  created_at: string
}

export interface Tag {
  id: string
  name: string
  color?: string
}

export interface DocumentVersion {
  id: string
  version_no: number
  size_bytes: number
  mime_type: string
  checksum_sha256: string
  created_by: string
  created_at: string
  note: string | null
}

export type DocumentStatus =
  | 'draft'
  | 'active'
  | 'expiring'
  | 'expired'
  | 'renewed'
  | 'archived'

export interface Document {
  id: string
  title: string
  folder_id: string | null
  type_id: string | null
  owner_id: string
  status: DocumentStatus
  processing_status: 'queued' | 'processing' | 'done' | 'failed'
  current_version?: DocumentVersion
  metadata?: Record<string, unknown>
  tags?: Tag[]
  lifecycle_summary?: { next_key_date: string | null; rule_type: string | null }
  legal_hold: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface ShareLink {
  id: string
  document_id: string
  permission: 'view' | 'download'
  has_password: boolean
  expires_at: string | null
  max_views: number | null
  view_count: number
  watermark: boolean
  notify_on_access: boolean
  revoked_at: string | null
  created_at: string
  /** Present ONLY on the create response — the raw token's single appearance. */
  url?: string | null
}

export interface SharedMeta {
  title: string
  requires_password: boolean
  permission: 'view' | 'download'
}

export type SignerStatus = 'pending' | 'verified' | 'signed' | 'declined'
export type EnvelopeStatus =
  | 'draft'
  | 'sent'
  | 'completed'
  | 'declined'
  | 'cancelled'
  | 'expired'

export interface Signer {
  id: string
  name: string
  email: string
  phone: string | null
  signing_order: number
  verify_method: 'email_otp' | 'sms_otp' | 'id_check'
  status: SignerStatus
  verified_at: string | null
  signed_at: string | null
  declined_reason: string | null
  /** null until an ID-check signer uploads one (B36). */
  id_check_status: 'submitted' | 'approved' | 'rejected' | null
  id_checked_at: string | null
}

/** The legal artifact, written once by the sealing job and never updated. */
export interface SignatureEvidence {
  envelope_id: string
  document_hash: string
  sealed_pdf_key: string
  certificate_key: string
  event_trail: unknown
  sealed_at: string
}

export interface Envelope {
  id: string
  document_id: string
  version_id: string
  status: EnvelopeStatus
  message: string | null
  deadline: string | null
  created_by: string
  sent_at: string | null
  completed_at: string | null
  cancel_reason: string | null
  created_at: string
  signers: Signer[]
}

/** Public guest-sign view (GET /sign/{token}). */
export interface GuestSignView {
  envelope: {
    id: string
    status: EnvelopeStatus
    document_title: string
    message: string | null
    deadline: string | null
  }
  signer: { name: string; status: SignerStatus }
  verify_required: boolean
  is_your_turn: boolean
  id_check_status: string | null
}

export type RuleType = 'expiry' | 'renewal' | 'review'
export type RuleStatus = 'pending_confirmation' | 'active' | 'resolved'

export interface LifecycleRule {
  id: string
  document_id: string
  document_title?: string | null
  rule_type: RuleType
  key_date: string
  source: 'manual' | 'ocr'
  status: RuleStatus
}

export type ReminderChannel = 'in_app' | 'email' | 'sms' | 'whatsapp' | 'push'

export interface Reminder {
  id: string
  rule_id: string
  offset_days: number
  channel: ReminderChannel
  recipient_id: string | null
  escalate_to: string | null
  status: 'scheduled' | 'sent' | 'acknowledged' | 'escalated'
  fire_at: string
  sent_at: string | null
  acknowledged_at: string | null
}

export interface Obligation {
  id: string
  document_id: string
  document_title?: string | null
  title: string
  due_date: string
  recurrence: string | null
  owner_id: string | null
  status: 'open' | 'done' | 'overdue'
}

export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled' | 'trial'

export interface Subscription {
  plan_id: string | null
  seats: number
  status: SubscriptionStatus
  renews_at: string | null
  payment_method: string | null
}

export type PaymentStatus =
  | 'pending'
  | 'awaiting_confirmation'
  | 'succeeded'
  | 'failed'
  | 'refunded'

export interface Payment {
  id: string
  provider: string
  amount_minor_units: number
  currency: string
  status: PaymentStatus
  purpose?: { plan_id?: string; ussd_hint?: string | null }
  created_at: string
}

export interface Invoice {
  id: string
  number: string
  amount_minor_units: number
  currency: string
  status: 'paid' | 'open' | 'void'
  issued_at: string
}

export interface Member {
  id: string
  user_id: string
  name: string | null
  email: string
  role_id: string
  role_name: string
  department_id: string | null
  status: string
  joined_at: string
}

export interface Invitation {
  id: string
  email: string
  role_id: string
  department_id: string | null
  status: 'pending' | 'accepted' | 'revoked' | 'expired'
  expires_at: string
  created_at: string
}

export interface Role {
  id: string
  name: string
  is_system: boolean
}

export interface Department {
  id: string
  name: string
  parent_id: string | null
}

export interface AuditEvent {
  id: string
  seq: number
  actor_id: string | null
  actor_type: string
  action: string
  resource_type: string | null
  resource_id: string | null
  ip_address: string | null
  device: string | null
  detail?: Record<string, unknown>
  created_at: string
}

export interface PublicVerifyResult {
  valid: boolean
  sealed_at: string | null
  issuer: string | null
}

export interface WorkflowTemplate {
  id: string
  name: string
  definition: unknown
  version: number
  active: boolean
  created_at: string
}

export interface WorkflowStep {
  id: string
  instance_id: string
  step_no: number
  step_type: string
  assignee_id: string | null
  decision: string | null
  comment: string | null
  due_at: string | null
  decided_at: string | null
  delegated_from: string | null
  /** present on the inbox feed */
  document_title?: string | null
}

export interface Workflow {
  id: string
  template_id: string
  template_version: number
  document_id: string
  status: 'running' | 'completed' | 'cancelled' | 'overdue'
  started_by: string
  started_at: string
  completed_at: string | null
  cancel_reason: string | null
  steps: WorkflowStep[]
}

export interface TaskItem {
  id: string
  title: string
  document_id: string | null
  assignee_id: string | null
  due_at: string | null
  status: 'open' | 'done'
  created_by: string
  created_at: string
}

export interface SearchHit {
  document: Document
  score?: number
  snippets?: string[]
}

export interface TrashItem {
  id: string
  title: string
  deleted_at: string | null
  purge_after: string | null
}

// --- data rooms, ACLs, notifications (W12/W13) -------------------------------

export interface DataRoom {
  id: string
  name: string
  description: string | null
  status: 'open' | 'closed'
  expires_at: string | null
  created_by: string
  created_at: string
  updated_at: string
}

/** `GET /data-rooms/{id}` — the list shape plus the room's contents. */
export interface DataRoomDetail extends DataRoom {
  document_ids: string[]
  visitor_count: number
}

export interface RoomVisitorAnalytics {
  email: string
  name: string | null
  documents_opened: number
  total_view_seconds: number
  last_visit: string | null
}

/** Ordered least → most privileged; the backend ranks them the same way. */
export const ACCESS_LEVELS = ['view', 'comment', 'edit', 'manage'] as const
export type AccessLevel = (typeof ACCESS_LEVELS)[number]

export const PRINCIPAL_TYPES = ['member', 'department', 'role'] as const
export type PrincipalType = (typeof PRINCIPAL_TYPES)[number]

export interface AclEntry {
  id: string
  principal_type: PrincipalType
  principal_id: string
  access_level: AccessLevel
  expires_at: string | null
  created_by: string | null
  created_at: string
}

/** What the PUT takes — no server-assigned fields. */
export interface AclEntryInput {
  principal_type: PrincipalType
  principal_id: string
  access_level: AccessLevel
  expires_at?: string | null
}

export interface EffectiveAccess {
  /** null = no grant reaches this member at all. */
  access_level: AccessLevel | null
  trace: { source: string; detail: string }[]
}

/** The visitor's view of a room — public surface, no auth. */
export interface RoomPortalView {
  room: { name: string; description: string | null; expires_at: string | null }
  visitor: { name: string | null }
  documents: { id: string; title: string }[]
}

export interface Notification {
  id: string
  title: string
  body: string | null
  event_type: string
  resource_type: string | null
  resource_id: string | null
  read_at: string | null
  created_at: string
}

// --- saved searches & document types (W15) -----------------------------------

/** `query` is stored as jsonb and parsed leniently server-side: unknown keys
 * are ignored, so the shape can grow without breaking old rows. */
export interface SavedSearch {
  id: string
  name: string
  query: { q: string; type_id?: string | null; folder_id?: string | null; tag?: string | null }
  created_at: string
  updated_at: string
}

export interface DocumentType {
  id: string
  name: string
  is_system: boolean
  metadata_schema: Record<string, unknown>
}

/** B58. `direction: 'outgoing'` means THIS document is the subject of the
 * verb ("this amends that"); 'incoming' means it's the object ("amended by"). */
export interface DocumentLink {
  id: string
  link_type: 'amends' | 'fulfills' | 'supports' | 'relates_to'
  direction: 'outgoing' | 'incoming'
  other_document: { id: string; title: string; status: string }
  created_by: string | null
  created_at: string
}

// --- B62–B65 (W31) ------------------------------------------------------------

export interface RetentionPolicy {
  id: string
  doc_type_id: string
  doc_type_name: string
  trigger_event: 'creation' | 'expiry'
  retain_years: number
  end_action: 'archive' | 'destroy' | 'review'
  created_at: string
}

/** Flat with `parent_id` — one level of threading, nested by the client. */
export interface Comment {
  id: string
  parent_id: string | null
  author_id: string
  author_name: string
  body: string
  edited: boolean
  /** Tombstone: body is blank but the row stays so replies keep their anchor. */
  deleted: boolean
  created_at: string
}

export interface Device {
  id: string
  platform: 'web' | 'ios' | 'android'
  token_preview: string
  created_at: string
}

export interface DeviceList {
  data: Device[]
  platforms: string[]
  delivery: {
    enabled: boolean
    web_enabled: boolean
    mobile_enabled: boolean
    /** Public by definition — the browser needs it to subscribe. Served
     * rather than bundled so rotating doesn't need a frontend release. */
    vapid_public_key: string | null
    reason: string | null
    detail: string
  }
}

export interface EmergencyContact {
  id: string
  name: string
  email: string
  phone: string | null
  scope: 'all' | 'selected_folders'
  folder_ids: string[]
  veto_window_hours: number
  status: 'active' | 'access_requested' | 'access_granted'
  access_requested_at: string | null
  created_at: string
}

export interface CreatedEmergencyContact {
  contact: EmergencyContact
  grant_token: string
  grant_token_notice: string
}

// --- templates (W30 / B61) ----------------------------------------------------

export interface TemplateField {
  key: string
  label: string
  type: 'text' | 'date' | 'number' | 'choice'
  required: boolean
  choices?: string[] | null
}

export interface Template {
  id: string
  name: string
  doc_type_id: string | null
  version: number
  active: boolean
  created_at: string
  fields: TemplateField[]
}

/** Authoring mistakes, reported rather than blocking: a declared field that
 * appears nowhere in the file, or a placeholder nobody declared. */
export interface TemplateWarnings {
  declared_but_missing: string[]
  in_file_but_undeclared: string[]
}

export interface TemplateDetail {
  template: Template
  warnings: TemplateWarnings
}

export interface GeneratedDocument {
  document_id: string
  version_id: string
  title: string
  can_send_for_signature: boolean
  signature_blocked_reason: string | null
}

// --- integrations (W28 / B59-B60) --------------------------------------------

export interface ApiKey {
  id: string
  name: string
  scopes: string[]
  expires_at: string | null
  last_used_at: string | null
  last_used_ip: string | null
  rotated_at: string | null
  /** While in the future, the PREVIOUS secret still works (rotation window). */
  grace_until: string | null
  revoked_at: string | null
  created_at: string
}

/** The only shape that ever carries a secret — on create and on rotate. */
export interface CreatedApiKey {
  key: ApiKey
  secret: string
  secret_notice: string
}

export interface ApiKeyList {
  data: ApiKey[]
  available_scopes: { scope: string; description: string }[]
}

export interface Webhook {
  id: string
  url: string
  events: string[]
  active: boolean
  created_at: string
}

export interface WebhookList {
  data: Webhook[]
  available_events: string[]
  signature: {
    header: string
    timestamp_header: string
    algorithm: string
    tolerance_seconds: number
  }
}

export interface WebhookDelivery {
  id: string
  event_id: string
  event_type: string
  status: 'pending' | 'delivered' | 'failed'
  attempt: number
  response_code: number | null
  error: string | null
  delivered_at: string | null
  next_attempt_at: string | null
  created_at: string
}

/** B57. Absent policy row on the server = these defaults, so this is never null. */
export interface SecurityPolicy {
  require_mfa: boolean
  session_max_days: number
  ip_allowlist: string[]
  share_max_days: number | null
  share_require_password: boolean
  share_external_allowed: boolean
}

/** B56. `always_on` lists channels that cannot be switched off (in_app). */
export interface NotificationPrefs {
  channels: string[]
  always_on: string[]
  preferences: { family: string; channels: Record<string, boolean> }[]
}

// --- imports (W17) -----------------------------------------------------------

export interface ImportJob {
  id: string
  source: string
  status: 'queued' | 'running' | 'done' | 'failed' | 'cancelled'
  discovered: number
  transferred: number
  failed: number
  /** Presigned, short-lived; only present when at least one file failed. */
  error_report_url: string | null
  started_at: string | null
  finished_at: string | null
}

export interface ImportConnection {
  id: string
  provider: string
  account_label: string | null
  status: 'pending_auth' | 'connected' | 'revoked'
  created_at: string
}

// --- reports (W20 / B46, admin+) --------------------------------------------

export interface ReportOverview {
  documents: { active: number; trashed: number }
  storage_bytes: number
  members_active: number
  share_links_active: number
  envelopes: { open: number; completed: number }
  workflows_running: number
  expiring_in_30_days: number
  obligations_open: number
  imports_running: number
  generated_at: string
}

export interface ExpiringReportRow {
  document_id: string
  title: string
  rule_type: string
  key_date: string
  days_left: number
  owner_id: string
  owner_name: string | null
}

export interface ActivityMember {
  user_id: string | null
  name: string | null
  email: string | null
  total: number
  actions: Record<string, number>
}

export interface SharingExposureReport {
  links: {
    active: number
    password_protected: number
    without_expiry: number
    expiring_in_7_days: number
    watermarked: number
  }
  views_30d: number
  unique_viewers_30d: number
  rooms: { open: number; visitors: number }
  top_shared: { document_id: string; title: string; views: number }[]
  generated_at: string
}

export interface ComplianceReport {
  documents_active: number
  with_lifecycle_rule: number
  retention_coverage_pct: number
  unclassified: number
  orphaned: number
  under_legal_hold: number
  holds_active: number
  obligations_overdue: number
  rules_pending_confirmation: number
  generated_at: string
}

export interface WorkflowPerfReport {
  started_90d: number
  completed_90d: number
  avg_completion_hours: number | null
  overdue_open_steps: number
  by_template: { template_id: string; name: string; completed: number; avg_hours: number | null }[]
  generated_at: string
}

/** B50 legal holds (admin+). `pending_release` carries who opened the
 * request so the UI can demand a DIFFERENT second administrator. */
export interface LegalHold {
  id: string
  name: string
  description: string | null
  status: 'active' | 'pending_release' | 'released'
  created_by: string | null
  released_at: string | null
  created_at: string
  item_count: number
  pending_release: { request_id: string; requested_by: string } | null
}

/** POST /import-connections (google_drive): open `authorize_url` in a popup;
 * the callback page posts `{type:'kdb:import-connection', ok, reason}` back. */
export interface CreateImportConnectionResult {
  connection_id: string
  authorize_url: string
}

/** One page of one Drive folder (W19 picker). Spec extension, like /room. */
export interface DriveBrowse {
  folders: { id: string; name: string }[]
  files: { id: string; name: string; mime_type: string; size: number | null }[]
  next_page_token: string | null
}

// --- extraction review, jobs, anchors (W14) ----------------------------------

/** A candidate the pipeline pulled out of the CURRENT version's text.
 * `confidence` is 0–1. `expiry_date` values are ISO `yyyy-MM-dd` and confirming
 * one creates (or blesses) the matching lifecycle rule server-side. */
export interface Extraction {
  id: string
  entity_type: string
  value: string
  confidence: number
  page_no: number | null
  confirmed: boolean
}

/** Async work: audit exports, evidence bundles, reprocessing. Poll until
 * `status` is `done` (then `result_url` is set) or `failed`. */
export interface Job {
  job_id: string
  status: 'queued' | 'running' | 'done' | 'failed'
  progress_percent: number
  result_url: string | null
  error: string | null
}

export interface AuditAnchor {
  id: string
  chain_head_hash: string
  seq: number
  anchor_ref: string | null
  anchored_at: string
}

/** `GET /folders/{id}/contents` mixes both — a Document always has `title`. */
export type FolderContentItem = Folder | Document

export function isDocument(item: FolderContentItem): item is Document {
  return 'title' in item
}
