import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { KeyRound, RefreshCw } from 'lucide-react'

import {
  apiKeysQuery,
  createApiKey,
  revokeApiKey,
  rotateApiKey,
} from '@/lib/api/queries'
import { API_ORIGIN, ApiProblem, NetworkError } from '@/lib/api/http'
import type { CreatedApiKey } from '@/lib/api/types'
import { formatDate } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Callout } from '@/components/ui/callout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SecretReveal } from '@/components/ui/secret-reveal'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/components/ui/sonner'

/** Filesystem-safe stem for the downloaded file, from the key's own name. */
function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'key'
}

/**
 * A copy-paste-able first request.
 *
 * The endpoint is chosen from the key's OWN scopes: handing someone a
 * `/documents` example for an audit-only key would answer 403 and teach them
 * their key is broken when it isn't. Falls back to the current origin when
 * VITE_API_URL is unset (the dev proxy case), so the command still runs.
 */
function curlExample(secret: string, scopes: string[]): string {
  const base = (API_ORIGIN || window.location.origin) + '/v1'
  const path = scopes.some((s) => s.startsWith('documents:'))
    ? '/documents?limit=5'
    : scopes.includes('search:read')
      ? '/search?q=test'
      : scopes.includes('reports:read')
        ? '/reports/overview'
        : scopes.includes('audit:read')
          ? '/audit/events?limit=5'
          : scopes.includes('signatures:read')
            ? '/envelopes'
            : '/imports'
  return `curl -H "Authorization: ApiKey ${secret}" \\\n  ${base}${path}`
}

/**
 * W28 (B59) — machine API keys.
 *
 * The whole screen is built around one fact: the secret exists in the
 * response and nowhere else. So it appears in a modal that says so, with a
 * copy button, and cannot be dismissed by clicking away — the one interaction
 * where an accidental outside-click costs the user something irreversible.
 */
export function ApiKeysCard() {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const keys = useQuery(apiKeysQuery)

  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [scopes, setScopes] = useState<string[]>([])
  const [revealed, setRevealed] = useState<CreatedApiKey | null>(null)

  const fail = (err: unknown) => {
    if (err instanceof NetworkError) toast.error(t('errors.network'))
    else if (err instanceof ApiProblem) toast.error(err.detail ?? err.title)
    else toast.error(t('errors.unknown'))
  }
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['api-keys'] })

  const create = useMutation({
    mutationFn: () => createApiKey({ name: name.trim(), scopes }),
    onSuccess: async (created) => {
      setRevealed(created)
      setCreating(false)
      setName('')
      setScopes([])
      await invalidate()
    },
    onError: fail,
  })

  const rotate = useMutation({
    mutationFn: (keyId: string) => rotateApiKey(keyId, 24),
    onSuccess: async (created) => {
      setRevealed(created)
      await invalidate()
    },
    onError: fail,
  })

  const revoke = useMutation({
    mutationFn: revokeApiKey,
    onSuccess: async () => {
      toast.success(t('integrations.keyRevoked'))
      await invalidate()
    },
    onError: fail,
  })

  const available = keys.data?.available_scopes ?? []
  const rows = keys.data?.data ?? []
  const live = rows.filter((k) => !k.revoked_at)
  const revoked = rows.filter((k) => k.revoked_at)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
          <KeyRound className="h-4 w-4" />
          {t('integrations.keys')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{t('integrations.keysExplainer')}</p>

        {live.length === 0 && !creating && (
          <p className="text-sm text-muted-foreground">{t('integrations.noKeys')}</p>
        )}

        {live.map((k, i) => (
          <div key={k.id}>
            {i > 0 && <Separator className="mb-3" />}
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <div className="text-sm font-medium">{k.name}</div>
                <div className="flex flex-wrap gap-1">
                  {k.scopes.map((s) => (
                    <Badge key={s} variant="outline" className="font-mono text-[10px]">
                      {s}
                    </Badge>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground">
                  {k.last_used_at
                    ? t('integrations.lastUsed', {
                        when: formatDate(k.last_used_at, i18n.language),
                        ip: k.last_used_ip ?? '—',
                      })
                    : t('integrations.neverUsed')}
                </div>
                {/* The rotation window is the one piece of state an operator
                    must see: it says how long the OLD secret still works. */}
                {k.grace_until && new Date(k.grace_until) > new Date() && (
                  <div className="text-xs text-amber-700 dark:text-amber-400">
                    {t('integrations.graceActive', {
                      when: formatDate(k.grace_until, i18n.language),
                    })}
                  </div>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={rotate.isPending}
                  onClick={() => rotate.mutate(k.id)}
                >
                  <RefreshCw className="mr-1 h-3.5 w-3.5" />
                  {t('integrations.rotate')}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-600 hover:text-red-600"
                  disabled={revoke.isPending}
                  onClick={() => revoke.mutate(k.id)}
                >
                  {t('integrations.revoke')}
                </Button>
              </div>
            </div>
          </div>
        ))}

        {revoked.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {t('integrations.revokedCount', { count: revoked.length })}
          </p>
        )}

        <Separator />

        {creating ? (
          <div className="space-y-4 rounded-md border p-3">
            <div className="space-y-1.5">
              <Label htmlFor="key-name">{t('integrations.keyName')}</Label>
              <Input
                id="key-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('integrations.keyNamePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('integrations.scopes')}</Label>
              <p className="text-xs text-muted-foreground">{t('integrations.scopesHint')}</p>
              <div className="space-y-1.5">
                {available.map((s) => (
                  <label key={s.scope} className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={scopes.includes(s.scope)}
                      onChange={(e) =>
                        setScopes((cur) =>
                          e.target.checked
                            ? [...cur, s.scope]
                            : cur.filter((x) => x !== s.scope),
                        )
                      }
                    />
                    <span>
                      <span className="font-mono text-xs">{s.scope}</span>
                      <span className="block text-xs text-muted-foreground">{s.description}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                disabled={create.isPending || !name.trim() || scopes.length === 0}
                onClick={() => create.mutate()}
              >
                {create.isPending ? t('app.loading') : t('common.create')}
              </Button>
              <Button variant="outline" onClick={() => setCreating(false)}>
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setCreating(true)}>
            {t('integrations.newKey')}
          </Button>
        )}

        {/* Secret reveal. Not dismissible by clicking outside: this is the
            only moment the secret exists, and a stray click would lose it. */}
        <Dialog open={revealed !== null} onOpenChange={() => {}}>
          <DialogContent
            className="sm:max-w-lg"
            onPointerDownOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle>{t('integrations.secretTitle')}</DialogTitle>
            </DialogHeader>
            <Callout variant="warning">{t('integrations.secretOnce')}</Callout>
            {revealed && (
              <SecretReveal
                value={revealed.secret}
                envKey="KDB_API_KEY"
                filenameBase={`kdbvault-api-key-${slug(revealed.key.name)}`}
                title={t('integrations.secretFileTitle', { name: revealed.key.name })}
                usage={t('integrations.secretUsage')}
                meta={{
                  [t('integrations.keyName')]: revealed.key.name,
                  [t('integrations.scopes')]: revealed.key.scopes.join(' '),
                }}
                // A real command, with the real host and the real value: the
                // shape of the header is guessable, that it WORKS is not.
                // Uses a route the key's own scopes can actually reach, so
                // pasting it doesn't produce a confusing 403.
                example={curlExample(revealed.secret, revealed.key.scopes)}
              />
            )}
            <DialogFooter>
              <Button onClick={() => setRevealed(null)}>{t('integrations.secretSaved')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
