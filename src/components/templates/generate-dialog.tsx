import { useNavigate } from '@tanstack/react-router'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { generateFromTemplate, rootFoldersQuery } from '@/lib/api/queries'
import { ApiProblem, NetworkError } from '@/lib/api/http'
import type { Template } from '@/lib/api/types'
import { Button } from '@/components/ui/button'
import { Callout } from '@/components/ui/callout'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/sonner'

const NO_FOLDER = '__none__'

/**
 * W30 (B61) — fill a template's blanks and file the result.
 *
 * The form is built from the template's own field declarations, so a `date`
 * field gets a date picker and a `choice` field gets its options. That's the
 * entire point of declaring types: the person filling in a contract should
 * never be typing a date into a free-text box and hoping the format matches.
 */
export function GenerateDialog({
  template,
  formats,
  open,
  onOpenChange,
}: {
  template: Template
  /** From the list response — ['docx'] when no converter is deployed. */
  formats: string[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  // rootFoldersQuery is infiniteQueryOptions — useQuery would accept it at
  // runtime and return the wrong shape. The render already reads `.pages`.
  const folders = useInfiniteQuery(rootFoldersQuery)

  const [values, setValues] = useState<Record<string, string>>({})
  const [title, setTitle] = useState('')
  const [folder, setFolder] = useState<string>(NO_FOLDER)
  // Default to PDF when it's available: most generated documents are finals
  // to send, and PDF is the one that can be signed. Word stays one click away
  // for the drafts people still edit.
  const canPdf = formats.includes('pdf')
  const [format, setFormat] = useState<'docx' | 'pdf'>(canPdf ? 'pdf' : 'docx')

  const generate = useMutation({
    mutationFn: () =>
      generateFromTemplate(template.id, {
        folder_id: folder === NO_FOLDER ? null : folder,
        title: title.trim() || undefined,
        values,
        format,
      }),
    onSuccess: async (g) => {
      toast.success(t('templates.generated'))
      await queryClient.invalidateQueries({ queryKey: ['documents'] })
      onOpenChange(false)
      setValues({})
      setTitle('')
      // Straight to the document: the point of generating was to have it.
      await navigate({ to: '/documents/$documentId', params: { documentId: g.document_id } })
    },
    onError: (e) => {
      if (e instanceof NetworkError) toast.error(t('errors.network'))
      else if (e instanceof ApiProblem) toast.error(e.detail ?? e.title)
      else toast.error(t('errors.unknown'))
    },
  })

  const missing = template.fields.filter(
    (f) => f.required && !values[f.key]?.trim(),
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{template.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {template.fields.length === 0 && (
            <Callout variant="info">{t('templates.noFields')}</Callout>
          )}

          {template.fields.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <Label htmlFor={`f-${f.key}`}>
                {f.label}
                {f.required && <span className="ml-1 text-red-600">*</span>}
              </Label>
              {f.type === 'choice' ? (
                <Select
                  value={values[f.key] ?? ''}
                  onValueChange={(v) => setValues((s) => ({ ...s, [f.key]: v }))}
                >
                  <SelectTrigger id={`f-${f.key}`}>
                    <SelectValue placeholder={t('templates.choose')} />
                  </SelectTrigger>
                  <SelectContent>
                    {(f.choices ?? []).map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={`f-${f.key}`}
                  type={f.type === 'date' ? 'date' : f.type === 'number' ? 'number' : 'text'}
                  value={values[f.key] ?? ''}
                  onChange={(e) => setValues((s) => ({ ...s, [f.key]: e.target.value }))}
                />
              )}
            </div>
          ))}

          <div className="space-y-1.5 border-t pt-4">
            <Label htmlFor="gen-title">{t('templates.docTitle')}</Label>
            <Input
              id="gen-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={template.name}
            />
            <p className="text-xs text-muted-foreground">{t('templates.docTitleHint')}</p>
          </div>

          {canPdf && (
            <div className="space-y-1.5">
              <Label>{t('templates.format')}</Label>
              <Select value={format} onValueChange={(v) => setFormat(v as 'docx' | 'pdf')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">{t('templates.formatPdf')}</SelectItem>
                  <SelectItem value="docx">{t('templates.formatDocx')}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {format === 'pdf' ? t('templates.formatPdfHint') : t('templates.formatDocxHint')}
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>{t('templates.folder')}</Label>
            <Select value={folder} onValueChange={setFolder}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_FOLDER}>{t('templates.noFolder')}</SelectItem>
                {(folders.data?.pages ?? []).flatMap((p) =>
                  p.data.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  )),
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button disabled={generate.isPending || missing.length > 0} onClick={() => generate.mutate()}>
            {generate.isPending ? t('app.loading') : t('templates.generate')}
          </Button>
        </DialogFooter>
        {missing.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {t('templates.stillNeeded', { fields: missing.map((f) => f.label).join(', ') })}
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}
