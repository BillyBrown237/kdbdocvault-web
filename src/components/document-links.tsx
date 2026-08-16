import { Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link2, X } from 'lucide-react'

import {
  createDocumentLink,
  deleteDocumentLink,
  documentLinksQuery,
  documentPickerQuery,
} from '@/lib/api/queries'
import { ApiProblem } from '@/lib/api/http'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { StatusBadge } from '@/components/ui/status-badge'
import { toast } from '@/components/ui/sonner'

const LINK_TYPES = ['amends', 'fulfills', 'supports', 'relates_to'] as const

/**
 * W27 (B58) — the relationships between documents.
 *
 * Each link is ONE row read from both ends, so the sentence changes with who
 * is asking: on the amendment it reads "amends X", on X it reads "amended by".
 * The translation keys carry both voices (`links.type.amends.outgoing` /
 * `.incoming`) rather than showing a bare enum and making the reader work out
 * which way round it goes.
 */
export function DocumentLinks({ documentId }: { documentId: string }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const links = useQuery(documentLinksQuery(documentId))

  const [adding, setAdding] = useState(false)
  const [term, setTerm] = useState('')
  const [type, setType] = useState<string>('relates_to')
  const [target, setTarget] = useState<{ id: string; title: string } | null>(null)

  // Reuse the existing search endpoint as the picker — no new surface, and it
  // already respects the reader's permissions.
  const results = useQuery({
    ...documentPickerQuery(term.trim()),
    enabled: adding && term.trim().length >= 2,
  })

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['documents', 'links', documentId] })

  const create = useMutation({
    mutationFn: () => createDocumentLink(documentId, { target_id: target!.id, link_type: type }),
    onSuccess: async () => {
      toast.success(t('links.created'))
      setAdding(false)
      setTarget(null)
      setTerm('')
      await invalidate()
    },
    onError: (e) =>
      toast.error(e instanceof ApiProblem ? (e.detail ?? e.title) : t('errors.unknown')),
  })

  const remove = useMutation({
    mutationFn: (linkId: string) => deleteDocumentLink(documentId, linkId),
    onSuccess: async () => {
      toast.success(t('links.removed'))
      await invalidate()
    },
    onError: () => toast.error(t('errors.unknown')),
  })

  const rows = links.data?.data ?? []

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link2 className="h-4 w-4" />
          {t('links.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length === 0 && !adding && (
          <p className="text-sm text-muted-foreground">{t('links.empty')}</p>
        )}

        {rows.map((l, i) => (
          <div key={l.id}>
            {i > 0 && <Separator className="mb-3" />}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">
                  {t(`links.type.${l.link_type}.${l.direction}`)}
                </div>
                <Link
                  to="/documents/$documentId"
                  params={{ documentId: l.other_document.id }}
                  className="block truncate text-sm font-medium hover:underline"
                >
                  {l.other_document.title}
                </Link>
                <StatusBadge domain="document" status={l.other_document.status} className="mt-1" />
              </div>
              <Button
                variant="ghost"
                size="sm"
                aria-label={t('links.remove')}
                disabled={remove.isPending}
                onClick={() => remove.mutate(l.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}

        {adding ? (
          <div className="space-y-3 rounded-md border p-3">
            <div className="space-y-1.5">
              <Label className="text-xs">{t('links.relationship')}</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LINK_TYPES.map((lt) => (
                    <SelectItem key={lt} value={lt}>
                      {t(`links.type.${lt}.outgoing`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">{t('links.findDocument')}</Label>
              {target ? (
                <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/40 px-3 py-2">
                  <span className="truncate text-sm">{target.title}</span>
                  <Button variant="ghost" size="sm" onClick={() => setTarget(null)}>
                    {t('common.cancel')}
                  </Button>
                </div>
              ) : (
                <>
                  <Input
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    placeholder={t('links.searchPlaceholder')}
                  />
                  {term.trim().length >= 2 && (
                    <div className="space-y-1">
                      {(results.data?.data ?? [])
                        .filter((r) => r.document.id !== documentId)
                        .map((r) => (
                          <button
                            key={r.document.id}
                            type="button"
                            className="block w-full truncate rounded px-2 py-1 text-left text-sm hover:bg-muted"
                            onClick={() =>
                              setTarget({ id: r.document.id, title: r.document.title })
                            }
                          >
                            {r.document.title}
                          </button>
                        ))}
                      {results.isFetched && (results.data?.data.length ?? 0) === 0 && (
                        <p className="px-2 text-xs text-muted-foreground">{t('search.noResults')}</p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex gap-2">
              <Button disabled={!target || create.isPending} onClick={() => create.mutate()}>
                {create.isPending ? t('app.loading') : t('links.add')}
              </Button>
              <Button variant="outline" onClick={() => setAdding(false)}>
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
            {t('links.add')}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
