import { useInfiniteQuery, useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Download, FileArchive, ScrollText } from 'lucide-react'

import { ApiProblem, NetworkError } from '@/lib/api/http'
import { createEvidenceBundle, documentAuditQuery } from '@/lib/api/queries'
import { useJob } from '@/lib/use-job'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/ui/sonner'

/**
 * The document's own slice of the hash-chained audit log, plus the evidence
 * bundle — the export you hand a court or an auditor: the document, its
 * versions, and the chain segment that proves the trail wasn't edited after
 * the fact.
 */
export function DocumentTrailPanel({ documentId }: { documentId: string }) {
  const { t, i18n } = useTranslation()
  const trail = useInfiniteQuery(documentAuditQuery(documentId))
  const bundle = useJob()

  const create = useMutation({
    mutationFn: () => createEvidenceBundle(documentId),
    onSuccess: (job) => bundle.start(job),
    onError: (err) => {
      if (err instanceof NetworkError) toast.error(t('errors.network'))
      else if (err instanceof ApiProblem) toast.error(err.detail ?? err.title)
      else toast.error(t('errors.unknown'))
    },
  })

  const events = trail.data?.pages.flatMap((p) => p.data) ?? []
  const job = bundle.job

  return (
    <Card className="md:col-span-2">
      <CardHeader className="flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
          <ScrollText className="h-4 w-4" />
          {t('docAudit.title')}
        </CardTitle>
        <div className="flex items-center gap-2">
          {job?.status === 'done' && job.result_url ? (
            <Button size="sm" asChild>
              <a href={job.result_url} target="_blank" rel="noreferrer">
                <Download className="h-4 w-4" />
                {t('evidence.download')}
              </a>
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              disabled={create.isPending || bundle.running}
              onClick={() => create.mutate()}
            >
              <FileArchive className="h-4 w-4" />
              {bundle.running ? t('evidence.building') : t('evidence.create')}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {job?.status === 'failed' && (
          <p className="mb-3 text-sm text-red-600">{job.error ?? t('evidence.failed')}</p>
        )}

        {trail.isPending ? (
          <Skeleton className="h-24" />
        ) : events.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('docAudit.empty')}</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {events.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="shrink-0 font-mono text-[11px]">
                  {e.action}
                </Badge>
                <span className="text-xs text-muted-foreground">{e.actor_type}</span>
                <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                  {new Intl.DateTimeFormat(i18n.language, {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  }).format(new Date(e.created_at))}
                </span>
              </li>
            ))}
          </ul>
        )}

        {trail.hasNextPage && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 w-full"
            disabled={trail.isFetchingNextPage}
            onClick={() => void trail.fetchNextPage()}
          >
            {trail.isFetchingNextPage ? t('app.loading') : t('common.loadMore')}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
