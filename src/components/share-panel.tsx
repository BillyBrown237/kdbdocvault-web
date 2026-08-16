import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link2 } from 'lucide-react'

import { ApiProblem, NetworkError } from '@/lib/api/http'
import { createShareLink, revokeShareLink, shareLinksQuery } from '@/lib/api/queries'
import { formatDate } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SecretReveal } from '@/components/ui/secret-reveal'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/components/ui/sonner'

export function SharePanel({ documentId }: { documentId: string }) {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const links = useQuery(shareLinksQuery(documentId))

  const [permission, setPermission] = useState<'view' | 'download'>('view')
  const [password, setPassword] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [createdUrl, setCreatedUrl] = useState<string | null>(null)

  const create = useMutation({
    mutationFn: () =>
      createShareLink(documentId, {
        permission,
        password: password || undefined,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      }),
    onSuccess: async (link) => {
      setCreatedUrl(link.url ?? null)
      setPassword('')
      setExpiresAt('')
      await queryClient.invalidateQueries({ queryKey: ['share-links', documentId] })
    },
    onError: (err) => {
      if (err instanceof NetworkError) toast.error(t('errors.network'))
      else if (err instanceof ApiProblem) toast.error(err.detail ?? err.title)
      else toast.error(t('errors.unknown'))
    },
  })

  const revoke = useMutation({
    mutationFn: revokeShareLink,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['share-links', documentId] }),
  })

  const activeLinks = links.data?.data.filter((l) => !l.revoked_at) ?? []

  return (
    <Card className="md:col-span-2">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link2 className="h-4 w-4" />
          {t('share.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            create.mutate()
          }}
        >
          <div className="space-y-1.5">
            <Label className="text-xs">{t('share.permission')}</Label>
            <Select value={permission} onValueChange={(v) => setPermission(v as 'view' | 'download')}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="view">{t('share.view')}</SelectItem>
                <SelectItem value="download">{t('share.download')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t('share.password')}</Label>
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('share.passwordOptional')}
              className="w-40"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t('share.expires')}</Label>
            <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
          </div>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? t('app.loading') : t('share.create')}
          </Button>
        </form>

        {createdUrl && (
          <div className="space-y-2 rounded-md border border-emerald-300 bg-emerald-50 p-3">
            {/* A share URL is a capability: whoever holds it holds the access.
                Same one-time treatment as an API key, download included —
                the person creating it is rarely the person who needs it. */}
            <SecretReveal
              value={createdUrl}
              filenameBase="kdbvault-share-link"
              title={t('share.fileTitle')}
              usage={t('share.fileUsage')}
              meta={{
                [t('share.permission')]: t(`share.${permission}`),
                ...(expiresAt ? { [t('share.expires')]: expiresAt } : {}),
              }}
            />
            <p className="text-xs text-muted-foreground">{t('share.oneTime')}</p>
          </div>
        )}

        {activeLinks.length > 0 && (
          <>
            <Separator />
            <ul className="space-y-2 text-sm">
              {activeLinks.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 flex-wrap items-center gap-1.5">
                    <Badge variant="secondary">{t(`share.${l.permission}`)}</Badge>
                    {l.has_password && <Badge variant="outline">{t('share.protected')}</Badge>}
                    <span className="text-xs text-muted-foreground">
                      {l.expires_at && `${t('share.until', { date: formatDate(l.expires_at, i18n.language) })} · `}
                      {t('share.views', { count: l.view_count })}
                    </span>
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 shrink-0 text-red-600 hover:text-red-600"
                    disabled={revoke.isPending}
                    onClick={() => revoke.mutate(l.id)}
                  >
                    {t('share.revoke')}
                  </Button>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  )
}
