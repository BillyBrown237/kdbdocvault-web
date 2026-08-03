# API contract

Place the backend's OpenAPI spec here as `kdb-vault-openapi.yaml` (copy it from the project's `docs/` knowledge — the file titled *KDB Vault API v1.1.0*).

Then generate the typed client + React Query hooks:

```bash
npm run api:generate
```

This file is a synced copy, not the source of truth — the backend owns the contract. Re-copy and regenerate whenever the contract changes.
