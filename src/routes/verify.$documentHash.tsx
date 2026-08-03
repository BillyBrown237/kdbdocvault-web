import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

// Public integrity check — GET /verify/{documentHash} (QR code target on seals).
export const Route = createFileRoute('/verify/$documentHash')({
  component: VerifyPage,
})

function VerifyPage() {
  const { t } = useTranslation()
  const { documentHash } = Route.useParams()

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold">{t('verify.title')}</h1>
      <p className="mt-2 break-all text-sm text-slate-500">hash: {documentHash}</p>
    </div>
  )
}
