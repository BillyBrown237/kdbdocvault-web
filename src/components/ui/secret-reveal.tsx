import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Copy, Download, Eye, EyeOff } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * The one-time secret, everywhere.
 *
 * KDB DocVault hands out several values that exist exactly once — an API key,
 * a webhook signing secret, a share URL, an invitation link, a TOTP seed. Each
 * had grown its own copy button and its own warning. This is the single
 * treatment: reveal, copy, and DOWNLOAD, because "copy to clipboard" quietly
 * assumes the person is at the machine that needs the value. They usually
 * aren't — the key goes to a server, the link goes to a colleague.
 *
 * Two file shapes, for two real destinations:
 *   .env — ready to drop beside an application. Commented, with the variable
 *          name the integration expects.
 *   .txt — for a password manager or a handover note: what it is, what it's
 *          for, when it was issued, how to use it.
 *
 * `masked` starts the value hidden. Shoulder-surfing is a real threat in a
 * shared office, and the person copying a key rarely needs to read it.
 */
export function SecretReveal({
  value,
  envKey,
  filenameBase,
  title,
  usage,
  meta,
  example,
  masked = false,
  className,
}: {
  value: string
  /** Variable name for the .env download. Omit to offer .txt only. */
  envKey?: string
  /** Base name for downloaded files; a timestamp is appended. */
  filenameBase: string
  /** What this secret IS — first line of the .txt. */
  title: string
  /** How to use it — e.g. the Authorization header shape. */
  usage?: string
  /** Extra context lines for the .txt (label → value). */
  meta?: Record<string, string>
  /**
   * A ready-to-run snippet, shown on screen AND appended to both files.
   * "Authorization: ApiKey <secret>" tells you the shape; a real command with
   * the real value and the real host tells you it works.
   */
  example?: string
  masked?: boolean
  className?: string
}) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const [hidden, setHidden] = useState(masked)

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard is blocked without https or a user gesture in some browsers.
      // The value is on screen and downloadable, so this is not a dead end —
      // but silently doing nothing would look broken.
      setHidden(false)
    }
  }

  function download(kind: 'env' | 'txt') {
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
    const content = kind === 'env' ? envFile() : txtFile()
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = kind === 'env' ? `${filenameBase}-${stamp}.env` : `${filenameBase}-${stamp}.txt`
    document.body.appendChild(a)
    a.click()
    a.remove()
    // Freeing the object URL immediately can cancel the download in Safari.
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
  }

  function envFile() {
    const lines = [
      `# ${title}`,
      `# ${t('secret.issued', { when: new Date().toISOString() })}`,
      `# ${t('secret.envWarning')}`,
    ]
    if (usage) lines.push(`# ${usage}`)
    for (const [k, v] of Object.entries(meta ?? {})) lines.push(`# ${k}: ${v}`)
    lines.push('', `${envKey}=${value}`, '')
    if (example) lines.push(`# ${t('secret.exampleTitle')}`, ...example.split('\n').map((l) => `#   ${l}`), '')
    return lines.join('\n')
  }

  function txtFile() {
    const lines = [
      title,
      '='.repeat(title.length),
      '',
      `${t('secret.issued', { when: new Date().toISOString() })}`,
    ]
    for (const [k, v] of Object.entries(meta ?? {})) lines.push(`${k}: ${v}`)
    lines.push('', value, '')
    if (usage) lines.push(usage, '')
    if (example) lines.push(t('secret.exampleTitle'), example, '')
    lines.push(t('secret.txtWarning'), '')
    return lines.join('\n')
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2">
        <code
          className={cn(
            'min-w-0 flex-1 truncate rounded-md border bg-muted px-3 py-2 font-mono text-xs',
            hidden && 'select-none',
          )}
        >
          {hidden ? '•'.repeat(Math.min(value.length, 44)) : value}
        </code>
        {masked && (
          <Button
            size="sm"
            variant="outline"
            aria-label={hidden ? t('secret.show') : t('secret.hide')}
            onClick={() => setHidden((h) => !h)}
          >
            {hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>
        )}
        <Button size="sm" variant="outline" aria-label={t('secret.copy')} onClick={copy}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>

      {/* The usage line goes ON SCREEN as well as into the files. It was
          file-only at first, which meant the person who copied the value to
          their clipboard — the common path — never learned how to send it. */}
      {usage && <p className="text-xs text-muted-foreground">{usage}</p>}

      <div className="flex flex-wrap items-center gap-2">
        {envKey && (
          <Button size="sm" variant="ghost" onClick={() => download('env')}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            {t('secret.downloadEnv')}
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={() => download('txt')}>
          <Download className="mr-1.5 h-3.5 w-3.5" />
          {t('secret.downloadTxt')}
        </Button>
      </div>

      {example && (
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium">{t('secret.exampleTitle')}</span>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2"
              onClick={() => void navigator.clipboard.writeText(example).catch(() => {})}
            >
              <Copy className="mr-1 h-3 w-3" />
              {t('secret.copy')}
            </Button>
          </div>
          <pre className="overflow-x-auto rounded-md border bg-muted px-3 py-2 font-mono text-[11px] leading-relaxed">
            {example}
          </pre>
        </div>
      )}
    </div>
  )
}
