import { Link, createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { login, setPendingChallenge } from '@/lib/auth'
import { ApiProblem, NetworkError } from '@/lib/api/http'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/sonner'

const searchSchema = z.object({ redirect: z.string().optional() })
const formSchema = z.object({ identifier: z.string().min(1), password: z.string().min(1) })
type FormValues = z.infer<typeof formSchema>

export const Route = createFileRoute('/login')({
  validateSearch: searchSchema,
  component: LoginPage,
})

function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const router = useRouter()
  const search = Route.useSearch()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { identifier: '', password: '' },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const result = await login(values.identifier, values.password)
      if (result.status === 'mfa_required') {
        setPendingChallenge(result.challengeToken ?? null)
        await navigate({ to: '/mfa', search: { redirect: search.redirect } })
        return
      }
      if (!result.tenantId) {
        await navigate({ to: '/onboarding' })
      } else if (search.redirect) {
        router.history.push(search.redirect)
      } else {
        await navigate({ to: '/' })
      }
    } catch (err) {
      if (err instanceof NetworkError) toast.error(t('errors.network'))
      else if (err instanceof ApiProblem) toast.error(t('auth.login.error'))
      else toast.error(t('errors.unknown'))
    }
  })

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">{t('app.name')}</CardTitle>
          <CardDescription>{t('auth.login.title')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
            <div className="space-y-1.5">
              <Label htmlFor="identifier">{t('auth.login.identifier')}</Label>
              <Input id="identifier" autoComplete="username" {...form.register('identifier')} />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t('auth.login.password')}</Label>
                <Link to="/forgot-password" className="text-xs text-muted-foreground underline">
                  {t('auth.login.forgot')}
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                {...form.register('password')}
              />
            </div>
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? t('app.loading') : t('auth.login.submit')}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              {t('auth.login.noAccount')}{' '}
              <Link to="/register" className="font-medium text-foreground underline">
                {t('auth.register.submit')}
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
