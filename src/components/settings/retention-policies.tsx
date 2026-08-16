import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Timer } from 'lucide-react'

import {
  createRetentionPolicy,
  deleteRetentionPolicy,
  documentTypesQuery,
  retentionPoliciesQuery,
} from '@/lib/api/queries'
import { ApiProblem, NetworkError } from '@/lib/api/http'
import { Button } from '@/components/ui/button'
import { Callout } from '@/components/ui/callout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/components/ui/sonner'

/**
 * W31 (B62) — disposal schedules.
 *
 * Each policy is rendered as the SENTENCE it is, not a row of enum values:
 * "Contracts: 10 years after the expiry date, then ask someone to review."
 * A retention schedule is read by auditors and lawyers, and a table of
 * `expiry / 10 / review` makes them decode it.
 */
export function RetentionPoliciesCard({ canEdit }: { canEdit: boolean }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const policies = useQuery(retentionPoliciesQuery)
  const types = useQuery(documentTypesQuery)

  const [typeId, setTypeId] = useState('')
  const [trigger, setTrigger] = useState('expiry')
  const [years, setYears] = useState('10')
  const [action, setAction] = useState('review')

  const fail = (e: unknown) => {
    if (e instanceof NetworkError) toast.error(t('errors.network'))
    else if (e instanceof ApiProblem) toast.error(e.detail ?? e.title)
    else toast.error(t('errors.unknown'))
  }
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['retention-policies'] })

  const create = useMutation({
    mutationFn: () =>
      createRetentionPolicy({
        doc_type_id: typeId,
        trigger_event: trigger,
        retain_years: Number(years),
        end_action: action,
      }),
    onSuccess: async () => {
      toast.success(t('retention.created'))
      setTypeId('')
      await invalidate()
    },
    onError: fail,
  })

  const remove = useMutation({
    mutationFn: deleteRetentionPolicy,
    onSuccess: async () => {
      toast.success(t('retention.deleted'))
      await invalidate()
    },
    onError: fail,
  })

  const list = policies.data?.data ?? []

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
          <Timer className="h-4 w-4" />
          {t('retention.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{t('retention.explainer')}</p>

        {list.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('retention.empty')}</p>
        ) : (
          <div className="space-y-2">
            {list.map((p, i) => (
              <div key={p.id}>
                {i > 0 && <Separator className="mb-2" />}
                <div className="flex flex-wrap items-start justify-between gap-2">
                  {/* The policy as a sentence, because that is how it will be
                      read to an auditor. */}
                  <p className="text-sm">
                    {t('retention.sentence', {
                      type: p.doc_type_name,
                      years: p.retain_years,
                      trigger: t(`retention.trigger.${p.trigger_event}`),
                      action: t(`retention.action.${p.end_action}`),
                    })}
                  </p>
                  {canEdit && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-600"
                      disabled={remove.isPending}
                      onClick={() => remove.mutate(p.id)}
                    >
                      {t('common.delete')}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {action === 'destroy' && canEdit && (
          <Callout variant="warning">{t('retention.destroyWarning')}</Callout>
        )}

        {canEdit && (
          <>
            <Separator />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">{t('retention.docType')}</Label>
                <Select value={typeId} onValueChange={setTypeId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('retention.chooseType')} />
                  </SelectTrigger>
                  <SelectContent>
                    {(types.data?.data ?? []).map((ty) => (
                      <SelectItem key={ty.id} value={ty.id}>
                        {ty.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t('retention.countFrom')}</Label>
                <Select value={trigger} onValueChange={setTrigger}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expiry">{t('retention.trigger.expiry')}</SelectItem>
                    <SelectItem value="creation">{t('retention.trigger.creation')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t('retention.years')}</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={years}
                  onChange={(e) => setYears(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t('retention.thenWhat')}</Label>
                <Select value={action} onValueChange={setAction}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="review">{t('retention.action.review')}</SelectItem>
                    <SelectItem value="archive">{t('retention.action.archive')}</SelectItem>
                    <SelectItem value="destroy">{t('retention.action.destroy')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button disabled={create.isPending || !typeId} onClick={() => create.mutate()}>
              {create.isPending ? t('app.loading') : t('common.create')}
            </Button>
            <p className="text-xs text-muted-foreground">{t('retention.holdNote')}</p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
