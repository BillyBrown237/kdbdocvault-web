/**
 * Resumable upload machinery — the presigned pipeline for every size:
 *
 *   POST /documents/uploads (initiate, client-side SHA-256)
 *   → XHR PUT to the presigned URL (XHR because fetch can't report upload
 *     progress; no auth header — the signature IS the auth)
 *   → POST /documents/uploads/{id}/complete → document created.
 *
 * An UploadTask remembers how far it got: retrying resumes from the FAILED
 * step (re-PUT with the same reservation, or just re-complete). The backend
 * cooperates twice over — initiate is idempotent on (user, checksum, size)
 * while the reservation is unexpired, and complete is replayable until it
 * succeeds once. Even a page reload converges onto the same reservation.
 *
 * Dev note: the PUT goes straight to MinIO (localhost:9000 = S3 API; 9001 is
 * only the console). CORS errors there mean the Vite origin isn't allowed.
 */
import { ApiProblem, NetworkError, apiFetch } from './http'
import type { Document } from './types'

export async function sha256Hex(file: File): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer())
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

interface XhrResult {
  status: number
  responseText: string
}

function xhrSend(
  url: string,
  method: string,
  body: XMLHttpRequestBodyInit,
  headers: Record<string, string>,
  onProgress?: (fraction: number) => void,
): Promise<XhrResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open(method, url)
    for (const [k, v] of Object.entries(headers)) xhr.setRequestHeader(k, v)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total)
    }
    xhr.onload = () => resolve({ status: xhr.status, responseText: xhr.responseText })
    xhr.onerror = () => reject(new NetworkError(new Error(`upload failed: ${url}`)))
    xhr.onabort = () => reject(new NetworkError(new Error('upload aborted')))
    xhr.send(body)
  })
}

function parseProblem(res: XhrResult): ApiProblem {
  try {
    const p = JSON.parse(res.responseText) as { title?: string; detail?: string; type?: string }
    return new ApiProblem(res.status, p.title ?? 'Upload failed', p.detail, p.type, p)
  } catch {
    return new ApiProblem(res.status, 'Upload failed')
  }
}

interface InitiateResponse {
  upload_id: string
  upload_url: string
  expires_at: string
}

/** Stateful, resumable upload. Call run(); on failure, call run() again. */
export class UploadTask {
  private uploadId: string | null = null
  private uploadUrl: string | null = null
  private putDone = false

  constructor(
    readonly file: File,
    readonly folderId?: string,
  ) {}

  async run(onProgress?: (fraction: number) => void): Promise<Document> {
    // Step 1 — reserve (idempotent server-side; a 410-expired reservation
    // is cleared so the next run() reserves fresh).
    if (!this.uploadId) {
      const checksum = await sha256Hex(this.file)
      const r = await apiFetch<InitiateResponse>('/documents/uploads', {
        method: 'POST',
        body: JSON.stringify({
          filename: this.file.name,
          size_bytes: this.file.size,
          mime_type: this.file.type || 'application/octet-stream',
          checksum_sha256: checksum,
          folder_id: this.folderId,
        }),
      })
      this.uploadId = r.upload_id
      this.uploadUrl = r.upload_url
    }

    // Step 2 — the bytes (skipped on retry if it already succeeded).
    if (!this.putDone) {
      const put = await xhrSend(
        this.uploadUrl!,
        'PUT',
        this.file,
        { 'Content-Type': this.file.type || 'application/octet-stream' },
        onProgress,
      )
      if (put.status < 200 || put.status >= 300) throw parseProblem(put)
      this.putDone = true
    }

    // Step 3 — materialize (replayable server-side until it succeeds).
    try {
      return await apiFetch<Document>(`/documents/uploads/${this.uploadId}/complete`, {
        method: 'POST',
        body: JSON.stringify({ title: this.file.name }),
      })
    } catch (err) {
      if (err instanceof ApiProblem && err.status === 410) {
        // Reservation expired — restart cleanly on next run().
        this.uploadId = null
        this.uploadUrl = null
        this.putDone = false
      }
      throw err
    }
  }
}
