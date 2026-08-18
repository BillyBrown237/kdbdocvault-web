import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Section } from '@/components/ui/Section'
import { REGISTER_URL } from '@/lib/links'
import { Logo } from './Logo'
import { useT } from '@/i18n'

/**
 * The closing call to action.
 *
 * Two devices keep this from being the usual coloured band with a button in
 * it, and both are references rather than decoration.
 *
 * The first is the light. `.bg-halo` sits behind the hero, thrown from above;
 * this section uses the same gradient anchored at the bottom instead. The page
 * opens and closes under one lamp, which is what makes the end feel like an
 * end rather than another block.
 *
 * The second is the recap: the four words from "How it works" reappear above
 * the mark, this time all lit. The visitor has just read eleven sections about
 * what happens between them, so the line means something here that it could
 * not have meant the first time.
 */
export function FinalCta() {
  const t = useT()

  return (
    <Section id="get-started" tone="page" space="loose" className="bg-halo-close overflow-hidden">
      <div className="mx-auto max-w-3xl text-center">
        <p className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 font-mono text-meta tracking-[0.1em] text-[var(--color-text-subtle)] uppercase">
          {/* The four words the page has been building toward, said one last time. */}
          {t.finalCta.model.map((word, i) => (
            <span key={word} className="flex items-center gap-2.5">
              {i > 0 && <span aria-hidden="true">→</span>}
              {word}
            </span>
          ))}
        </p>

        <div className="mt-10 flex justify-center">
          <Logo size="lg" />
        </div>

        <h2 className="mt-10 text-h1 leading-[1.06] text-[var(--color-text)]">
          {t.finalCta.title}
        </h2>

        <p className="mx-auto mt-6 max-w-xl text-lead leading-relaxed text-[var(--color-text-muted)]">
          {t.finalCta.lead}
        </p>

        <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
          <Button
            href={REGISTER_URL}
            size="lg"
            trailing={<ArrowRight size={18} aria-hidden="true" />}
          >
            {t.common.getStarted}
          </Button>
          <Button href="#how" variant="secondary" size="lg">
            {t.common.seeHow}
          </Button>
        </div>
      </div>
    </Section>
  )
}
