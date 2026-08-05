import { createFileRoute } from '@tanstack/react-router'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollText } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { EmptyState, LoadMoreButton } from '@/components/vault-list'
import { auditEventsQuery } from '@/lib/api/queries'
import { requireTenant } from '@/lib/route-guards'
import { useDebouncedValue } from '@/lib/use-debounced-value'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export const Route = createFileRoute('/audit')({
  beforeLoad: ({ location }) => requireTenant(location),
  component: AuditPage,
})

function AuditPage() {
  const { t, i18n } = useTranslation()
  const [actionInput, setActionInput] = useState('')
  const action = useDebouncedValue(actionInput, 350)
  const q = useInfiniteQuery(auditEventsQuery(action ? { action } : {}))

  const events = q.data?.pages.flatMap((p) => p.data) ?? []

  return (
    <AppShell>
      <div className="flex items-center gap-2">
        <ScrollText className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-2xl font-bold tracking-tight">{t('audit.title')}</h1>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{t('audit.subtitle')}</p>

      <Input
        value={actionInput}
        onChange={(e) => setActionInput(e.target.value)}
        placeholder={t('audit.filterAction')}
        className="mt-4 max-w-xs"
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
    </AppShell>
  )
}
