import { useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RotateCcw, Upload } from 'lucide-react'

import { ApiProblem, NetworkError } from '@/lib/api/http'
import { UploadTask } from '@/lib/api/upload'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface UploadItem {
  id: string
  task: UploadTask
  progress: number
  status: 'uploading' | 'done' | 'error'
  error?: string
}

export function UploadButton({ folderId }: { folderId?: string }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [items, setItems] = useState<UploadItem[]>([])

  function patch(id: string, updates: Partial<UploadItem>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...updates } : it)))
  }

  async function runItem(id: string, task: UploadTask) {
    patch(id, { status: 'uploading', error: undefined })
    try {
      await task.run((fraction) => patch(id, { progress: fraction }))
      patch(id, { status: 'done', progress: 1 })
      await queryClient.invalidateQueries({ queryKey: ['folders'] })
      await queryClient.invalidateQueries({ queryKey: ['documents'] })
      await queryClient.invalidateQueries({ queryKey: ['recent'] })
      setTimeout(() => setItems((prev) => prev.filter((it) => it.id !== id)), 4000)
    } catch (err) {
      const message =
        err instanceof NetworkError
          ? t('errors.network')
          : err instanceof ApiProblem
            ? (err.detail ?? err.title)
            : t('errors.unknown')
      patch(id, { status: 'error', error: message })
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files?.length) return
    for (const file of Array.from(files)) {
      const id = crypto.randomUUID()
      const task = new UploadTask(file, folderId)
      setItems((prev) => [...prev, { id, task, progress: 0, status: 'uploading' }])
      void runItem(id, task)
    }
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <Button onClick={() => inputRef.current?.click()}>
        <Upload className="h-4 w-4" />
        {t('upload.button')}
      </Button>

      {items.length > 0 && (
        <div className="fixed right-4 bottom-16 z-30 w-72 space-y-2 md:bottom-4">
          {items.map((it) => (
            <Card key={it.id} className="p-3 shadow-md">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-xs font-medium">{it.task.file.name}</span>
                {it.status === 'error' && (
                  <button
                    type="button"
                    className="text-xs text-muted-foreground"
                    onClick={() => setItems((prev) => prev.filter((x) => x.id !== it.id))}
                    aria-label="dismiss"
                  >
                    ✕
                  </button>
                )}
              </div>
              {it.status === 'error' ? (
                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className="min-w-0 flex-1 truncate text-xs text-red-600">{it.error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void runItem(it.id, it.task)}
                    className="h-7 shrink-0"
                  >
                    <RotateCcw className="h-3 w-3" />
                    {t('upload.retry')}
                  </Button>
                </div>
              ) : (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all ${it.status === 'done' ? 'bg-emerald-500' : 'bg-slate-900'}`}
                    style={{ width: `${Math.round(it.progress * 100)}%` }}
                  />
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
