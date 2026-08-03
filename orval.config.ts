import { defineConfig } from 'orval'

// Contract-first: the backend's OpenAPI 3.1 spec is the single source of truth.
// `api/kdb-vault-openapi.yaml` is a synced copy — refresh it whenever the
// backend contract changes, then run `npm run api:generate`.
export default defineConfig({
  kdbvault: {
    input: {
      target: './api/kdb-vault-openapi.yaml',
    },
    output: {
      target: './src/api/generated',
      mode: 'tags-split',
      client: 'react-query',
      httpClient: 'fetch',
      clean: true,
      prettier: true,
      override: {
        mutator: {
          path: './src/lib/api/http.ts',
          name: 'apiFetch',
        },
        query: {
          useQuery: true,
        },
      },
    },
  },
})
