/**
 * English — the source of truth for the dictionary's shape.
 *
 * `fr.ts` is typed as `typeof en`, so adding a key here and forgetting it
 * there fails the build. Keep the two files in the same order; reviewing a
 * translation is much easier when the diffs line up.
 *
 * Product nouns stay in English in both locales — KDB Doc Vault, PDF, OCR, API
 * — and so do the fictional file names inside the mockups, because a French
 * office does not rename its PDFs either.
 */
export const en = {
  meta: {
    lang: 'en',
    title: 'KDB Doc Vault — Your documents deserve more than a folder.',
    description:
      'One secure place to store, organize, search, share, sign, and manage your documents — from the moment they arrive until the moment they are archived.',
    ogDescription: 'Secure document management for individuals, teams, and organizations.',
    ogLocale: 'en',
    ogImageAlt: 'The KDB Doc Vault workspace.',
    jsonLdDescription:
      'Store, organize, search, share, sign and manage documents across their whole lifecycle, with expiry reminders, controlled access and a full audit trail.',
  },

  common: {
    getStarted: 'Get started',
    seeHow: 'See how it works',
    signIn: 'Sign in',
    comingSoon: 'Coming soon',
    languageLabel: 'Language',
    switchToEnglish: 'English',
    switchToFrench: 'Français',
  },

  nav: {
    skip: 'Skip to content',
    home: 'KDB Doc Vault — home',
    brand: 'KDB Doc Vault',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    tagline: 'Secure document management for individuals, teams, and organizations.',
    links: {
      product: 'Product',
      solutions: 'Solutions',
      security: 'Security',
      features: 'Features',
      pricing: 'Pricing',
      resources: 'Resources',
    },
  },

  hero: {
    badge: 'Encrypted, versioned, auditable',
    title: 'Your documents deserve more than a folder.',
    lead: 'KDB Doc Vault gives you one secure place to store, organize, search, share, sign, and manage your documents — from the moment they arrive until the moment they are archived.',
    trust: 'Secure document management for individuals, teams, and organizations.',
    visualLabel:
      'The KDB Doc Vault workspace: folders, recent documents with signature and expiry status, secure sharing and an activity feed.',
    workspace: 'Workspace',
    encrypted: 'Encrypted',
    folders: 'Folders',
    storage: 'Storage',
    recent: 'Recent documents',
    filterAll: 'All',
    upload: 'Upload',
    lifecycle: 'Lifecycle',
    retain: 'retain 10 y',
    activity: 'Activity',
    secureLink: 'Secure link',
    linkRules: 'Password · expires in 7 days · 2 of 5 views',
    addedTo: 'Added to Contracts · encrypted',
    searchPhrases: [
      'contracts expiring this quarter',
      'signed by Marie Ndongo',
      'invoices · Sofrigaz SA',
    ],
    folderNames: {
      all: 'All documents',
      contracts: 'Contracts',
      invoices: 'Invoices',
      hr: 'HR & payroll',
      compliance: 'Compliance',
      archive: 'Archive',
    },
    docs: {
      msa: 'Master services agreement — Sofrigaz SA',
      tax: 'Tax clearance certificate 2026',
      lease: 'Warehouse lease — Bonabéri',
      payroll: 'Payroll register — July 2026',
      minutes: 'Board minutes — Q1 2026',
      amendment: 'Amendment no. 2 — Sofrigaz SA',
    },
    status: {
      signed: 'Signed',
      awaiting: 'Awaiting signature',
      expiring: 'Expiring',
      expiresIn12: 'Expires in 12 days',
      draft: 'Draft',
      archived: 'Archived',
    },
    steps: ['Received', 'In review', 'Signed', 'Archived'],
    when: {
      justNow: 'Just now',
      now: 'now',
      minutes2: '2 min ago',
      hour1: '1 h ago',
      yesterday: 'Yesterday',
      days3: '3 days ago',
      apr12: '12 Apr',
    },
    events: {
      shared: 'shared a secure link to',
      archived: 'archived',
      flagged: 'flagged an expiry on',
      signedDoc: 'signed',
      uploaded: 'uploaded',
    },
    eventTargets: {
      auditPack: 'Q2 audit pack',
      minutesQ1: 'Board minutes — Q1',
      taxClearance: 'Tax clearance',
      msa: 'Master services agreement',
      amendment: 'Amendment no. 2',
    },
    system: 'System',
  },

  problem: {
    eyebrow: 'The problem',
    title: 'Documents shouldn’t become a problem after you save them.',
    lead: 'Saving a file is the easy part. What follows — finding it again, knowing which copy is current, remembering it expires, knowing who has seen it — is where the work quietly piles up.',
    turn: 'None of this is a storage problem. It’s a lifecycle problem.',
    stages: {
      scattered: {
        name: 'Scattered files',
        note: 'A document is saved wherever it happened to arrive — a laptop, a chat thread, an inbox. Each copy then drifts on its own.',
      },
      context: {
        name: 'Lost context',
        note: 'Once the copies exist, the file name is all that’s left to go on — and a file name doesn’t know what’s inside it.',
      },
      deadlines: {
        name: 'Missed deadlines',
        note: 'A document with a date in it is a commitment. Stored as a file, it has no way to remind anyone of that.',
      },
      security: {
        name: 'Security risks',
        note: 'What gets shared to move things along tends to keep moving — and by then there is no way to look back and see where it went.',
      },
    },
    captions: {
      devices: 'Important files scattered across devices.',
      buried: 'Documents buried inside folders.',
      versions: 'Teams unsure which version is current.',
      search: 'Finding one specific document takes too long.',
      expiry: 'Expiring certificates forgotten.',
      renewal: 'Contracts difficult to track.',
      sharing: 'Sensitive documents shared without control.',
      history: 'No clear history of who accessed a document.',
    },
    artifacts: {
      laptop: 'Laptop',
      whatsapp: 'WhatsApp',
      email: 'Email',
      pathSegments: ['Documents', '2024', 'Admin', 'Scans', 'New folder', 'to sort', 'final', 'ok'],
      pathNote: 'Eleven levels deep, three people, three conventions.',
      whichOne: 'Which one did the client sign?',
      searchQuery: 'sofrigaz amendment',
      searchNote: 'No results — file names don’t contain what’s inside them.',
      expired: 'Expired 4 months ago',
      expiredNote: 'Nobody was notified. Nothing was scheduled.',
      maintenance: 'Maintenance contract',
      renewed: 'Auto-renewed · 12 months',
      renewedNote: 'Notice period closed two weeks before anyone looked.',
      shareTags: ['forwarded ×3', 'no expiry', 'no password'],
      accessHistory: 'Access history',
      noRecord: 'No record kept',
    },
  },

  solution: {
    eyebrow: 'The system',
    title: 'Turn your documents into an organized system.',
    lead: 'KDB Doc Vault doesn’t just store files. It manages the lifecycle around them.',
    store: {
      title: 'Store',
      copy: 'Securely store documents and keep them organized — every version kept, nothing overwritten.',
      note: 'Encrypted at rest · versioned',
    },
    find: {
      title: 'Find',
      copy: 'Search documents using metadata and extracted content, so a file name stops being the only way in.',
      query: 'termination clause',
      result: 'Master services agreement',
      snippetBefore: '“…either party may give notice of ',
      snippetMatch: 'termination',
      snippetAfter: ' no later than…”',
      tags: ['type: contract', 'party: Sofrigaz', 'signed 2026'],
    },
    protect: {
      title: 'Protect',
      copy: 'Control who can access, view, download, or share documents — inside the vault and outside it.',
      columns: ['View', 'Get', 'Share'],
      roles: { owner: 'Owner', member: 'Member', guest: 'Guest' },
      note: 'Links carry the same rules — and an expiry.',
    },
    collaborate: {
      title: 'Collaborate',
      copy: 'Share documents and work through approvals and workflows without a single attachment.',
      step: 'Approval · step 3 of 4',
      note: 'Aïcha was asked to approve · 2 comments open',
    },
    track: {
      title: 'Track',
      copy: 'Know what happened to important documents: who opened them, when, and what changed.',
      events: ['viewed v4', 'downloaded', 'created a link'],
      note: 'Append-only. Exportable. Nothing can be edited out.',
    },
    automate: {
      title: 'Automate',
      copy: 'Handle expiration, reminders, workflows, and document processing before anyone has to remember.',
      when: 'when',
      inWords: 'in',
      days30: '30 days',
      then: 'then',
      action: 'notify owner',
      plus: '+',
      legal: 'Legal',
      expiry: 'expiry',
      also: 'Also: OCR on upload',
    },
  },

  how: {
    eyebrow: 'How it works',
    title: 'From file to managed document.',
    lead: 'Everything else on this page happens inside these four steps.',
    model: ['Upload', 'Understand', 'Manage', 'Automate'],
    steps: {
      upload: { name: 'Upload', copy: 'Bring in your document.' },
      organize: { name: 'Organize', copy: 'Categorize, tag, and enrich it.' },
      manage: { name: 'Manage', copy: 'Share, approve, sign, track, and collaborate.' },
      automate: {
        name: 'Automate',
        copy: 'Let reminders, workflows, and document intelligence handle repetitive work.',
      },
    },
    doc: {
      tags: ['contract', '2026'],
      signed: 'Signed',
      renews: 'Renews in 12 months',
    },
  },

  showcase: {
    eyebrow: 'Document details',
    title: 'Everything important about a document. In one place.',
    lead: 'A file tells you its name and its size. A document in KDB Doc Vault tells you who owns it, what it replaced, who has opened it, what it is waiting on, and what happens the day it expires.',
    hint: 'This one is live — switch the tabs, pick a version, preview an access level.',
    tablist: 'Document sections',
    tabs: {
      overview: 'Overview',
      versions: 'Versions',
      activity: 'Activity',
      permissions: 'Permissions',
      workflow: 'Workflow',
    },
    meta: {
      status: 'Status',
      owner: 'Owner',
      created: 'Created',
      expires: 'Expires',
      version: 'Version',
      access: 'Access',
    },
    doc: {
      subtitle: 'Framework agreement — logistics services',
      owner: 'Finance Department',
      created: 'August 12, 2026',
      expires: 'August 12, 2027',
      access: 'Finance Team',
      active: 'Active',
      pages: 'pages',
      retention:
        'Encrypted at rest. Under a 10-year retention rule — deletion stays blocked until it lapses.',
    },
    overview: {
      description:
        'Framework agreement covering logistics services for the 2026–2027 term, signed by both parties.',
      fields: {
        description: 'Description',
        reference: 'Reference',
        tags: 'Tags',
        linked: 'Linked',
      },
      tags: ['contract', 'logistics', 'signed'],
      linked: ['Amendment no. 1', 'Purchase order 4412'],
      term: 'Term',
      daysLeft: 'days left',
    },
    versions: {
      current: 'current',
      note: 'Every version is kept. Nothing is overwritten, and any version can be restored or compared.',
      notes: {
        v4: 'Clause 12.3 added — termination notice raised to 90 days.',
        v3: 'Legal review comments applied.',
        v2: 'Annexes A and B attached.',
        v1: 'Initial upload.',
      },
    },
    activity: {
      note: 'Append-only. Nothing can be edited out, and the trail exports as PDF or CSV.',
      events: {
        viewed: { action: 'viewed the document', at: 'Today · 09:41', meta: 'Web · Douala · v4' },
        approved: { action: 'approved', at: '14 Aug · 16:20', meta: 'Approval step 2 of 2' },
        shared: {
          action: 'shared with Legal',
          at: '13 Aug · 11:05',
          meta: 'Secure link · view only · expires in 7 days',
        },
        uploaded: {
          action: 'uploaded v4',
          at: '14 Aug · 09:12',
          meta: 'Replaces v3 · previous version kept',
        },
        created: {
          action: 'created the document',
          at: '12 Aug · 08:30',
          meta: 'Folder: Contracts / Active',
        },
      },
    },
    permissions: {
      previewAs: 'Preview access as',
      capabilities: ['View', 'Download', 'Share', 'Delete'],
      principals: {
        finance: {
          name: 'Finance Team',
          detail: '5 members',
          role: 'Editor',
          summary:
            'Full access. Members may re-share inside the organization, but cannot delete a document under retention.',
        },
        legal: {
          name: 'Legal',
          detail: '2 members',
          role: 'Reviewer',
          summary:
            'Read and download for review. Cannot re-share — the link they were given does not travel further.',
        },
        guest: {
          name: 'Guest link',
          detail: 'External counsel',
          role: 'Viewer',
          summary:
            'Watermarked preview in the browser. Expires in 7 days, 2 of 5 views used, password required.',
        },
      },
    },
    workflow: {
      steps: [
        { name: 'Drafted', at: '12 Aug' },
        { name: 'Legal review', at: '13 Aug' },
        { name: 'Approved', at: '14 Aug' },
        { name: 'Active', at: 'now' },
        { name: 'Renewal', at: 'May 2027' },
      ],
      rulesTitle: 'Rules attached to this document',
      rules: [
        { when: '90 days before expiry', then: 'notify Finance + Legal' },
        { when: 'on approval', then: 'move to Contracts / Active' },
        { when: 'on expiry', then: 'archive · retain 10 years' },
      ],
      next: 'Next: renewal review assigned to Finance, opening 14 May 2027.',
    },
  },

  sources: {
    eyebrow: 'Connected sources',
    title: 'Your documents don’t have to start in the Vault.',
    lead: 'Bring documents from the services you already use and manage them from one secure workspace.',
    cloudTitle: 'Cloud storage',
    routesTitle: 'And the other ways in',
    copied: 'Documents are copied in. The original stays where it is.',
    drives: {
      google: 'Pick a folder. Files arrive with their names and dates intact.',
      onedrive: 'Personal or work account.',
      dropbox: 'Including the shared folders you already have access to.',
      sharepoint: 'Document libraries, with their existing structure.',
    },
    routes: {
      device: { name: 'Upload from this device', note: 'A file, or a folder of them, dragged straight in.' },
      email: {
        name: 'Email-in address',
        note: 'Forward an attachment to a folder’s address and it files itself.',
      },
      api: { name: 'Your own systems', note: 'Push documents through the API with a scoped key.' },
    },
    after: {
      read: {
        title: 'Read on arrival',
        copy: 'Text is extracted as it lands, so an imported document is searchable by its contents the same day — not just by the file name it happened to have.',
      },
      dated: {
        title: 'Dated on arrival',
        copy: 'Expiry and retention rules apply from the moment it enters the vault, so an imported contract starts being watched immediately.',
      },
      recorded: {
        title: 'Recorded on arrival',
        copy: 'The import is an entry in the trail like any other action: which source, who connected it, and what came in.',
      },
    },
  },

  intelligence: {
    eyebrow: 'Document intelligence',
    title: 'Your documents can tell you what’s inside.',
    lead: 'KDB Doc Vault can analyze document content, extract useful information, and make documents easier to search and manage.',
    steps: ['Upload', 'Analyze', 'Extract', 'Organize', 'Search'],
    stepsLabel: 'How a document is processed',
    ocrNote:
      'Text recognition (OCR) runs on the page image, so a scan is as readable as a born-digital file.',
    extracted: 'Extracted fields',
    found: '4 found · 1 to review',
    masked: 'masked',
    confident: 'confident',
    needsReview: 'needs review',
    fields: {
      type: { label: 'Document type', value: 'Passport' },
      name: { label: 'Name', value: 'John Doe' },
      number: { label: 'Document number', value: 'XXXXXXXX' },
      expiry: { label: 'Expiration', value: '12 March 2029' },
    },
    honesty:
      'Extraction is a suggestion, not a verdict. Fields land as drafts, someone confirms them, and the confirmation is recorded like any other action on the document.',
    filed: 'Filed automatically',
    folder: 'Compliance / Identity documents',
    tags: ['passport', 'identity', 'expires-2029'],
    rule: '90 days before 12 Mar 2029 → notify owner',
    findable: 'Findable afterwards',
    query: 'documents expiring in 2029',
    foundNote: 'Found on a field nobody typed in — and on the words inside the page.',
    replay: 'Replay',
    sheet: {
      passport: 'PASSPORT',
      specimen: 'SPECIMEN',
      surname: 'Surname / Given names',
      documentNo: 'Document no.',
      nationality: 'Nationality',
      expiry: 'Date of expiry',
      labels: { type: 'type', name: 'name', number: 'number', expiry: 'expiry' },
    },
  },

  lifecycle: {
    eyebrow: 'Lifecycle',
    title: 'Never discover an expired document too late.',
    lead: 'KDB Doc Vault keeps important dates attached to the documents they belong to and helps you act before deadlines become problems.',
    boardTitle: 'Renewals & expiries',
    boardCount: '4 documents · 1 due tomorrow',
    expired: 'Expired',
    expiresTomorrow: 'Expires tomorrow',
    expiresIn: (days: number) => `Expires in ${days} days`,
    ladderTitle: 'What happens as the date approaches',
    remindersTitle: 'Reminders sent',
    ctaTitle: 'Stay ahead of your documents',
    ctaLead: 'Add a date to any document. KDB Doc Vault carries it from there.',
    docs: {
      passport: { name: 'Passport', detail: 'Identity document', owner: 'M. Ndongo' },
      insurance: { name: 'Insurance', detail: 'Vehicle fleet policy', owner: 'Operations' },
      licence: { name: 'Business License', detail: 'Trade licence — Littoral', owner: 'Legal' },
      contract: {
        name: 'Contract',
        detail: 'Framework agreement — Sofrigaz SA',
        owner: 'Finance',
      },
    },
    ladder: [
      {
        at: '90 days',
        action: 'The owner is notified and a renewal task is opened on the document itself.',
      },
      {
        at: '30 days',
        action:
          'The reminder widens to everyone who shares the folder, so it stops being one person’s memory.',
      },
      {
        at: '7 days',
        action: 'A daily reminder, and the document is flagged wherever it appears in the vault.',
      },
      { at: '1 day', action: 'Push notification to registered devices, alongside the email.' },
      {
        at: 'Expired',
        action:
          'Access follows the policy you set, the document moves to archive, and the audit trail records all of it.',
      },
    ],
    reminders: {
      contract: {
        title: 'Contract expires tomorrow',
        meta: 'Push to 3 devices · Finance',
        at: 'just now',
      },
      licence: {
        title: 'Business License — 7 days left',
        meta: 'Email to Legal · daily until renewed',
        at: '2 h ago',
      },
      insurance: {
        title: 'Renewal task assigned — Insurance',
        meta: 'Aïcha Bello · due in 32 days',
        at: 'yesterday',
      },
      passport: {
        title: 'Notice scheduled — Passport',
        meta: (date: string) => `30-day notice on ${date}`,
        at: 'queued',
      },
    },
  },

  sharing: {
    eyebrow: 'Secure sharing',
    title: 'Share a document without losing control of it.',
    lead: 'Give people access to the document they need without giving away everything around it.',
    dialogTitle: 'Share document',
    fields: {
      recipient: 'Recipient',
      accessLevel: 'Access level',
      expiration: 'Expiration',
    },
    external: 'external',
    levels: {
      preview: {
        label: 'Preview only',
        note: 'Watermarked, in the browser. Downloading is not available at this level.',
      },
      view: { label: 'View', note: 'Read the document as it is, nothing more.' },
      comment: {
        label: 'View & comment',
        note: 'Read it and leave comments, which stay on the document.',
      },
    },
    expiries: {
      h24: { label: '24 hours', phrase: 'in 24 hours' },
      h48: { label: '48 hours', phrase: 'in 48 hours' },
      d7: { label: '7 days', phrase: 'in 7 days' },
      never: { label: 'No expiry', phrase: 'never' },
    },
    neverWarning: 'A link with no expiry is the one nobody remembers to revoke.',
    password: {
      label: 'Password protection',
      hint: 'John receives the password separately, not in the same message as the link.',
    },
    download: {
      label: 'Download permission',
      hintPreview: 'Not available at “Preview only” — the document never leaves the browser.',
      hintOn: 'Every download is recorded in the document’s trail.',
    },
    sharedWith: 'Shared with John Doe',
    expiresPrefix: 'Expires ',
    noExpirySet: 'No expiry set',
    chips: {
      passwordOn: 'Password required',
      passwordOff: 'No password',
      downloadOn: 'Download allowed',
      downloadOff: 'Download blocked',
    },
    cannotTitle: 'What John still cannot do',
    cannot: {
      browse: 'Browse the folder this document sits in.',
      others: 'See any other document in your vault.',
      afterExpiry: 'Open the link after it expires.',
      afterRevoke: 'Keep access once you revoke the link.',
      downloadTracked: 'Download it without that appearing in the trail.',
      save: 'Save a copy — the document never leaves the browser.',
    },
    revoke:
      'Revoke the link at any time and it stops working — you don’t have to wait for the expiry you set.',
  },

  security: {
    eyebrow: 'Security',
    title: 'Built for documents you wouldn’t want in the wrong hands.',
    lead: 'Every request for a document passes the same six checkpoints, in the same order, every time. Here is what each one actually does.',
    disclaimerBefore: 'You won’t find ',
    disclaimerWords: ['military-grade', 'bank-level', 'unbreakable'],
    disclaimerOr: ' or ',
    disclaimerAfter:
      ' anywhere on this page. None of those are standards. What follows are mechanisms you can check.',
    restTitle: 'The rest of it, in plain words',
    stages: {
      user: {
        name: 'User',
        question: 'Who is asking?',
        plain: 'A request arrives from a person on a device — nothing is trusted about it yet.',
        line: 'GET /documents/019f…c41/content',
        faint: 'from a browser session · no assumptions made',
      },
      auth: {
        name: 'Authentication',
        question: 'Are you who you say you are?',
        plain: 'The sign-in is verified and turned into a session with a limited lifetime.',
        line: 'session · issued 09:14 · expires 21:14',
        faint: 'expired or revoked sessions stop here',
      },
      authz: {
        name: 'Authorization',
        question: 'Are you allowed to do this, to this document?',
        plain: 'The action is checked against the role you hold and the rules on that document.',
        lineBefore: 'requires ',
        lineMiddle: ' · role ',
        faint: 'the answer is per action, not per login',
      },
      tenant: {
        name: 'Tenant isolation',
        question: 'Whose data can you even see?',
        plain:
          'Your organization’s rows are separated by the database itself, underneath every query the application writes.',
        lineBefore: 'tenant = ',
        lineAfter: ' · set by the server',
        faint: 'a mistake in the application still cannot return another organization’s row',
      },
      document: {
        name: 'Document',
        question: 'What actually comes back?',
        plain: 'The file is served from encrypted storage, through a link that expires in minutes.',
        line: 'object key · opaque · encrypted at rest',
        faint: 'the storage path reveals nothing about the document',
      },
      audit: {
        name: 'Audit trail',
        question: 'What was written down?',
        plain:
          'The action becomes an entry: who, what, when. Entries are appended, never edited.',
        line: '+ viewed · marie@… · 09:41 · v4',
        faint: 'appended — see the trail below',
      },
    },
    concepts: {
      tenant: {
        name: 'Tenant isolation',
        copy: 'Every row belongs to one organization, and the database enforces that on every query. Another tenant’s data is not hidden from you — it is unreachable.',
      },
      roles: {
        name: 'Role-based access',
        copy: 'Owner, admin, member. What a person can do follows the role they hold, not the link somebody forwarded them.',
      },
      encryption: {
        name: 'Encryption',
        copy: 'Documents are encrypted in transit and at rest. Object keys are opaque, so a storage path gives nothing away about what it holds.',
      },
      audit: {
        name: 'Audit trails',
        copy: 'Every action that changes a document adds an entry. Entries are appended — the application offers no way to edit or remove one.',
      },
      sharing: {
        name: 'Secure sharing',
        copy: 'A link carries its own rules: an expiry date, a view limit, an optional password. It can be revoked, and revoking it is immediate.',
      },
      versions: {
        name: 'Version integrity',
        copy: 'A new version never overwrites the old one. Each is stored separately and stays retrievable, so “the current one” is a fact rather than a convention.',
      },
      access: {
        name: 'Access controls',
        copy: 'View, download, share and delete are granted separately, per document and per folder — not bundled into one permission called “access”.',
      },
      retention: {
        name: 'Document retention',
        copy: 'A retention rule blocks deletion until it lapses. A legal hold blocks it regardless of the rule, and both are recorded.',
      },
    },
  },

  audit: {
    eyebrow: 'Auditability',
    title: 'Know what happened. Not just where the file is.',
    lead: 'Every important document action can become part of a traceable history — attached to the document, kept for as long as the document is.',
    panelTitle: 'Audit trail',
    filter: 'All actions',
    export: 'Export',
    appended: 'Appended, never edited',
    kept: 'Kept with the document, for as long as the document',
    whyTitle: 'Why organizations ask for this',
    entries: {
      upload: {
        time: '10:42 AM',
        action: 'Document uploaded',
        role: 'Owner',
        detail: [
          { label: 'Version', value: 'v1 · 412 KB · PDF' },
          { label: 'Folder', value: 'Contracts / Active' },
          { label: 'Origin', value: 'Web · Douala' },
        ],
      },
      review: {
        time: '11:03 AM',
        action: 'Legal reviewed',
        role: 'Reviewer',
        detail: [
          { label: 'Outcome', value: 'Review completed · 2 comments left' },
          { label: 'On version', value: 'v1' },
          { label: 'Requested by', value: 'Marie Ndongo · 10:44 AM' },
        ],
      },
      approve: {
        time: '11:17 AM',
        action: 'Manager approved',
        role: 'Approver',
        detail: [
          { label: 'Step', value: 'Approval 2 of 2 — workflow complete' },
          { label: 'On version', value: 'v1' },
          { label: 'Note', value: '“Approved subject to the amended notice period.”' },
        ],
      },
      share: {
        time: '11:19 AM',
        action: 'Document shared',
        role: 'Owner',
        detail: [
          { label: 'With', value: 'External counsel · secure link' },
          { label: 'Rules', value: 'View only · expires in 7 days · password required' },
          { label: 'Used', value: '2 of 5 views' },
        ],
      },
      v2: {
        time: '11:25 AM',
        action: 'Version 2 created',
        role: 'Owner',
        detail: [
          { label: 'Change', value: 'v1 → v2 · notice period raised to 90 days' },
          { label: 'Previous', value: 'v1 kept and still retrievable' },
          { label: 'Notified', value: 'Legal, Finance' },
        ],
      },
    },
    reasons: {
      dispute: {
        title: 'When there is a disagreement',
        copy: 'Who approved it, on which version, and at what time stops being someone’s recollection. It is a record with a timestamp next to it.',
      },
      audited: {
        title: 'When you are audited',
        copy: 'Export the history of a document, a folder, or a date range. Nobody has to reconstruct a year from memory and an inbox.',
      },
      leaver: {
        title: 'When someone leaves',
        copy: 'The trail belongs to the document, not to the person who handled it. A handover does not depend on what was in one mailbox.',
      },
    },
  },

  workflow: {
    eyebrow: 'Workflow',
    title: 'Documents can move work forward.',
    lead: 'Documents can participate in structured workflows instead of living separately from business processes — the approval happens on the document, not in a thread about the document.',
    exampleTitle: 'New supplier contract',
    versionNote: 'Each decision is recorded against v2 — approving one version never quietly approves the next one.',
    approved: 'Approved',
    approvedNote: 'All three approvals recorded · sent for signature to Groupe Sicam',
    statesTitle: 'The states a document can be in',
    stages: {
      upload: {
        name: 'Upload',
        blurb:
          'The document arrives in the vault and the process starts from it, not from an email about it.',
      },
      review: {
        name: 'Review',
        blurb:
          'Comments and mentions sit on the document itself, so the discussion stays where the file is.',
      },
      approval: {
        name: 'Approval',
        blurb: 'Named approvers, in order. Each decision is recorded with who made it and when.',
      },
      signature: {
        name: 'Signature',
        blurb: 'Once approved, the document can be sent for signature without leaving the vault.',
      },
      archive: {
        name: 'Archive',
        blurb: 'When the process closes, the document is filed and held under its retention rule.',
      },
    },
    steps: {
      finance: {
        party: 'Finance',
        at: '12 Aug · 09:20',
        note: 'Budget line confirmed for the 2026 term.',
      },
      legal: {
        party: 'Legal',
        at: '13 Aug · 14:02',
        note: 'Returned once for changes to the notice period — resubmitted as v2 and approved at 16:41.',
      },
      management: {
        party: 'Management',
        at: 'waiting since 14 Aug · 08:05',
        note: 'Last approval before the document goes out for signature.',
        resolvedAt: '14 Aug · 11:26',
      },
    },
    states: {
      pending: {
        label: 'Pending approval',
        copy: 'Sitting with a named person, not with “the team”. It appears in their queue and in the document’s own status.',
      },
      approved: {
        label: 'Approved',
        copy: 'A decision recorded against a specific version, so approving v1 never silently approves v2.',
      },
      rejected: {
        label: 'Rejected',
        copy: 'Sent back with a reason. The document stays in place, the reason stays with it, and the next version resumes from there.',
      },
      signature: {
        label: 'Signature requested',
        copy: 'Out for signature, with each signer’s status visible. Nothing has to be downloaded and re-uploaded.',
      },
      completed: {
        label: 'Completed',
        copy: 'Every step closed. The document moves to its destination folder and its retention clock starts.',
      },
    },
    returned: 'Returned for changes',
  },

  audiences: {
    eyebrow: 'Who it’s for',
    title: 'One vault, at the size you need it.',
    lead: 'The same documents, the same rules, the same trail — whether it holds your passport or every contract a department has signed.',
    individuals: {
      title: 'Your personal vault',
      message: 'Keep the documents you cannot afford to lose organized and easy to find.',
      cta: 'For individuals',
      items: [
        { name: 'National ID card', meta: 'expires 2031' },
        { name: 'Birth certificate', meta: 'no expiry' },
        { name: 'Health insurance', meta: 'expires in 32 days' },
        { name: 'Apartment lease', meta: 'v2 · signed' },
        { name: 'Vehicle registration', meta: 'expires 2027' },
      ],
    },
    teams: {
      title: 'Your team’s workspace',
      message: 'Give your team one place to collaborate around important documents.',
      cta: 'For teams',
      folder: 'Contracts / 2026',
      rows: [
        { name: 'Kribi site — project brief', chip: 'v3', note: '2 comments' },
        { name: 'Supplier agreement', chip: 'v2', note: 'awaiting Paul' },
        { name: 'Rate card — Q3', chip: 'v1', note: 'shared with Legal' },
      ],
    },
    organizations: {
      title: 'Document infrastructure for your organization',
      message: 'Build a controlled document environment around the way your organization works.',
      cta: 'For organizations',
      columns: { department: 'Department', keep: 'Keep', access: 'Access' },
      rows: [
        { dept: 'Finance', retention: '10 y', access: 'Editor' },
        { dept: 'Legal', retention: '10 y', access: 'Editor' },
        { dept: 'HR', retention: '5 y', access: 'Restricted' },
        { dept: 'Operations', retention: '3 y', access: 'Editor' },
      ],
      restricted: 'Restricted',
      chips: ['Audit export', 'Approval workflows', 'Compliance holds', 'Retention clocks'],
    },
  },

  proof: {
    eyebrow: 'Proof',
    title: 'The people already doing this.',
    lead: 'Documents that matter, kept by people who would notice if they went missing.',
    placeholderTag: 'placeholder',
    placeholderBefore: 'Logos and quotes below are slots, not content. Fill them in ',
    placeholderMiddle: ' and set ',
    placeholderAfter: ' to ',
    logoCaption: 'Used by teams at',
  },

  pricing: {
    eyebrow: 'Pricing',
    title: 'Plans designed to grow with your document needs.',
    lead: 'The tiers are settled. The numbers are not — we would rather leave them blank than put up a figure we intend to change.',
    talkToUs: 'Talk to us',
    everythingIn: 'Everything in ',
    plus: ', plus:',
    alwaysTitle: 'On every plan, whatever the price turns out to be',
    always: [
      'Encrypted in transit and at rest',
      'Your organization’s data isolated from every other',
      'A full audit trail',
      'Every version kept',
    ],
    tiers: {
      personal: {
        name: 'Personal',
        who: 'For one person looking after their own documents.',
        features: [
          'Your own vault, reachable from any device',
          'Version history on every document',
          'Expiry dates, with reminders before they arrive',
          'Secure links with an expiry and a password',
          'Text read on upload, so documents are searchable',
        ],
      },
      teams: {
        name: 'Teams',
        who: 'For a small group working from the same documents.',
        features: [
          'Shared folders, with roles that decide who can do what',
          'Comments and mentions, kept on the document',
          'Approval requests',
          'Signature requests',
          'Activity everyone on the team can see',
        ],
      },
      business: {
        name: 'Business',
        who: 'For a company with real processes around its documents.',
        features: [
          'Multi-step approval workflows',
          'Retention rules and legal holds',
          'Document templates',
          'Import from Google Drive, OneDrive and Dropbox',
          'API keys and webhooks for your own systems',
          'Data rooms for a deal or an audit',
        ],
      },
      enterprise: {
        name: 'Enterprise',
        who: 'For an organization that needs the whole estate governed.',
        features: [
          'Organization-wide management, department by department',
          'Advanced permissions, down to a single document',
          'Workflows modelled on how your organization already approves things',
          'Auditability — export the trail for a document, a folder or a period',
          'Integrations with the systems your documents already come from',
          'Direct support, and help planning the move',
        ],
      },
    },
  },

  finalCta: {
    model: ['Upload', 'Understand', 'Manage', 'Automate'],
    title: 'Stop managing documents. Start managing what they mean.',
    lead: 'KDB Doc Vault gives your documents a secure home, a history, and a purpose.',
  },

  footer: {
    tagline: 'Secure document management for individuals, teams, and organizations.',
    cities: 'Douala · Yaoundé',
    unpublished: 'Entries shown without a link aren’t published yet.',
    rights: 'All rights reserved.',
    product: 'A KDB product.',
    operational: 'All systems operational',
    columns: {
      product: 'Product',
      solutions: 'Solutions',
      resources: 'Resources',
      company: 'Company',
      legal: 'Legal',
    },
    links: {
      features: 'Features',
      security: 'Security',
      integrations: 'Integrations',
      pricing: 'Pricing',
      roadmap: 'Roadmap',
      individuals: 'Individuals',
      teams: 'Teams',
      businesses: 'Businesses',
      organizations: 'Organizations',
      documentation: 'Documentation',
      helpCenter: 'Help Center',
      api: 'API',
      blog: 'Blog',
      about: 'About',
      contact: 'Contact',
      careers: 'Careers',
      privacy: 'Privacy',
      terms: 'Terms',
    },
  },
}
