import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

/**
 * The frame for every page a NON-USER sees (W34).
 *
 * Share links, data rooms, signature requests and hash verification are opened
 * by people who have no account and may never get one — a client, a lawyer,
 * a counterparty. For most of them this page is the only KDB Doc Vault they
 * will ever see, and until now it was a grey background, a bare card, and the
 * product name as plain text where the logo should be.
 *
 * Four routes had each built their own version of that frame. This is one
 * frame, with the real lockup, so the pages differ only where they actually
 * do different things.
 *
 * `width`:
 *  · `narrow` — one decision on the page (verify a hash, sign a document).
 *  · `wide`   — a document or a list to read (share view, data room).
 */
export function PublicShell({
  children,
  width = 'narrow',
  className,
}: {
  children: React.ReactNode
  width?: 'narrow' | 'wide'
  className?: string
}) {
  const { t } = useTranslation()
  const year = new Date().getFullYear()

  return (
    <div className="app-surface flex min-h-dvh flex-col">
      {/* Not a Link: there is nowhere in the app for a signed-out visitor to
          go, and a logo that navigates to a login wall is a small betrayal. */}
      <header className="flex justify-center px-4 pt-8 pb-6 sm:pt-12">
        <img
          src="/brand/logo-lockup.png"
          width={258}
          height={112}
          alt={t('app.name')}
          className="h-7 w-auto object-contain"
        />
      </header>

      <main
        className={cn(
          'mx-auto w-full flex-1 px-4 pb-10',
          width === 'narrow' ? 'max-w-md' : 'max-w-4xl',
          className,
        )}
      >
        {children}
      </main>

      {/* Says only what is true of any HTTPS page. No security claims — the
          people reading this are the ones least able to check them. */}
      <footer className="text-muted-foreground px-4 pb-8 text-center text-xs">
        <p>
          © {year} {t('app.name')}
        </p>
      </footer>
    </div>
  )
}
