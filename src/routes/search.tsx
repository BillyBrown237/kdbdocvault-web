import { createFileRoute } from '@tanstack/react-router'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search as SearchIcon } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { DocumentRow, EmptyState, LoadMoreButton } from '@/components/vault-list'
import { searchQuery } from '@/lib/api/queries'
import { requireTenant } from '@/lib/route-guards'
import { useDebouncedValue } from '@/lib/use-debounced-value'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

export const Route = createFileRoute('/search')({
  beforeLoad: ({ location }) => requireTenant(location),
  component: SearchPage,
})

function SearchPage() {
  const { t } = useTranslation()
  const [input, setInput] = useState('')
  const q = useDebouncedValue(input, 350)
  const results = useInfiniteQuery(searchQuery(q))

  const hits = results.data?.pages.flatMap((p) => p.data) ?? []

  return (
    <AppShell>
      <h1 className="text-2xl font-bold tracking-tight">{t('search.title')}</h1>

      <div className="relative mt-4">
        <SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('search.placeholder')}
          autoFocus
          className="h-11 pl-9"
        />
      </div>

      <div className="mt-4">
        {q.trim() === '' ? (
          <p className="text-sm text-muted-foreground">{t('search.hint')}</p>
        ) : results.isPending ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        ) : hits.length === 0 ? (
          <EmptyState label={t('search.noResults', { q })} />
        ) : (
          <div className="space-y-2">
            {hits.map((hit) => (
              <div key={hit.document.id}>
                <DocumentRow document={hit.document} />
                {hit.snippets && hit.snippets.length > 0 && (
                  <p className="mt-1 mb-2 truncate pl-4 text-xs text-muted-foreground italic">
                    …{hit.snippets[0]}…
                  </p>
                )}
              </div>
            ))}
            <LoadMoreButton
              hasMore={Boolean(results.hasNextPage)}
              loading={results.isFetchingNextPage}
              onClick={() => void results.fetchNextPage()}
            />
          </div>
        )}
      </div>
    </AppShell>
  )
}
