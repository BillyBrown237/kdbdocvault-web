import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DoorOpen, Plus, Users } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { ApiProblem, NetworkError } from '@/lib/api/http'
import { createDataRoom, dataRoomsQuery } from '@/lib/api/queries'
import { formatDate } from '@/lib/format'
import { requireTenant } from '@/lib/route-guards'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import { toast } from '@/components/ui/sonner'

export const Route = createFileRoute('/rooms/')({
  beforeLoad: ({ location }) => requireTenant(location),
  loader: ({ context }) => context.queryClient.ensureQueryData(dataRoomsQuery),
  component: RoomsPage,
})

function RoomsPage() {
  const { t, i18n } = useTranslation()
  const rooms = useQuery(dataRoomsQuery)

  return (
    <AppShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('rooms.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('rooms.subtitle')}</p>
        </div>
        <CreateRoomDialog />
      </div>

      {rooms.isPending ? (
        <div className="mt-6 space-y-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : rooms.data && rooms.data.data.length > 0 ? (
        <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {rooms.data.data.map((room) => {
            const expired = room.expires_at !== null && new Date(room.expires_at) < new Date()
            return (
              <Link key={room.id} to="/rooms/$roomId" params={{ roomId: room.id }}>
                <Card className="h-full transition-colors hover:border-primary/40">
                  <CardContent className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <span className="min-w-0 flex-1 font-medium break-words">{room.name}</span>
                      <Badge
                        variant={room.status === 'open' && !expired ? 'default' : 'secondary'}
                        className="shrink-0"
                      >
                        {t(
                          expired && room.status === 'open'
                            ? 'rooms.status.expired'
                            : `rooms.status.${room.status}`,
                        )}
                      </Badge>
                    </div>
                    {room.description && (
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {room.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {room.expires_at
                        ? t('rooms.expiresOn', {
                            date: formatDate(room.expires_at, i18n.language),
                          })
                        : t('rooms.noExpiry')}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      ) : (
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <DoorOpen className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">{t('rooms.emptyTitle')}</p>
            <p className="max-w-sm text-sm text-muted-foreground">{t('rooms.emptyBody')}</p>
          </CardContent>
        </Card>
      )}
    </AppShell>
  )
}

function CreateRoomDialog() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [expiresAt, setExpiresAt] = useState('')

  const create = useMutation({
    mutationFn: () =>
      createDataRoom({
        name: name.trim(),
        description: description.trim() || undefined,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      }),
    onSuccess: async () => {
      setOpen(false)
      setName('')
      setDescription('')
      setExpiresAt('')
      toast.success(t('rooms.created'))
      await queryClient.invalidateQueries({ queryKey: ['data-rooms'] })
    },
    onError: (err) => {
      if (err instanceof NetworkError) toast.error(t('errors.network'))
      else if (err instanceof ApiProblem) toast.error(err.detail ?? err.title)
      else toast.error(t('errors.unknown'))
    },
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          {t('rooms.create')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t('rooms.create')}
          </DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (name.trim()) create.mutate()
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="room-name">{t('rooms.name')}</Label>
            <Input
              id="room-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('rooms.namePlaceholder')}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="room-desc">{t('rooms.description')}</Label>
            <Input
              id="room-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('rooms.descriptionPlaceholder')}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="room-expiry">{t('rooms.expires')}</Label>
            <Input
              id="room-expiry"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">{t('rooms.expiryHint')}</p>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={create.isPending || !name.trim()}>
              {create.isPending ? t('app.loading') : t('rooms.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
