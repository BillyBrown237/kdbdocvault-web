import { Link, useNavigate, useRouter } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  BarChart3,
  CalendarClock,
  Check,
  ChevronsUpDown,
  ClipboardCheck,
  CreditCard,
  DoorOpen,
  Download,
  FileArchive,
  FileText,
  FolderClosed,
  Gavel,
  Home,
  Languages,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Plug,
  ScrollText,
  Search,
  Settings,
  Trash2,
  Users,
  X,
} from 'lucide-react'

import { NotificationBell } from '@/components/notification-bell'
import { queryClient } from '@/lib/query'
import { meQuery, switchTenant, tenantQuery } from '@/lib/api/queries'
import { logout } from '@/lib/auth'
import { promptInstall, useInstallable, useOnline } from '@/lib/pwa'
import { useSidebar } from '@/lib/use-sidebar'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Banner } from '@/components/ui/banner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

/**
 * The application shell.
 *
 * ── What changed and why ─────────────────────────────────────────────────
 * The sidebar was a flat list of ten links, and everything else — team,
 * audit, legal holds, billing, trash, settings — lived inside the avatar
 * dropdown. That menu had become the real navigation, which is the worst
 * place for it: hidden behind a click, unscannable, and impossible to see
 * your position in.
 *
 * Now the sidebar is grouped and collapsible, admin surfaces are visible
 * where they belong, and the avatar menu holds only account-level things —
 * who you are, which organization, language, sign out.
 *
 * Collapsing is a rail, not a disappearance: icons stay, labels become
 * tooltips, and the toggle state persists per device (⌘B).
 */

type NavItem = {
  to: string
  key: string
  icon: typeof Home
  /** Exact matching — only '/' needs it, or every route lights up Home. */
  exact?: boolean
  admin?: boolean
  /** In the five-slot mobile bottom bar. */
  primary?: boolean
}

const NAV: { labelKey: string; items: NavItem[] }[] = [
  {
    labelKey: 'nav.group.workspace',
    items: [
      { to: '/', key: 'nav.dashboard', icon: Home, exact: true, primary: true },
      { to: '/vault', key: 'nav.vault', icon: FolderClosed, primary: true },
      { to: '/search', key: 'nav.search', icon: Search, primary: true },
      { to: '/lifecycle', key: 'nav.lifecycle', icon: CalendarClock, primary: true },
      { to: '/approvals', key: 'nav.approvals', icon: ClipboardCheck, primary: true },
    ],
  },
  {
    labelKey: 'nav.group.work',
    items: [
      { to: '/rooms', key: 'nav.rooms', icon: DoorOpen },
      { to: '/templates', key: 'nav.templates', icon: FileText },
      { to: '/imports', key: 'nav.imports', icon: FileArchive, admin: true },
      { to: '/reports', key: 'nav.reports', icon: BarChart3, admin: true },
      { to: '/integrations', key: 'nav.integrations', icon: Plug, admin: true },
    ],
  },
  {
    // Surfaces the role can reach, shown rather than hidden in a menu. The
    // BACKEND is the enforcement; this gating is courtesy, so nobody
    // discovers a permission by hitting a 403.
    labelKey: 'nav.group.admin',
    items: [
      { to: '/team', key: 'nav.team', icon: Users },
      { to: '/audit', key: 'nav.audit', icon: ScrollText, admin: true },
      { to: '/legal-holds', key: 'nav.holds', icon: Gavel, admin: true },
      { to: '/billing', key: 'nav.billing', icon: CreditCard, admin: true },
    ],
  },
]

const FOOTER_NAV: NavItem[] = [
  { to: '/trash', key: 'nav.trash', icon: Trash2 },
  { to: '/settings', key: 'nav.settings', icon: Settings },
]

const PRIMARY = NAV.flatMap((g) => g.items).filter((i) => i.primary)

export function AppShell({ children }: { children: React.ReactNode }) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const router = useRouter()
  const me = useQuery(meQuery)
  const tenant = useQuery(tenantQuery)
  const [readOnly, setReadOnly] = useState(false)
  const [drawer, setDrawer] = useState(false)
  const online = useOnline()
  const installable = useInstallable()
  const { collapsed, toggle } = useSidebar()

  const role = me.data?.memberships.find((m) => m.tenant_id === tenant.data?.id)?.role
  const isAdmin = role === 'Owner' || role === 'Admin'
  const isMember = isAdmin || role === 'Member'

  useEffect(() => {
    const handler = () => setReadOnly(true)
    window.addEventListener('kdb:read-only', handler)
    return () => window.removeEventListener('kdb:read-only', handler)
  }, [])

  // A drawer left open behind a rotation, or behind a navigation, is a trap.
  useEffect(() => {
    if (!drawer) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawer(false)
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [drawer])

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
  const visible = (item: NavItem) => (item.admin ? isAdmin : item.to === '/team' ? isMember : true)

  return (
    <TooltipProvider delayDuration={200}>
      <div className="app-surface text-foreground flex min-h-screen">
        {/* ---- Desktop sidebar ------------------------------------------ */}
        <aside
          className={cn(
            'app-rail sticky top-0 hidden h-screen shrink-0 flex-col border-r md:flex',
            'transition-[width] duration-200 ease-out motion-reduce:transition-none',
            collapsed ? 'w-[4.5rem]' : 'w-64',
          )}
        >
          <WorkspaceSwitcher
            collapsed={collapsed}
            tenantName={tenant.data?.name}
            memberships={me.data?.memberships ?? []}
            currentTenantId={tenant.data?.id}
            onSwitch={onSwitchTenant}
          />

          <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
            {NAV.map((group) => {
              const items = group.items.filter(visible)
              if (items.length === 0) return null
              return (
                <div key={group.labelKey}>
                  {collapsed ? (
                    <div className="bg-border/60 mx-2 mb-2 h-px" aria-hidden />
                  ) : (
                    <p className="text-muted-foreground/70 mb-1.5 px-3 text-[0.6875rem] font-medium tracking-[0.08em] uppercase">
                      {t(group.labelKey)}
                    </p>
                  )}
                  <div className="space-y-0.5">
                    {items.map((item) => (
                      <NavLink key={item.to} item={item} collapsed={collapsed} />
                    ))}
                  </div>
                </div>
              )
            })}
          </nav>

          <div className="space-y-0.5 border-t px-3 py-3">
            {FOOTER_NAV.map((item) => (
              <NavLink key={item.to} item={item} collapsed={collapsed} />
            ))}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={toggle}
                  aria-label={t(collapsed ? 'nav.expand' : 'nav.collapse')}
                  className={cn(
                    'text-muted-foreground hover:bg-accent hover:text-foreground flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                    collapsed && 'justify-center px-0',
                  )}
                >
                  {collapsed ? (
                    <PanelLeftOpen className="h-4 w-4 shrink-0" />
                  ) : (
                    <>
                      <PanelLeftClose className="h-4 w-4 shrink-0" />
                      <span className="truncate">{t('nav.collapse')}</span>
                      <kbd className="text-muted-foreground/70 ml-auto text-[0.625rem]">⌘B</kbd>
                    </>
                  )}
                </button>
              </TooltipTrigger>
              {collapsed && <TooltipContent side="right">{t('nav.expand')}</TooltipContent>}
            </Tooltip>
          </div>
        </aside>

        {/* ---- Mobile drawer -------------------------------------------- */}
        {drawer && (
          <div className="fixed inset-0 z-50 md:hidden">
            <button
              type="button"
              aria-label={t('nav.closeMenu')}
              onClick={() => setDrawer(false)}
              className="absolute inset-0 bg-black/50"
            />
            <div className="bg-card absolute inset-y-0 left-0 flex w-[17rem] flex-col border-r shadow-xl">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <Brand />
                <button
                  type="button"
                  onClick={() => setDrawer(false)}
                  aria-label={t('nav.closeMenu')}
                  className="hover:bg-accent rounded-lg p-1.5"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
                {NAV.map((group) => {
                  const items = group.items.filter(visible)
                  if (items.length === 0) return null
                  return (
                    <div key={group.labelKey}>
                      <p className="text-muted-foreground/70 mb-1.5 px-3 text-[0.6875rem] font-medium tracking-[0.08em] uppercase">
                        {t(group.labelKey)}
                      </p>
                      <div className="space-y-0.5" onClick={() => setDrawer(false)}>
                        {items.map((item) => (
                          <NavLink key={item.to} item={item} collapsed={false} />
                        ))}
                      </div>
                    </div>
                  )
                })}
                <div className="space-y-0.5 border-t pt-4" onClick={() => setDrawer(false)}>
                  {FOOTER_NAV.map((item) => (
                    <NavLink key={item.to} item={item} collapsed={false} />
                  ))}
                </div>
              </nav>
            </div>
          </div>
        )}

        {/* ---- Main column ---------------------------------------------- */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="bg-app-surface/85 sticky top-0 z-30 flex items-center gap-3 border-b px-4 py-2.5 backdrop-blur-xl md:px-6">
            <button
              type="button"
              onClick={() => setDrawer(true)}
              aria-label={t('nav.openMenu')}
              className="hover:bg-accent -ml-1 rounded-lg p-2 md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="md:hidden">
              <Brand />
            </div>

            {/* Looks like a field, behaves like a link: search has its own
                page, and a fake input that swallows a keystroke before
                navigating is worse than an honest button. */}
            <Link
              to="/search"
              className="text-muted-foreground hover:border-ring/60 hover:text-foreground ml-auto hidden h-9 w-full max-w-xs items-center gap-2 rounded-lg border bg-transparent px-3 text-sm transition-colors md:flex"
            >
              <Search className="h-4 w-4 shrink-0" />
              <span className="truncate">{t('nav.search')}</span>
            </Link>

            <div className="ml-auto flex items-center gap-1 md:ml-0">
              <NotificationBell />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="focus-visible:ring-ring rounded-full outline-none focus-visible:ring-2">
                    <Avatar>
                      <AvatarFallback>{initial}</AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel className="flex flex-col">
                    <span>{me.data?.name}</span>
                    <span className="text-muted-foreground truncate text-xs font-normal">
                      {me.data?.email}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/settings">
                      <Settings className="h-4 w-4" />
                      {t('nav.settings')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={toggleLanguage}>
                    <Languages className="h-4 w-4" />
                    {i18n.language.startsWith('fr') ? 'English' : 'Français'}
                  </DropdownMenuItem>
                  {installable && (
                    <DropdownMenuItem onClick={() => void promptInstall()}>
                      <Download className="h-4 w-4" />
                      {t('app.install')}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => void onLogout()}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                    {t('auth.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {!online && <Banner variant="offline">{t('app.offline')}</Banner>}

          {readOnly && (
            <Banner
              variant="readonly"
              action={
                <Link to="/billing" className="font-medium underline">
                  {t('nav.billing')}
                </Link>
              }
            >
              {t('billing.readOnly')}
            </Banner>
          )}

          {/* The page itself is unpainted: it inherits the app surface, and the
              CARDS inside it are the white. That is the whole reason
              --app-surface exists — white panels on a white page have nothing
              to be raised above, and every screen reads as one flat sheet.
              pb-24 clears the mobile bottom bar; md:pb-8 is normal padding. */}
          <main className="flex-1 px-4 pt-5 pb-24 md:px-6 md:pt-6 md:pb-8">
            <div className="mx-auto w-full max-w-[88rem]">{children}</div>
          </main>

          {/* pb-[env(safe-area-inset-bottom)]: on an iPhone the home indicator
              would otherwise sit on top of the last row of labels. */}
          <nav className="bg-app-surface/95 fixed inset-x-0 bottom-0 z-30 flex border-t pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
            {PRIMARY.map(({ to, key, icon: Icon, exact }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact }}
                className="text-muted-foreground hover:text-foreground flex flex-1 flex-col items-center gap-1 py-2 text-[0.6875rem] transition-colors"
                activeProps={{ className: 'text-primary font-medium' }}
              >
                <Icon className="h-5 w-5" />
                {t(key)}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </TooltipProvider>
  )
}

/**
 * One navigation row.
 *
 * Collapsed, the label becomes a tooltip rather than disappearing — a rail of
 * unlabelled glyphs is a memory test. `activeProps` keeps TanStack Router as
 * the source of truth for "where am I", so the active state can never drift
 * from the actual route.
 */
function NavLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const { t } = useTranslation()
  const { to, key, icon: Icon, exact } = item

  const link = (
    <Link
      to={to}
      activeOptions={{ exact }}
      className={cn(
        'group text-muted-foreground hover:bg-accent hover:text-foreground relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
        collapsed && 'justify-center px-0',
      )}
      activeProps={{
        // A left marker plus a tint, not a tint alone: at a glance the eye
        // finds the bar before it reads the shade.
        className:
          'bg-primary/10 text-foreground font-medium before:absolute before:left-0 before:top-1/2 before:h-5 before:w-[3px] before:-translate-y-1/2 before:rounded-r-full before:bg-primary',
      }}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span className="truncate">{t(key)}</span>}
    </Link>
  )

  if (!collapsed) return link
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{t(key)}</TooltipContent>
    </Tooltip>
  )
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <img
      src="/brand/logo-lockup.png"
      width={258}
      height={112}
      alt="KDB Doc Vault"
      /* object-contain + an explicit height: a bare <img> in a flex container
         gets stretched by align-items, which is what warped this lockup once
         already. */
      className={cn('w-auto shrink-0 self-center object-contain', compact ? 'h-6' : 'h-7')}
    />
  )
}

/**
 * Organization identity and switching, at the top of the rail.
 *
 * This was buried in the avatar menu, which put "which company's documents am
 * I looking at?" — the single most consequential piece of context in a
 * multi-tenant vault — behind a click and below the fold of a dropdown.
 */
function WorkspaceSwitcher({
  collapsed,
  tenantName,
  memberships,
  currentTenantId,
  onSwitch,
}: {
  collapsed: boolean
  tenantName?: string
  memberships: { tenant_id: string; tenant_name: string; role: string }[]
  currentTenantId?: string
  onSwitch: (id: string) => void | Promise<void>
}) {
  const { t } = useTranslation()
  const many = memberships.length > 1
  const badge = (tenantName ?? 'K').charAt(0).toUpperCase()

  const face = (
    <div
      className={cn(
        'flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-left',
        many && 'hover:bg-accent cursor-pointer transition-colors',
        collapsed && 'justify-center px-0',
      )}
    >
      <span className="bg-primary text-primary-foreground grid h-8 w-8 shrink-0 place-items-center rounded-lg text-sm font-semibold">
        {badge}
      </span>
      {!collapsed && (
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{tenantName ?? t('app.name')}</span>
          <span className="text-muted-foreground block truncate text-xs">
            {memberships.find((m) => m.tenant_id === currentTenantId)?.role ?? ''}
          </span>
        </span>
      )}
      {!collapsed && many && (
        <ChevronsUpDown className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
      )}
    </div>
  )

  return (
    <div className="border-b px-3 py-3">
      {many ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="w-full" aria-label={t('nav.organizations')}>
              {face}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              {t('nav.organizations')}
            </DropdownMenuLabel>
            {memberships.map((m) => (
              <DropdownMenuItem key={m.tenant_id} onClick={() => void onSwitch(m.tenant_id)}>
                <span className={cn('truncate', currentTenantId === m.tenant_id && 'font-medium')}>
                  {m.tenant_name}
                </span>
                {currentTenantId === m.tenant_id && <Check className="ml-auto h-4 w-4" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        face
      )}
    </div>
  )
}
