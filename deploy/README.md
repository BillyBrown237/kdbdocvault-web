# Deploying the web app

Push to `develop` → GitHub Actions typechecks, builds, and publishes the
static files to the VPS. Roughly 90 seconds.

This pipeline is **independent of the backend's**. The two share a server, not
a release cycle: a CSS fix doesn't rebuild .NET images, and a database
migration doesn't wait on `npm ci`.

## Branches

| Branch | Deploys to | Status |
|---|---|---|
| `develop` | the dev environment | active |
| `main` | production | **no workflow yet** |

While the product is pre-pilot, `develop` is the only branch that ships.
`main` is left without a workflow on purpose: a branch that cannot deploy
cannot deploy by accident, and adding production later is a new file rather
than an edit to a pipeline you depend on.

When you're ready, copy this file to `deploy-prod.yml`, trigger it on `main`,
point it at the production web root, and use a `production` environment with
a required reviewer so a merge can't ship unattended.

## Who owns what on the server

| Path | Owned by |
|---|---|
| `/var/www/kdbvault-dev/{releases,current}` | **this pipeline** |
| `~/kdbvault-dev` (compose, migrations, containers) | the backend pipeline |
| `/etc/nginx` | neither — configured once by hand |

nginx serves through the `current` symlink:

```
/var/www/kdbvault-dev/current/web    → the SPA        (kdb.dekoubrown.dev)
/var/www/kdbvault-dev/current/site   → front office   (site.kdb.dekoubrown.dev)
```

nginx serves these files directly and proxies `/v1` and `/pub` to the API on
the same origin. That's why this repo needs no API URL and no CORS: to the
browser, the app and the API are one host.

## GitHub secrets

Settings → Secrets and variables → Actions.

| Secret | Value |
|---|---|
| `VPS_HOST` | server IP or hostname |
| `VPS_USER` | SSH user owning `/var/www/kdbvault-dev` |
| `VPS_SSH_KEY` | private key, full PEM including BEGIN/END lines |
| `VPS_PORT` | only if SSH isn't on 22 |

And one repository **variable** (the tab beside Secrets):

| Variable | Value |
|---|---|
| `APP_HOST` | `kdb.dekoubrown.dev` |

A hostname in public DNS is not a secret, and storing it as one is actively
harmful: GitHub masks secret values in logs, so the smoke test's diagnostics
would all read `https://***`. Variables aren't masked. If it's unset the
smoke test warns and passes rather than failing on a missing setting.

The same deploy key as the backend repo is fine — it's the same user doing the
same kind of work. Generate it once on the VPS:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/github-deploy -N ""
cat ~/.ssh/github-deploy.pub >> ~/.ssh/authorized_keys
cat ~/.ssh/github-deploy       # → VPS_SSH_KEY in both repos
```

## Prerequisite

`/var/www/kdbvault-dev` must exist and be writable by `VPS_USER`. The backend
repo's `deploy/README.md` creates it during first-time setup; this pipeline
fails with a clear message rather than creating it, because guessing at
ownership and permissions for a web root is how you end up with a 403 nobody
can explain.

**The first deploy will 404 until nginx is configured**, because `current`
doesn't exist until this pipeline first runs — and nginx's `root` points
through it. Order doesn't matter: deploy first or configure nginx first, the
site comes up once both are done.

## How publishing works

Each build extracts into a **new, immutable release directory** named after
the commit SHA:

```
/var/www/kdbvault-dev/releases/<sha>/web
/var/www/kdbvault-dev/releases/<sha>/site
```

Nothing is visible to nginx until the extract has finished and both
`index.html` files are verified present. Only then is `current` repointed.
Because nginx resolves the symlink per request, the switch is atomic — no
request ever sees a half-built tree, and no nginx reload is needed.

A failed extract deletes its own release directory and leaves `current`
untouched, so a broken build cannot take the site down.

### Rolling back

```bash
ls -t /var/www/kdbvault-dev/releases          # newest first
ln -sfn /var/www/kdbvault-dev/releases/<sha> /var/www/kdbvault-dev/current
```

`ln -sfn` matters: without `-n`, ln follows the existing symlink and creates
the new link *inside* the old release directory instead of replacing it.

No cache to purge — `index.html` and both service workers are served
`no-cache`, and `/assets/*` filenames are content-hashed.

**Don't enable `open_file_cache`** on these server blocks. It caches file
descriptors across the symlink swap, so a deploy appears to do nothing.

## Things that go wrong

**Typecheck fails but it built locally.** `vite build` uses esbuild, which
strips types without checking them. CI runs `tsc --noEmit` as a separate step
precisely to catch what the build cannot.

**Smoke test fails on the asset.** `index.html` was published but `/assets/*`
wasn't — usually a partial extract. Re-run the workflow; the staging swap
makes it safe to repeat.

**A deploy appears to do nothing.** The service worker is serving the previous
shell. Both `sw.js` and `push-sw.js` are `no-cache` in the nginx config; if
you changed that, this is the consequence.

**403 on every page.** nginx can't traverse into `/var/www/kdbvault-dev`.
Every parent directory needs `755` and the files need to be readable by the
nginx user.
