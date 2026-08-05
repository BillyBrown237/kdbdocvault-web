import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * View-only PDF rendering via pdf.js canvases — no browser PDF toolbar, no
 * download affordance, no blob URL parked in a tab. This is DETERRENCE, not
 * DRM: screenshots can't be prevented; the server-side watermark (link id +
 * date stamped into every page) is the real control — a leaked page carries
 * its provenance.
 */
export function InlinePdfViewer({ data }: { data: Blob }) {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    let cancelled = false

    async function render() {
      try {
        const pdfjs = await import('pdfjs-dist')
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url,
        ).toString()

        const doc = await pdfjs.getDocument({ data: await data.arrayBuffer() }).promise
        const container = containerRef.current
        if (!container || cancelled) return
        container.innerHTML = ''

        const width = Math.min(container.clientWidth, 900)
        for (let n = 1; n <= doc.numPages; n++) {
          if (cancelled) return
          const page = await doc.getPage(n)
          const base = page.getViewport({ scale: 1 })
          const scale = (width / base.width) * (window.devicePixelRatio || 1)
          const viewport = page.getViewport({ scale })

          const canvas = document.createElement('canvas')
          canvas.width = viewport.width
          canvas.height = viewport.height
          canvas.style.width = '100%'
          canvas.className = 'mb-3 rounded-md border border-slate-200 shadow-sm'
          container.appendChild(canvas)
          await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise
        }
        if (!cancelled) setState('ready')
      } catch {
        if (!cancelled) setState('error')
      }
    }

    void render()
    return () => {
      cancelled = true
    }
  }, [data])

  return (
    <div
      className="max-h-[75vh] w-full overflow-y-auto select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      {state === 'loading' && (
        <p className="py-8 text-center text-sm text-slate-500">{t('app.loading')}</p>
      )}
      {state === 'error' && (
        <p className="py-8 text-center text-sm text-red-600">{t('shared.previewFailed')}</p>
      )}
      <div ref={containerRef} />
    </div>
  )
}
