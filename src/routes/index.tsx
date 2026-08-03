import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { apiFetch } from '@/lib/api/http'
import { bootstrapSession, logout } from '@/lib/auth'

interface Me {
  id?: string
  display_name?: string
  email?: string
  locale?: string
}

export const Route = createFileRoute('/')({
  beforeLoad: async ({ location }) => {
    const authenticated = await bootstrapSession()
    if (!authenticated) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
  },
  component: Dashboard,
})

function Dashboard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const me = useQuery({
    queryKey: ['me'],
    queryFn: () => apiFetch<Me>('/me'),
  })

  return (
    <div className="mx-auto max-w-4xl p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('dashboard.title')}</h1>
        <button
          type="button"
          className="text-sm text-slate-500 hover:text-slate-900"
          onClick={() => {
            void logout().then(() => navigate({ to: '/login', search: { redirect: undefined } }))
          }}
        >
          {t('auth.logout')}
        </button>
      </header>
      <p className="mt-4 text-lg">
        {me.isPending
          ? t('app.loading')
          : t('dashboard.welcome', { name: me.data?.display_name ?? me.data?.email ?? '' })}
      </p>
    </div>
  )
}
