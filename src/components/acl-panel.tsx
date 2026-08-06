import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Building2, ShieldCheck, Trash2, UserRound, X } from 'lucide-react'

import { ApiProblem, NetworkError } from '@/lib/api/http'
import {
  aclQuery,
  departmentsQuery,
  effectiveAccessQuery,
  membersQuery,
  rolesQuery,
  setAcl,
} from '@/lib/api/queries'
import { ACCESS_LEVELS, PRINCIPAL_TYPES } from '@/lib/api/types'
import type { AccessLevel, AclEntry, AclEntryInput, PrincipalType } from '@/lib/api/types'
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
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/ui/sonner'

const PRINCIPAL_ICON = {
  member: UserRound,
  department: Building2,
  role: ShieldCheck,
} as const

/**
 * Internal permissions — the third sharing leg beside share links (external
 * individuals) and data rooms (external audiences).
 *
 * The API is set-replace: `PUT /documents/{id}/acl` takes the WHOLE list, so
 * every edit here rebuilds the array from the loaded entries and sends it back.
 * That's also why there's no per-row PATCH.
 */
export function AclPanel({ documentId }: { documentId: string }) {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()

  const acl = useQuery(aclQuery(documentId))
  const members = useQuery(membersQuery)
  const departments = useQuery(departmentsQuery)
  const roles = useQuery(rolesQuery)

  const [principalType, setPrincipalType] = useState<PrincipalType>('member')
  const [principalId, setPrincipalId] = useState('')
  const [level, setLevel] = useState<AccessLevel>('view')
  const [expiresAt, setExpiresAt] = useState('')

  const entries = acl.data?.entries ?? []

  const save = useMutation({
    mutationFn: (next: AclEntryInput[]) => setAcl(documentId, next),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['acl', documentId] })
      await queryClient.invalidateQueries({ queryKey: ['effective-access', documentId] })
    },
    onError: (err) => {
      if (err instanceof NetworkError) toast.error(t('errors.network'))
      else if (err instanceof ApiProblem) toast.error(err.detail ?? err.title)
      else toast.error(t('errors.unknown'))
    },
  })

  function toInput(e: AclEntry): AclEntryInput {
    return {
      principal_type: e.principal_type,
      principal_id: e.principal_id,
      access_level: e.access_level,
      expires_at: e.expires_at,
    }
  }

  function principalLabel(type: PrincipalType, id: string): string {
    if (type === 'member') {
      const m = members.data?.data.find((x) => x.id === id)
      return m ? (m.name ?? m.email) : id.slice(0, 8)
    }
    if (type === 'department') {
      return departments.data?.data.find((x) => x.id === id)?.name ?? id.slice(0, 8)
    }
    return roles.data?.data.find((x) => x.id === id)?.name ?? id.slice(0, 8)
  }

  const options =
    principalType === 'member'
      ? (members.data?.data ?? []).map((m) => ({ id: m.id, label: m.name ?? m.email }))
      : principalType === 'department'
        ? (departments.data?.data ?? []).map((d) => ({ id: d.id, label: d.name }))
        : (roles.data?.data ?? []).map((r) => ({ id: r.id, label: r.name }))

  const alreadyGranted = new Set(entries.map((e) => `${e.principal_type}:${e.principal_id}`))
  const available = options.filter((o) => !alreadyGranted.has(`${principalType}:${o.id}`))

  function addEntry() {
    if (!principalId) return
    save.mutate([
      ...entries.map(toInput),
      {
        principal_type: principalType,
        principal_id: principalId,
        access_level: level,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      },
    ])
    setPrincipalId('')
    setExpiresAt('')
  }

  function removeEntry(entryId: string) {
    save.mutate(entries.filter((e) => e.id !== entryId).map(toInput))
  }

  function changeLevel(entryId: string, next: AccessLevel) {
    save.mutate(
      entries.map((e) => (e.id === entryId ? { ...toInput(e), access_level: next } : toInput(e))),
    )
  }

  return (
    <Card className="md:col-span-2">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4" />
          {t('acl.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {acl.isPending ? (
          <Skeleton className="h-16" />
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('acl.empty')}</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {entries.map((e) => {
              const Icon = PRINCIPAL_ICON[e.principal_type]
              const expired = e.expires_at ? new Date(e.expires_at) < new Date() : false
              return (
                <li key={e.id} className="flex flex-wrap items-center gap-2">
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate">
                    {principalLabel(e.principal_type, e.principal_id)}
                    <span className="ml-1.5 text-xs text-muted-foreground">
                      {t(`acl.principal.${e.principal_type}`)}
                    </span>
                  </span>
                  {e.expires_at && (
                    <Badge variant={expired ? 'destructive' : 'outline'} className="shrink-0">
                      {t(expired ? 'acl.expired' : 'acl.until', {
                        date: formatDate(e.expires_at, i18n.language),
                      })}
                    </Badge>
                  )}
                  <Select
                    value={e.access_level}
                    onValueChange={(v) => changeLevel(e.id, v as AccessLevel)}
                    disabled={save.isPending}
                  >
                    <SelectTrigger className="h-8 w-32 shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACCESS_LEVELS.map((l) => (
                        <SelectItem key={l} value={l}>
                          {t(`acl.level.${l}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-red-600 hover:text-red-600"
                    disabled={save.isPending}
                    onClick={() => removeEntry(e.id)}
                    aria-label={t('acl.remove')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              )
            })}
          </ul>
        )}

        <Separator />

        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">{t('acl.principalType')}</Label>
            <Select
              value={principalType}
              onValueChange={(v) => {
                setPrincipalType(v as PrincipalType)
                setPrincipalId('')
              }}
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRINCIPAL_TYPES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {t(`acl.principal.${p}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t('acl.who')}</Label>
            <Select value={principalId} onValueChange={setPrincipalId}>
              <SelectTrigger className="w-52">
                <SelectValue placeholder={t('acl.choose')} />
              </SelectTrigger>
              <SelectContent>
                {available.length === 0 ? (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    {t('acl.noneLeft')}
                  </div>
                ) : (
                  available.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.label}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t('acl.access')}</Label>
            <Select value={level} onValueChange={(v) => setLevel(v as AccessLevel)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACCESS_LEVELS.map((l) => (
                  <SelectItem key={l} value={l}>
                    {t(`acl.level.${l}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t('acl.expires')}</Label>
            <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
          </div>
          <Button disabled={!principalId || save.isPending} onClick={addEntry}>
            {save.isPending ? t('app.loading') : t('acl.grant')}
          </Button>
        </div>

        <Separator />
        <EffectiveAccessChecker documentId={documentId} />
      </CardContent>
    </Card>
  )
}

/** "Why can this person see it?" — the backend returns the winning level plus
 * the full resolution trace (direct grant, role, department, ownership …). */
function EffectiveAccessChecker({ documentId }: { documentId: string }) {
  const { t } = useTranslation()
  const members = useQuery(membersQuery)
  const [memberId, setMemberId] = useState('')

  const effective = useQuery({
    ...effectiveAccessQuery(documentId, memberId),
    enabled: memberId !== '',
    retry: false,
  })

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">{t('acl.checkAccess')}</Label>
          <Select value={memberId} onValueChange={setMemberId}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder={t('acl.chooseMember')} />
            </SelectTrigger>
            <SelectContent>
              {(members.data?.data ?? []).map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name ?? m.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {memberId && (
          <Button variant="ghost" size="icon" onClick={() => setMemberId('')} aria-label={t('acl.clear')}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {effective.isPending && memberId ? (
        <Skeleton className="h-14" />
      ) : effective.data ? (
        <div className="rounded-md border bg-muted/30 p-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">{t('acl.effective')}</span>
            {effective.data.access_level ? (
              <Badge>{t(`acl.level.${effective.data.access_level}`)}</Badge>
            ) : (
              <Badge variant="destructive">{t('acl.noAccess')}</Badge>
            )}
          </div>
          {effective.data.trace.length > 0 && (
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              {effective.data.trace.map((line, i) => (
                <li key={i}>
                  <span className="font-medium">{line.source}</span> — {line.detail}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}
