import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { AppShell } from '@/components/app-shell'
import { ApiKeysCard } from '@/components/integrations/api-keys'
import { WebhooksCard } from '@/components/integrations/webhooks'
import { requireTenant } from '@/lib/route-guards'

/**
 * W28 — one page for both halves of B59/B60. Keys and webhooks are the same
 * job from two directions (let a system call us / let us call a system), the
 * same audience, and the same admin conversation — splitting them across two
 * routes would just mean two places to look.
 */
export const Route = createFileRoute('/integrations')({
  beforeLoad: ({ location }) => requireTenant(location),
  component: IntegrationsPage,
})

function IntegrationsPage() {
  const { t } = useTranslation()
  return (
    <AppShell>
      <h1 className="text-2xl font-bold tracking-tight">{t('integrations.title')}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t('integrations.subtitle')}</p>
      <div className="mt-4">
        <ApiKeysCard />
        <WebhooksCard />
      </div>
    </AppShell>
  )
}
