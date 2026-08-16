import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Eye, FileText } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { GenerateDialog } from '@/components/templates/generate-dialog'
import { TemplateEditor } from '@/components/templates/template-editor'
import {
  meQuery,
  previewTemplate,
  retireTemplate,
  templatesQuery,
  tenantQuery,
} from '@/lib/api/queries'
import type { Template } from '@/lib/api/types'
import { requireTenant } from '@/lib/route-guards'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/vault-list'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/ui/sonner'

export const Route = createFileRoute('/templates')({
  beforeLoad: ({ location }) => requireTenant(location),
  component: TemplatesPage,
})

/**
 * W30 (B61) — the templates people generate contracts from.
 *
 * Anyone can generate; only admins author. A template is a document every
 * future contract inherits from, so editing one edits the future — that's a
 * different privilege from filling in a form.
 */
function TemplatesPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const templates = useQuery(templatesQuery)
  const me = useQuery(meQuery)
  const tenant = useQuery(tenantQuery)

  const role = me.data?.memberships.find((m) => m.tenant_id === tenant.data?.id)?.role
  const isAdmin = role === 'Owner' || role === 'Admin'

  const [editing, setEditing] = useState(false)
  const [generating, setGenerating] = useState<Template | null>(null)

  const retire = useMutation({
    mutationFn: retireTemplate,
    onSuccess: async () => {
      toast.success(t('templates.retired'))
      await queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
    onError: () => toast.error(t('errors.unknown')),
  })

  async function preview(tpl: Template) {
    try {
      const blob = await previewTemplate(tpl.id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${tpl.name}-preview.docx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
    } catch {
      toast.error(t('errors.unknown'))
    }
  }

  const list = templates.data?.data ?? []

  return (
    <AppShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('templates.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('templates.subtitle')}</p>
          </div>
        </div>
        {isAdmin && <Button onClick={() => setEditing(true)}>{t('templates.new')}</Button>}
      </div>

      <div className="mt-4">
        {templates.isPending ? (
          <Skeleton className="h-40" />
        ) : list.length === 0 ? (
          <EmptyState
            label={
              isAdmin
                ? t('templates.emptyAdmin', { example: '{{employee_name}}' })
                : t('templates.empty')
            }
          />
        ) : (
          <Card>
            <CardContent className="space-y-3 p-4">
              {list.map((tpl, i) => (
                <div key={tpl.id}>
                  {i > 0 && <Separator className="mb-3" />}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{tpl.name}</span>
                        <Badge variant="outline" className="text-[10px]">
                          v{tpl.version}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {tpl.fields.length === 0
                          ? t('templates.noFieldsShort')
                          : t('templates.fieldCount', { count: tpl.fields.length })}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {tpl.fields.slice(0, 6).map((f) => (
                          <Badge key={f.key} variant="secondary" className="text-[10px]">
                            {f.label}
                          </Badge>
                        ))}
                        {tpl.fields.length > 6 && (
                          <Badge variant="secondary" className="text-[10px]">
                            +{tpl.fields.length - 6}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button size="sm" variant="ghost" onClick={() => void preview(tpl)}>
                        <Eye className="mr-1 h-3.5 w-3.5" />
                        {t('templates.preview')}
                      </Button>
                      <Button size="sm" onClick={() => setGenerating(tpl)}>
                        {t('templates.use')}
                      </Button>
                      {isAdmin && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-600"
                          disabled={retire.isPending}
                          onClick={() => retire.mutate(tpl.id)}
                        >
                          {t('templates.retire')}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <TemplateEditor open={editing} onOpenChange={setEditing} />
      {generating && (
        <GenerateDialog
          template={generating}
          formats={templates.data?.formats ?? ['docx']}
          open={generating !== null}
          onOpenChange={(o) => !o && setGenerating(null)}
        />
      )}
    </AppShell>
  )
}
