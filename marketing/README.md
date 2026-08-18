# KDB Doc Vault — site public

Site marketing public. **Application Vite autonome**, séparée de la SPA
authentifiée du dossier parent.

## Pourquoi une application séparée

Un visiteur qui arrive sur la page d'accueil n'a aucune raison de télécharger
TanStack Router, React Query, i18next, pdf.js et shadcn pour lire trois
paragraphes. Le site public a ses propres dépendances (`react`, `react-dom`,
`lucide-react` — rien d'autre) et son propre bundle. Il remplace le dossier
statique `site/`.

## Démarrer

```bash
npm install
npm run dev        # http://localhost:3100
npm run typecheck  # tsc --noEmit
npm run build      # typecheck + build -> dist/
```

## Structure

```
src/
  styles.css                 tokens de design + couche de base (source unique)
  main.tsx                   point d'entrée
  App.tsx                    coquille : Navbar / <main> / Footer
  lib/cn.ts                  concaténation de classes
  components/ui/             primitives réutilisables
    Container.tsx            rythme horizontal (default | prose | wide)
    Section.tsx              rythme vertical + bloc de titre (page | raised | seam)
    Button.tsx               <a> si href, <button> sinon
  lib/useReducedMotion.ts    pour les animations pilotées par JS
  lib/useTypewriter.ts       frappe de la recherche dans le hero
  lib/links.ts               ⚠ toutes les URL sortantes — à confirmer
  lib/useInView.ts           déclenchement des entrées au scroll
  components/ui/Reveal.tsx   fondu montant à l'entrée dans le viewport
  components/marketing/      blocs propres au site
    Logo.tsx  Navbar.tsx  Hero.tsx  Problem.tsx  Solution.tsx
    FinalCta.tsx  Footer.tsx
    hero/HeroVisual.tsx      visualisation produit du hero
    hero/workspace.ts        données de la maquette (documents, dossiers…)
    showcase/DocumentShowcase.tsx  vue détail d'un document (onglets)
    showcase/panels.tsx      les cinq panneaux d'onglet
    showcase/document.ts     le document exemple (Contract.pdf)
    intelligence/Intelligence.tsx   flux Upload → … → Search
    intelligence/PassportSheet.tsx  le spécimen et ses cadres de détection
    lifecycle/Lifecycle.tsx  tableau des échéances + échelle de relances
    lifecycle/lifecycle.ts   documents, seuils, calcul de position
    how/HowItWorks.tsx       les quatre étapes — la section calme
    audiences/Audiences.tsx  particuliers / équipes / organisations
    proof/Proof.tsx          logos + témoignages (structure)
    proof/proof.ts           ← le seul fichier à éditer le jour venu
    pricing/Pricing.tsx      quatre paliers, sans prix
    pricing/pricing.ts       ← paliers et fonctionnalités
public/
  favicon.svg                la marque, en statique
  logos/                     SVG monochromes des logos clients
    sources/Sources.tsx      entonnoir d'entrée (drives, e-mail, API)
    sharing/Sharing.tsx      dialogue de partage — réellement interactif
    workflow/Workflow.tsx    étapes, exemple d'approbation, états
    workflow/workflow.ts     contenu + drapeau `availability`
    security/Security.tsx    les six points de contrôle + les huit notions
    security/Auditability.tsx  journal d'audit dépliable
  pages/
    Home.tsx                 page d'accueil (squelette)
```

## Les fichiers de marque

```
public/logo.png       2000×2000   master : symbole + nom, fond navy opaque
public/app-icon.png   2000×2000   master : symbole seul, fond navy opaque
public/og-image.png   1731×909    carte de partage
        │
        │  python3 scripts/brand-assets.py
        ▼
public/brand/logo-lockup.png   258×112   25 ko, fond transparent
public/brand/logo-mark.png      83×112   14 ko, fond transparent
```

Les masters **ne peuvent pas** être posés tels quels dans l'interface. La barre
de navigation est transparente au-dessus du hero : un PNG à fond opaque y
apparaîtrait comme un rectangle sombre posé sur le halo. Le script détoure le
fond en le remplissant **depuis les bords vers l'intérieur** — un détourage par
couleur globale percerait aussi les zones sombres du symbole lui-même.

Après remplacement d'un master : relancer le script, puis vérifier les
constantes `width`/`height` dans `Logo.tsx`. Ce sont elles qui réservent la
place de l'image et empêchent l'en-tête de sauter pendant le chargement.

### Deux points à trancher

1. **La couleur de marque ne correspond pas à celle du site.** Le logo est
   bleu/cyan ; l'accent du site est émeraude. Les deux se voient désormais côte
   à côte dans la barre de navigation. Soit l'accent passe au bleu de la marque
   (une modification de `styles.css` plus toutes les valeurs `rgb()` littérales,
   soit environ 80 occurrences), soit c'est assumé. Ce n'est pas une décision
   technique.
2. **`og-image.png` est en anglais uniquement.** La page française partage donc
   une carte anglaise. Une variante `og-image-fr.png` et une clé
   `meta.ogImage` par locale règleraient le problème — le prérendu réécrit déjà
   toutes les autres balises `og:`.

## Bilingue — anglais et français

Deux **documents prérendus distincts**, pas un sélecteur :

| | anglais | français |
|---|---|---|
| URL | `/` | `/fr/` |
| fichier | `dist/index.html` | `dist/fr/index.html` |
| `<html lang>` | `en` | `fr` |
| `canonical` | `…dev/` | `…dev/fr/` |

C'est la seule disposition qu'un moteur de recherche peut indexer deux fois.
Un basculement côté client sur une seule URL aurait fait qu'une seule des deux
langues soit jamais trouvée — ce qui aurait annulé l'essentiel du travail SEO.
Les deux pages déclarent mutuellement leurs `hreflang`, et le sitemap liste
les deux.

### Le dictionnaire

`src/i18n/en.ts` et `src/i18n/fr.ts`. Pas de i18next : la locale ne change
jamais après le service de la page, il n'y a donc rien à détecter, rien à
charger paresseusement, et aucune raison de poser 15 ko de framework sur une
page d'accueil.

```ts
export const fr: typeof en = { … }
```

**`fr` est typé `typeof en`** : une clé manquante, mal orthographiée ou en trop
est une erreur de compilation, pas une chaîne qui s'affiche `hero.title` en
production. Garder les deux fichiers dans le même ordre — relire une
traduction est bien plus simple quand les diffs s'alignent.

### La règle qui revient le plus souvent

Un composant lit `const t = useT()`. **Les constantes de module ne peuvent pas
appeler de hook** : toute constante qui portait du texte est devenue une
fonction du dictionnaire.

```ts
const STAGES = [{ name: 'Upload', … }]        // avant
function stages(t: Dict) { return [{ name: t.workflow.stages.upload.name, … }] }  // après
```

Deux pièges à connaître :

- **Identifiants ≠ libellés.** Les `id`, les clés d'état (`'preview'`,
  `'48h'`, `'pending'`), les `id` DOM et les cibles `aria-labelledby` restent
  en anglais. Seuls les libellés viennent du dictionnaire. Traduire un
  identifiant casse les onglets, les colonnes de pied de page et le
  `aria-controls`.
- **Identité des tableaux.** `useTypewriter` compare son argument `phrases`
  **par référence**. Un tableau littéral recréé à chaque rendu relance la
  frappe indéfiniment. Passer la référence du dictionnaire, ou un `useMemo`.

### Ce qui n'est volontairement pas traduit

Les noms de produits (KDB Doc Vault, PDF, OCR, API), les noms de fichiers
fictifs des maquettes, les initiales d'avatar, les tailles, les libellés de
version et les noms de personnes. Un bureau francophone ne renomme pas ses
PDF non plus.

### Vérifier après une modification

```bash
npm run build   # échoue si l'une des deux pages ne contient pas son propre titre
grep -c '<html lang="fr"' dist/fr/index.html   # doit valoir 1
```

Le pipeline vérifie la même chose deux fois : sur les fichiers avant envoi, et
sur `SITE_HOST/fr/` une fois en ligne — parce qu'un nginx qui ne résout pas le
répertoire sert l'index anglais avec un code 200, ce qui a l'air correct
jusqu'à ce que quelqu'un lise la page.

## Échelles fermées

Trois inventaires qui ne doivent plus s'ouvrir. Avant la passe de finition, les
composants avaient accumulé **treize** tailles de texte, **cinq** ombres et
**onze** tailles d'icône choisies à l'œil — c'est exactement ainsi qu'une page
cesse d'avoir l'air faite par une seule personne.

| | Valeurs autorisées |
|---|---|
| Texte d'interface | `text-nano` `text-micro` `text-meta` `text-ui-sm` `text-ui` `text-ui-lg` `text-card` |
| Titres | `text-h4` `text-h3` `text-h2` `text-h1` `text-display` `text-lead` |
| Icônes (`size=`) | `10` `12` `14` `16` `18` `20` |
| Ombres | `shadow-sheet` `shadow-frame` `shadow-float` |
| Surface de carte | `bg-[var(--color-card)]/60` — une seule valeur |
| Panneau encastré | `bg-black/25`, et `bg-black/30` pour un champ **dans** un panneau |

Vérification après modification :

```bash
grep -rhoE 'text-\[[0-9.]+rem\]' src/components/   # doit être vide (hors PassportSheet)
grep -rhoE 'size=\{[0-9]+\}' src/components/ | sort -u
grep -rhoE 'shadow-\[[^]]+\]' src/components/      # doit être vide
```

`PassportSheet.tsx` est la seule exception assumée : c'est un fac-similé à
échelle réduite, ses tailles internes lui appartiennent.

## Appels à l'action

Deux libellés, pas davantage : **« Get started »** en primaire,
**« See how it works »** en secondaire.

Le vert émeraude plein n'apparaît que **deux fois dans le corps de la page** —
dans le hero et dans le bloc de clôture — plus la barre de navigation. Tout le
reste est secondaire ou un lien. Les trois cartes « Pour qui » sont des liens
fléchés et non des boutons : ce sont des panneaux indicateurs (« celle-là,
c'est moi »), et trois boutons de plus auraient donné neuf appels à l'action
concurrents sur la page.

```bash
# inventaire des boutons
grep -rn '<Button' src/components/ -A4 | grep -E 'variant=|</Button>'
```

## Règles de design

Elles sont volontairement peu nombreuses, et tenir à elles est ce qui garde le
site cohérent quand des sections s'ajoutent.

1. **Les couleurs viennent des tokens**, jamais de valeurs codées en dur.
   `var(--color-text)`, `var(--color-hairline)`, `var(--color-accent-600)`…
   Tout est défini dans le bloc `@theme` de `src/styles.css`.
2. **L'émeraude est rare.** C'est la couleur de l'action principale et de
   l'anneau de focus. S'il y a deux surfaces émeraude visibles en même temps,
   l'une des deux n'est pas l'action principale.
3. **Une seule source de lumière.** L'utilitaire `.bg-halo` n'apparaît que
   dans le hero. Le reste de la page est plat ; c'est ce qui rend le hero
   lumineux.
4. **Les tailles de texte sont fluides.** `var(--text-display)`, `--text-h1`,
   `--text-h2`, `--text-h3`, `--text-lead` utilisent `clamp()` : aucune
   surcharge par breakpoint n'est nécessaire pour la typographie.
5. **Chaque section passe par `<Section>`.** Elle fournit l'espacement, le ton
   de surface et le `aria-labelledby` vers son propre titre. Une section
   ajoutée « à la main » cassera le rythme et l'accessibilité.
6. **Pas de nouvelle dépendance sans raison.** Une icône se prend dans
   `lucide-react` ; une animation se fait en CSS.
7. **Les animations sont déclarées avec `@utility`, pas dans
   `@layer utilities`.** Seul `@utility` enregistre le nom auprès du système
   de variantes de Tailwind v4. Dans un `@layer`, la classe existe mais
   `motion-safe:animate-rise` n'est jamais générée : le balisage ne fait
   silencieusement rien. Après ajout d'une animation, vérifier :
   `npm run build && grep -o 'motion-safe\\:animate-[a-z-]*' dist/assets/*.css`
8. **Rien d'absolu à l'intérieur d'un `<Reveal>`.** `animate-rise` applique un
   `transform`, et un ancêtre transformé devient le bloc conteneur de ses
   descendants en `position: absolute`. Une pastille en `left-0` se retrouve
   alors collée au bord du padding et dérive pendant l'animation. Les éléments
   positionnés se placent en frère de `<Reveal>`, pas dedans.

## Le récit, et pourquoi l'ordre des sections n'est pas arbitraire

```
Problem      vos documents sont difficiles à gérer
Solution     KDB Doc Vault règle le problème
How          et cela tient en quatre étapes
Showcase     ce n'est pas que du stockage
Sources      ils n'ont pas à commencer dans le coffre
Intelligence ils deviennent lisibles et cherchables
Lifecycle    les dates deviennent gérables
Sharing  ┐
Security ┘   l'accès devient contrôlé
Audit        l'activité devient prouvable
Workflow     le travail circule à travers eux
Audiences    équipes et organisations bâtissent leurs processus
Proof · Pricing · FinalCta
```

Workflow est passé **après** Audit lors de la passe de finition : contrôler
l'accès et prouver ce qui s'est passé sont les prérequis d'un circuit
d'approbation, pas l'inverse. Déplacer une section impose de revérifier les
tons (voir plus haut).

## Accessibilité — ce qui est déjà en place

- Lien d'évitement vers `#main`, premier élément focusable de la page.
- `:focus-visible` global : contour émeraude 2px, décalage 3px. Ne jamais
  écrire `outline: none` sans remplacement.
- Menu mobile : `aria-expanded` + `aria-controls`, fermeture par `Échap` avec
  retour du focus sur le bouton, fermeture automatique au passage en desktop.
- Cibles tactiles : la taille `md` du bouton fait 44px de haut.
- `prefers-reduced-motion` : les transitions et le défilement doux sont
  neutralisés dans `styles.css`. Les nouvelles animations doivent utiliser le
  préfixe `motion-safe:`.
- `scroll-padding-top` réservé pour l'en-tête collant, afin qu'une ancre ne
  passe pas sous la barre.
- **Contraste mesuré**, pas supposé. `--color-text-subtle` était `#64748B`,
  soit 3,8:1 sur la surface des cartes — sous le plancher AA de 4,5:1, et
  c'est la teinte qui porte presque toute la petite typo du site. Elle vaut
  désormais `#78889F` (5,1:1 sur carte, 5,5:1 sur la page). Les entrées non
  publiées étaient affichées à 55 % d'opacité, soit 2,0:1 : l'opacité a été
  retirée, elles se distinguent en n'étant pas des liens. **Ne pas
  réassombrir cette rampe.**
- Hiérarchie des titres : `h1` unique (hero) → `h2` (titres de section, bloc
  final, colonnes du pied de page) → `h3` → `h4`. Aucun niveau sauté. Les
  maquettes produit inertes n'utilisent pas de balises de titre : elles sont
  dans un `role="img"` et n'ont rien à faire dans le plan du document.

## Ajouter une section

```tsx
<Section
  id="tarifs"
  tone="raised"          // page | raised | seam — alterner pour le rythme
  eyebrow="Tarifs"
  title="Un prix par organisation, pas par document"
  lead="…"
>
  <VotreContenu />
</Section>
```

Ajouter l'ancre correspondante dans `LINKS` (`Navbar.tsx`) si elle doit
apparaître dans la navigation.

## État

Ordre des sections et tons (vérifié — aucun ton ne se répète d'une section à
la suivante) :

```
Problem  page  →  Solution raised →  How    seam  →  Showcase raised
Sources  seam  →  Intelligence raised → Lifecycle page → Workflow seam
Sharing  raised → Security  page   →  Audit  seam  →  Audiences raised
Proof    page   →  Pricing  raised →  FinalCta page
```

**Aucune ancre morte** sur le site : toutes les destinations `#…` référencées
correspondent à une section réelle, et les entrées sans page ne sont pas des
liens.

Terminé : tokens, primitives, coquille, Navbar (desktop + feuille mobile),
Footer, Hero et sa visualisation produit animée, section Problème, section
Solution, section Détail document (`#features`, interactive), section
Intelligence documentaire (`#intelligence`), section Cycle de vie
(`#lifecycle`), section Sources connectées (`#sources`), section Workflow
(`#workflow`), section Partage sécurisé (`#sharing`), section Sécurité
(`#security`), section Auditabilité (`#audit`), section « Pour qui »
(`#solutions`).

L'ordre des tons alterne volontairement : `page`, `raised` et `seam` ne se
suivent jamais deux fois. Insérer une section impose de vérifier ses voisines
— la note est en tête de `pages/Home.tsx`.

Plus aucun `Placeholder` sur la page. Restent à construire : `#pricing` et
`#resources` — ces deux ancres existent dans la navigation et ne mènent nulle
part pour l'instant.

### Section Problème — pourquoi elle est construite ainsi

Les huit problèmes ne sont pas huit cartes. Ils sont regroupés en quatre
étapes d'une même chute — fichiers éparpillés → contexte perdu → échéances
manquées → risques de sécurité — reliées par une seule colonne verticale dont
le dégradé passe de l'ardoise à l'ambre, puis à l'émeraude sur le nœud final.

Chaque problème est montré comme l'artefact que la personne reconnaît de sa
propre semaine : trois copies du même contrat sur trois appareils, un chemin
de dossiers à onze niveaux, une attestation expirée depuis quatre mois qui
n'a prévenu personne. C'est la reconnaissance qui convainc.

Règles de ton, à tenir si la section évolue : pas de rouge, pas de triangles
d'avertissement, pas de statistique inventée. L'ambre n'apparaît qu'aux étapes
3 et 4. Le registre visé est « oui, c'est mon mardi », pas « vous êtes en
danger ».

### Deux maquettes produit, deux règles opposées

Le site contient deux représentations du produit, et elles ne suivent pas les
mêmes règles. Confondre les deux est la principale façon de casser
l'accessibilité de cette page.

| | Hero (`hero/HeroVisual`) | Détail document (`showcase/`) |
|---|---|---|
| Nature | une **image** du produit | le **produit** |
| Interaction | aucune | onglets, versions, aperçu d'accès |
| Balises | `div` stylés — jamais `button` ni `input` | vrais `button`, contrat ARIA complet |
| Lecteur d'écran | un seul `role="img"` + `aria-label` | `tablist` / `tab` / `tabpanel` |
| Tabulation | traversée sans arrêt | arrêts réels, flèches, Home/End |

Autrement dit : un faux champ de recherche qui capte le focus est pire que pas
de champ du tout ; un vrai onglet qui n'annonce pas son état l'est tout autant.
Dans le showcase, la chrome décorative (Partager, Télécharger, …) reste en
`span aria-hidden` — seuls les éléments qui répondent vraiment sont focusables.

### Section Détail document — le mobile

Elle est **réorganisée**, pas réduite :

- le rail de métadonnées (colonne de droite à partir de `md`) devient une
  grille de paires à deux colonnes placée **au-dessus** du contenu — un résumé
  est plus utile qu'une barre d'onglets quand il n'y a pas la place des deux ;
- la barre d'onglets défile horizontalement, avec points d'accrochage et un
  dégradé sur le bord droit. C'est un calque, pas un `mask-image` : un masque
  rognerait aussi l'anneau de focus. Le déplacement du focus au clavier fait
  défiler l'onglet actif dans la vue, il ne reste donc jamais sous le dégradé ;
- le workflow passe de l'horizontale à la verticale, les lignes de version
  abandonnent leur colonne de taille, l'aperçu de page passe au-dessus des
  champs.

Le panneau a un `min-h` : les cinq onglets ont des hauteurs proches, et sans
plancher le cadre se redimensionnerait sous le curseur à chaque changement.

### Section Intelligence documentaire — ce qui est promis

C'est la section la plus facile à rendre malhonnête. Les garde-fous, à tenir :

- **Aucune prétention d'exactitude.** Sur les quatre champs extraits, un
  revient en « needs review ». La phrase « l'extraction est une suggestion,
  pas un verdict » est dans le panneau qui fait la démonstration, pas dans une
  note de bas de page.
- **Le document est un spécimen.** Pas de pays, pas d'armoiries, pas de numéro
  réel — et le numéro s'affiche masqué. Sur une pièce d'identité, c'est le
  minimum.
- **Pas de vocabulaire IA.** « analyser », « extraire », « reconnaissance de
  texte (OCR) ». Pas d'agent, pas de modèle, pas d'étincelles.
- **Pas de chatbot.** Aucune bulle de conversation, aucun champ de prompt.
  L'écran est un document à gauche et une fiche à droite.

Deux points techniques qui comptent :

- Les cadres de détection **entourent la ligne qu'ils désignent** au lieu
  d'être positionnés en pourcentages. Une reformulation ne peut donc pas
  laisser un cadre flotter au-dessus de la mauvaise ligne.
- Tout le flux est **rendu dès le départ** ; seule l'opacité change
  (`<Appear>`). Monter chaque étape à son tour ferait grandir le bloc cinq
  fois pendant la lecture et pousserait le reste de la page vers le bas à
  chaque fois.

La séquence démarre à l'entrée dans le viewport et un bouton **Replay** la
rejoue : rien d'important n'est réservé à qui regardait au bon moment. Sous
`prefers-reduced-motion`, l'état final s'affiche immédiatement et le bouton
disparaît.

### Section Cycle de vie — le tableau *est* la frise

Il n'y a pas d'un côté une liste de documents et de l'autre un schéma
90 / 30 / 7 / 1 / Expiré : chaque document est **tracé sur cet axe**. Quatre
lignes suffisent alors à voir que le passeport a de la marge, que la licence
n'en a plus et que le contrat est hors délai. Un tableau qui liste des dates
est un tableur ; un tableau qui montre la distance à l'échéance est
l'argument produit.

Deux décisions à ne pas défaire :

- **L'axe n'est pas linéaire.** Les cinq arrêts sont équidistants. Sur une
  vraie échelle de temps, 7 j et 1 j se superposeraient dans le dernier
  centimètre de la barre.
- **Les jours restants sont la donnée ; les dates en sont dérivées**
  (`dateIn()`). Une date écrite en dur à côté d'un « dans 87 jours » devient
  fausse le lendemain de la mise en ligne, et rien ne ressemble moins à un
  produit qui fonctionne qu'un tableau de bord dont l'arithmétique ne tombe
  pas juste.

Le marqueur de chaque ligne est porté par le bord droit du segment coloré :
une seule transition de `width` déplace les deux, il n'y a donc rien à
synchroniser. L'anneau qui bat n'apparaît que sur la ligne la plus urgente.

**Aucune statistique.** La section ne prétend nulle part réduire les oublis
d'un pourcentage quelconque : il n'existe pas de chiffre honnête à mettre là.
Elle montre le mécanisme et s'arrête.

### Section « How it works » — la section calme

Son rôle est d'être la plus silencieuse de la page. Tout ce qui l'entoure est
dense — tableaux de bord, journaux d'audit, matrices de permissions — et un
lecteur qui déchiffre des interfaces depuis deux minutes a besoin d'un endroit
où prendre du recul. D'où : quatre phrases courtes, aucun tableau, aucune
micro-typo mono, plus d'air que partout ailleurs. **La retenue est la
fonctionnalité.** Ne pas y ajouter de détails techniques : ils ont déjà leur
section.

Le document est **le même dans les quatre cartes** — même nom, même page.
Seul change ce qui l'entoure : une étiquette, puis une signature, puis un
rappel. Lu de gauche à droite, ce cumul est l'argument : rien de nouveau n'est
demandé au lecteur à chaque étape, le document gagne simplement un contexte
qu'il n'avait pas.

La ligne `Upload → Understand → Manage → Automate` est le modèle mental que le
visiteur doit retenir ; elle apparaît **avant** le détail, mot par mot.

### Section « Pour qui » — distinguer sans casser le système

Les trois panneaux se distinguent par leur **contenu**, pas par une décoration
ajoutée. Un coffre personnel est une courte liste de documents à ne pas
perdre ; un espace d'équipe est un dossier où il y a d'autres gens ; une
organisation est un tableau de services et des politiques qu'on leur applique.
La densité augmente d'un panneau à l'autre parce que c'est ce qui se passe
réellement — et cela permet au lecteur de se situer avant d'avoir fini la
première phrase.

Chacun garde **un** accent pris dans les tokens existants (émeraude, ciel,
violet) : un filet en haut de la carte et une teinte sur l'icône. Rien
d'autre ne change — mêmes surfaces, mêmes filets, même micro-typo mono. Ne pas
introduire de quatrième teinte ni de dégradé propre à une carte.

Cette section porte l'id `#solutions` : l'ancre de navigation qui ne menait
nulle part pointe désormais sur elle.

Pas de logos ni de témoignages dans cette section : ils vivent dans
`#proof`, décrite ci-dessous.

### CTA final et pied de page

Le bloc de fin évite le bandeau coloré avec un bouton dedans par deux
**rappels**, pas par de la décoration :

- **La lumière.** `.bg-halo` est derrière le hero, jetée d'en haut ;
  `.bg-halo-close` est le même dégradé ancré en bas. La page s'ouvre et se
  ferme sous la même lampe. Il n'y en a que deux sur tout le site — ne pas en
  ajouter une troisième.
- **Le rappel des quatre mots** de « How it works », cette fois tous allumés.
  Le visiteur vient de lire onze sections sur ce qui se passe entre eux ; la
  ligne ne veut pas dire la même chose qu'à la première lecture.

### Destinations non publiées — navbar et pied de page

Cinq colonnes de pied de page contiennent des entrées sans page :
*Roadmap, Documentation, Help Center, API, Blog, About, Careers, Privacy,
Terms* — et *Resources* dans la barre de navigation.

Les deux réflexes habituels sont mauvais : les supprimer fait perdre la forme
du produit, les lier vers `/blog` expédie un 404 le jour où quelqu'un clique.
Le champ `href` est donc **optionnel** dans `COLUMNS` (Footer) et dans `LINKS`
(Navbar) ; sans lui, l'entrée s'affiche en texte atténué, non cliquable. Une
seule phrase sous les colonnes l'explique — neuf badges « bientôt » crieraient,
une phrase non.

Le jour où la page existe : ajouter `href`, rien d'autre.

Un script de vérification utile après toute modification de lien :

```bash
grep -rhoE "['\"]#[a-z-]+['\"]" src/ | sort -u   # ancres référencées
grep -rhoE 'id="[a-z-]+"' src/components/marketing/  # ancres existantes
```

### ⚠ URL sortantes — à confirmer avant mise en ligne

`src/lib/links.ts` contient **toutes** les destinations du site. Elles étaient
auparavant recopiées dans six composants, ce qui est exactement la façon dont
un site part en production avec la moitié de ses boutons pointant vers un
domaine que personne ne possède.

Les valeurs actuelles sont **déduites** du `canonical` de `index.html`
(`https://site.kdb.dekoubrown.dev/`), pas d'une source fiable :

```ts
APP_URL       = 'https://app.kdb.dekoubrown.dev'   // à vérifier
CONTACT_EMAIL = 'contact@kdb.dekoubrown.dev'       // à vérifier
```

Une seule édition ici déplace tous les appels à l'action de la page.

### Section Tarifs — des paliers sans prix

Deux choses sont provisoires, et une seule le dit à l'écran.

1. **Les prix.** Non fixés. Chaque palier affiche « Coming soon » ou
   « Talk to us », et la section explique pourquoi, **une fois**, en tête :
   quatre badges identiques sans explication se lisent comme une page cassée,
   pas comme de l'honnêteté. Aucun chiffre, aucune remise, aucune durée
   d'essai, aucune garantie n'est inventé.
2. **La répartition des fonctionnalités entre paliers.** C'est une décision
   commerciale, pas technique. Le découpage dans `pricing/pricing.ts` est un
   premier jet à discuter : toutes les capacités citées **existent**, mais la
   frontière entre Teams et Business est un pari. Les déplacer librement — les
   cartes ne lisent que ce tableau.

`ALWAYS` est l'exception assumée : ce qui ne se vend pas séparément.
L'isolation entre organisations est architecturale, pas un drapeau de
fonctionnalité, et un journal d'audit que seule l'offre chère conserve n'est
pas un journal d'audit. À confirmer commercialement.

**Aucun palier n'est mis en avant comme « recommandé ».** C'est une
affirmation sur les choix des autres, et il n'y a pas encore assez de monde
pour la formuler.

### Section Preuve sociale — construite, pas remplie

`components/marketing/proof/Proof.tsx` est terminée : rangée de logos, trois
cartes de citation, comportement responsive, tout est en place. **Tout le
contenu est dans `proof/proof.ts`** — le jour où les vrais éléments existent,
c'est un seul fichier de données à éditer, pas un composant à reconstruire.

Deux étapes, dans cet ordre :

1. remplir `LOGOS` (chemins vers `public/logos/`) et `QUOTES` ;
2. passer `PLACEHOLDER` à `false`.

La seconde étape est la raison d'être du drapeau. Tant qu'il vaut `true`, la
section **affiche son état** : tuiles en pointillés, citations en italique
grisée, encart « placeholder » au-dessus. C'est délibérément visible. Une
section qui a l'air finie mais contient des éloges inventés est exactement
celle qui part en production par accident, parce qu'elle semble terminée à
quiconque y jette un œil.

Le texte des citations d'attente n'est pas du faux éloge : c'est le **cahier
des charges de chaque emplacement** (« une phrase sur ce qui était difficile
avant — la chose précise, pas “on était désorganisés” »). Utile en attendant,
et impossible à confondre avec un vrai témoignage s'il s'affiche.

Position : la section est en fin de page. Pour remonter la rangée de logos
sous le hero, déplacer `<Proof />` juste après `<Hero />` dans `Home.tsx` —
elle porte son propre ton et rien ne dépend de sa place.

### Section Partage — le dialogue fonctionne vraiment

Niveau d'accès, expiration et les deux interrupteurs modifient le résumé de
droite en temps réel, et la liste « ce que John ne peut toujours pas faire »
est **calculée à partir des réglages** choisis. L'argument de la section est
que les garanties sont des paramètres, pas des promesses ; une capture d'écran
figée d'un formulaire démontrerait exactement l'inverse.

Une règle est *appliquée*, pas décrite : à « Preview only », l'interrupteur de
téléchargement est réellement `disabled`. Un configurateur qui laisse composer
une combinaison que le produit refuserait est pire que pas de configurateur.

### Section Sources connectées — pas un mur de logos

Aucune marque n'est dessinée. Redessiner de mémoire le logo de Google Drive
donnerait un résultat pire que la typographie, et des fichiers officiels ont
leur place dans le dépôt, pas dans un composant. La tuile de gauche dans `Row`
est l'emplacement prévu si des SVG officiels sont ajoutés un jour.

La section est construite comme un **entonnoir d'entrée**, pas comme une liste
d'intégrations : quatre espaces de stockage et trois autres voies convergent
vers le coffre, et le bloc du bas dit ce qui arrive au document *parce qu'il*
est entré (lu, daté, journalisé). L'import est la première étape du cycle de
vie, pas une fonctionnalité posée à côté.

État confirmé côté produit : Google Drive, OneDrive et Dropbox sont
disponibles ; **SharePoint porte le badge « Coming soon »**. Voies d'entrée
disponibles : dépôt depuis l'appareil, adresse e-mail, API.

### Section Workflow — le drapeau « Coming soon »

Chaque étape et chaque état porte un champ `availability: 'live' | 'soon'`
dans `workflow/workflow.ts`. Le composant `<Badge>` **ne rend rien** quand la
valeur est `live` :

```ts
{ id: 'signature', name: 'Signature', availability: 'soon' }  // ← un seul mot
```

C'est volontairement dans ce sens. Un badge qu'il faut *ajouter* plus tard ne
l'est jamais ; un badge qu'il faut *retirer* le jour où la fonctionnalité sort
finit toujours par être retiré.

Aujourd'hui les cinq étapes et les cinq états sont `live` — confirmé côté
produit. Aucun badge ne s'affiche donc, et c'est correct : inventer un
« Coming soon » sur quelque chose qui fonctionne est aussi malhonnête que
l'inverse.

Le retour en arrière de Legal (« Returned for changes », resoumis en v2) est
délibéré. Une visualisation de workflow qui n'affiche que des coches vertes
décrit un processus que personne n'a — et c'est précisément ce détour qui
justifie que la décision soit enregistrée **contre une version**, pas contre
un nom de fichier.

### Sections Sécurité et Auditabilité — les affirmations

Ces deux sections sont les seules du site qui affirment des choses
**vérifiables sur le backend**. Une phrase fausse ici ne coûte pas une
conversion, elle coûte la confiance.

Vocabulaire interdit, définitivement : *military-grade*, *bank-level*,
*unbreakable*, *100 % sécurisé*. Ce ne sont pas des normes. La section le dit
elle-même en préambule, et c'est ce préambule qui rend crédible tout ce qui
suit — ne pas le retirer.

**À revérifier avant toute mise en production** (chaque affirmation doit
correspondre à l'implémentation réelle) :

| Affirmation | Où | À confirmer |
|---|---|---|
| isolation par tenant appliquée par la base | Sécurité, étape 4 + notion 1 | RLS actif sur **toutes** les tables exposées |
| sessions à durée limitée | Sécurité, étape 2 | durée réelle du jeton |
| clé d'objet opaque, chiffré au repos | Sécurité, étape 5 + notion 3 | chiffrement du bucket de stockage |
| entrées d'audit ajoutées, jamais modifiées | Sécurité, étape 6 + Auditabilité | absence d'`UPDATE`/`DELETE` exposé sur la table d'audit |
| lien révocable, expiration, mot de passe, limite de vues | notion 5 | tous présents |
| export du journal en PDF / CSV | Auditabilité | l'export existe-t-il déjà ? |
| rétention et *legal hold* bloquant la suppression | notion 8 | comportement effectif |
| niveau « Preview only » filigrané, sans téléchargement | Partage | le niveau existe-t-il ? |
| commentaire possible via un lien de partage | Partage | « View & comment » |
| révocation immédiate d'un lien | Partage | prise d'effet réelle |
| « les documents sont copiés, l'original reste en place » | Sources | sémantique de l'import |
| OCR à l'arrivée sur les documents importés | Sources, « Read on arrival » | s'applique-t-il aux imports ? |
| l'import apparaît dans le journal d'audit | Sources, « Recorded on arrival » | entrée effectivement écrite |

Aucun condensat (SHA-256 ou autre) n'est affiché nulle part : tant que
l'intégrité par empreinte n'est pas réellement calculée et stockée, elle ne
doit pas apparaître à l'écran.

La frise d'audit est une **liste dépliable**, pas une décoration : vrais
boutons, `aria-expanded`, un seul élément ouvert à la fois. Présenter un
journal d'audit qu'on ne peut pas ouvrir affaiblirait précisément l'argument.

### Transition Problème → Solution

Elle est portée par la surface, pas par un graphique : la colonne se termine
sur le nœud émeraude du produit, puis la section Solution passe en
`tone="raised"` et son bord supérieur reçoit un filet émeraude (via
`before:` sur la `<Section>`). La page se soulève — rien à aligner au pixel
entre deux sections, donc rien à casser.

### Chronologie de l'animation du hero

Une histoire courte, jouée une fois, puis le calme. Un hero qui boucle
indéfiniment concurrence le titre au lieu de le servir.

| t | ce qui se passe |
|---|---|
| 0 s | les cinq documents arrivent dans l'espace de travail, en cascade |
| 3,4 s | le contrat passe de « Awaiting signature » à « Signed », la barre de cycle de vie avance, l'activité s'enrichit |
| 6,0 s | un document arrive : notification, compteur du dossier Contracts 316 → 317 |
| 10,4 s | la notification disparaît |

En continu et discrètement : la frappe dans le champ de recherche, le
battement de l'indicateur de chiffrement, le balayage de la barre de cycle de
vie.

Sous `prefers-reduced-motion`, `HeroVisual` saute directement à l'état final
et le champ de recherche affiche sa requête complète.

## SEO — pourquoi la page est prérendue

Avant, un robot qui n'exécute pas JavaScript recevait ceci, et rien d'autre :

```html
<body><div id="root"></div></body>
```

Google finit par exécuter le JS, mais les dépanneurs de liens (LinkedIn,
Slack, WhatsApp), Bing et à peu près tout le reste ne le font pas — et même
pour Google, une page qui arrive déjà rendue est indexée plus vite.

`npm run build` fait donc trois choses :

1. `vite build` — le bundle client, comme avant ;
2. `vite build --ssr src/entry-server.tsx` — la même application compilée pour
   Node ;
3. `node scripts/prerender.mjs` — rend la page et l'injecte dans
   `dist/index.html`, puis supprime `dist-ssr/`.

**Aucune dépendance ajoutée** : `react-dom/server` est livré avec React. Le
site reste un paquet statique — nginx sert des fichiers, rien ne tourne côté
serveur en production.

`main.tsx` appelle `hydrateRoot` quand `#root` contient déjà du balisage et
`createRoot` sinon, si bien que `npm run dev` fonctionne à l'identique.

**Le script échoue bruyamment.** Un prérendu qui ne produit rien ressemble
exactement à un prérendu réussi, et le problème ne se voit que des semaines
plus tard, sous la forme d'une page qui n'a jamais été indexée. Chaque étape
est donc vérifiée, et le résultat doit contenir le titre principal pour que le
script sorte en 0. Le pipeline le revérifie deux fois : avant l'envoi, et sur
le site en ligne.

### Décalages d'hydratation

Trois valeurs sont calculées à partir de la date du jour et diffèrent donc
entre le moment du build et celui de la visite. Elles portent
`suppressHydrationWarning` — c'est l'outil prévu pour du contenu qui doit
volontairement différer :

- `Lifecycle` — la date d'échéance de chaque ligne ;
- `Lifecycle` — la date du rappel programmé ;
- `panels.tsx` — le décompte « N days left » et la largeur de sa barre.

Toute nouvelle valeur dérivée de `Date.now()` doit faire de même.

### Ce qui est déclaré, et ce qui ne l'est pas

`index.html` contient du JSON-LD : `Organization`, `WebSite`,
`SoftwareApplication`. Volontairement rien d'autre — **pas** d'`aggregateRating`
(aucun avis n'existe), **pas** d'`offers` (aucun prix n'est fixé), aucune date
de fondation devinée. Les données structurées sont le seul endroit où une
affirmation fausse est lisible par une machine, ce qui en fait un très mauvais
endroit où se faire prendre.

`public/robots.txt` et `public/sitemap.xml` ne listent qu'une URL. Les ancres
(`#pricing`, `#security`…) ne sont pas des pages : un sitemap rempli de
fragments du même document signale surtout un site qui essaie de paraître plus
grand qu'il n'est.

## Déploiement

Branché. `deploy-dev.yml` (dépôt web) construit les deux projets à chaque push
sur `develop` :

| | source | publié dans | servi sur |
|---|---|---|---|
| SPA | `src/` | `releases/<sha>/web` | `APP_HOST` |
| Site public | `marketing/` | `releases/<sha>/site` | `SITE_HOST` |

`marketing/package-lock.json` **doit être versionné** — `npm ci` en dépend.

Une variable GitHub reste à créer pour que le test de fumée du site s'exécute :
`SITE_HOST` = `site.kdb.dekoubrown.dev`
(Settings → Secrets and variables → Actions → Variables). Sans elle, le
pipeline avertit et continue.

L'ancien dossier `site/` n'est plus construit ni déployé ; il peut être
supprimé du dépôt.
