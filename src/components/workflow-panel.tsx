import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GitBranch, Play, X } from 'lucide-react'

import { ApiProblem, NetworkError } from '@/lib/api/http'
import {
  cancelWorkflow,
  startWorkflow,
  workflowTemplatesQuery,
  workflowsForDocumentQuery,
} from '@/lib/api/queries'
import type { Workflow } from '@/lib/api/types'
import { formatDate } from '@/lib/format'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/components/ui/sonner'

const STATUS_VARIANT: Record<string, BadgeProps['variant']> = {
  running: 'default',
  completed: 'success',
  cancelled: 'destructive',
  overdue: 'warning',
}

export function WorkflowPanel({ documentId }: { documentId: string }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const workflows = useQuery(workflowsForDocumentQuery(documentId))
  const templates = useQuery(workflowTemplatesQuery)
  const [templateId, setTemplateId] = useState('')

  const fail = (err: unknown) => {
    if (err instanceof NetworkError) toast.error(t('errors.network'))
    else if (err instanceof ApiProblem) toast.error(err.detail ?? err.title)
    else toast.error(t('errors.unknown'))
  }
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['workflows', documentId] })

  const start = useMutation({
    mutationFn: () => startWorkflow(documentId, templateId),
    onSuccess: () => {
      toast.success(t('workflow.started'))
      void invalidate()
    },
    onError: fail,
  })

  const cancel = useMutation({
    mutationFn: (id: string) => cancelWorkflow(id, t('workflow.cancelledByOwner')),
    onSuccess: () => {
      toast.success(t('workflow.cancelled'))
      void invalidate()
    },
    onError: fail,
  })

  const activeTemplates = templates.data?.data.filter((x) => x.active) ?? []
  const list = workflows.data?.data ?? []

  return (
    <Card className="md:col-span-2">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
          <GitBranch className="h-4 w-4" />
          {t('workflow.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeTemplates.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder={t('workflow.chooseTemplate')} />
              </SelectTrigger>
              <SelectContent>
                {activeTemplates.map((tpl) => (
                  <SelectItem key={tpl.id} value={tpl.id}>
                    {tpl.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button disabled={!templateId || start.isPending} onClick={() => start.mutate()}>
              <Play className="h-4 w-4" />
              {t('workflow.start')}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t('workflow.noTemplates')}</p>
        )}

        {list.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              {list.map((w) => (
                <WorkflowRow key={w.id} workflow={w} onCancel={() => cancel.mutate(w.id)} />
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function WorkflowRow({ workflow, onCancel }: { workflow: Workflow; onCancel: () => void }) {
  const { t, i18n } = useTranslation()
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant={STATUS_VARIANT[workflow.status] ?? 'secondary'}>
            {t(`workflow.status.${workflow.status}`)}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {formatDate(workflow.started_at, i18n.language)}
          </span>
        </div>
        {workflow.status === 'running' && (
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-red-600 hover:text-red-600"
            onClick={onCancel}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
      <ol className="mt-2 space-y-1">
        {workflow.steps.map((s) => (
          <li key={s.id} className="flex items-center justify-between text-sm">
            <span className="min-w-0 truncate">
              <span className="text-muted-foreground">{s.step_no}.</span> {s.step_type}
              {s.comment && <span className="text-xs text-muted-foreground"> — {s.comment}</span>}
            </span>
            {s.decision ? (
              <Badge variant={s.decision === 'approve' ? 'success' : 'destructive'}>
                {t(`approvals.decision.${s.decision}`)}
              </Badge>
            ) : (
              <Badge variant="secondary">{t('workflow.pending')}</Badge>
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}
