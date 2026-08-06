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
