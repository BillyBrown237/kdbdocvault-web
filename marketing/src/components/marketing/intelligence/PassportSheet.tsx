import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { useT } from '@/i18n'

/**
 * The example document, drawn rather than photographed.
 *
 * It is a *specimen*: no country, no crest, no real number. That is both the
 * honest thing to put on a marketing page and the recognisable thing — the
 * layout of an identity page (photo block, label/value rows, two lines of
 * machine-readable text at the foot) is what makes it read as a passport, not
 * the flag on it.
 *
 * The detection outlines are not positioned by percentage. Each one wraps the
 * row it belongs to, so a wording change can never leave a box floating over
 * the wrong line.
 */

const INK = '#5B6B80'
const FAINT = '#93A2B6'
const LABEL = '#A9B7C8'

export function PassportSheet({
  detected,
  scanning,
}: {
  /** Which field outlines are showing. */
  detected: boolean
  /** Whether the reading pass is running. */
  scanning: boolean
}) {
  const t = useT()

  return (
    <div className="relative mx-auto w-full max-w-[19rem]">
      <div className="relative aspect-[1.42/1] overflow-hidden rounded-lg bg-[#E9EEF5] p-3 shadow-sheet">
        <div className="flex items-start justify-between">
          <Detected label={t.intelligence.sheet.labels.type} on={detected}>
            <p className="text-[0.5625rem] leading-none font-semibold tracking-[0.18em]" style={{ color: INK }}>
              {t.intelligence.sheet.passport}
            </p>
          </Detected>
          <p className="text-[0.5rem] tracking-[0.14em]" style={{ color: LABEL }}>
            {t.intelligence.sheet.specimen}
          </p>
        </div>

        <div className="mt-2.5 flex gap-3">
          {/* Photo block. Deliberately empty — a drawn face would be the one
              piece of this that looked fake. */}
          <div
            className="h-[3.9rem] w-[3rem] shrink-0 rounded-sm"
            style={{ backgroundColor: '#CFD8E3' }}
          />

          <div className="min-w-0 flex-1 space-y-1.5">
            <Detected label={t.intelligence.sheet.labels.name} on={detected}>
              <Row label={t.intelligence.sheet.surname} value="DOE, JOHN" />
            </Detected>
            <Detected label={t.intelligence.sheet.labels.number} on={detected}>
              <Row label={t.intelligence.sheet.documentNo} value="XXXXXXXX" />
            </Detected>
            <Row label={t.intelligence.sheet.nationality} value="—" />
            <Detected label={t.intelligence.sheet.labels.expiry} on={detected}>
              <Row label={t.intelligence.sheet.expiry} value="12 MAR 2029" />
            </Detected>
          </div>
        </div>

        {/* Machine-readable zone. */}
        <div className="absolute inset-x-3 bottom-2.5 space-y-0.5 overflow-hidden">
          {['P<SPECDOE<<JOHN<<<<<<<<<<<<<<<<<<<<<<<<<<<<', 'XXXXXXXX<0SPE<<<<<<<<<M2903127<<<<<<<<<<<<0'].map(
            (line) => (
              <p
                key={line}
                className="truncate font-mono text-[0.4375rem] leading-none tracking-[0.06em]"
                style={{ color: FAINT }}
              >
                {line}
              </p>
            ),
          )}
        </div>

        {/* The reading pass. Rendered only while it runs, and absolutely
            positioned, so it never affects layout. */}
        {scanning && (
          <span
            aria-hidden="true"
            className="motion-safe:animate-scan pointer-events-none absolute inset-x-0 top-0 h-8 bg-[linear-gradient(180deg,transparent,rgb(5_150_105/0.22),rgb(5_150_105/0.5),transparent)]"
          />
        )}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[0.4375rem] tracking-[0.08em] uppercase" style={{ color: LABEL }}>
        {label}
      </p>
      <p className="text-[0.625rem] leading-tight font-medium" style={{ color: INK }}>
        {value}
      </p>
    </div>
  )
}

/** An outline drawn around whatever it wraps, with a small field name. */
function Detected({
  children,
  label,
  on,
}: {
  children: ReactNode
  label: string
  on: boolean
}) {
  return (
    <div className="relative">
      {children}
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute -inset-x-1 -inset-y-0.5 rounded-[3px] ring-1 ring-[#059669] transition-opacity duration-500 ease-[var(--ease-out-soft)]',
          on ? 'opacity-100' : 'opacity-0',
        )}
        style={{ backgroundColor: 'rgb(5 150 105 / 0.07)' }}
      >
        <span className="absolute -top-[7px] left-0 rounded-[2px] bg-[#059669] px-1 text-[0.4375rem] leading-[10px] font-medium text-white">
          {label}
        </span>
      </span>
    </div>
  )
}
