# Logos clients

Déposer ici les fichiers référencés par `LOGOS` dans
`src/components/marketing/proof/proof.ts` :

```ts
{ name: 'Sofrigaz SA', src: '/logos/sofrigaz.svg' }
```

Deux contraintes :

- **SVG monochromes** (blanc ou une seule couleur). La rangée est posée sur un
  fond quasi noir ; un logo en couleurs d'origine se battra avec la page.
- **Hauteur normalisée** : le composant contraint à `h-6`. Prévoir des SVG
  dont le contenu occupe la hauteur du viewBox, sinon deux logos côte à côte
  paraîtront de tailles différentes.

Ne rien déposer ici tant que l'autorisation d'utiliser la marque n'est pas
acquise.
