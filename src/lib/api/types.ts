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

/** `GET /folders/{id}/contents` mixes both — a Document always has `title`. */
export type FolderContentItem = Folder | Document

export function isDocument(item: FolderContentItem): item is Document {
  return 'title' in item
}
