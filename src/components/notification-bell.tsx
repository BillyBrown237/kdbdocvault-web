import { useNavigate } from '@tanstack/react-router'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Bell, CheckCheck, Mail, MessageSquare, Monitor } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import {
  markNotificationsRead,
  notificationDeliveryQuery,
  notificationsQuery,
} from '@/lib/api/queries'
import type { Notification } from '@/lib/api/types'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const CHANNEL_ICON: Record<string, LucideIcon> = {
  in_app: Monitor,
  email: Mail,
  sms: MessageSquare,
}

/** Where a notification points, when it points anywhere we can render. */
function targetOf(n: Notification): { to: '/documents/$documentId'; params: { documentId: string } } | null {
  if (n.resource_type === 'document' && n.resource_id) {
    return { to: '/documents/$documentId', params: { documentId: n.resource_id } }
  }
  return null
}

/**
 * Which channels this notification actually went out on. Fetched per row and
 * cached indefinitely: delivery is settled history by the time the bell shows
 * the notification, so refetching it on every popover open is pure waste.
 */
function DeliveryChannels({ notificationId }: { notificationId: string }) {
  const q = useQuery({
    ...notificationDeliveryQuery(notificationId),
    staleTime: Infinity,
    retry: false,
  })
  const channels = q.data?.channels ?? []
  if (channels.length === 0) return null

  return (
    <span className="flex gap-1">
      {channels.map((c) => {
        const Icon = CHANNEL_ICON[c.channel] ?? Bell
        const failed = c.status === 'failed' || c.status === 'bounced'
        return (
          <Icon
            key={c.channel}
            className={cn('h-3 w-3', failed ? 'text-red-500' : 'opacity-60')}
            aria-label={`${c.channel}: ${c.status}`}
          />
        )
      })}
    </span>
  )
}

export function NotificationBell() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Polled, not pushed: the backend has no SSE/WebSocket surface, and a
  // minute of latency on an in-app bell is not worth a socket per tab.
  const feed = useInfiniteQuery({ ...notificationsQuery(), refetchInterval: 60_000 })
  const items = feed.data?.pages.flatMap((p) => p.data) ?? []
  const unread = items.filter((n) => n.read_at === null)

  const markRead = useMutation({
    mutationFn: markNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  async function onOpen(n: Notification) {
    if (n.read_at === null) markRead.mutate({ ids: [n.id] })
    const target = targetOf(n)
    if (target) await navigate(target)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={t('notifications.title')}>
          <Bell className="h-5 w-5" />
          {unread.length > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-0.5 -right-0.5 h-4 min-w-4 justify-center px-1 text-[10px]"
            >
              {unread.length > 9 ? '9+' : unread.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <DropdownMenuLabel className="flex items-center justify-between gap-2 px-3 py-2">
          <span>{t('notifications.title')}</span>
          {unread.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs font-normal"
              disabled={markRead.isPending}
              onClick={(e) => {
                e.preventDefault()
                markRead.mutate({ all: true })
              }}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              {t('notifications.markAll')}
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="m-0" />

        <div className="max-h-96 overflow-y-auto">
          {feed.isPending ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">{t('app.loading')}</p>
          ) : items.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              {t('notifications.empty')}
            </p>
          ) : (
            <ul className="divide-y">
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    className={cn(
                      'w-full px-3 py-2.5 text-left transition-colors hover:bg-muted',
                      n.read_at === null && 'bg-primary/5',
                    )}
                    onClick={() => void onOpen(n)}
                  >
                    <span className="flex items-start gap-2">
                      {n.read_at === null && (
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium break-words">{n.title}</span>
                        {n.body && (
                          <span className="mt-0.5 block line-clamp-2 text-xs text-muted-foreground">
                            {n.body}
                          </span>
                        )}
                        <span className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                          {formatDate(n.created_at, i18n.language)}
                          <DeliveryChannels notificationId={n.id} />
                        </span>
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {feed.hasNextPage && (
          <>
            <DropdownMenuSeparator className="m-0" />
            <Button
              variant="ghost"
              size="sm"
              className="w-full rounded-none text-xs font-normal"
              disabled={feed.isFetchingNextPage}
              onClick={(e) => {
                e.preventDefault()
                void feed.fetchNextPage()
              }}
            >
              {feed.isFetchingNextPage ? t('app.loading') : t('notifications.loadMore')}
            </Button>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
