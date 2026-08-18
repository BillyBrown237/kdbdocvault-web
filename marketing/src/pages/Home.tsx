import { Hero } from '@/components/marketing/Hero'
import { Problem } from '@/components/marketing/Problem'
import { Solution } from '@/components/marketing/Solution'
import { HowItWorks } from '@/components/marketing/how/HowItWorks'
import { DocumentShowcase } from '@/components/marketing/showcase/DocumentShowcase'
import { Sources } from '@/components/marketing/sources/Sources'
import { Intelligence } from '@/components/marketing/intelligence/Intelligence'
import { Lifecycle } from '@/components/marketing/lifecycle/Lifecycle'
import { Workflow } from '@/components/marketing/workflow/Workflow'
import { Sharing } from '@/components/marketing/sharing/Sharing'
import { Security } from '@/components/marketing/security/Security'
import { Auditability } from '@/components/marketing/security/Auditability'
import { Audiences } from '@/components/marketing/audiences/Audiences'
import { Proof } from '@/components/marketing/proof/Proof'
import { Pricing } from '@/components/marketing/pricing/Pricing'
import { FinalCta } from '@/components/marketing/FinalCta'

/**
 * The landing page.
 *
 * The argument, in order: here is the product (hero) → here is what your week
 * actually looks like (problem) → here is the system that replaces it
 * (solution) → and it is only four steps (how) → here is one document inside
 * it (showcase) → this is how they
 * get in (sources) → it can read them (intelligence) → it watches their dates
 * (lifecycle) → it moves work through them (workflow) → you can let someone
 * else in without letting go (sharing) → here is what protects them
 * (security) → here is how you prove any of it happened (audit) → so which of
 * these are you (audiences) → here are the people already doing it (proof) →
 * this is what it will cost (pricing) → so here is the door (final CTA).
 *
 * `Proof` renders placeholder slots until `proof.ts` is filled in. If the logo
 * row is wanted high on the page instead, move the component directly under
 * `<Hero />` — it takes its own tone and nothing else depends on its position.
 *
 * Section tones alternate deliberately: `page`, `raised` and `seam` never
 * repeat back to back, which is what gives the page its rhythm without a rule
 * drawn between every block. Inserting a section means checking its
 * neighbours.
 *
 * Still to come: #resources.
 */
export function Home() {
  return (
    <>
      <Hero />
      <Problem />
      <Solution />
      <HowItWorks />
      <DocumentShowcase />
      <Sources />
      <Intelligence />
      <Lifecycle />
      <Sharing />
      <Security />
      <Auditability />
      <Workflow />
      <Audiences />
      <Proof />
      <Pricing />
      <FinalCta />
    </>
  )
}
