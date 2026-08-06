import { createFileRoute } from '@tanstack/react-router'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, ClipboardCheck, Plus, XCircle } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { EmptyState, LoadMoreButton } from '@/components/vault-list'
import { ApiProblem, NetworkError } from '@/lib/api/http'
import {
  createTask,
  decideStep,
  delegateStep,
  membersQuery,
  tasksQuery,
  updateTask,
  workflowInboxQuery,
} from '@/lib/api/queries'
import { requireTenant } from '@/lib/route-guards'
import { formatDate } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/components/ui/sonner'

export const Route = createFileRoute('/approvals')({
  beforeLoad: ({ location }) => requireTenant(location),
  component: ApprovalsPage,
})

function fail(err: unknown, t: (k: string) => string) {
  if (err instanceof NetworkError) toast.error(t('errors.network'))
  else if (err instanceof ApiProblem) toast.error(err.detail ?? err.title)
  else toast.error(t('errors.unknown'))
}

function ApprovalsPage() {
  const { t } = useTranslation()
  const inbox = useQuery(workflowInboxQuery)
  const pending = inbox.data?.data.length ?? 0

  return (
    <AppShell>
      <div className="flex items-center gap-2">
        <ClipboardCheck className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-2xl font-bold tracking-tight">{t('approvals.title')}</h1>
      </div>
      <Tabs defaultValue="inbox" className="mt-4">
        <TabsList>
          <TabsTrigger value="inbox">
            {t('approvals.inbox')}
            {pending > 0 && (
              <Badge variant="destructive" className="ml-1.5 px-1.5 py-0">
                {pending}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="tasks">{t('approvals.tasks')}</TabsTrigger>
        </TabsList>
        <TabsContent value="inbox">
          <InboxTab />
        </TabsContent>
        <TabsContent value="tasks">
          <TasksTab />
        </TabsContent>
      </Tabs>
    </AppShell>
  )
}

function InboxTab() {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const inbox = useQuery(workflowInboxQuery)
  const [comments, setComments] = useState<Record<string, string>>({})

  const decide = useMutation({
    mutationFn: ({
      stepId,
      decision,
    }: {
      stepId: string
      decision: 'approve' | 'reject' | 'request_changes'
    }) => decideStep(stepId, decision, comments[stepId] || undefined),
    onSuccess: async () => {
      toast.success(t('approvals.decided'))
      await queryClient.invalidateQueries({ queryKey: ['workflow-inbox'] })
      await queryClient.invalidateQueries({ queryKey: ['workflows'] })
    },
    onError: (e) => fail(e, t),
  })

  if (inbox.isPending) return <Skeleton className="h-32" />
  const steps = inbox.data?.data ?? []
  if (steps.length === 0) return <EmptyState label={t('approvals.inboxEmpty')} />

  return (
    <div className="space-y-3">
      {steps.map((s) => (
        <Card key={s.id} className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">
                {s.document_title ?? t('approvals.step', { n: s.step_no })}
              </div>
              <div className="text-xs text-muted-foreground">
                {t('approvals.stepType', { type: s.step_type })}
                {s.due_at && ` · ${t('approvals.due', { date: formatDate(s.due_at, i18n.language) })}`}
              </div>
            </div>
          </div>
          <Input
            value={comments[s.id] ?? ''}
            onChange={(e) => setComments((p) => ({ ...p, [s.id]: e.target.value }))}
            placeholder={t('approvals.commentOptional')}
            className="mt-3 h-8 text-xs"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={decide.isPending}
              onClick={() => decide.mutate({ stepId: s.id, decision: 'approve' })}
            >
              <CheckCircle2 className="h-4 w-4" />
              {t('approvals.approve')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={decide.isPending}
              onClick={() => decide.mutate({ stepId: s.id, decision: 'request_changes' })}
            >
              {t('approvals.requestChanges')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 hover:text-red-600"
              disabled={decide.isPending}
              onClick={() => decide.mutate({ stepId: s.id, decision: 'reject' })}
            >
              <XCircle className="h-4 w-4" />
              {t('approvals.reject')}
            </Button>
            <DelegateControl stepId={s.id} reason={comments[s.id]} />
          </div>
        </Card>
      ))}
    </div>
  )
}

/**
 * Delegation reuses the step's comment box as the reason — one text field per
 * step, whichever action you take, rather than a second box that's empty 95%
 * of the time.
 */
function DelegateControl({ stepId, reason }: { stepId: string; reason?: string }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const members = useQuery(membersQuery)

  const delegate = useMutation({
    mutationFn: (toMemberId: string) => delegateStep(stepId, toMemberId, reason?.trim() || undefined),
    onSuccess: async () => {
      toast.success(t('approvals.delegated'))
      await queryClient.invalidateQueries({ queryKey: ['workflow-inbox'] })
      await queryClient.invalidateQueries({ queryKey: ['workflows'] })
    },
    onError: (e) => fail(e, t),
  })

  return (
    <Select onValueChange={(v) => delegate.mutate(v)} disabled={delegate.isPending}>
      <SelectTrigger className="h-8 w-44 text-xs">
        <SelectValue placeholder={t('approvals.delegateTo')} />
      </SelectTrigger>
      <SelectContent>
        {(members.data?.data ?? []).map((m) => (
          <SelectItem key={m.id} value={m.id}>
            {m.name ?? m.email}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function TasksTab() {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const q = useInfiniteQuery(tasksQuery())
  const [title, setTitle] = useState('')

  const add = useMutation({
    mutationFn: () => createTask({ title: title.trim() }),
    onSuccess: async () => {
      setTitle('')
      await queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
    onError: (e) => fail(e, t),
  })

  const complete = useMutation({
    mutationFn: (id: string) => updateTask(id, { status: 'done' }),
    onSuccess: async () => {
      toast.success(t('approvals.taskDone'))
      await queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
    onError: (e) => fail(e, t),
  })

  const items = q.data?.pages.flatMap((p) => p.data) ?? []

  return (
    <div className="space-y-3">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (title.trim()) add.mutate()
        }}
      >
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('approvals.newTask')}
          className="max-w-sm"
        />
        <Button type="submit" disabled={add.isPending || !title.trim()}>
          <Plus className="h-4 w-4" />
          {t('common.create')}
        </Button>
      </form>

      {q.isPending ? (
        <Skeleton className="h-24" />
      ) : items.length === 0 ? (
        <EmptyState label={t('approvals.noTasks')} />
      ) : (
        <div className="space-y-2">
          {items.map((task) => (
            <Card key={task.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className={`truncate text-sm ${task.status === 'done' ? 'text-muted-foreground line-through' : 'font-medium'}`}>
                  {task.title}
                </div>
                {task.due_at && (
                  <div className="text-xs text-muted-foreground">
                    {t('approvals.due', { date: formatDate(task.due_at, i18n.language) })}
                  </div>
                )}
              </div>
              {task.status !== 'done' && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={complete.isPending}
                  onClick={() => complete.mutate(task.id)}
                >
                  {t('lifecycle.markDone')}
                </Button>
              )}
            </Card>
          ))}
          <LoadMoreButton
            hasMore={Boolean(q.hasNextPage)}
            loading={q.isFetchingNextPage}
            onClick={() => void q.fetchNextPage()}
          />
        </div>
      )}
    </div>
  )
}
