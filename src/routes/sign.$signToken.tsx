import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

// Public guest-signing surface — GET /sign/{signToken} (no auth).
// Full flow (verify → otp → complete/decline) comes in the signatures slice.
export const Route = createFileRoute('/sign/$signToken')({
  component: SignPage,
})

function SignPage() {
  const { t } = useTranslation()
  const { signToken } = Route.useParams()

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold">{t('sign.title')}</h1>
      <p className="mt-2 text-sm text-slate-500">token: {signToken}</p>
    </div>
  )
}
