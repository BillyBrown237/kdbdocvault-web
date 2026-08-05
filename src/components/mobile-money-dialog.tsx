import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, Smartphone } from 'lucide-react'

import { ApiProblem, NetworkError } from '@/lib/api/http'
import { getPayment, initiateMobileMoney } from '@/lib/api/queries'
import type { Payment } from '@/lib/api/types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/components/ui/sonner'

type Provider = 'mtn_momo' | 'orange_money'
type Phase = 'form' | 'awaiting' | 'done'

export function MobileMoneyDialog({
  planId,
  open,
  onOpenChange,
}: {
  planId: string | null
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [provider, setProvider] = useState<Provider>('mtn_momo')
  const [phone, setPhone] = useState('')
  const [phase, setPhase] = useState<Phase>('form')
  const [payment, setPayment] = useState<Payment | null>(null)
  const [busy, setBusy] = useState(false)
  const pollRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current)
    }
  }, [])

  // Reset when reopened.
  useEffect(() => {
    if (open) {
      setPhase('form')
      setPayment(null)
      setBusy(false)
    }
  }, [open])

  function startPolling(paymentId: string) {
    pollRef.current = window.setInterval(async () => {
      try {
        const p = await getPayment(paymentId)
        setPayment(p)
        if (p.status === 'succeeded') {
          stopPolling()
          setPhase('done')
          toast.success(t('billing.paymentSucceeded'))
          await queryClient.invalidateQueries({ queryKey: ['subscription'] })
          await queryClient.invalidateQueries({ queryKey: ['invoices'] })
          await queryClient.invalidateQueries({ queryKey: ['tenant'] })
        } else if (p.status === 'failed' || p.status === 'refunded') {
          stopPolling()
          setPhase('form')
          toast.error(t('billing.paymentFailed'))
        }
      } catch {
        /* transient — keep polling */
      }
    }, 3000)
  }

  function stopPolling() {
    if (pollRef.current) {
      window.clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  async function onInitiate(e: React.FormEvent) {
    e.preventDefault()
    if (!planId || !phone.trim()) return
    setBusy(true)
    try {
      const p = await initiateMobileMoney({ provider, phone: phone.trim(), plan_id: planId })
      setPayment(p)
      setPhase('awaiting')
      startPolling(p.id)
    } catch (err) {
      if (err instanceof NetworkError) toast.error(t('errors.network'))
      else if (err instanceof ApiProblem) toast.error(err.detail ?? err.title)
      else toast.error(t('errors.unknown'))
    } finally {
      setBusy(false)
    }
  }

  const ussd = payment?.purpose?.ussd_hint

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) stopPolling()
        onOpenChange(v)
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            {t('billing.mobileMoney')}
          </DialogTitle>
        </DialogHeader>

        {phase === 'form' && (
          <form className="space-y-4" onSubmit={(e) => void onInitiate(e)}>
            <div className="space-y-1.5">
              <Label>{t('billing.provider')}</Label>
              <Select value={provider} onValueChange={(v) => setProvider(v as Provider)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mtn_momo">MTN MoMo</SelectItem>
                  <SelectItem value="orange_money">Orange Money</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">{t('billing.phone')}</Label>
              <Input
                id="phone"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+237 6XX XXX XXX"
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy || !phone.trim()}>
              {busy ? t('app.loading') : t('billing.payNow')}
            </Button>
          </form>
        )}

        {phase === 'awaiting' && (
          <div className="space-y-4 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t('billing.confirmOnPhone')}</p>
            {ussd && (
              <div className="rounded-lg border bg-muted/50 p-4">
                <p className="text-xs text-muted-foreground">{t('billing.dialCode')}</p>
                <p className="mt-1 text-2xl font-bold tracking-wider">{ussd}</p>
              </div>
            )}
            <p className="text-xs text-muted-foreground">{t('billing.waiting')}</p>
          </div>
        )}

        {phase === 'done' && (
          <div className="space-y-3 py-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <Smartphone className="h-6 w-6 text-emerald-600" />
            </div>
            <p className="font-medium">{t('billing.paymentSucceeded')}</p>
            <Button className="w-full" onClick={() => onOpenChange(false)}>
              {t('common.done')}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
