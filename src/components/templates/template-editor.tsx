import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2, Upload } from 'lucide-react'

import { createTemplate, inspectTemplateUpload } from '@/lib/api/queries'
import { ApiProblem, NetworkError } from '@/lib/api/http'
import { UploadTask } from '@/lib/api/upload'
import type { TemplateField, TemplateWarnings } from '@/lib/api/types'
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
import { Separator } from '@/components/ui/separator'
import { toast } from '@/components/ui/sonner'

const TYPES = ['text', 'date', 'number', 'choice'] as const

/**
 * Guess a field's label and type from its key.
 *
 * Rules, not a model: `start_date` is a date because it ends in `_date`, not
 * because something inferred it. Deterministic, instant, free, and wrong in
 * ways the author can see and fix in one click. The label is just the key made
 * readable — a human still writes the real question.
 */
function guessField(key: string): TemplateField {
  const k = key.toLowerCase()
  const type: TemplateField['type'] =
    /(^|_)(date|deadline|echeance|expiry)($|_)/.test(k) ? 'date'
    : /(amount|salary|salaire|price|prix|montant|total|number|nombre|count|qty|months?|mois|years?|ans)($|_)/.test(k) ? 'number'
    : /(^|_)(type|status|statut|categorie|category|mode)($|_)/.test(k) ? 'choice'
    : 'text'

  const label = key
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())

  return { key, label, type, required: true, choices: type === 'choice' ? [] : undefined }
}

/** A file name makes a decent first draft of the template name. */
function f2name(file: File | null): string {
  return file ? file.name.replace(/\.docx$/i, '').replace(/[-_]+/g, ' ').trim() : ''
}

/**
 * W30 (B61) — author a template.
 *
 * Two things happen here that the API can't do for you: the .docx is uploaded
 * through the ordinary presigned path (reserve + PUT, never completed — that
 * would mint a document out of the template itself), and the merge fields are
 * DECLARED. Declaring is what turns `{{start_date}}` into a labelled date
 * picker for whoever fills the form later.
 *
 * After saving, the server reports mismatches between what was declared and
 * what the file actually contains. Those are shown, not hidden: a field that
 * appears nowhere silently does nothing, and a placeholder nobody declared
 * will survive into the finished contract as literal braces.
 */
export function TemplateEditor({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [name, setName] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploadId, setUploadId] = useState<string | null>(null)
  const [fields, setFields] = useState<TemplateField[]>([])
  const [progress, setProgress] = useState<number | null>(null)
  const [warnings, setWarnings] = useState<TemplateWarnings | null>(null)
  const [detected, setDetected] = useState<number | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  const reset = () => {
    setName('')
    setFile(null)
    setUploadId(null)
    setFields([])
    setProgress(null)
    setWarnings(null)
    setDetected(null)
  }

  /**
   * Upload happens the moment a file is chosen, not on save — because the
   * document already NAMES its own blanks, and the author shouldn't retype
   * them. We upload, ask the server what's in there, and build the field rows
   * with sensible guesses for label and type. All that's left is correcting.
   */
  const pick = useMutation({
    mutationFn: async (f: File) => {
      const id = await new UploadTask(f).reserveOnly((p) => setProgress(p))
      setProgress(null)
      const { placeholders } = await inspectTemplateUpload(id)
      return { id, placeholders }
    },
    onSuccess: ({ id, placeholders }) => {
      setUploadId(id)
      setDetected(placeholders.length)
      // Never clobber work already done: keep any row the author has edited,
      // append only blanks that aren't represented yet.
      setFields((cur) => {
        const known = new Set(cur.map((f) => f.key))
        return [...cur, ...placeholders.filter((p) => !known.has(p)).map(guessField)]
      })
      if (!name.trim() && f2name(file)) setName(f2name(file))
    },
    onError: (e) => {
      setProgress(null)
      setFile(null)
      if (e instanceof NetworkError) toast.error(t('errors.network'))
      else if (e instanceof ApiProblem) toast.error(e.detail ?? e.title)
      else toast.error(t('errors.unknown'))
    },
  })

  const save = useMutation({
    mutationFn: async () => {
      // The file is already stored (uploaded when it was chosen), so saving is
      // just the declaration.
      return createTemplate({ name: name.trim(), upload_id: uploadId!, fields })
    },
    onSuccess: async (detail) => {
      await queryClient.invalidateQueries({ queryKey: ['templates'] })
      const w = detail.warnings
      if (w.declared_but_missing.length || w.in_file_but_undeclared.length) {
        // Saved, but worth a second look — keep the dialog open showing why.
        setWarnings(w)
        toast.success(t('templates.savedWithWarnings'))
      } else {
        toast.success(t('templates.saved'))
        onOpenChange(false)
        reset()
      }
    },
    onError: (e) => {
      setProgress(null)
      if (e instanceof NetworkError) toast.error(t('errors.network'))
      else if (e instanceof ApiProblem) toast.error(e.detail ?? e.title)
      else toast.error(t('errors.unknown'))
    },
  })

  const setField = (i: number, patch: Partial<TemplateField>) =>
    setFields((f) => f.map((x, j) => (j === i ? { ...x, ...patch } : x)))

  const valid =
    name.trim().length > 0 &&
    uploadId !== null &&
    !pick.isPending &&
    fields.every((f) => /^[A-Za-z0-9_]+$/.test(f.key) && f.label.trim().length > 0)

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) reset()
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('templates.new')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* The example placeholder is passed as a VALUE, not written into
              the translation: i18next interpolates {{…}}, so a literal one in
              the string would render as nothing. */}
          <Callout variant="info">
            {t('templates.howItWorks', { example: '{{employee_name}}' })}
          </Callout>

          {warnings && (
            <Callout variant="warning">
              {warnings.declared_but_missing.length > 0 && (
                <div>
                  {t('templates.warnMissing', {
                    keys: warnings.declared_but_missing.join(', '),
                  })}
                </div>
              )}
              {warnings.in_file_but_undeclared.length > 0 && (
                <div className="mt-1">
                  {t('templates.warnUndeclared', {
                    keys: warnings.in_file_but_undeclared.join(', '),
                  })}
                </div>
              )}
            </Callout>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="tpl-name">{t('templates.name')}</Label>
            <Input
              id="tpl-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('templates.namePlaceholder')}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tpl-file">{t('templates.file')}</Label>
            <div className="flex items-center gap-2">
              <Input
                id="tpl-file"
                type="file"
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                disabled={pick.isPending}
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null
                  setFile(f)
                  setDetected(null)
                  if (f) pick.mutate(f)
                }}
              />
              {file && <Upload className="h-4 w-4 shrink-0 text-muted-foreground" />}
            </div>
            {progress !== null && (
              <p className="text-xs text-muted-foreground">
                {t('templates.uploading', { percent: Math.round(progress * 100) })}
              </p>
            )}
            {pick.isPending && progress === null && (
              <p className="text-xs text-muted-foreground">{t('templates.reading')}</p>
            )}
            {detected !== null && (
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                {detected === 0
                  ? t('templates.detectedNone', { example: '{{client_name}}' })
                  : t('templates.detected', { count: detected })}
              </p>
            )}
          </div>

          <Separator />

          <div>
            <Label>{t('templates.fields')}</Label>
            <p className="mt-1 text-xs text-muted-foreground">{t('templates.fieldsHint')}</p>
          </div>

          {fields.map((f, i) => (
            <div key={i} className="space-y-2 rounded-md border p-3">
              <div className="flex flex-wrap gap-2">
                <div className="min-w-[9rem] flex-1 space-y-1">
                  <Label className="text-xs">{t('templates.fieldKey')}</Label>
                  <Input
                    value={f.key}
                    onChange={(e) => setField(i, { key: e.target.value })}
                    placeholder="employee_name"
                    className="font-mono text-xs"
                  />
                </div>
                <div className="min-w-[9rem] flex-1 space-y-1">
                  <Label className="text-xs">{t('templates.fieldLabel')}</Label>
                  <Input
                    value={f.label}
                    onChange={(e) => setField(i, { label: e.target.value })}
                    placeholder={t('templates.fieldLabelPlaceholder')}
                  />
                </div>
                <div className="w-28 space-y-1">
                  <Label className="text-xs">{t('templates.fieldType')}</Label>
                  <Select
                    value={f.type}
                    onValueChange={(v) => setField(i, { type: v as TemplateField['type'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPES.map((ty) => (
                        <SelectItem key={ty} value={ty}>
                          {t(`templates.type.${ty}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-5 text-red-600 hover:text-red-600"
                  onClick={() => setFields((cur) => cur.filter((_, j) => j !== i))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {f.type === 'choice' && (
                <div className="space-y-1">
                  <Label className="text-xs">{t('templates.choices')}</Label>
                  <Input
                    value={(f.choices ?? []).join(', ')}
                    onChange={(e) =>
                      setField(i, {
                        choices: e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder={t('templates.choicesPlaceholder')}
                  />
                </div>
              )}

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={f.required}
                  onChange={(e) => setField(i, { required: e.target.checked })}
                />
                {t('templates.required')}
              </label>

              {f.key && (
                <p className="font-mono text-[11px] text-muted-foreground">
                  {t('templates.putInDoc', { placeholder: `{{${f.key}}}` })}
                </p>
              )}
            </div>
          ))}

          {/* The add button lives AFTER the list, which is where you are when
              you finish filling one in. It was above: with eight blanks you
              had to scroll back up to add a ninth. */}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setFields((f) => [...f, { key: '', label: '', type: 'text', required: false }])
              // Keep the new row in view — adding something you can't see is
              // indistinguishable from nothing happening.
              requestAnimationFrame(() => endRef.current?.scrollIntoView({ block: 'nearest' }))
            }}
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            {t('templates.addField')}
          </Button>
          <div ref={endRef} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button disabled={!valid || save.isPending} onClick={() => save.mutate()}>
            {save.isPending ? t('app.loading') : t('common.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
