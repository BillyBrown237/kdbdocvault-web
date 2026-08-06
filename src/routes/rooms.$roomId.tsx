import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import {
  useInfiniteQuery,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BarChart3, ChevronLeft, FileText, Mail, Plus, Users } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { ApiProblem, NetworkError } from '@/lib/api/http'
import {
  addRoomDocuments,
  closeDataRoom,
  dataRoomQuery,
  documentQuery,
  documentsQuery,
  inviteRoomVisitor,
  roomAnalyticsQuery,
  updateDataRoom,
} from '@/lib/api/queries'
import { formatDate, formatDuration } from '@/lib/format'
import { requireTenant } from '@/lib/route-guards'
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
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/components/ui/sonner'

export const Route = createFileRoute('/rooms/$roomId')({
  beforeLoad: ({ location }) => requireTenant(location),
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(dataRoomQuery(params.roomId)),
  component: RoomDetail,
})

function fail(err: unknown, t: (k: string) => string) {
  if (err instanceof NetworkError) toast.error(t('errors.network'))
  else if (err instanceof ApiProblem) toast.error(err.detail ?? err.title)
  else toast.error(t('errors.unknown'))
}

function RoomDetail() {
  const { t, i18n } = useTranslation()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { roomId } = Route.useParams()

  const room = useQuery(dataRoomQuery(roomId))
  const analytics = useQuery(roomAnalyticsQuery(roomId))

  const close = useMutation({
    mutationFn: () => closeDataRoom(roomId),
    onSuccess: async () => {
      toast.success(t('rooms.closed'))
      await queryClient.invalidateQueries({ queryKey: ['data-room', roomId] })
      await queryClient.invalidateQueries({ queryKey: ['data-rooms'] })
    },
    onError: (err) => fail(err, t),
  })

  const r = room.data
  const expired = r?.expires_at ? new Date(r.expires_at) < new Date() : false
  const live = r?.status === 'open' && !expired
  const visitors = analytics.data?.visitors ?? []

  return (
    <AppShell>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.history.back()}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="min-w-0 flex-1 truncate text-2xl font-bold tracking-tight">
          {r?.name ?? t('app.loading')}
        </h1>
        {r && (
          <Badge variant={live ? 'default' : 'secondary'}>
            {t(expired && r.status === 'open' ? 'rooms.status.expired' : `rooms.status.${r.status}`)}
          </Badge>
        )}
        {r && r.status === 'open' && (
          <Button
            variant="outline"
            className="text-red-600 hover:text-red-600"
            disabled={close.isPending}
            onClick={() => close.mutate()}
          >
            {t('rooms.close')}
          </Button>
        )}
      </div>

      {r && (
        <>
          <p className="mt-2 pl-12 text-sm text-muted-foreground">
            {r.description && <span className="block">{r.description}</span>}
            {r.expires_at
              ? t('rooms.expiresOn', { date: formatDate(r.expires_at, i18n.language) })
              : t('rooms.noExpiry')}
            {' · '}
            {t('rooms.visitorCount', { count: r.visitor_count })}
          </p>

          <Tabs defaultValue="documents" className="mt-6">
            <TabsList>
              <TabsTrigger value="documents">
                {t('rooms.documents')}
                <Badge variant="secondary" className="ml-1.5 px-1.5 py-0">
                  {r.document_ids.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="visitors">{t('rooms.visitors')}</TabsTrigger>
              <TabsTrigger value="settings">{t('rooms.settings')}</TabsTrigger>
            </TabsList>

            <TabsContent value="documents" className="mt-4">
              <Card>
                <CardHeader className="flex-row items-center justify-between pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    {t('rooms.documents')}
                  </CardTitle>
                  {live && <AddDocumentsDialog roomId={roomId} existing={r.document_ids} />}
                </CardHeader>
                <CardContent>
                  {r.document_ids.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      {t('rooms.noDocuments')}
                    </p>
                  ) : (
                    <RoomDocumentList documentIds={r.document_ids} />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="visitors" className="mt-4 space-y-4">
              {live && <InviteVisitorCard roomId={roomId} />}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                    <BarChart3 className="h-4 w-4" />
                    {t('rooms.analytics')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics.isPending ? (
                    <Skeleton className="h-24" />
                  ) : visitors.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      {t('rooms.noVisitors')}
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('rooms.visitor')}</TableHead>
                          <TableHead className="text-right">{t('rooms.opened')}</TableHead>
                          <TableHead className="text-right">{t('rooms.viewTime')}</TableHead>
                          <TableHead className="text-right">{t('rooms.lastVisit')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {visitors.map((v) => (
                          <TableRow key={v.email}>
                            <TableCell>
                              <span className="font-medium">{v.name ?? v.email}</span>
                              {v.name && (
                                <span className="block text-xs text-muted-foreground">
                                  {v.email}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">{v.documents_opened}</TableCell>
                            <TableCell className="text-right">
                              {formatDuration(v.total_view_seconds)}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {v.last_visit ? formatDate(v.last_visit, i18n.language) : '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="mt-4">
              <RoomSettingsCard
                roomId={roomId}
                name={r.name}
                expiresAt={r.expires_at}
                disabled={r.status !== 'open'}
              />
            </TabsContent>
          </Tabs>
        </>
      )}
    </AppShell>
  )
}

/** The room detail returns ids only; resolve titles one query each (they're
 * already cached whenever the user came from the vault). */
function RoomDocumentList({ documentIds }: { documentIds: string[] }) {
  const { t } = useTranslation()
  const docs = useQueries({ queries: documentIds.map((id) => documentQuery(id)) })

  return (
    <ul className="divide-y text-sm">
      {documentIds.map((id, i) => {
        const q = docs[i]
        return (
          <li key={id} className="py-2">
            {q.isPending ? (
              <Skeleton className="h-5 w-48" />
            ) : q.isError ? (
              <span className="text-muted-foreground">{t('rooms.documentUnavailable')}</span>
            ) : (
              <Link
                to="/documents/$documentId"
                params={{ documentId: id }}
                className="hover:underline"
              >
                {q.data?.title}
              </Link>
            )}
          </li>
        )
      })}
    </ul>
  )
}

function AddDocumentsDialog({ roomId, existing }: { roomId: string; existing: string[] }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [picked, setPicked] = useState<Set<string>>(new Set())

  const docs = useInfiniteQuery(documentsQuery(q.trim() ? { q: q.trim() } : {}))
  const inRoom = new Set(existing)
  const candidates = (docs.data?.pages.flatMap((p) => p.data) ?? []).filter(
    (d) => !inRoom.has(d.id),
  )

  const add = useMutation({
    mutationFn: () => addRoomDocuments(roomId, [...picked]),
    onSuccess: async () => {
      setOpen(false)
      setPicked(new Set())
      setQ('')
      toast.success(t('rooms.documentsAdded'))
      await queryClient.invalidateQueries({ queryKey: ['data-room', roomId] })
    },
    onError: (err) => fail(err, t),
  })

  function toggle(id: string) {
    const next = new Set(picked)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setPicked(next)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="h-4 w-4" />
          {t('rooms.addDocuments')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('rooms.addDocuments')}</DialogTitle>
        </DialogHeader>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('search.placeholder')}
        />
        <div className="max-h-72 overflow-y-auto rounded-md border">
          {docs.isPending ? (
            <div className="space-y-2 p-3">
              <Skeleton className="h-5" />
              <Skeleton className="h-5" />
            </div>
          ) : candidates.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              {t('rooms.noCandidates')}
            </p>
          ) : (
            <ul className="divide-y">
              {candidates.map((d) => (
                <li key={d.id}>
                  <label className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-muted">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-primary"
                      checked={picked.has(d.id)}
                      onChange={() => toggle(d.id)}
                    />
                    <span className="min-w-0 flex-1 truncate">{d.title}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
        <DialogFooter>
          <Button disabled={picked.size === 0 || add.isPending} onClick={() => add.mutate()}>
            {add.isPending ? t('app.loading') : t('rooms.addSelected', { count: picked.size })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function InviteVisitorCard({ roomId }: { roomId: string }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')

  const invite = useMutation({
    mutationFn: () => inviteRoomVisitor(roomId, { email: email.trim(), name: name.trim() || undefined }),
    onSuccess: async () => {
      setEmail('')
      setName('')
      toast.success(t('rooms.invited'))
      await queryClient.invalidateQueries({ queryKey: ['data-room', roomId] })
      await queryClient.invalidateQueries({ queryKey: ['room-analytics', roomId] })
    },
    onError: (err) => fail(err, t),
  })

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          {t('rooms.invite')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            if (email.trim()) invite.mutate()
          }}
        >
          <div className="space-y-1.5">
            <Label className="text-xs">{t('rooms.visitorEmail')}</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="avocat@cabinet.cm"
              className="w-56"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t('rooms.visitorName')}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('rooms.optional')}
              className="w-44"
            />
          </div>
          <Button type="submit" disabled={invite.isPending || !email.trim()}>
            <Mail className="h-4 w-4" />
            {invite.isPending ? t('app.loading') : t('rooms.sendInvite')}
          </Button>
        </form>
        <p className="mt-2 text-xs text-muted-foreground">{t('rooms.inviteHint')}</p>
      </CardContent>
    </Card>
  )
}

function RoomSettingsCard({
  roomId,
  name: initialName,
  expiresAt: initialExpiry,
  disabled,
}: {
  roomId: string
  name: string
  expiresAt: string | null
  disabled: boolean
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [name, setName] = useState(initialName)
  const [expiresAt, setExpiresAt] = useState(initialExpiry ? initialExpiry.slice(0, 10) : '')

  const save = useMutation({
    mutationFn: () =>
      updateDataRoom(roomId, {
        name: name.trim(),
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      }),
    onSuccess: async () => {
      toast.success(t('rooms.saved'))
      await queryClient.invalidateQueries({ queryKey: ['data-room', roomId] })
      await queryClient.invalidateQueries({ queryKey: ['data-rooms'] })
    },
    onError: (err) => fail(err, t),
  })

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm text-muted-foreground">{t('rooms.settings')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            if (name.trim()) save.mutate()
          }}
        >
          <div className="space-y-1.5">
            <Label className="text-xs">{t('rooms.name')}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-64"
              disabled={disabled}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t('rooms.expires')}</Label>
            <Input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              disabled={disabled}
            />
          </div>
          <Button type="submit" disabled={disabled || save.isPending || !name.trim()}>
            {save.isPending ? t('app.loading') : t('rooms.save')}
          </Button>
        </form>
        {disabled && <p className="mt-2 text-xs text-muted-foreground">{t('rooms.closedHint')}</p>}
      </CardContent>
    </Card>
  )
}
