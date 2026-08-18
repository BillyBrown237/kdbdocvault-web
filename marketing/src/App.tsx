import { Footer } from '@/components/marketing/Footer'
import { Navbar } from '@/components/marketing/Navbar'
import { Home } from '@/pages/Home'

/**
 * Application shell.
 *
 * No router yet, deliberately: there is one page. When the second arrives,
 * the swap is `react-router-dom` here and nothing else — every component
 * below already navigates with plain anchors, which work either way.
 */
export default function App() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main id="main" className="flex-1">
        <Home />
      </main>
      <Footer />
    </div>
  )
}
