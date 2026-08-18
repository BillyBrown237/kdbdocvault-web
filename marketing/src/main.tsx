import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

const root = document.getElementById('root')
// Failing loudly beats rendering into nothing and leaving a blank page with a
// clean console.
if (!root) throw new Error('#root is missing from index.html')

const app = (
  <StrictMode>
    <App />
  </StrictMode>
)

// The build prerenders the page into `#root`, so in production there is markup
// to adopt rather than replace. `npm run dev` serves an empty root, and this
// falls back to a normal client render there — the same file works both ways
// without a flag to keep in sync.
if (root.hasChildNodes()) {
  hydrateRoot(root, app)
} else {
  createRoot(root).render(app)
}
