import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Copy, Mail, UserPlus, Users } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { ApiProblem, NetworkError } from '@/lib/api/http'
import {
  createInvitation,
  invitationsQuery,
  membersQuery,
  removeMember,
  revokeInvitation,
  rolesQuery,
  tenantQuery,
  transferOwnership,
  updateMember,
  updateTenantName,
} from '@/lib/api/queries'
import type { Member } from '@/lib/api/types'
import { requireTenant } from '@/lib/route-guards'
import { formatDate } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/components/ui/sonner'

export const Route = createFileRoute('/team')({
  beforeLoad: ({ location }) => requireTenant(location),
  component: TeamPage,
})

function fail(err: unknown, t: (k: string) => string) {
  if (err instanceof NetworkError) toast.error(t('errors.network'))
  else if (err instanceof ApiProblem) toast.error(err.detail ?? err.title)
  else toast.error(t('errors.unknown'))
}

function TeamPage() {
  const { t } = useTranslation()
  return (
    <AppShell>
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-2xl font-bold tracking-tight">{t('team.title')}</h1>
      </div>
      <Tabs defaultValue="members" className="mt-4">
        <TabsList>
          <TabsTrigger value="members">{t('team.members')}</TabsTrigger>
          <TabsTrigger value="invitations">{t('team.invitations')}</TabsTrigger>
          <TabsTrigger value="org">{t('team.organization')}</TabsTrigger>
        </TabsList>
        <TabsContent value="members">
          <MembersTab />
        </TabsContent>
        <TabsContent value="invitations">
          <InvitationsTab />
        </TabsContent>
        <TabsContent value="org">
          <OrgTab />
        </TabsContent>
      </Tabs>
    </AppShell>
  )
}

function MembersTab() {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const members = useQuery(membersQuery)
  const roles = useQuery(rolesQuery)

  const changeRole = useMutation({
    mutationFn: ({ id, roleId }: { id: string; roleId: string }) =>
      updateMember(id, { role_id: roleId }),
    onSuccess: async () => {
      toast.success(t('team.roleChanged'))
      await queryClient.invalidateQueries({ queryKey: ['members'] })
    },
    onError: (e) => fail(e, t),
  })

  const remove = useMutation({
    mutationFn: removeMember,
    onSuccess: async () => {
      toast.success(t('team.memberRemoved'))
      await queryClient.invalidateQueries({ queryKey: ['members'] })
    },
    onError: (e) => fail(e, t),
  })

  if (members.isPending) return <Skeleton className="h-32" />

  return (
    <Card>
      <CardContent className="space-y-2 p-4">
        {members.data?.data.map((m, i) => (
          <div key={m.id}>
            {i > 0 && <Separator className="mb-2" />}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{m.name ?? m.email}</div>
                <div className="text-xs text-muted-foreground">
                  {m.email} · {t('team.joined', { date: formatDate(m.joined_at, i18n.language) })}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={m.role_id}
                  onValueChange={(roleId) => changeRole.mutate({ id: m.id, roleId })}
                >
                  <SelectTrigger className="h-8 w-32 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.data?.data.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <TransferOwnershipDialog
                  member={m}
                  others={(members.data?.data ?? []).filter((x) => x.id !== m.id)}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-600 hover:text-red-600"
                  onClick={() => remove.mutate(m.id)}
                  disabled={remove.isPending}
                >
                  {t('team.remove')}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

/**
 * Hands a member's documents and the Owner role to someone else — the exit
 * path when a person leaves. Destructive and irreversible from the UI, so it
 * sits behind a dialog with an explicit recipient choice rather than a
 * one-click button next to "Remove".
 */
function TransferOwnershipDialog({ member, others }: { member: Member; others: Member[] }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [toId, setToId] = useState('')

  const transfer = useMutation({
    mutationFn: () => transferOwnership(member.id, toId),
    onSuccess: async (r) => {
      setOpen(false)
      setToId('')
      toast.success(t('team.transferred', { count: r.documents_moved }))
      await queryClient.invalidateQueries({ queryKey: ['members'] })
      await queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
    onError: (e) => fail(e, t),
  })

  if (others.length === 0) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="text-xs">
          {t('team.transfer')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('team.transferTitle', { name: member.name ?? member.email })}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{t('team.transferExplainer')}</p>
        <Select value={toId} onValueChange={setToId}>
          <SelectTrigger>
            <SelectValue placeholder={t('team.transferTo')} />
          </SelectTrigger>
          <SelectContent>
            {others.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name ?? m.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button disabled={!toId || transfer.isPending} onClick={() => transfer.mutate()}>
            {transfer.isPending ? t('app.loading') : t('team.transferConfirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function InvitationsTab() {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const invitations = useQuery(invitationsQuery)
  const roles = useQuery(rolesQuery)

  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [roleId, setRoleId] = useState<string>('')
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!roleId && roles.data?.data.length) {
      const member = roles.data.data.find((r) => r.name === 'Member') ?? roles.data.data[0]
      setRoleId(member.id)
    }
  }, [roles.data, roleId])

  const invite = useMutation({
    mutationFn: () => createInvitation({ email: email.trim(), role_id: roleId }),
    onSuccess: async (r) => {
      setInviteUrl(r.invite_url)
      setCopied(false)
      setEmail('')
      await queryClient.invalidateQueries({ queryKey: ['invitations'] })
    },
    onError: (e) => fail(e, t),
  })

  const revoke = useMutation({
    mutationFn: revokeInvitation,
    onSuccess: async () => {
      toast.success(t('team.inviteRevoked'))
      await queryClient.invalidateQueries({ queryKey: ['invitations'] })
    },
    onError: (e) => fail(e, t),
  })

  const pending = invitations.data?.data.filter((i) => i.status === 'pending') ?? []

  return (
    <div className="space-y-4">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>
            <UserPlus className="h-4 w-4" />
            {t('team.invite')}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('team.inviteTitle')}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              if (email.trim() && roleId) invite.mutate()
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="invite-email">{t('auth.register.email')}</Label>
              <Input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('team.role')}</Label>
              <Select value={roleId} onValueChange={setRoleId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.data?.data.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {inviteUrl && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 rounded-md border border-emerald-300 bg-emerald-50 p-2">
                  <code className="min-w-0 flex-1 truncate text-xs">{inviteUrl}</code>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 shrink-0 bg-white"
                    onClick={() => {
                      void navigator.clipboard.writeText(inviteUrl)
                      setCopied(true)
                    }}
                  >
                    {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    {copied ? t('share.copied') : t('share.copy')}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">{t('team.inviteUrlNote')}</p>
              </div>
            )}

            <DialogFooter>
              <Button type="submit" disabled={invite.isPending || !email.trim()}>
                {invite.isPending ? t('app.loading') : t('team.sendInvite')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="space-y-2 p-4">
          {invitations.isPending ? (
            <Skeleton className="h-16" />
          ) : pending.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('team.noInvitations')}</p>
          ) : (
            pending.map((inv, i) => (
              <div key={inv.id}>
                {i > 0 && <Separator className="mb-2" />}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <div className="truncate text-sm">{inv.email}</div>
                      <div className="text-xs text-muted-foreground">
                        {t('team.expires', { date: formatDate(inv.expires_at, i18n.language) })}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:text-red-600"
                    onClick={() => revoke.mutate(inv.id)}
                  >
                    {t('team.revokeInvite')}
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function OrgTab() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const tenant = useQuery(tenantQuery)
  const [name, setName] = useState('')

  useEffect(() => {
    if (tenant.data) setName(tenant.data.name)
  }, [tenant.data])

  const save = useMutation({
    mutationFn: () => updateTenantName(name.trim()),
    onSuccess: async () => {
      toast.success(t('team.orgSaved'))
      await queryClient.invalidateQueries({ queryKey: ['tenant'] })
    },
    onError: (e) => fail(e, t),
  })

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm text-muted-foreground">{t('team.organization')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="org">{t('onboarding.orgName')}</Label>
          <Input id="org" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span>{t('team.plan')}: {tenant.data?.plan}</span>
          <span>{t('team.region')}: {tenant.data?.region}</span>
          <Badge variant="outline">{tenant.data?.isolation_tier}</Badge>
        </div>
        <Button onClick={() => save.mutate()} disabled={save.isPending || !name.trim()}>
          {save.isPending ? t('app.loading') : t('settings.save')}
        </Button>
      </CardContent>
    </Card>
  )
}
