import { createFileRoute } from '@tanstack/react-router'
import { useInfiniteQuery, useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Anchor, Download, FileDown, ScrollText } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { EmptyState, LoadMoreButton } from '@/components/vault-list'
import { ApiProblem, NetworkError } from '@/lib/api/http'
import { auditAnchorsQuery, auditEventsQuery, createAuditExport } from '@/lib/api/queries'
import { requireTenant } from '@/lib/route-guards'
import { useDebouncedValue } from '@/lib/use-debounced-value'
import { useJob } from '@/lib/use-job'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from '@/components/ui/sonner'

export const Route = createFileRoute('/audit')({
  beforeLoad: ({ location }) => requireTenant(location),
  component: AuditPage,
})

function AuditPage() {
  const { t } = useTranslation()

  return (
    <AppShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ScrollText className="h-5 w-5 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('audit.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('audit.subtitle')}</p>
          </div>
        </div>
        <ExportControl />
      </div>

      <Tabs defaultValue="events" className="mt-4">
        <TabsList>
          <TabsTrigger value="events">{t('audit.events')}</TabsTrigger>
          <TabsTrigger value="anchors">{t('anchors.tab')}</TabsTrigger>
        </TabsList>
        <TabsContent value="events" className="mt-4">
          <EventsTab />
        </TabsContent>
        <TabsContent value="anchors" className="mt-4">
          <AnchorsTab />
        </TabsContent>
      </Tabs>
    </AppShell>
  )
}

/** Export is a job, not a download: submit, poll, then a link appears. */
function ExportControl() {
  const { t } = useTranslation()
  const [format, setFormat] = useState<'csv' | 'json'>('csv')
  const job = useJob()

  const create = useMutation({
    mutationFn: () => createAuditExport(format),
    onSuccess: (j) => job.start(j),
    onError: (err) => {
      if (err instanceof NetworkError) toast.error(t('errors.network'))
      else if (err instanceof ApiProblem) toast.error(err.detail ?? err.title)
      else toast.error(t('errors.unknown'))
    },
  })

  const ready = job.job?.status === 'done' ? job.job.result_url : null

  return (
    <div className="flex items-end gap-2">
      <Select value={format} onValueChange={(v) => setFormat(v as 'csv' | 'json')}>
        <SelectTrigger className="w-24">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="csv">CSV</SelectItem>
          <SelectItem value="json">JSON</SelectItem>
        </SelectContent>
      </Select>
      {ready ? (
        <Button asChild>
          <a href={ready} target="_blank" rel="noreferrer">
            <Download className="h-4 w-4" />
            {t('audit.downloadExport')}
          </a>
        </Button>
      ) : (
        <Button
          variant="outline"
          disabled={create.isPending || job.running}
          onClick={() => create.mutate()}
        >
          <FileDown className="h-4 w-4" />
          {job.running ? t('audit.exporting') : t('audit.export')}
        </Button>
      )}
      {job.job?.status === 'failed' && (
        <span className="text-sm text-red-600">{job.job.error ?? t('audit.exportFailed')}</span>
      )}
    </div>
  )
}

function EventsTab() {
  const { t, i18n } = useTranslation()
  const [actionInput, setActionInput] = useState('')
  const action = useDebouncedValue(actionInput, 350)
  const q = useInfiniteQuery(auditEventsQuery(action ? { action } : {}))

  const events = q.data?.pages.flatMap((p) => p.data) ?? []

  return (
    <>
      <Input
        value={actionInput}
        onChange={(e) => setActionInput(e.target.value)}
        placeholder={t('audit.filterAction')}
        className="max-w-xs"
      />

      <div className="mt-4">
        {q.isPending ? (
          <Skeleton className="h-64" />
        ) : events.length === 0 ? (
          <EmptyState label={t('audit.noEvents')} />
        ) : (
          <Card className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('audit.when')}</TableHead>
                  <TableHead>{t('audit.action')}</TableHead>
                  <TableHead>{t('audit.resource')}</TableHead>
                  <TableHead className="hidden md:table-cell">{t('audit.actor')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {new Intl.DateTimeFormat(i18n.language, {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      }).format(new Date(e.created_at))}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono text-[11px]">
                        {e.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {e.resource_type ?? '—'}
                    </TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                      {e.actor_type}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
        <LoadMoreButton
          hasMore={Boolean(q.hasNextPage)}
          loading={q.isFetchingNextPage}
          onClick={() => void q.fetchNextPage()}
        />
      </div>
    </>
  )
}

/**
 * Anchors are periodic notarisations of the chain head: each row says "at
 * sequence N the whole log hashed to this value". Anyone holding an older
 * anchor can prove history hasn't been rewritten since.
 */
function AnchorsTab() {
  const { t, i18n } = useTranslation()
  const q = useInfiniteQuery(auditAnchorsQuery)
  const anchors = q.data?.pages.flatMap((p) => p.data) ?? []

  return (
    <>
      <p className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
        <Anchor className="h-4 w-4 shrink-0" />
        {t('anchors.explainer')}
      </p>
      {q.isPending ? (
        <Skeleton className="h-48" />
      ) : anchors.length === 0 ? (
        <EmptyState label={t('anchors.empty')} />
      ) : (
        <Card className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('anchors.seq')}</TableHead>
                <TableHead>{t('anchors.hash')}</TableHead>
                <TableHead className="hidden md:table-cell">{t('anchors.ref')}</TableHead>
                <TableHead className="text-right">{t('anchors.at')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {anchors.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.seq}</TableCell>
                  <TableCell className="max-w-40 truncate font-mono text-[11px] text-muted-foreground">
                    {a.chain_head_hash}
                  </TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                    {a.anchor_ref ?? '—'}
                  </TableCell>
                  <TableCell className="text-right text-xs whitespace-nowrap text-muted-foreground">
                    {new Intl.DateTimeFormat(i18n.language, {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    }).format(new Date(a.anchored_at))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
      <LoadMoreButton
        hasMore={Boolean(q.hasNextPage)}
        loading={q.isFetchingNextPage}
        onClick={() => void q.fetchNextPage()}
      />
    </>
  )
}
