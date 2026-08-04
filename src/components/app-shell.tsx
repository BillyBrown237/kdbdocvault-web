import { Link, useNavigate, useRouter } from '@tanstack/react-router'
import { queryClient } from '@/lib/query'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FolderClosed, Home, LogOut, User as UserIcon } from 'lucide-react'

import { meQuery, switchTenant, tenantQuery } from '@/lib/api/queries'
import { logout } from '@/lib/auth'

const NAV = [
  { to: '/', key: 'nav.dashboard', icon: Home },
  { to: '/vault', key: 'nav.vault', icon: FolderClosed },
] as const

export function AppShell({ children }: { children: React.ReactNode }) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const router = useRouter()
  const me = useQuery(meQuery)
  const tenant = useQuery(tenantQuery)
  const [menuOpen, setMenuOpen] = useState(false)

  async function onSwitchTenant(tenantId: string) {
    setMenuOpen(false)
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

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-border p-4 md:flex">
        <div className="mb-8 text-lg font-bold">{t('app.name')}</div>
        <nav className="flex flex-col gap-1">
          {NAV.map(({ to, key, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === '/' }}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
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
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="font-bold md:hidden">{t('app.name')}</div>
          <div className="hidden text-sm text-muted-foreground md:block">
            {tenant.data?.name ?? ''}
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-medium"
              aria-label={t('nav.profile')}
            >
              {me.data?.name?.charAt(0).toUpperCase() ?? <UserIcon className="h-4 w-4" />}
            </button>
            {menuOpen && (
              <div className="absolute right-0 z-20 mt-2 w-64 rounded-lg border border-border bg-popover p-2 shadow-lg">
                <div className="px-3 py-2">
                  <div className="text-sm font-medium">{me.data?.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{me.data?.email}</div>
                </div>
                {me.data && me.data.memberships.length > 1 && (
                  <div className="border-t border-border py-1">
                    <div className="px-3 py-1 text-xs font-medium text-muted-foreground">
                      {t('nav.organizations')}
                    </div>
                    {me.data.memberships.map((m) => (
                      <button
                        key={m.tenant_id}
                        type="button"
                        onClick={() => void onSwitchTenant(m.tenant_id)}
                        className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                      >
                        {m.tenant_name}
                        <span className="ml-2 text-xs text-muted-foreground">{m.role}</span>
                      </button>
                    ))}
                  </div>
                )}
                <div className="border-t border-border py-1">
                  <button
                    type="button"
                    onClick={toggleLanguage}
                    className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                  >
                    {i18n.language.startsWith('fr') ? 'English' : 'Français'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void onLogout()}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-red-600 hover:bg-muted"
                  >
                    <LogOut className="h-4 w-4" />
                    {t('auth.logout')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 pb-20 md:p-6 md:pb-6">{children}</main>

        {/* Mobile bottom nav */}
        <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-border bg-background md:hidden">
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
