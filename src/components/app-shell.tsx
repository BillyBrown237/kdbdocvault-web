import { Link, useNavigate, useRouter } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { CalendarClock, FolderClosed, Home, LogOut, Search, Settings, Trash2 } from 'lucide-react'

import { queryClient } from '@/lib/query'
import { meQuery, switchTenant, tenantQuery } from '@/lib/api/queries'
import { logout } from '@/lib/auth'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const NAV = [
  { to: '/', key: 'nav.dashboard', icon: Home },
  { to: '/vault', key: 'nav.vault', icon: FolderClosed },
  { to: '/search', key: 'nav.search', icon: Search },
  { to: '/lifecycle', key: 'nav.lifecycle', icon: CalendarClock },
] as const

export function AppShell({ children }: { children: React.ReactNode }) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const router = useRouter()
  const me = useQuery(meQuery)
  const tenant = useQuery(tenantQuery)

  async function onSwitchTenant(tenantId: string) {
    await switchTenant(queryClient, tenantId)
    await router.invalidate()
  }

  async function onLogout() {
    await logout()
    queryClient.clear()
    await navigate({ to: '/login', search: { redirect: undefined } })
  }

  function toggleLanguage() {
    void i18n.changeLanguage(i18n.language.startsWith('fr') ? 'en' : 'fr')
  }

  const initial = me.data?.name?.charAt(0).toUpperCase() ?? me.data?.email?.charAt(0).toUpperCase()

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-card/40 p-4 md:flex">
        <div className="mb-8 flex items-center gap-2 px-2 text-lg font-bold">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            K
          </div>
          {t('app.name')}
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map(({ to, key, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === '/' }}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{ className: 'bg-muted font-medium text-foreground' }}
            >
              <Icon className="h-4 w-4" />
              {t(key)}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="flex items-center justify-between border-b px-4 py-3">
          <div className="font-bold md:hidden">{t('app.name')}</div>
          <div className="hidden text-sm text-muted-foreground md:block">{tenant.data?.name ?? ''}</div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Avatar>
                  <AvatarFallback>{initial}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="flex flex-col">
                <span>{me.data?.name}</span>
                <span className="truncate text-xs font-normal text-muted-foreground">
                  {me.data?.email}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {me.data && me.data.memberships.length > 1 && (
                <>
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    {t('nav.organizations')}
                  </DropdownMenuLabel>
                  {me.data.memberships.map((m) => (
                    <DropdownMenuItem
                      key={m.tenant_id}
                      onClick={() => void onSwitchTenant(m.tenant_id)}
                    >
                      <span className={cn(tenant.data?.id === m.tenant_id && 'font-medium')}>
                        {m.tenant_name}
                      </span>
                      <span className="ml-auto text-xs text-muted-foreground">{m.role}</span>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem asChild>
                <Link to="/settings">
                  <Settings className="h-4 w-4" />
                  {t('nav.settings')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/trash">
                  <Trash2 className="h-4 w-4" />
                  {t('nav.trash')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={toggleLanguage}>
                {i18n.language.startsWith('fr') ? 'English' : 'Français'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => void onLogout()}
                className="text-red-600 focus:text-red-600"
              >
                <LogOut className="h-4 w-4" />
                {t('auth.logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 p-4 pb-20 md:p-6 md:pb-6">{children}</main>

        {/* Mobile bottom nav */}
        <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t bg-background md:hidden">
          {NAV.map(({ to, key, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === '/' }}
              className="flex flex-1 flex-col items-center gap-1 py-2 text-xs text-muted-foreground"
              activeProps={{ className: 'text-foreground font-medium' }}
            >
              <Icon className="h-5 w-5" />
              {t(key)}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}
