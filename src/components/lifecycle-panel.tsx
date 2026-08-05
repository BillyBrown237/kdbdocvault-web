import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BellPlus, CalendarClock, Check, Plus, Trash2 } from 'lucide-react'

import { ApiProblem, NetworkError } from '@/lib/api/http'
import {
  confirmLifecycleRule,
  createLifecycleRule,
  createReminder,
  deleteLifecycleRule,
  deleteReminder,
  lifecycleRulesQuery,
  remindersQuery,
} from '@/lib/api/queries'
import type { LifecycleRule, ReminderChannel, RuleType } from '@/lib/api/types'
import { formatDate } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/components/ui/sonner'

export function LifecyclePanel({ documentId }: { documentId: string }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const rules = useQuery(lifecycleRulesQuery(documentId))

  const [ruleType, setRuleType] = useState<RuleType>('expiry')
  const [keyDate, setKeyDate] = useState('')

  const fail = (err: unknown) => {
    if (err instanceof NetworkError) toast.error(t('errors.network'))
    else if (err instanceof ApiProblem) toast.error(err.detail ?? err.title)
    else toast.error(t('errors.unknown'))
  }
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['lifecycle-rules', documentId] })

  const add = useMutation({
    mutationFn: () => createLifecycleRule(documentId, { rule_type: ruleType, key_date: keyDate }),
    onSuccess: () => {
      toast.success(t('lifecycle.ruleAdded'))
      setKeyDate('')
      void invalidate()
    },
    onError: fail,
  })
  const confirm = useMutation({
    mutationFn: confirmLifecycleRule,
    onSuccess: () => void invalidate(),
    onError: fail,
  })
  const remove = useMutation({
    mutationFn: deleteLifecycleRule,
    onSuccess: () => void invalidate(),
    onError: fail,
  })

  const list = rules.data?.data ?? []

  return (
    <Card className="md:col-span-2">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarClock className="h-4 w-4" />
          {t('lifecycle.rules')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (keyDate) add.mutate()
          }}
        >
          <Select value={ruleType} onValueChange={(v) => setRuleType(v as RuleType)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="expiry">{t('lifecycle.ruleType.expiry')}</SelectItem>
              <SelectItem value="renewal">{t('lifecycle.ruleType.renewal')}</SelectItem>
              <SelectItem value="review">{t('lifecycle.ruleType.review')}</SelectItem>
            </SelectContent>
          </Select>
          <Input type="date" value={keyDate} onChange={(e) => setKeyDate(e.target.value)} className="w-40" />
          <Button type="submit" disabled={add.isPending || !keyDate}>
            <Plus className="h-4 w-4" />
            {t('lifecycle.addRule')}
          </Button>
        </form>

        {list.length > 0 && (
          <>
            <Separator />
            <ul className="space-y-3">
              {list.map((r) => (
                <RuleRow
                  key={r.id}
                  rule={r}
                  onConfirm={() => confirm.mutate(r.id)}
                  onDelete={() => remove.mutate(r.id)}
                />
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function RuleRow({
  rule,
  onConfirm,
  onDelete,
}: {
  rule: LifecycleRule
  onConfirm: () => void
  onDelete: () => void
}) {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const reminders = useQuery(remindersQuery(rule.id))
  const [offset, setOffset] = useState('7')
  const [channel, setChannel] = useState<ReminderChannel>('email')

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['reminders', rule.id] })
  const addReminder = useMutation({
    mutationFn: () =>
      createReminder(rule.id, { offset_days: Number(offset) || 0, channel }),
    onSuccess: () => {
      toast.success(t('lifecycle.reminderAdded'))
      void invalidate()
    },
  })
  const removeReminder = useMutation({
    mutationFn: deleteReminder,
    onSuccess: () => void invalidate(),
  })

  return (
    <li className="rounded-lg border p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant={rule.rule_type === 'expiry' ? 'destructive' : 'secondary'}>
            {t(`lifecycle.ruleType.${rule.rule_type}`)}
          </Badge>
          <span className="text-sm">{formatDate(rule.key_date, i18n.language)}</span>
          {rule.status === 'pending_confirmation' && (
            <Badge variant="warning">{t('lifecycle.pendingOcr')}</Badge>
          )}
        </div>
        <div className="flex gap-1">
          {rule.status === 'pending_confirmation' && (
            <Button size="sm" variant="outline" className="h-7" onClick={onConfirm}>
              <Check className="h-3 w-3" />
              {t('lifecycle.confirm')}
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-red-600 hover:text-red-600"
            onClick={onDelete}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Reminders */}
      <div className="mt-3 space-y-2 pl-1">
        {reminders.data?.data.map((rm) => (
          <div key={rm.id} className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {t('lifecycle.reminderLine', { days: rm.offset_days })} · {t(`lifecycle.channel.${rm.channel}`)}
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => removeReminder.mutate(rm.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            addReminder.mutate()
          }}
        >
          <Input
            type="number"
            value={offset}
            onChange={(e) => setOffset(e.target.value)}
            className="h-7 w-16 text-xs"
            aria-label={t('lifecycle.offsetDays')}
          />
          <span className="text-xs text-muted-foreground">{t('lifecycle.daysBefore')}</span>
          <Select value={channel} onValueChange={(v) => setChannel(v as ReminderChannel)}>
            <SelectTrigger className="h-7 w-28 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(['email', 'sms', 'whatsapp', 'in_app', 'push'] as ReminderChannel[]).map((c) => (
                <SelectItem key={c} value={c}>
                  {t(`lifecycle.channel.${c}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit" size="sm" variant="outline" className="h-7" disabled={addReminder.isPending}>
            <BellPlus className="h-3 w-3" />
            {t('lifecycle.addReminder')}
          </Button>
        </form>
      </div>
    </li>
  )
}
