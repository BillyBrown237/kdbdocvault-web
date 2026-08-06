import { createFileRoute } from '@tanstack/react-router'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Bookmark, BookmarkPlus, Search as SearchIcon, X } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { DocumentRow, EmptyState, LoadMoreButton } from '@/components/vault-list'
import { ApiProblem, NetworkError } from '@/lib/api/http'
import {
  deleteSavedSearch,
  documentTypesQuery,
  runSavedSearchQuery,
  saveSearch,
  savedSearchesQuery,
  searchQuery,
  tagsQuery,
} from '@/lib/api/queries'
import type { SearchFilters } from '@/lib/api/queries'
import type { SearchHit } from '@/lib/api/types'
import { requireTenant } from '@/lib/route-guards'
import { useDebouncedValue } from '@/lib/use-debounced-value'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/ui/sonner'

export const Route = createFileRoute('/search')({
  beforeLoad: ({ location }) => requireTenant(location),
  component: SearchPage,
})

/** Select can't hold an empty string as a value, so "no filter" needs a token. */
const ANY = '__any__'

function SearchPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [input, setInput] = useState('')
  const q = useDebouncedValue(input, 350)
  const [typeId, setTypeId] = useState(ANY)
  const [tag, setTag] = useState(ANY)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [saveName, setSaveName] = useState('')
  const [naming, setNaming] = useState(false)

  const types = useQuery(documentTypesQuery)
  const tags = useQuery(tagsQuery)
  const saved = useQuery(savedSearchesQuery)

  const filters: SearchFilters = {
    type_id: typeId === ANY ? undefined : typeId,
    tag: tag === ANY ? undefined : tag,
  }

  const live = useInfiniteQuery(searchQuery(q, filters))
  const stored = useInfiniteQuery({
    ...runSavedSearchQuery(savedId ?? ''),
    enabled: savedId !== null,
  })

  // One of the two drives the page: a saved search runs its OWN stored
  // criteria server-side, so it isn't just these inputs replayed.
  const results = savedId ? stored : live
  const hits: SearchHit[] = results.data?.pages.flatMap((p) => p.data) ?? []

  const save = useMutation({
    mutationFn: () => saveSearch(saveName.trim(), { q: q.trim(), ...filters }),
    onSuccess: async () => {
      setNaming(false)
      setSaveName('')
      toast.success(t('savedSearch.saved'))
      await queryClient.invalidateQueries({ queryKey: ['saved-searches'] })
    },
    onError: (err) => {
      if (err instanceof NetworkError) toast.error(t('errors.network'))
      else if (err instanceof ApiProblem) toast.error(err.detail ?? err.title)
      else toast.error(t('errors.unknown'))
    },
  })

  const remove = useMutation({
    mutationFn: deleteSavedSearch,
    onSuccess: async (_r, id) => {
      if (savedId === id) setSavedId(null)
      await queryClient.invalidateQueries({ queryKey: ['saved-searches'] })
    },
  })

  function clearSaved() {
    setSavedId(null)
  }

  const activeSaved = saved.data?.data.find((s) => s.id === savedId)
  const canSave = q.trim().length > 0 && !savedId

  return (
    <AppShell>
      <h1 className="text-2xl font-bold tracking-tight">{t('search.title')}</h1>

      <div className="relative mt-4">
        <SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            clearSaved()
          }}
          placeholder={t('search.placeholder')}
          autoFocus
          className="h-11 pl-9"
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Select
          value={typeId}
          onValueChange={(v) => {
            setTypeId(v)
            clearSaved()
          }}
        >
          <SelectTrigger className="h-9 w-44">
            <SelectValue placeholder={t('search.anyType')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>{t('search.anyType')}</SelectItem>
            {(types.data?.data ?? []).map((ty) => (
              <SelectItem key={ty.id} value={ty.id}>
                {ty.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={tag}
          onValueChange={(v) => {
            setTag(v)
            clearSaved()
          }}
        >
          <SelectTrigger className="h-9 w-44">
            <SelectValue placeholder={t('search.anyTag')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>{t('search.anyTag')}</SelectItem>
            {(tags.data?.data ?? []).map((tg) => (
              <SelectItem key={tg.id} value={tg.name}>
                {tg.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {naming ? (
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              if (saveName.trim()) save.mutate()
            }}
          >
            <Input
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder={t('savedSearch.namePlaceholder')}
              className="h-9 w-48"
              autoFocus
            />
            <Button type="submit" size="sm" disabled={save.isPending || !saveName.trim()}>
              {save.isPending ? t('app.loading') : t('savedSearch.save')}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setNaming(false)}>
              {t('common.cancel')}
            </Button>
          </form>
        ) : (
          <Button variant="outline" size="sm" disabled={!canSave} onClick={() => setNaming(true)}>
            <BookmarkPlus className="h-4 w-4" />
            {t('savedSearch.saveThis')}
          </Button>
        )}
      </div>

      {(saved.data?.data.length ?? 0) > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Bookmark className="h-4 w-4 text-muted-foreground" />
          {saved.data!.data.map((s) => (
            <Badge
              key={s.id}
              variant={savedId === s.id ? 'default' : 'outline'}
              className="cursor-pointer gap-1 py-1"
              onClick={() => setSavedId(savedId === s.id ? null : s.id)}
            >
              {s.name}
              <button
                type="button"
                aria-label={t('savedSearch.delete')}
                className="opacity-60 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation()
                  remove.mutate(s.id)
                }}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {activeSaved && (
        <p className="mt-3 text-sm text-muted-foreground">
          {t('savedSearch.running', { name: activeSaved.name, q: activeSaved.query.q })}
        </p>
      )}

      <div className="mt-4">
        {!savedId && q.trim() === '' ? (
          <p className="text-sm text-muted-foreground">{t('search.hint')}</p>
        ) : results.isPending ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        ) : hits.length === 0 ? (
          <EmptyState label={t('search.noResults', { q: activeSaved?.query.q ?? q })} />
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
