import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PenLine, Plus, Send, Trash2, X } from 'lucide-react'

import { ApiProblem, NetworkError } from '@/lib/api/http'
import {
  cancelEnvelope,
  createEnvelope,
  envelopesForDocumentQuery,
  remindEnvelope,
  sendEnvelope,
  type SignerInput,
} from '@/lib/api/queries'
import type { Envelope, SignerStatus } from '@/lib/api/types'
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
  busy,
}: {
  env: Envelope
  onSend: () => void
  onRemind: () => void
  onCancel: () => void
  busy: boolean
}) {
  const { t } = useTranslation()
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
            <Button size="sm" variant="outline" className="h-7" asChild>
              <a href={`/v1/envelopes/${env.id}/signed-document`} target="_blank" rel="noreferrer">
                {t('sign.download')}
              </a>
            </Button>
          )}
        </div>
      </div>
      <ul className="mt-2 space-y-1">
        {env.signers.map((s) => (
          <li key={s.id} className="flex items-center justify-between text-sm">
            <span className="min-w-0 truncate">
              <span className="text-muted-foreground">{s.signing_order}.</span> {s.name}{' '}
              <span className="text-xs text-muted-foreground">{s.email}</span>
            </span>
            <Badge variant={SIGNER_VARIANT[s.status]}>{t(`sign.signer.${s.status}`)}</Badge>
          </li>
        ))}
      </ul>
    </div>
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
