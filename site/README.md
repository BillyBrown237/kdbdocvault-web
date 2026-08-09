# KDB DocVault — Front Office (marketing site)

Static implementation of the design file `docs/KDB DocVault v2.dc.html`
(W21). No build step, no framework: three HTML pages + one stylesheet +
one dependency-free script.

```
index.html      Accueil   (hero, table of expirables, lifecycle timeline,
                           hash chain, guest signing, calculator, mobile
                           money, references, FAQ)
produit.html    Produit   (the five questions → shipped features,
                           reminder-date checker, honest « bientôt » list)
securite.html   Sécurité  (measure / how-to-verify table, public
                           verification, exit commitments, what we
                           do NOT have yet)
assets/site.js  FR↔EN toggle (persisted), scroll-driven timeline + chain,
                exposure calculator, date checker  (~7 KB gzipped)
assets/site.css skip-link focus + print
```

Design source of truth stays `docs/KDB DocVault v2.dc.html`; if the design
is revised, re-run the transform (see session outputs `build_site.py`) or
port the diff by hand — the mapping is 1:1 (`data-t` keys, ids listed at
the top of `site.js`).

## Behavior notes

- Content is FR in the markup (SEO/default); EN lives in `site.js` and
  swaps `data-t` nodes client-side. `<html lang>` follows.
- Everything works without JS except the two widgets (calculator and date
  checker keep their FR initial values) and the language toggle.
- Animations honor `prefers-reduced-motion` (timeline/chain render final
  state).
- Placeholders to fill before launch: phone number (`tel:+237`,
  `wa.me/237`), the real demo-certificate QR on the security page,
  the three reference slots, Confidentialité/Conditions pages.

## Deploy

Copy this directory to the VPS as `deploy/site/`; Caddy serves it at
`kdbvault.com` (block added in `deploy/Caddyfile`, mount in
`docker-compose.prod.yml`). Locally: any static server
(`python3 -m http.server` in this directory).
