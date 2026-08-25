import { createFileRoute } from '@tanstack/react-router'
import { Plug } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { PageHeader } from '@/components/ui/page-header'
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
      <PageHeader
        icon={Plug}
        title={t('integrations.title')}
        description={t('integrations.subtitle')}
      />
      <div>
        <ApiKeysCard />
        <WebhooksCard />
      </div>
    </AppShell>
  )
}
