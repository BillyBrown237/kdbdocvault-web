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

export interface FileChecksum {
  hex: string
  base64: string
}

/** hex goes to initiate (API contract); base64 goes on the PUT itself —
 * the presigned URL SIGNS the x-amz-checksum-sha256 header, so the PUT
 * must carry it or the storage service rejects the request. */
export async function sha256(file: File): Promise<FileChecksum> {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', await file.arrayBuffer()))
  return {
    hex: Array.from(digest, (b) => b.toString(16).padStart(2, '0')).join(''),
    base64: btoa(String.fromCharCode(...digest)),
  }
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
  private checksum: FileChecksum | null = null
  private putDone = false

  constructor(
    readonly file: File,
    readonly folderId?: string,
  ) {}

  /** Steps 1–2, shared by `run()` (new document) and `runAsVersion()` (new
   * version of an existing one) — both reserve and PUT identically; only the
   * materializing call at the end differs. */
  private async reserveAndPut(onProgress?: (fraction: number) => void): Promise<void> {
    // Step 1 — reserve (idempotent server-side; a 410-expired reservation
    // is cleared so the next run() reserves fresh).
    if (!this.uploadId) {
      this.checksum ??= await sha256(this.file)
      const r = await apiFetch<InitiateResponse>('/documents/uploads', {
        method: 'POST',
        body: JSON.stringify({
          filename: this.file.name,
          size_bytes: this.file.size,
          mime_type: this.file.type || 'application/octet-stream',
          checksum_sha256: this.checksum.hex,
          folder_id: this.folderId,
        }),
      })
      this.uploadId = r.upload_id
      this.uploadUrl = r.upload_url
    }

    // Step 2 — the bytes (skipped on retry if it already succeeded). The
    // checksum header is part of the presigned signature — omit it and the
    // storage service answers 400 before looking at the body.
    if (!this.putDone) {
      const put = await xhrSend(
        this.uploadUrl!,
        'PUT',
        this.file,
        {
          'Content-Type': this.file.type || 'application/octet-stream',
          'x-amz-checksum-sha256': this.checksum!.base64,
        },
        onProgress,
      )
      if (put.status < 200 || put.status >= 300) throw parseProblem(put)
      this.putDone = true
    }
  }

  /** A 410 means the reservation died under us — forget it so the next call
   * reserves fresh instead of replaying against a dead upload id. */
  private resetOnExpiry(err: unknown): never {
    if (err instanceof ApiProblem && err.status === 410) {
      this.uploadId = null
      this.uploadUrl = null
      this.putDone = false
    }
    throw err
  }

  async run(onProgress?: (fraction: number) => void): Promise<Document> {
    await this.reserveAndPut(onProgress)

    // Step 3 — materialize (replayable server-side until it succeeds).
    try {
      return await apiFetch<Document>(`/documents/uploads/${this.uploadId}/complete`, {
        method: 'POST',
        body: JSON.stringify({ title: this.file.name }),
      })
    } catch (err) {
      this.resetOnExpiry(err)
    }
  }

  /**
   * Reserve + PUT only, returning the upload id.
   *
   * For archives handed to `POST /imports`: the bytes travel the same
   * presigned path as any document, but the reservation must NOT be
   * completed — `/complete` would mint a single document out of the ZIP
   * itself, which is the opposite of importing its contents. The import
   * worker reads the upload row directly.
   */
  async runAsArchive(onProgress?: (fraction: number) => void): Promise<string> {
    return this.reserveOnly(onProgress)
  }

  /**
   * The general form of the above: get the bytes into storage and hand back
   * the reservation for someone else to spend.
   *
   * Two consumers now — ZIP imports and document templates (W30). Both need
   * the file stored but must NOT call `/complete`, which would mint a document
   * out of the archive or the template itself.
   */
  async reserveOnly(onProgress?: (fraction: number) => void): Promise<string> {
    await this.reserveAndPut(onProgress)
    return this.uploadId!
  }

  /**
   * Same pipeline, different ending: `POST /documents/{id}/versions` consumes
   * the reservation directly (it marks the upload completed itself), so the
   * `/complete` call is skipped entirely — calling both would try to spend the
   * same upload twice.
   */
  async runAsVersion(
    documentId: string,
    note?: string,
    onProgress?: (fraction: number) => void,
  ): Promise<{ id: string; version_no: number }> {
    await this.reserveAndPut(onProgress)
    try {
      return await apiFetch<{ id: string; version_no: number }>(
        `/documents/${documentId}/versions`,
        { method: 'POST', body: JSON.stringify({ upload_id: this.uploadId, note }) },
      )
    } catch (err) {
      this.resetOnExpiry(err)
    }
  }
}
