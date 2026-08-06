import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, RefreshCw, Sparkles } from 'lucide-react'

import { ApiProblem, NetworkError } from '@/lib/api/http'
import { confirmExtraction, extractionsQuery, reprocessDocument } from '@/lib/api/queries'
import type { Extraction } from '@/lib/api/types'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/ui/sonner'

/** Below this the pipeline is guessing, and the UI should say so rather than
 * present a number the reader will trust by default. */
const LOW_CONFIDENCE = 0.7

/**
 * Review of what the OCR/extraction pipeline found in the current version.
 *
 * Confirming is not cosmetic: for `expiry_date` the backend creates or blesses
 * the matching lifecycle rule, and the reminder scheduler picks it up on its
 * next pass exactly as if a person had typed the date in. Correcting a date
 * additionally retires the machine's suggestion at the old one.
 */
export function ExtractionPanel({ documentId }: { documentId: string }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const extractions = useQuery(extractionsQuery(documentId))
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  function fail(err: unknown) {
    if (err instanceof NetworkError) toast.error(t('errors.network'))
    else if (err instanceof ApiProblem) toast.error(err.detail ?? err.title)
    else toast.error(t('errors.unknown'))
  }

  const confirm = useMutation({
    mutationFn: ({ id, corrected }: { id: string; corrected?: string }) =>
      confirmExtraction(documentId, id, corrected),
    onSuccess: async () => {
      setEditing(null)
      toast.success(t('extraction.confirmed'))
      await queryClient.invalidateQueries({ queryKey: ['extractions', documentId] })
      // A confirmed expiry date becomes an active lifecycle rule.
      await queryClient.invalidateQueries({ queryKey: ['lifecycle-rules', documentId] })
      await queryClient.invalidateQueries({ queryKey: ['expiring'] })
    },
    onError: fail,
  })

  const reprocess = useMutation({
    mutationFn: () => reprocessDocument(documentId),
    onSuccess: () => toast.success(t('extraction.reprocessQueued')),
    onError: fail,
  })

  const items = extractions.data?.data ?? []
  const pending = items.filter((e) => !e.confirmed)

  function startEdit(e: Extraction) {
    setEditing(e.id)
    setDraft(e.value)
  }

  return (
    <Card className="md:col-span-2">
      <CardHeader className="flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4" />
          {t('extraction.title')}
          {pending.length > 0 && (
            <Badge variant="secondary" className="px-1.5 py-0">
              {t('extraction.pendingCount', { count: pending.length })}
            </Badge>
          )}
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          disabled={reprocess.isPending}
          onClick={() => reprocess.mutate()}
        >
          <RefreshCw className={cn('h-4 w-4', reprocess.isPending && 'animate-spin')} />
          {t('extraction.reprocess')}
        </Button>
      </CardHeader>
      <CardContent>
        {extractions.isPending ? (
          <Skeleton className="h-20" />
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('extraction.empty')}</p>
        ) : (
          <ul className="space-y-3 text-sm">
            {items.map((e, i) => {
              const low = e.confidence < LOW_CONFIDENCE
              return (
                <li key={e.id}>
                  {i > 0 && <Separator className="mb-3" />}
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="shrink-0">
                      {t(`extraction.entity.${e.entity_type}`, {
                        defaultValue: e.entity_type.replace(/_/g, ' '),
                      })}
                    </Badge>

                    {editing === e.id ? (
                      <Input
                        value={draft}
                        onChange={(ev) => setDraft(ev.target.value)}
                        className="h-8 w-44"
                        placeholder={
                          e.entity_type === 'expiry_date' ? 'yyyy-mm-dd' : undefined
                        }
                        autoFocus
                      />
                    ) : (
                      <span className="min-w-0 flex-1 font-medium break-words">{e.value}</span>
                    )}

                    <span
                      className={cn(
                        'shrink-0 text-xs',
                        low ? 'text-amber-600' : 'text-muted-foreground',
                      )}
                      title={t('extraction.confidenceTitle')}
                    >
                      {Math.round(e.confidence * 100)}%
                    </span>
                    {e.page_no !== null && (
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {t('extraction.page', { n: e.page_no })}
                      </span>
                    )}

                    {e.confirmed ? (
                      <Badge className="shrink-0 gap-1">
                        <Check className="h-3 w-3" />
                        {t('extraction.confirmedBadge')}
                      </Badge>
                    ) : editing === e.id ? (
                      <span className="flex shrink-0 gap-1">
                        <Button
                          size="sm"
                          className="h-8"
                          disabled={confirm.isPending || !draft.trim()}
                          onClick={() => confirm.mutate({ id: e.id, corrected: draft.trim() })}
                        >
                          {t('extraction.saveCorrection')}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8"
                          onClick={() => setEditing(null)}
                        >
                          {t('common.cancel')}
                        </Button>
                      </span>
                    ) : (
                      <span className="flex shrink-0 gap-1">
                        <Button
                          size="sm"
                          className="h-8"
                          disabled={confirm.isPending}
                          onClick={() => confirm.mutate({ id: e.id })}
                        >
                          <Check className="h-3.5 w-3.5" />
                          {t('extraction.confirm')}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8"
                          onClick={() => startEdit(e)}
                        >
                          {t('extraction.correct')}
                        </Button>
                      </span>
                    )}
                  </div>

                  {/* Confidence as a bar, because a bare percentage reads as
                      precision the model doesn't have. */}
                  <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn('h-full', low ? 'bg-amber-500' : 'bg-emerald-500')}
                      style={{ width: `${Math.round(e.confidence * 100)}%` }}
                    />
                  </div>

                  {e.entity_type === 'expiry_date' && !e.confirmed && (
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {t('extraction.expiryHint')}
                    </p>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
