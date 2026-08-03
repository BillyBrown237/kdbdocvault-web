import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

// Public share-link surface — GET /shared/{token} (+ unlock/content).
export const Route = createFileRoute('/shared/$token')({
  component: SharedPage,
})

function SharedPage() {
  const { t } = useTranslation()
  const { token } = Route.useParams()

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold">{t('shared.title')}</h1>
      <p className="mt-2 text-sm text-slate-500">token: {token}</p>
    </div>
  )
}
