import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Download,
  FileCheck2,
  Pencil,
  PenLine,
  Plus,
  ScanFace,
  Send,
  Trash2,
  X,
} from 'lucide-react'

import { ApiProblem, NetworkError } from '@/lib/api/http'
import {
  cancelEnvelope,
  createEnvelope,
  envelopesForDocumentQuery,
  evidenceQuery,
  remindEnvelope,
  reviewSignerId,
  sealedDocumentBlob,
  sendEnvelope,
  signerIdDocumentBlob,
  updateSigner,
  type SignerInput,
} from '@/lib/api/queries'
import { formatDate } from '@/lib/format'
import type { Envelope, Signer, SignerStatus } from '@/lib/api/types'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/components/ui/sonner'

const SIGNER_VARIANT: Record<SignerStatus, BadgeProps['variant']> = {
  pending: 'secondary',
  verified: 'default',
  signed: 'success',
  declined: 'destructive',
}

export function SignaturePanel({
  documentId,
  versionId,
}: {
  documentId: string
  versionId?: string
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const envelopes = useQuery(envelopesForDocumentQuery(documentId))

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['envelopes', documentId] })
  const fail = (err: unknown) => {
    if (err instanceof NetworkError) toast.error(t('errors.network'))
    else if (err instanceof ApiProblem) toast.error(err.detail ?? err.title)
    else toast.error(t('errors.unknown'))
  }

  const send = useMutation({
    mutationFn: sendEnvelope,
    onSuccess: () => {
      toast.success(t('sign.sent'))
      void invalidate()
    },
    onError: fail,
  })
  const remind = useMutation({
    mutationFn: remindEnvelope,
    onSuccess: () => toast.success(t('sign.reminded')),
    onError: fail,
  })
  const cancel = useMutation({
    mutationFn: (id: string) => cancelEnvelope(id, t('sign.cancelledByOwner')),
    onSuccess: () => {
      toast.success(t('sign.cancelled'))
      void invalidate()
    },
    onError: fail,
  })

  const list = envelopes.data?.data ?? []

  return (
    <Card className="md:col-span-2">
      <CardHeader className="flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
          <PenLine className="h-4 w-4" />
          {t('sign.title')}
        </CardTitle>
        <CreateEnvelopeDialog
          documentId={documentId}
          versionId={versionId}
          onCreated={invalidate}
        />
      </CardHeader>
      <CardContent className="space-y-3">
        {envelopes.isPending ? (
          <p className="text-sm text-muted-foreground">{t('app.loading')}</p>
        ) : list.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('sign.none')}</p>
        ) : (
          list.map((env) => (
            <EnvelopeRow
              key={env.id}
              env={env}
              onSend={() => send.mutate(env.id)}
              onRemind={() => remind.mutate(env.id)}
              onCancel={() => cancel.mutate(env.id)}
              onReviewed={invalidate}
              busy={send.isPending || cancel.isPending}
            />
          ))
        )}
      </CardContent>
    </Card>
  )
}

function EnvelopeRow({
  env,
  onSend,
  onRemind,
  onCancel,
  onReviewed,
  busy,
}: {
  env: Envelope
  onSend: () => void
  onRemind: () => void
  onCancel: () => void
  onReviewed: () => void
  busy: boolean
}) {
  const { t } = useTranslation()
  const [downloading, setDownloading] = useState(false)

  async function onDownloadSealed() {
    setDownloading(true)
    try {
      const blob = await sealedDocumentBlob(env.id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${env.id}.pdf`
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (err) {
      if (err instanceof NetworkError) toast.error(t('errors.network'))
      else if (err instanceof ApiProblem) toast.error(err.detail ?? err.title)
      else toast.error(t('errors.unknown'))
    } finally {
      setDownloading(false)
    }
  }

  const statusVariant: BadgeProps['variant'] =
    env.status === 'completed'
      ? 'success'
      : env.status === 'declined' || env.status === 'cancelled' || env.status === 'expired'
        ? 'destructive'
        : env.status === 'sent'
          ? 'default'
          : 'secondary'

  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center justify-between gap-2">
        <Badge variant={statusVariant}>{t(`sign.status.${env.status}`)}</Badge>
        <div className="flex gap-1">
          {env.status === 'draft' && (
            <Button size="sm" className="h-7" onClick={onSend} disabled={busy}>
              <Send className="h-3 w-3" />
              {t('sign.send')}
            </Button>
          )}
          {env.status === 'sent' && (
            <>
              <Button size="sm" variant="outline" className="h-7" onClick={onRemind}>
                {t('sign.remind')}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-red-600 hover:text-red-600"
                onClick={onCancel}
                disabled={busy}
              >
                <X className="h-3 w-3" />
              </Button>
            </>
          )}
          {env.status === 'completed' && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="h-7"
                disabled={downloading}
                onClick={() => void onDownloadSealed()}
              >
                <Download className="h-3 w-3" />
                {downloading ? t('app.loading') : t('sign.download')}
              </Button>
              <EvidenceDialog envelopeId={env.id} />
            </>
          )}
        </div>
      </div>
      <ul className="mt-2 space-y-1">
        {env.signers.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center gap-2 text-sm">
            <span className="min-w-0 flex-1 truncate">
              <span className="text-muted-foreground">{s.signing_order}.</span> {s.name}{' '}
              <span className="text-xs text-muted-foreground">{s.email}</span>
            </span>
            {s.id_check_status && (
              <Badge
                variant={
                  s.id_check_status === 'approved'
                    ? 'success'
                    : s.id_check_status === 'rejected'
                      ? 'destructive'
                      : 'outline'
                }
              >
                {t(`sign.idCheck.${s.id_check_status}`)}
              </Badge>
            )}
            {s.id_check_status === 'submitted' && (
              <IdReviewDialog envelopeId={env.id} signer={s} onReviewed={onReviewed} />
            )}
            {s.status === 'pending' && env.status !== 'completed' && (
              <EditSignerDialog envelopeId={env.id} signer={s} onSaved={onReviewed} />
            )}
            <Badge variant={SIGNER_VARIANT[s.status]}>{t(`sign.signer.${s.status}`)}</Badge>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** The sealing job's frozen record: what was signed, and the event trail. */
function EvidenceDialog({ envelopeId }: { envelopeId: string }) {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const evidence = useQuery({ ...evidenceQuery(envelopeId), enabled: open, retry: false })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="h-7">
          <FileCheck2 className="h-3 w-3" />
          {t('sign.evidence')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('sign.evidenceTitle')}</DialogTitle>
        </DialogHeader>
        {evidence.isPending ? (
          <p className="text-sm text-muted-foreground">{t('app.loading')}</p>
        ) : evidence.isError ? (
          <p className="text-sm text-muted-foreground">{t('sign.evidencePending')}</p>
        ) : (
          evidence.data && (
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">{t('sign.documentHash')}</p>
                <code className="block break-all text-xs">{evidence.data.document_hash}</code>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('sign.sealedAt')}</p>
                <p>{formatDate(evidence.data.sealed_at, i18n.language)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('sign.eventTrail')}</p>
                <pre className="max-h-64 overflow-auto rounded-md bg-muted p-2 text-[11px]">
                  {JSON.stringify(evidence.data.event_trail, null, 2)}
                </pre>
              </div>
            </div>
          )
        )}
      </DialogContent>
    </Dialog>
  )
}

/**
 * ID review. The image is fetched as a blob into an object URL and never
 * navigated to: the presigned link is a 10-minute capability and the most
 * sensitive object in the system — it should not end up in browser history,
 * a shared tab, or a bookmark. The URL is revoked when the dialog closes.
 */
function IdReviewDialog({
  envelopeId,
  signer,
  onReviewed,
}: {
  envelopeId: string
  signer: Signer
  onReviewed: () => void
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [src, setSrc] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    let url: string | null = null
    let cancelled = false
    void (async () => {
      try {
        const blob = await signerIdDocumentBlob(envelopeId, signer.id)
        if (cancelled) return
        url = URL.createObjectURL(blob)
        setSrc(url)
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof NetworkError
              ? t('errors.network')
              : err instanceof ApiProblem
                ? (err.detail ?? err.title)
                : t('errors.unknown'),
          )
        }
      }
    })()
    return () => {
      cancelled = true
      if (url) URL.revokeObjectURL(url)
      setSrc(null)
    }
  }, [open, envelopeId, signer.id, t])

  const review = useMutation({
    mutationFn: (approve: boolean) =>
      reviewSignerId(envelopeId, signer.id, approve, reason.trim() || undefined),
    onSuccess: (_r, approve) => {
      setOpen(false)
      setReason('')
      toast.success(t(approve ? 'sign.idApproved' : 'sign.idRejected'))
      onReviewed()
    },
    onError: (err) => {
      if (err instanceof NetworkError) toast.error(t('errors.network'))
      else if (err instanceof ApiProblem) toast.error(err.detail ?? err.title)
      else toast.error(t('errors.unknown'))
    },
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-7">
          <ScanFace className="h-3 w-3" />
          {t('sign.reviewId')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('sign.reviewIdFor', { name: signer.name })}</DialogTitle>
        </DialogHeader>

        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : src ? (
          <div className="select-none" onContextMenu={(e) => e.preventDefault()}>
            <img
              src={src}
              alt=""
              draggable={false}
              className="mx-auto max-h-[50vh] rounded-md border"
            />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t('app.loading')}</p>
        )}

        <p className="text-xs text-muted-foreground">{t('sign.idPrivacyNote')}</p>

        <Input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t('sign.rejectReason')}
        />
        <DialogFooter>
          <Button
            variant="outline"
            className="text-red-600 hover:text-red-600"
            disabled={review.isPending}
            onClick={() => review.mutate(false)}
          >
            {t('sign.reject')}
          </Button>
          <Button disabled={review.isPending} onClick={() => review.mutate(true)}>
            {t('sign.approve')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function EditSignerDialog({
  envelopeId,
  signer,
  onSaved,
}: {
  envelopeId: string
  signer: Signer
  onSaved: () => void
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState(signer.email)
  const [phone, setPhone] = useState(signer.phone ?? '')

  const save = useMutation({
    mutationFn: () =>
      updateSigner(envelopeId, signer.id, {
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
      }),
    onSuccess: () => {
      setOpen(false)
      toast.success(t('sign.signerUpdated'))
      onSaved()
    },
    onError: (err) => {
      if (err instanceof NetworkError) toast.error(t('errors.network'))
      else if (err instanceof ApiProblem) toast.error(err.detail ?? err.title)
      else toast.error(t('errors.unknown'))
    },
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="h-7 px-2" aria-label={t('sign.editSigner')}>
          <Pencil className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('sign.editSigner')}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            save.mutate()
          }}
        >
          <div className="space-y-1.5">
            <Label className="text-xs">{t('sign.signerEmail')}</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t('sign.signerPhone')}</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <p className="text-xs text-muted-foreground">{t('sign.editSignerHint')}</p>
          <DialogFooter>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? t('app.loading') : t('sign.saveSigner')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function CreateEnvelopeDialog({
  documentId,
  versionId,
  onCreated,
}: {
  documentId: string
  versionId?: string
  onCreated: () => void
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [signers, setSigners] = useState<SignerInput[]>([
    { name: '', email: '', signing_order: 1, verify_method: 'email_otp' },
  ])
  const [busy, setBusy] = useState(false)

  function updateSigner(i: number, patch: Partial<SignerInput>) {
    setSigners((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!versionId) {
      toast.error(t('sign.noVersion'))
      return
    }
    const valid = signers.filter((s) => s.name.trim() && s.email.trim())
    if (valid.length === 0) return
    setBusy(true)
    try {
      await createEnvelope(documentId, {
        version_id: versionId,
        message: message || undefined,
        signers: valid.map((s, i) => ({ ...s, signing_order: i + 1 })),
      })
      toast.success(t('sign.created'))
      setOpen(false)
      setMessage('')
      setSigners([{ name: '', email: '', signing_order: 1, verify_method: 'email_otp' }])
      onCreated()
    } catch (err) {
      if (err instanceof NetworkError) toast.error(t('errors.network'))
      else if (err instanceof ApiProblem) toast.error(err.detail ?? err.title)
      else toast.error(t('errors.unknown'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" />
          {t('sign.new')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('sign.newEnvelope')}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
          <div className="space-y-1.5">
            <Label>{t('sign.message')}</Label>
            <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t('sign.messagePlaceholder')} />
          </div>

          <Separator />
          <div className="space-y-3">
            <Label>{t('sign.signers')}</Label>
            {signers.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  placeholder={t('sign.signerName')}
                  value={s.name}
                  onChange={(e) => updateSigner(i, { name: e.target.value })}
                  className="flex-1"
                />
                <Input
                  type="email"
                  placeholder={t('sign.signerEmail')}
                  value={s.email}
                  onChange={(e) => updateSigner(i, { email: e.target.value })}
                  className="flex-1"
                />
                {signers.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => setSigners((prev) => prev.filter((_, idx) => idx !== i))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setSigners((prev) => [
                  ...prev,
                  { name: '', email: '', signing_order: prev.length + 1, verify_method: 'email_otp' },
                ])
              }
            >
              <Plus className="h-4 w-4" />
              {t('sign.addSigner')}
            </Button>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={busy}>
              {busy ? t('app.loading') : t('sign.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
