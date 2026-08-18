import type { en } from './en'

/**
 * Français.
 *
 * Typed as `typeof en`: a missing key, a misspelt key or an extra one is a
 * compile error, not a string that reads `hero.title` in production.
 *
 * Translated rather than transposed. The English copy leans on short verbless
 * sentences that read as curt in French, so several are rebuilt around a verb.
 * Product nouns are left alone — KDB Doc Vault, PDF, OCR, API, and the file
 * names inside the mockups, because a francophone office does not rename its
 * PDFs either.
 *
 * Typography follows French rules: narrow no-break spaces before `? ! ; :` and
 * inside « guillemets », written as   so they cannot be collapsed by an
 * editor.
 */
export const fr: typeof en = {
  meta: {
    lang: 'fr',
    title: 'KDB Doc Vault — Vos documents méritent mieux qu’un dossier.',
    description:
      'Un seul endroit sécurisé pour conserver, organiser, rechercher, partager, signer et gérer vos documents — de leur arrivée à leur archivage.',
    ogDescription:
      'La gestion documentaire sécurisée, pour les particuliers, les équipes et les organisations.',
    ogLocale: 'fr',
    ogImageAlt: 'L’espace de travail KDB Doc Vault.',
    jsonLdDescription:
      'Conserver, organiser, rechercher, partager, signer et gérer des documents tout au long de leur cycle de vie, avec rappels d’échéance, accès contrôlé et journal d’audit complet.',
  },

  common: {
    getStarted: 'Commencer',
    seeHow: 'Voir comment ça marche',
    signIn: 'Se connecter',
    comingSoon: 'Bientôt disponible',
    languageLabel: 'Langue',
    switchToEnglish: 'English',
    switchToFrench: 'Français',
  },

  nav: {
    skip: 'Aller au contenu',
    home: 'KDB Doc Vault — accueil',
    openMenu: 'Ouvrir le menu',
    closeMenu: 'Fermer le menu',
    tagline:
      'La gestion documentaire sécurisée, pour les particuliers, les équipes et les organisations.',
    links: {
      product: 'Produit',
      solutions: 'Solutions',
      security: 'Sécurité',
      features: 'Fonctionnalités',
      pricing: 'Tarifs',
      resources: 'Ressources',
    },
  },

  hero: {
    badge: 'Chiffré, versionné, auditable',
    title: 'Vos documents méritent mieux qu’un dossier.',
    lead: 'KDB Doc Vault vous donne un seul endroit sécurisé pour conserver, organiser, rechercher, partager, signer et gérer vos documents — de leur arrivée à leur archivage.',
    trust:
      'La gestion documentaire sécurisée, pour les particuliers, les équipes et les organisations.',
    visualLabel:
      'L’espace de travail KDB Doc Vault : dossiers, documents récents avec leur statut de signature et d’échéance, partage sécurisé et fil d’activité.',
    workspace: 'Espace de travail',
    encrypted: 'Chiffré',
    folders: 'Dossiers',
    storage: 'Stockage',
    recent: 'Documents récents',
    filterAll: 'Tous',
    upload: 'Déposer',
    lifecycle: 'Cycle de vie',
    retain: 'conserver 10 ans',
    activity: 'Activité',
    secureLink: 'Lien sécurisé',
    linkRules: 'Mot de passe · expire dans 7 jours · 2 vues sur 5',
    addedTo: 'Ajouté à Contrats · chiffré',
    searchPhrases: [
      'contrats expirant ce trimestre',
      'signés par Marie Ndongo',
      'factures · Sofrigaz SA',
    ],
    folderNames: {
      all: 'Tous les documents',
      contracts: 'Contrats',
      invoices: 'Factures',
      hr: 'RH & paie',
      compliance: 'Conformité',
      archive: 'Archives',
    },
    docs: {
      msa: 'Contrat-cadre de services — Sofrigaz SA',
      tax: 'Attestation fiscale 2026',
      lease: 'Bail d’entrepôt — Bonabéri',
      payroll: 'Registre de paie — juillet 2026',
      minutes: 'Procès-verbal du conseil — T1 2026',
      amendment: 'Avenant n° 2 — Sofrigaz SA',
    },
    status: {
      signed: 'Signé',
      awaiting: 'Signature attendue',
      expiring: 'Bientôt expiré',
      expiresIn12: 'Expire dans 12 jours',
      draft: 'Brouillon',
      archived: 'Archivé',
    },
    steps: ['Reçu', 'En revue', 'Signé', 'Archivé'],
    when: {
      justNow: 'À l’instant',
      now: 'maintenant',
      minutes2: 'il y a 2 min',
      hour1: 'il y a 1 h',
      yesterday: 'Hier',
      days3: 'il y a 3 jours',
      apr12: '12 avr.',
    },
    events: {
      shared: 'a partagé un lien sécurisé vers',
      archived: 'a archivé',
      flagged: 'a signalé une échéance sur',
      signedDoc: 'a signé',
      uploaded: 'a déposé',
    },
    eventTargets: {
      auditPack: 'le dossier d’audit T2',
      minutesQ1: 'Procès-verbal — T1',
      taxClearance: 'Attestation fiscale',
      msa: 'Contrat-cadre de services',
      amendment: 'Avenant n° 2',
    },
    system: 'Système',
  },

  problem: {
    eyebrow: 'Le problème',
    title: 'Un document ne devrait pas devenir un problème une fois enregistré.',
    lead: 'Enregistrer un fichier est la partie facile. Ce qui suit — le retrouver, savoir quelle copie fait foi, se souvenir qu’il expire, savoir qui l’a consulté — voilà où le travail s’accumule sans bruit.',
    turn: 'Rien de tout cela n’est un problème de stockage. C’est un problème de cycle de vie.',
    stages: {
      scattered: {
        name: 'Fichiers éparpillés',
        note: 'Un document est enregistré là où il est arrivé : un ordinateur portable, une conversation, une boîte mail. Chaque copie dérive ensuite pour son compte.',
      },
      context: {
        name: 'Contexte perdu',
        note: 'Une fois les copies créées, il ne reste que le nom du fichier pour s’y retrouver — et un nom de fichier ignore ce qu’il contient.',
      },
      deadlines: {
        name: 'Échéances manquées',
        note: 'Un document qui porte une date est un engagement. Rangé comme un simple fichier, il n’a aucun moyen de le rappeler à qui que ce soit.',
      },
      security: {
        name: 'Risques de sécurité',
        note: 'Ce qu’on partage pour faire avancer les choses continue généralement de circuler — et il est alors impossible de revenir en arrière pour savoir où c’est allé.',
      },
    },
    captions: {
      devices: 'Des fichiers importants dispersés sur plusieurs appareils.',
      buried: 'Des documents enfouis dans des dossiers.',
      versions: 'Des équipes qui ignorent quelle version fait foi.',
      search: 'Retrouver un document précis prend trop de temps.',
      expiry: 'Des attestations expirées sans que personne l’ait vu.',
      renewal: 'Des contrats difficiles à suivre.',
      sharing: 'Des documents sensibles partagés sans contrôle.',
      history: 'Aucun historique clair de qui a consulté un document.',
    },
    artifacts: {
      laptop: 'Ordinateur',
      whatsapp: 'WhatsApp',
      email: 'E-mail',
      pathSegments: ['Documents', '2024', 'Admin', 'Scans', 'Nouveau dossier', 'à trier', 'final', 'ok'],
      pathNote: 'Onze niveaux de profondeur, trois personnes, trois conventions.',
      whichOne: 'Laquelle le client a-t-il signée ?',
      searchQuery: 'sofrigaz avenant',
      searchNote: 'Aucun résultat — les noms de fichiers ne contiennent pas ce qu’il y a dedans.',
      expired: 'Expirée depuis 4 mois',
      expiredNote: 'Personne n’a été prévenu. Rien n’avait été programmé.',
      maintenance: 'Contrat de maintenance',
      renewed: 'Reconduit tacitement · 12 mois',
      renewedNote: 'Le préavis s’est refermé deux semaines avant que quelqu’un ne regarde.',
      shareTags: ['transféré ×3', 'sans expiration', 'sans mot de passe'],
      accessHistory: 'Historique d’accès',
      noRecord: 'Aucune trace conservée',
    },
  },

  solution: {
    eyebrow: 'Le système',
    title: 'Faites de vos documents un système organisé.',
    lead: 'KDB Doc Vault ne se contente pas de stocker des fichiers. Il gère le cycle de vie qui les entoure.',
    store: {
      title: 'Conserver',
      copy: 'Conservez vos documents en sécurité et gardez-les organisés — chaque version est conservée, rien n’est écrasé.',
      note: 'Chiffré au repos · versionné',
    },
    find: {
      title: 'Retrouver',
      copy: 'Cherchez par métadonnées et par contenu extrait, pour que le nom du fichier cesse d’être la seule porte d’entrée.',
      query: 'clause de résiliation',
      result: 'Contrat-cadre de services',
      snippetBefore: '« …chaque partie peut notifier la ',
      snippetMatch: 'résiliation',
      snippetAfter: ' au plus tard… »',
      tags: ['type : contrat', 'partie : Sofrigaz', 'signé 2026'],
    },
    protect: {
      title: 'Protéger',
      copy: 'Décidez qui peut consulter, télécharger ou partager un document — dans le coffre comme en dehors.',
      columns: ['Voir', 'Obtenir', 'Partager'],
      roles: { owner: 'Propriétaire', member: 'Membre', guest: 'Invité' },
      note: 'Les liens portent les mêmes règles — et une expiration.',
    },
    collaborate: {
      title: 'Collaborer',
      copy: 'Partagez et faites circuler validations et circuits d’approbation, sans une seule pièce jointe.',
      step: 'Validation · étape 3 sur 4',
      note: 'Aïcha doit valider · 2 commentaires ouverts',
    },
    track: {
      title: 'Suivre',
      copy: 'Sachez ce qui est arrivé à vos documents importants : qui les a ouverts, quand, et ce qui a changé.',
      events: ['a consulté v4', 'a téléchargé', 'a créé un lien'],
      note: 'En ajout seul. Exportable. Rien ne peut être effacé.',
    },
    automate: {
      title: 'Automatiser',
      copy: 'Prenez en charge échéances, rappels, circuits et traitements avant que quiconque ait à y penser.',
      when: 'quand',
      inWords: 'dans',
      days30: '30 jours',
      then: 'alors',
      action: 'prévenir le propriétaire',
      plus: '+',
      legal: 'Juridique',
      expiry: 'échéance',
      also: 'Aussi : OCR au dépôt',
    },
  },

  how: {
    eyebrow: 'Comment ça marche',
    title: 'Du fichier au document géré.',
    lead: 'Tout le reste de cette page se passe à l’intérieur de ces quatre étapes.',
    model: ['Déposer', 'Comprendre', 'Gérer', 'Automatiser'],
    steps: {
      upload: { name: 'Déposer', copy: 'Faites entrer votre document.' },
      organize: { name: 'Organiser', copy: 'Classez-le, étiquetez-le, enrichissez-le.' },
      manage: { name: 'Gérer', copy: 'Partagez, validez, signez, suivez et collaborez.' },
      automate: {
        name: 'Automatiser',
        copy: 'Laissez rappels, circuits d’approbation et lecture automatique prendre en charge le répétitif.',
      },
    },
    doc: {
      tags: ['contrat', '2026'],
      signed: 'Signé',
      renews: 'Reconduction dans 12 mois',
    },
  },

  showcase: {
    eyebrow: 'Détail d’un document',
    title: 'Tout ce qui compte sur un document. Au même endroit.',
    lead: 'Un fichier vous donne son nom et sa taille. Un document dans KDB Doc Vault vous dit à qui il appartient, ce qu’il remplace, qui l’a ouvert, ce qu’il attend, et ce qui se passera le jour où il expirera.',
    hint: 'Celui-ci est réel — changez d’onglet, choisissez une version, prévisualisez un niveau d’accès.',
    tablist: 'Sections du document',
    tabs: {
      overview: 'Aperçu',
      versions: 'Versions',
      activity: 'Activité',
      permissions: 'Permissions',
      workflow: 'Circuit',
    },
    meta: {
      status: 'Statut',
      owner: 'Propriétaire',
      created: 'Créé le',
      expires: 'Expire le',
      version: 'Version',
      access: 'Accès',
    },
    doc: {
      subtitle: 'Contrat-cadre — prestations logistiques',
      owner: 'Direction financière',
      created: '12 août 2026',
      expires: '12 août 2027',
      access: 'Équipe Finance',
      active: 'Actif',
      pages: 'pages',
      retention:
        'Chiffré au repos. Soumis à une règle de conservation de 10 ans — la suppression reste bloquée jusqu’à son terme.',
    },
    overview: {
      description:
        'Contrat-cadre couvrant les prestations logistiques pour la période 2026-2027, signé par les deux parties.',
      fields: {
        description: 'Description',
        reference: 'Référence',
        tags: 'Étiquettes',
        linked: 'Liés',
      },
      tags: ['contrat', 'logistique', 'signé'],
      linked: ['Avenant n° 1', 'Bon de commande 4412'],
      term: 'Durée',
      daysLeft: 'jours restants',
    },
    versions: {
      current: 'actuelle',
      note: 'Chaque version est conservée. Rien n’est écrasé, et n’importe quelle version peut être restaurée ou comparée.',
      notes: {
        v4: 'Ajout de la clause 12.3 — préavis de résiliation porté à 90 jours.',
        v3: 'Commentaires de la revue juridique appliqués.',
        v2: 'Annexes A et B jointes.',
        v1: 'Dépôt initial.',
      },
    },
    activity: {
      note: 'En ajout seul. Rien ne peut être effacé, et le journal s’exporte en PDF ou en CSV.',
      events: {
        viewed: {
          action: 'a consulté le document',
          at: 'Aujourd’hui · 09:41',
          meta: 'Web · Douala · v4',
        },
        approved: { action: 'a validé', at: '14 août · 16:20', meta: 'Validation étape 2 sur 2' },
        shared: {
          action: 'a partagé avec le juridique',
          at: '13 août · 11:05',
          meta: 'Lien sécurisé · lecture seule · expire dans 7 jours',
        },
        uploaded: {
          action: 'a déposé la v4',
          at: '14 août · 09:12',
          meta: 'Remplace la v3 · version précédente conservée',
        },
        created: {
          action: 'a créé le document',
          at: '12 août · 08:30',
          meta: 'Dossier : Contrats / Actifs',
        },
      },
    },
    permissions: {
      previewAs: 'Prévisualiser l’accès en tant que',
      capabilities: ['Voir', 'Télécharger', 'Partager', 'Supprimer'],
      principals: {
        finance: {
          name: 'Équipe Finance',
          detail: '5 membres',
          role: 'Éditeur',
          summary:
            'Accès complet. Les membres peuvent repartager en interne, mais ne peuvent pas supprimer un document sous conservation.',
        },
        legal: {
          name: 'Juridique',
          detail: '2 membres',
          role: 'Relecteur',
          summary:
            'Lecture et téléchargement pour revue. Pas de repartage — le lien reçu ne va pas plus loin.',
        },
        guest: {
          name: 'Lien invité',
          detail: 'Conseil externe',
          role: 'Lecteur',
          summary:
            'Aperçu filigrané dans le navigateur. Expire dans 7 jours, 2 vues sur 5 utilisées, mot de passe requis.',
        },
      },
    },
    workflow: {
      steps: [
        { name: 'Rédigé', at: '12 août' },
        { name: 'Revue juridique', at: '13 août' },
        { name: 'Validé', at: '14 août' },
        { name: 'Actif', at: 'maintenant' },
        { name: 'Reconduction', at: 'mai 2027' },
      ],
      rulesTitle: 'Règles attachées à ce document',
      rules: [
        { when: '90 jours avant l’échéance', then: 'prévenir Finance + Juridique' },
        { when: 'à la validation', then: 'classer dans Contrats / Actifs' },
        { when: 'à l’échéance', then: 'archiver · conserver 10 ans' },
      ],
      next: 'Suite : revue de reconduction confiée à Finance, ouverture le 14 mai 2027.',
    },
  },

  sources: {
    eyebrow: 'Sources connectées',
    title: 'Vos documents n’ont pas à commencer dans le coffre.',
    lead: 'Faites venir vos documents depuis les services que vous utilisez déjà et gérez-les depuis un seul espace sécurisé.',
    cloudTitle: 'Stockage cloud',
    routesTitle: 'Et les autres voies d’entrée',
    copied: 'Les documents sont copiés. L’original reste où il est.',
    drives: {
      google: 'Choisissez un dossier. Les fichiers arrivent avec leurs noms et leurs dates.',
      onedrive: 'Compte personnel ou professionnel.',
      dropbox: 'Y compris les dossiers partagés auxquels vous avez déjà accès.',
      sharepoint: 'Bibliothèques de documents, avec leur structure existante.',
    },
    routes: {
      device: {
        name: 'Dépôt depuis cet appareil',
        note: 'Un fichier, ou un dossier entier, glissé directement.',
      },
      email: {
        name: 'Adresse e-mail dédiée',
        note: 'Transférez une pièce jointe à l’adresse d’un dossier : elle se classe toute seule.',
      },
      api: {
        name: 'Vos propres systèmes',
        note: 'Envoyez des documents par l’API avec une clé à portée limitée.',
      },
    },
    after: {
      read: {
        title: 'Lu à l’arrivée',
        copy: 'Le texte est extrait dès l’entrée : un document importé est cherchable par son contenu le jour même, et pas seulement par le nom qu’il portait.',
      },
      dated: {
        title: 'Daté à l’arrivée',
        copy: 'Les règles d’échéance et de conservation s’appliquent dès l’entrée dans le coffre : un contrat importé est surveillé immédiatement.',
      },
      recorded: {
        title: 'Journalisé à l’arrivée',
        copy: 'L’import est une entrée du journal comme une autre : quelle source, qui l’a connectée, et ce qui est entré.',
      },
    },
  },

  intelligence: {
    eyebrow: 'Lecture des documents',
    title: 'Vos documents peuvent vous dire ce qu’ils contiennent.',
    lead: 'KDB Doc Vault peut analyser le contenu d’un document, en extraire des informations utiles et rendre vos documents plus faciles à chercher et à gérer.',
    steps: ['Déposer', 'Analyser', 'Extraire', 'Classer', 'Rechercher'],
    stepsLabel: 'Comment un document est traité',
    ocrNote:
      'La reconnaissance de texte (OCR) s’applique à l’image de la page : un scan devient aussi lisible qu’un fichier natif.',
    extracted: 'Champs extraits',
    found: '4 trouvés · 1 à vérifier',
    masked: 'masqué',
    confident: 'fiable',
    needsReview: 'à vérifier',
    fields: {
      type: { label: 'Type de document', value: 'Passeport' },
      name: { label: 'Nom', value: 'John Doe' },
      number: { label: 'Numéro du document', value: 'XXXXXXXX' },
      expiry: { label: 'Expiration', value: '12 mars 2029' },
    },
    honesty:
      'L’extraction est une proposition, pas un verdict. Les champs arrivent à l’état de brouillon, quelqu’un les confirme, et cette confirmation est journalisée comme toute autre action sur le document.',
    filed: 'Classé automatiquement',
    folder: 'Conformité / Pièces d’identité',
    tags: ['passeport', 'identité', 'expire-2029'],
    rule: '90 jours avant le 12 mars 2029 → prévenir le propriétaire',
    findable: 'Retrouvable ensuite',
    query: 'documents expirant en 2029',
    foundNote:
      'Trouvé sur un champ que personne n’a saisi — et sur les mots contenus dans la page.',
    replay: 'Rejouer',
    sheet: {
      passport: 'PASSEPORT',
      specimen: 'SPÉCIMEN',
      surname: 'Nom / Prénoms',
      documentNo: 'N° du document',
      nationality: 'Nationalité',
      expiry: 'Date d’expiration',
      labels: { type: 'type', name: 'nom', number: 'numéro', expiry: 'échéance' },
    },
  },

  lifecycle: {
    eyebrow: 'Cycle de vie',
    title: 'Ne découvrez plus jamais un document expiré trop tard.',
    lead: 'KDB Doc Vault garde les dates importantes attachées aux documents auxquels elles appartiennent et vous aide à agir avant que les échéances ne deviennent des problèmes.',
    boardTitle: 'Reconductions & échéances',
    boardCount: '4 documents · 1 à échéance demain',
    expired: 'Expiré',
    expiresTomorrow: 'Expire demain',
    expiresIn: (days: number) => `Expire dans ${days} jours`,
    ladderTitle: 'Ce qui se passe à l’approche de la date',
    remindersTitle: 'Rappels envoyés',
    ctaTitle: 'Gardez une longueur d’avance sur vos documents',
    ctaLead: 'Ajoutez une date à n’importe quel document. KDB Doc Vault s’occupe de la suite.',
    docs: {
      passport: { name: 'Passeport', detail: 'Pièce d’identité', owner: 'M. Ndongo' },
      insurance: { name: 'Assurance', detail: 'Flotte de véhicules', owner: 'Exploitation' },
      licence: {
        name: 'Licence commerciale',
        detail: 'Registre du commerce — Littoral',
        owner: 'Juridique',
      },
      contract: { name: 'Contrat', detail: 'Contrat-cadre — Sofrigaz SA', owner: 'Finance' },
    },
    ladder: [
      {
        at: '90 jours',
        action:
          'Le propriétaire est prévenu et une tâche de reconduction est ouverte sur le document lui-même.',
      },
      {
        at: '30 jours',
        action:
          'Le rappel s’étend à toutes les personnes qui partagent le dossier : ce n’est plus la mémoire d’une seule personne.',
      },
      {
        at: '7 jours',
        action:
          'Un rappel quotidien, et le document est signalé partout où il apparaît dans le coffre.',
      },
      {
        at: '1 jour',
        action: 'Notification push sur les appareils enregistrés, en plus de l’e-mail.',
      },
      {
        at: 'Expiré',
        action:
          'L’accès suit la politique que vous avez définie, le document part aux archives, et le journal d’audit consigne le tout.',
      },
    ],
    reminders: {
      contract: {
        title: 'Le contrat expire demain',
        meta: 'Push vers 3 appareils · Finance',
        at: 'à l’instant',
      },
      licence: {
        title: 'Licence commerciale — 7 jours restants',
        meta: 'E-mail au juridique · chaque jour jusqu’au renouvellement',
        at: 'il y a 2 h',
      },
      insurance: {
        title: 'Tâche de reconduction assignée — Assurance',
        meta: 'Aïcha Bello · échéance dans 32 jours',
        at: 'hier',
      },
      passport: {
        title: 'Rappel programmé — Passeport',
        meta: (date: string) => `Préavis de 30 jours le ${date}`,
        at: 'en attente',
      },
    },
  },

  sharing: {
    eyebrow: 'Partage sécurisé',
    title: 'Partagez un document sans en perdre le contrôle.',
    lead: 'Donnez accès au document dont quelqu’un a besoin, sans donner accès à tout ce qui l’entoure.',
    dialogTitle: 'Partager le document',
    fields: {
      recipient: 'Destinataire',
      accessLevel: 'Niveau d’accès',
      expiration: 'Expiration',
    },
    external: 'externe',
    levels: {
      preview: {
        label: 'Aperçu seul',
        note: 'Filigrané, dans le navigateur. Le téléchargement n’est pas disponible à ce niveau.',
      },
      view: { label: 'Consultation', note: 'Lire le document tel quel, rien de plus.' },
      comment: {
        label: 'Consultation & commentaires',
        note: 'Lire et laisser des commentaires, qui restent sur le document.',
      },
    },
    expiries: {
      h24: { label: '24 heures', phrase: 'dans 24 heures' },
      h48: { label: '48 heures', phrase: 'dans 48 heures' },
      d7: { label: '7 jours', phrase: 'dans 7 jours' },
      never: { label: 'Sans expiration', phrase: 'jamais' },
    },
    neverWarning: 'Un lien sans expiration est celui que personne ne pense à révoquer.',
    password: {
      label: 'Protection par mot de passe',
      hint: 'John reçoit le mot de passe séparément, pas dans le message qui contient le lien.',
    },
    download: {
      label: 'Autorisation de téléchargement',
      hintPreview:
        'Indisponible en « Aperçu seul » — le document ne quitte jamais le navigateur.',
      hintOn: 'Chaque téléchargement est consigné dans le journal du document.',
    },
    sharedWith: 'Partagé avec John Doe',
    expiresPrefix: 'Expire ',
    noExpirySet: 'Aucune expiration définie',
    chips: {
      passwordOn: 'Mot de passe requis',
      passwordOff: 'Sans mot de passe',
      downloadOn: 'Téléchargement autorisé',
      downloadOff: 'Téléchargement bloqué',
    },
    cannotTitle: 'Ce que John ne peut toujours pas faire',
    cannot: {
      browse: 'Parcourir le dossier où se trouve ce document.',
      others: 'Voir un autre document de votre coffre.',
      afterExpiry: 'Ouvrir le lien une fois expiré.',
      afterRevoke: 'Conserver l’accès une fois le lien révoqué.',
      downloadTracked: 'Le télécharger sans que cela apparaisse dans le journal.',
      save: 'En garder une copie — le document ne quitte jamais le navigateur.',
    },
    revoke:
      'Révoquez le lien à tout moment et il cesse de fonctionner — inutile d’attendre l’expiration que vous aviez fixée.',
  },

  security: {
    eyebrow: 'Sécurité',
    title: 'Conçu pour des documents que vous ne voudriez pas voir circuler.',
    lead: 'Chaque demande d’accès à un document franchit les mêmes six points de contrôle, dans le même ordre, à chaque fois. Voici ce que chacun fait réellement.',
    disclaimerBefore: 'Vous ne trouverez ni ',
    disclaimerWords: ['sécurité militaire', 'niveau bancaire', 'inviolable'],
    disclaimerOr: ' ni ',
    disclaimerAfter:
      ' sur cette page. Aucun de ces termes n’est une norme. Ce qui suit, ce sont des mécanismes vérifiables.',
    restTitle: 'Le reste, en clair',
    stages: {
      user: {
        name: 'Utilisateur',
        question: 'Qui demande ?',
        plain:
          'Une requête arrive d’une personne sur un appareil — rien n’est encore tenu pour acquis.',
        line: 'GET /documents/019f…c41/content',
        faint: 'depuis une session navigateur · aucune hypothèse',
      },
      auth: {
        name: 'Authentification',
        question: 'Êtes-vous bien qui vous dites être ?',
        plain:
          'La connexion est vérifiée puis transformée en session à durée limitée.',
        line: 'session · émise 09:14 · expire 21:14',
        faint: 'les sessions expirées ou révoquées s’arrêtent ici',
      },
      authz: {
        name: 'Autorisation',
        question: 'Avez-vous le droit de faire cela, sur ce document ?',
        plain:
          'L’action est confrontée au rôle que vous détenez et aux règles posées sur ce document.',
        lineBefore: 'requiert ',
        lineMiddle: ' · rôle ',
        faint: 'la réponse vaut par action, pas par connexion',
      },
      tenant: {
        name: 'Isolation par organisation',
        question: 'Quelles données pouvez-vous seulement voir ?',
        plain:
          'Les lignes de votre organisation sont séparées par la base de données elle-même, sous chaque requête écrite par l’application.',
        lineBefore: 'tenant = ',
        lineAfter: ' · posé par le serveur',
        faint:
          'une erreur dans l’application ne peut toujours pas renvoyer la ligne d’une autre organisation',
      },
      document: {
        name: 'Document',
        question: 'Qu’est-ce qui revient réellement ?',
        plain:
          'Le fichier est servi depuis un stockage chiffré, via un lien qui expire en quelques minutes.',
        line: 'clé d’objet · opaque · chiffré au repos',
        faint: 'le chemin de stockage ne révèle rien du document',
      },
      audit: {
        name: 'Journal d’audit',
        question: 'Qu’est-ce qui a été consigné ?',
        plain:
          'L’action devient une entrée : qui, quoi, quand. Les entrées sont ajoutées, jamais modifiées.',
        line: '+ consulté · marie@… · 09:41 · v4',
        faint: 'ajouté — voir le journal plus bas',
      },
    },
    concepts: {
      tenant: {
        name: 'Isolation par organisation',
        copy: 'Chaque ligne appartient à une organisation, et la base de données l’impose à chaque requête. Les données d’une autre organisation ne vous sont pas cachées — elles sont hors d’atteinte.',
      },
      roles: {
        name: 'Accès par rôle',
        copy: 'Propriétaire, administrateur, membre. Ce qu’une personne peut faire découle du rôle qu’elle détient, pas du lien qu’on lui a transféré.',
      },
      encryption: {
        name: 'Chiffrement',
        copy: 'Les documents sont chiffrés en transit et au repos. Les clés d’objet sont opaques : un chemin de stockage ne dit rien de ce qu’il contient.',
      },
      audit: {
        name: 'Journaux d’audit',
        copy: 'Chaque action qui modifie un document ajoute une entrée. Les entrées sont ajoutées — l’application n’offre aucun moyen d’en modifier ou d’en supprimer une.',
      },
      sharing: {
        name: 'Partage sécurisé',
        copy: 'Un lien porte ses propres règles : une date d’expiration, un nombre de vues, un mot de passe facultatif. Il peut être révoqué, et la révocation est immédiate.',
      },
      versions: {
        name: 'Intégrité des versions',
        copy: 'Une nouvelle version n’écrase jamais l’ancienne. Chacune est stockée séparément et reste accessible : « la version actuelle » devient un fait, pas une convention.',
      },
      access: {
        name: 'Contrôles d’accès',
        copy: 'Consulter, télécharger, partager et supprimer s’accordent séparément, par document et par dossier — pas regroupés dans une permission nommée « accès ».',
      },
      retention: {
        name: 'Conservation',
        copy: 'Une règle de conservation bloque la suppression jusqu’à son terme. Une mise sous scellés la bloque quelle que soit la règle, et les deux sont consignées.',
      },
    },
  },

  audit: {
    eyebrow: 'Auditabilité',
    title: 'Savoir ce qui s’est passé. Pas seulement où est le fichier.',
    lead: 'Chaque action importante sur un document peut devenir un historique traçable — attaché au document, conservé aussi longtemps que lui.',
    panelTitle: 'Journal d’audit',
    filter: 'Toutes les actions',
    export: 'Exporter',
    appended: 'Ajouté, jamais modifié',
    kept: 'Conservé avec le document, aussi longtemps que lui',
    whyTitle: 'Pourquoi les organisations le demandent',
    entries: {
      upload: {
        time: '10:42',
        action: 'Document déposé',
        role: 'Propriétaire',
        detail: [
          { label: 'Version', value: 'v1 · 412 Ko · PDF' },
          { label: 'Dossier', value: 'Contrats / Actifs' },
          { label: 'Origine', value: 'Web · Douala' },
        ],
      },
      review: {
        time: '11:03',
        action: 'Revue juridique effectuée',
        role: 'Relectrice',
        detail: [
          { label: 'Résultat', value: 'Revue terminée · 2 commentaires laissés' },
          { label: 'Sur la version', value: 'v1' },
          { label: 'Demandée par', value: 'Marie Ndongo · 10:44' },
        ],
      },
      approve: {
        time: '11:17',
        action: 'Validation de la direction',
        role: 'Validateur',
        detail: [
          { label: 'Étape', value: 'Validation 2 sur 2 — circuit terminé' },
          { label: 'Sur la version', value: 'v1' },
          { label: 'Note', value: '« Validé sous réserve du préavis modifié. »' },
        ],
      },
      share: {
        time: '11:19',
        action: 'Document partagé',
        role: 'Propriétaire',
        detail: [
          { label: 'Avec', value: 'Conseil externe · lien sécurisé' },
          { label: 'Règles', value: 'Lecture seule · expire dans 7 jours · mot de passe requis' },
          { label: 'Utilisé', value: '2 vues sur 5' },
        ],
      },
      v2: {
        time: '11:25',
        action: 'Version 2 créée',
        role: 'Propriétaire',
        detail: [
          { label: 'Changement', value: 'v1 → v2 · préavis porté à 90 jours' },
          { label: 'Précédente', value: 'v1 conservée et toujours accessible' },
          { label: 'Prévenus', value: 'Juridique, Finance' },
        ],
      },
    },
    reasons: {
      dispute: {
        title: 'En cas de désaccord',
        copy: 'Qui a validé, sur quelle version et à quelle heure cesse d’être un souvenir. C’est une trace, avec son horodatage à côté.',
      },
      audited: {
        title: 'En cas d’audit',
        copy: 'Exportez l’historique d’un document, d’un dossier ou d’une période. Personne n’a à reconstituer une année de mémoire et de boîte mail.',
      },
      leaver: {
        title: 'Quand quelqu’un s’en va',
        copy: 'Le journal appartient au document, pas à la personne qui s’en occupait. Une passation ne dépend plus du contenu d’une seule boîte mail.',
      },
    },
  },

  workflow: {
    eyebrow: 'Circuits',
    title: 'Un document peut faire avancer le travail.',
    lead: 'Vos documents peuvent participer à des circuits structurés au lieu de vivre à côté de vos processus — la validation se fait sur le document, pas dans un fil de discussion à son sujet.',
    exampleTitle: 'Nouveau contrat fournisseur',
    versionNote:
      'Chaque décision est enregistrée sur la v2 — valider une version n’en valide jamais silencieusement une autre.',
    approved: 'Validé',
    approvedNote: 'Les trois validations enregistrées · envoyé à la signature de Groupe Sicam',
    statesTitle: 'Les états possibles d’un document',
    stages: {
      upload: {
        name: 'Dépôt',
        blurb:
          'Le document entre dans le coffre et le processus part de lui, pas d’un e-mail à son sujet.',
      },
      review: {
        name: 'Revue',
        blurb:
          'Commentaires et mentions se posent sur le document lui-même : la discussion reste là où est le fichier.',
      },
      approval: {
        name: 'Validation',
        blurb:
          'Des validateurs désignés, dans l’ordre. Chaque décision est consignée avec son auteur et son heure.',
      },
      signature: {
        name: 'Signature',
        blurb: 'Une fois validé, le document part à la signature sans quitter le coffre.',
      },
      archive: {
        name: 'Archivage',
        blurb:
          'Quand le circuit se referme, le document est classé et conservé selon sa règle de rétention.',
      },
    },
    steps: {
      finance: {
        party: 'Finance',
        at: '12 août · 09:20',
        note: 'Ligne budgétaire confirmée pour l’exercice 2026.',
      },
      legal: {
        party: 'Juridique',
        at: '13 août · 14:02',
        note: 'Renvoyé une fois pour modifier le préavis — resoumis en v2 et validé à 16:41.',
      },
      management: {
        party: 'Direction',
        at: 'en attente depuis le 14 août · 08:05',
        note: 'Dernière validation avant l’envoi à la signature.',
        resolvedAt: '14 août · 11:26',
      },
    },
    states: {
      pending: {
        label: 'Validation en attente',
        copy: 'Chez une personne nommée, pas chez « l’équipe ». Cela apparaît dans sa file et dans le statut du document.',
      },
      approved: {
        label: 'Validé',
        copy: 'Une décision enregistrée sur une version précise : valider la v1 ne valide jamais silencieusement la v2.',
      },
      rejected: {
        label: 'Refusé',
        copy: 'Renvoyé avec un motif. Le document reste en place, le motif reste avec lui, et la version suivante repart de là.',
      },
      signature: {
        label: 'Signature demandée',
        copy: 'Parti à la signature, avec le statut de chaque signataire visible. Rien à télécharger puis redéposer.',
      },
      completed: {
        label: 'Terminé',
        copy: 'Toutes les étapes closes. Le document rejoint son dossier de destination et son compteur de conservation démarre.',
      },
    },
    returned: 'Renvoyé pour modification',
  },

  audiences: {
    eyebrow: 'Pour qui',
    title: 'Un seul coffre, à la taille dont vous avez besoin.',
    lead: 'Les mêmes documents, les mêmes règles, le même journal — qu’il s’agisse de votre passeport ou de tous les contrats signés par un service.',
    individuals: {
      title: 'Votre coffre personnel',
      message: 'Gardez organisés et faciles à retrouver les documents que vous ne pouvez pas perdre.',
      cta: 'Pour les particuliers',
      items: [
        { name: 'Carte nationale d’identité', meta: 'expire en 2031' },
        { name: 'Acte de naissance', meta: 'sans expiration' },
        { name: 'Assurance santé', meta: 'expire dans 32 jours' },
        { name: 'Bail d’habitation', meta: 'v2 · signé' },
        { name: 'Carte grise', meta: 'expire en 2027' },
      ],
    },
    teams: {
      title: 'L’espace de votre équipe',
      message: 'Donnez à votre équipe un seul endroit où collaborer autour des documents importants.',
      cta: 'Pour les équipes',
      folder: 'Contrats / 2026',
      rows: [
        { name: 'Site de Kribi — note de cadrage', chip: 'v3', note: '2 commentaires' },
        { name: 'Contrat fournisseur', chip: 'v2', note: 'attente de Paul' },
        { name: 'Grille tarifaire — T3', chip: 'v1', note: 'partagé au juridique' },
      ],
    },
    organizations: {
      title: 'Une infrastructure documentaire pour votre organisation',
      message:
        'Construisez un environnement documentaire maîtrisé, calqué sur le fonctionnement réel de votre organisation.',
      cta: 'Pour les organisations',
      columns: { department: 'Service', keep: 'Conserv.', access: 'Accès' },
      rows: [
        { dept: 'Finance', retention: '10 ans', access: 'Éditeur' },
        { dept: 'Juridique', retention: '10 ans', access: 'Éditeur' },
        { dept: 'RH', retention: '5 ans', access: 'Restreint' },
        { dept: 'Exploitation', retention: '3 ans', access: 'Éditeur' },
      ],
      restricted: 'Restreint',
      chips: [
        'Export d’audit',
        'Circuits de validation',
        'Mises sous scellés',
        'Compteurs de conservation',
      ],
    },
  },

  proof: {
    eyebrow: 'Ils l’utilisent',
    title: 'Celles et ceux qui le font déjà.',
    lead: 'Des documents qui comptent, gardés par des gens qui remarqueraient leur disparition.',
    placeholderTag: 'emplacement',
    placeholderBefore:
      'Les logos et citations ci-dessous sont des emplacements, pas du contenu. Remplissez-les dans ',
    placeholderMiddle: ' puis passez ',
    placeholderAfter: ' à ',
    logoCaption: 'Utilisé par les équipes de',
  },

  pricing: {
    eyebrow: 'Tarifs',
    title: 'Des offres qui suivent vos besoins documentaires.',
    lead: 'Les paliers sont arrêtés. Les montants ne le sont pas — nous préférons les laisser vides plutôt qu’afficher un chiffre que nous comptons changer.',
    talkToUs: 'Parlons-en',
    everythingIn: 'Tout ce que contient ',
    plus: ', et :',
    alwaysTitle: 'Sur toutes les offres, quel que soit le prix retenu',
    always: [
      'Chiffré en transit et au repos',
      'Les données de votre organisation isolées de toutes les autres',
      'Un journal d’audit complet',
      'Chaque version conservée',
    ],
    tiers: {
      personal: {
        name: 'Particulier',
        who: 'Pour une personne qui gère ses propres documents.',
        features: [
          'Votre propre coffre, accessible depuis n’importe quel appareil',
          'L’historique des versions sur chaque document',
          'Des dates d’échéance, avec des rappels avant l’heure',
          'Des liens sécurisés avec expiration et mot de passe',
          'Le texte lu au dépôt, pour que les documents soient cherchables',
        ],
      },
      teams: {
        name: 'Équipe',
        who: 'Pour un petit groupe qui travaille sur les mêmes documents.',
        features: [
          'Des dossiers partagés, avec des rôles qui décident de qui fait quoi',
          'Commentaires et mentions, conservés sur le document',
          'Demandes de validation',
          'Demandes de signature',
          'Une activité visible par toute l’équipe',
        ],
      },
      business: {
        name: 'Entreprise',
        who: 'Pour une société qui a de vrais processus autour de ses documents.',
        features: [
          'Circuits de validation à plusieurs étapes',
          'Règles de conservation et mises sous scellés',
          'Modèles de documents',
          'Import depuis Google Drive, OneDrive et Dropbox',
          'Clés d’API et webhooks pour vos propres systèmes',
          'Data rooms pour une opération ou un audit',
        ],
      },
      enterprise: {
        name: 'Grand compte',
        who: 'Pour une organisation qui doit gouverner l’ensemble de son patrimoine documentaire.',
        features: [
          'Une gestion à l’échelle de l’organisation, service par service',
          'Des permissions fines, jusqu’au document près',
          'Des circuits calqués sur vos validations existantes',
          'Auditabilité — export du journal d’un document, d’un dossier ou d’une période',
          'Intégrations avec les systèmes d’où viennent déjà vos documents',
          'Un accompagnement direct, et de l’aide pour la migration',
        ],
      },
    },
  },

  finalCta: {
    model: ['Déposer', 'Comprendre', 'Gérer', 'Automatiser'],
    title: 'Arrêtez de gérer des documents. Gérez ce qu’ils veulent dire.',
    lead: 'KDB Doc Vault donne à vos documents un abri sûr, une histoire, et une raison d’être.',
  },

  footer: {
    tagline:
      'La gestion documentaire sécurisée, pour les particuliers, les équipes et les organisations.',
    cities: 'Douala · Yaoundé',
    unpublished: 'Les entrées sans lien ne sont pas encore publiées.',
    rights: 'Tous droits réservés.',
    product: 'Un produit KDB.',
    operational: 'Tous les services sont opérationnels',
    columns: {
      product: 'Produit',
      solutions: 'Solutions',
      resources: 'Ressources',
      company: 'Entreprise',
      legal: 'Mentions légales',
    },
    links: {
      features: 'Fonctionnalités',
      security: 'Sécurité',
      integrations: 'Intégrations',
      pricing: 'Tarifs',
      roadmap: 'Feuille de route',
      individuals: 'Particuliers',
      teams: 'Équipes',
      businesses: 'Entreprises',
      organizations: 'Organisations',
      documentation: 'Documentation',
      helpCenter: 'Centre d’aide',
      api: 'API',
      blog: 'Blog',
      about: 'À propos',
      contact: 'Contact',
      careers: 'Carrières',
      privacy: 'Confidentialité',
      terms: 'Conditions',
    },
  },
}
