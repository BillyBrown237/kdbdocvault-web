/* KDB DocVault front office — vanilla port of the design component logic.
   Scope: FR/EN toggle (persisted), scroll-driven timeline + hash chain,
   exposure calculator, reminder-date checker. No dependencies. */
(function () {
  "use strict";

  var EN = {
    "skip":"Skip to content","n.home":"Home","n.product":"Product","n.security":"Security & trust","n.login":"Log in",
    "cta.try":"Open an account","cta.demo":"See how a reminder goes out","cta.call":"Talk to someone in Douala",
    "hero.folio":"Douala · Yaoundé","hero.folio2":"document management software",
    "hero.h1a":"Dropbox keeps your files.","hero.h1b":"We keep your deadlines.",
    "hero.pain":"Your transport licence expires on 14 March 2026. You will know on 14 December 2025, then on 12 February, then on 7 March — and your director will know on the 13th.",
    "hero.fine":"Free plan. Payment by MTN MoMo or Orange Money, in FCFA. Full export of your documents at any time, without telling us first.",
    "mail.from":"reminders@kdbvault.com",
    "mail.subj":"Transport licence no. 04412 — expires in 90 days",
    "mail.body":"Hello Mireille, the renewal file is filed with the ministry 60 days before the 14 March 2026 deadline. Two items are missing:",
    "mail.i1":"— technical compliance certificate (2024)","mail.i2":"— fleet insurance receipt, policy 8841-C",
    "mail.cta":"Replying “done” closes the reminder. With no action by 12 February, M. Ndongo (management) is copied in.",
    "s1.h":"What expires while you work",
    "s1.p":"The four documents our users track most, and what forgetting them costs. Amounts follow published Cameroonian schedules; they vary case by case.",
    "s1.c1":"Document","s1.c2":"Cycle","s1.c3":"If the date passes","s1.c4":"File by",
    "s1.r1a":"Intercity transport licence","s1.r1b":"annual","s1.r1c":"vehicles grounded, fine per vehicle",
    "s1.r2a":"Fleet insurance policy","s1.r2b":"annual","s1.r2c":"claim uncovered, surcharge at renewal",
    "s1.r3a":"Commercial lease","s1.r3b":"3 years, auto-renewing","s1.r3c":"renewed on the landlord's terms",
    "s1.r4a":"Framework supplier contract","s1.r4b":"12 months","s1.r4c":"volume discount lost for the year",
    "s1.note":"* Filing lead times are configurable per document type; those shown are the defaults shipped at installation.",
    "s2.h":"A document has an age",
    "s2.p":"The expiry date is read on import, then confirmed by you in one click. After that, nobody has to remember it.",
    "tl.0":"Uploaded","tl.0.d":"The PDF arrives, the date “14/03/2026” is spotted in the body text. You confirm it.",
    "tl.1":"First reminder","tl.1.d":"To the document owner, with the list of missing items. Replying “done” closes the task.",
    "tl.2":"Escalation","tl.2.d":"With no reply, management is copied in. The escalation is written to the log, with the time.",
    "tl.3":"Renewed","tl.3.d":"The new licence is sealed, the old one archived — readable, never again mistaken for the current one.",
    "s3.h":"The chain, on the right",
    "s3.p":"Every log entry carries the fingerprint of the previous one. Removing or editing a line breaks every line after it — tampering shows, it cannot be patched over.",
    "s3.p2":"At sealing, the final fingerprint is sent to an RFC 3161 timestamping authority. The date is no longer ours: a third party attests to it.",
    "s3.note":"The log shown is that of licence 04412. Fingerprints are truncated for display; the export gives them in full.",
    "ch.by":"by","ch.remind":"reminder D-90","ch.esc":"escalation","ch.seal":"sealing","ch.tsa":"third-party timestamp","ch.ok":"chain intact · 1,284 entries verified",
    "s4.h":"Your client signs without creating an account",
    "s4.p":"The haulier who has to countersign the amendment will install nothing, remember no password, and sign from their phone.",
    "sig.1":"You send the link","sig.1.d":"By email or WhatsApp. It expires on the date you set, and every opening is timestamped.",
    "sig.2":"They prove who they are","sig.2.d":"Six-digit code by SMS. If your procedure requires it, a photo of the ID card as well.",
    "sig.3":"The document is sealed","sig.3.d":"Certificate, log and third-party timestamp. A QR printed at the foot of the page opens public verification.",
    "s5.h":"What a missed date costs",
    "s5.p":"Enter the document and the annual value that depends on it. The calculation applies indicative exposure rates, itemised line by line.",
    "calc.type":"Document","calc.val":"Annual value at stake · FCFA",
    "calc.o1":"Transport licence","calc.o2":"Fleet insurance policy","calc.o3":"Framework supplier contract",
    "calc.note":"Exposure rates drawn from cases reported by our users. They are not legal advice.",
    "calc.res":"Estimated exposure",
    "calc.foot":"The reminder that prevents it goes out 90 days ahead, on its own, and costs the price of a monthly subscription.",
    "mm.h":"Pay in FCFA, without a bank card","mm.p":"MTN Mobile Money · Orange Money · bank transfer. Billed monthly or annually, downloadable receipt.",
    "proof.h":"References",
    "proof.p":"We do not show logos we have no right to display, nor figures we cannot produce. Three slots are waiting for clients who agree to be named.",
    "proof.s1":"Slot — intercity transport, Douala. Name, role, dated and quantified outcome.",
    "proof.s2":"Slot — notary practice, Yaoundé. Name, role, dated and quantified outcome.",
    "proof.s3":"Slot — import-export, Kribi. Name, role, dated and quantified outcome.",
    "faq.h":"The questions we actually get asked",
    "faq.1":"Where is my data stored?","faq.1.d":"On encrypted European infrastructure, replicated daily. The exact data-centre location is stated in the contract and does not change without 60 days' notice. Hosting in Cameroon is in preparation for public bodies; it is not available yet.",
    "faq.2":"What happens if I leave?","faq.2.d":"You export everything from your account, without asking us: files in their original format, metadata as CSV, log and certificates as JSON. Seals stay verifiable after you leave, since the timestamp comes from a third party. Your data is deleted 30 days after closure.",
    "faq.3":"Who at your end can read my documents?","faq.3.d":"Nobody, in normal operation. Support access is opened only at your written request, for a limited period, and every view appears in your log exactly like those of your own staff.",
    "faq.4":"Does a signature made here hold up in court?","faq.4.d":"It produces a body of evidence: identity verified by SMS code, hash-chained log, RFC 3161 timestamp from an independent authority, all exportable as one bundle. We are not a qualified trust service provider under eIDAS: for a deed that requires one, go to a notary.",
    "faq.5":"What if the connection drops?","faq.5.d":"The app installs from the browser and keeps the deadline list and recently opened documents on the device. An interrupted upload resumes where it stopped. Reminders are sent from our servers: they do not wait for you to be online.",
    "faq.6":"Can I bring over what is already on Google Drive?","faq.6.d":"Yes, with the folder tree preserved, plus ZIP archive and CSV metadata import. OneDrive, Dropbox and SharePoint are not supported yet.",
    "pr.folio":"Product — what works today",
    "pr.h1":"Five questions a business asks every week",
    "pr.sub":"Where, who, when, what, how. Each answer below maps to a shipped feature; what is not shipped is listed at the end, unvarnished.",
    "q.ou":"Where","q.qui":"Who","q.quand":"When","q.quoi":"What","q.comment":"How",
    "pr.ou.h":"The vault: found in eight seconds",
    "pr.ou.p":"Folders, numbered versions, tags, trash with 30-day restore. Search covers the contents of PDFs, not just file names: typing “04412” returns the licence, its amendments and the receipt that cites it.",
    "vault.q":"search","vault.hits":"3 results · 2 of them by content",
    "pr.qui.h":"Every action carries a name and a time",
    "pr.qui.p":"Views, edits, approvals, signatures, downloads. Roles can be delegated for a set period — one manager's leave does not block a renewal, and the delegation stays on record.",
    "log.view":"views","log.dl":"downloads","log.approve":"approves","log.seal":"sealing","log.deleg":"delegation",
    "pr.quand.h":"The dates chase you",
    "pr.quand.p":"Enter a real deadline opposite: you will see the four dates on which someone gets warned, and the point at which management enters the loop.",
    "chk.label":"Expiry date","chk.who1":"owner","chk.who2":"owner + deputy","chk.who3":"team","chk.who4":"management",
    "pr.quoi.h":"Obligations come out of the PDF",
    "pr.quoi.p":"A clause that binds you becomes a task: a title, a due date, an owner. Approvals follow a defined route, with a response deadline and an automatic stand-in.",
    "ob.1":"Compliance certificate to supply","ob.2":"Notice not to renew the lease","ob.3":"Annual supplier price review",
    "pr.comment.h":"Sending a document outside your walls without losing it",
    "pr.comment.p":"Link protected by password, expiry date and a watermark bearing the recipient's name. You see who opened it, for how long, which pages. A link is revoked in one click, even once sent.",
    "link.exp":"expires 20 March","link.wm":"watermark: “SARL TRANSCAM — 14/03/2026”","link.pw":"password: on","link.dl":"download: blocked","link.views":"2 openings · 4 min · pages 1-3",
    "soon.h":"In development — not available yet",
    "soon.p":"Nothing on this list is sellable today. We publish it so that nobody signs believing they are buying it.",
    "soon.1":"Scanning and OCR of paper documents","soon.2":"Reminders by WhatsApp and SMS","soon.3":"Assisted question-answering on your documents","soon.4":"Document templates with merge fields","soon.5":"OneDrive, Dropbox, SharePoint import","soon.6":"API and webhooks","soon.7":"Emergency access and estate transfer","soon.8":"Sovereign hosting for government",
    "se.folio":"Security & trust — status at 9 August 2026",
    "se.h1":"What protects your documents, and what you can check yourself",
    "se.sub":"Two columns: the measure, and the means you have to check it without taking our word for it. Where the second column says “on request”, it is not automated yet.",
    "se.c1h":"Measure","se.c2h":"What it means in practice","se.c3h":"You can check",
    "se.r1a":"Encryption in transit","se.r1b":"TLS 1.3 required; no cleartext connection is accepted.","se.r1c":"public SSL test",
    "se.r2a":"Private storage","se.r2b":"No file has a public URL. Every access goes through a signed link valid for a few minutes.","se.r2c":"on request",
    "se.r3a":"Per-organisation isolation","se.r3b":"Enforced in the database itself, not only in application code.","se.r3c":"on request",
    "se.r4a":"Chained log","se.r4b":"Each entry carries the previous fingerprint; rewriting the past visibly breaks the chain.","se.r4c":"JSON export",
    "se.r5a":"RFC 3161 timestamping","se.r5b":"The seal's date is attested by an independent authority; our clock is not the record.","se.r5c":"public portal",
    "se.r6a":"Evidence bundle","se.r6b":"Document, certificate, log and timestamp token in an archive readable without our tools.","se.r6c":"ZIP export",
    "ver.h":"Verify a document without an account",
    "ver.p":"Every sealed document carries a QR at the foot of the page. It opens a public page that recomputes the file's fingerprint and compares it to the seal. If a comma has moved, the page says so in plain words. No account is asked for — not from your banker, your insurer, or a judge.",
    "ver.cta":"Open a demo certificate","qr.slot":"real QR\nto insert","qr.ok":"seal valid",
    "eng.h":"Our exit commitments",
    "eng.p":"A trustworthy platform is judged by how easily you can leave it. These three points are in the contract, not only on this page.",
    "eng.1":"Export in one action","eng.1.d":"Files, CSV metadata, log and JSON certificates. Available from your account, no request needed.",
    "eng.2":"Open formats","eng.2.d":"PDF, CSV, JSON. Nothing that needs our tools to be readable in ten years.",
    "eng.3":"Proof that outlives us","eng.3.d":"Seals stay verifiable after your account closes: the timestamp comes from a third party, not from us.",
    "cert.h":"What we do not have yet",
    "cert.1":"ISO 27001 certification — not started",
    "cert.2":"Independent security audit — intended, not scheduled",
    "cert.3":"Qualified trust service provider status — no",
    "end.h":"Your deadlines fall either way. Better to be warned.",
    "end.p":"Open an account, upload three documents, set their dates. The first reminder goes out tonight at 6 a.m.",
    "f.tag":"Secure. Organize. Empower.","f.product":"Product","f.features":"Features","f.sec":"Security","f.verify":"Verify a document",
    "f.trust":"Trust","f.exit":"Full export, at any time","f.notrack":"No third-party trackers, no cookie banner","f.contact":"Contact","f.wa":"WhatsApp",
    "f.copy":"© 2026 KDB DocVault · Privacy · Terms","f.weight":"Served with no tracker and no render-blocking third-party font"
  };

  var CALC = {
    agrement:  { rate:.34, fr:["Immobilisation de la flotte","Marché public perdu","Régularisation en urgence"], en:["Fleet grounded","Public tender lost","Emergency re-approval"], k:[.18,.12,.04] },
    assurance: { rate:.28, fr:["Sinistre non couvert","Véhicules à l'arrêt","Surprime au renouvellement"],  en:["Uninsured claim","Vehicles off the road","Renewal surcharge"],   k:[.20,.06,.02] },
    contrat:   { rate:.22, fr:["Reconduction défavorable","Litige et frais de conseil","Remise de volume perdue"], en:["Renewal on worse terms","Dispute and legal fees","Volume discount lost"], k:[.12,.07,.03] }
  };

  var $ = function (id) { return document.getElementById(id); };
  var lang = "fr";
  try { lang = localStorage.getItem("kdb-site-lang") === "en" ? "en" : "fr"; } catch (e) {}

  // ---- language -------------------------------------------------------------
  function translate() {
    var en = lang === "en";
    document.querySelectorAll("[data-t]").forEach(function (n) {
      if (n.dataset.fr === undefined) n.dataset.fr = n.textContent;
      var t = EN[n.getAttribute("data-t")];
      var next = en && t ? t : n.dataset.fr;
      if (n.textContent !== next) n.textContent = next;
    });
    document.documentElement.lang = en ? "en" : "fr";
    if ($("lang-fr")) { $("lang-fr").style.color = en ? "#8FA0B6" : "#FFFFFF"; }
    if ($("lang-en")) { $("lang-en").style.color = en ? "#FFFFFF" : "#8FA0B6"; }
    renderCalc();
    renderDates();
  }
  var toggle = $("lang-toggle");
  if (toggle) toggle.addEventListener("click", function () {
    lang = lang === "en" ? "fr" : "en";
    try { localStorage.setItem("kdb-site-lang", lang); } catch (e) {}
    translate();
  });

  // ---- money & dates --------------------------------------------------------
  function fmt(n) {
    return Math.round(n).toLocaleString("fr-FR").replace(/[  ,]/g, " ") + " FCFA";
  }
  function dateStr(base, days) {
    var d = new Date(base);
    if (isNaN(d)) return "—";
    d.setDate(d.getDate() - days);
    return d.toLocaleDateString(lang === "en" ? "en-GB" : "fr-FR",
      { day: "2-digit", month: "short", year: "numeric" });
  }

  // ---- calculator (home) ----------------------------------------------------
  function renderCalc() {
    var sel = $("calc-type"), valEl = $("calc-val");
    if (!sel || !valEl) return;
    var c = CALC[sel.value] || CALC.agrement;
    var val = Number(valEl.value) || 0;
    var labels = lang === "en" ? c.en : c.fr;
    var set = function (id, v) { var e = $(id); if (e) e.textContent = v; };
    set("calc-r1l", labels[0]); set("calc-r1v", fmt(val * c.k[0]));
    set("calc-r2l", labels[1]); set("calc-r2v", fmt(val * c.k[1]));
    set("calc-r3l", labels[2]); set("calc-r3v", fmt(val * c.k[2]));
    set("calc-total", fmt(val * c.rate));
  }
  if ($("calc-type")) $("calc-type").addEventListener("change", renderCalc);
  if ($("calc-val")) $("calc-val").addEventListener("input", renderCalc);

  // ---- reminder-date checker (produit) --------------------------------------
  function renderDates() {
    var input = $("exp-date");
    if (!input) return;
    var set = function (id, days) { var e = $(id); if (e) e.textContent = dateStr(input.value, days); };
    set("r90", 90); set("r30", 30); set("r7", 7); set("r1", 1);
  }
  if ($("exp-date")) $("exp-date").addEventListener("change", renderDates);

  // ---- scroll-driven timeline + hash chain (home) ---------------------------
  var tlRoot = $("tl-root"), chainRoot = $("chain-root");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function prog(el) {
    if (!el) return 0;
    var r = el.getBoundingClientRect();
    return Math.min(1, Math.max(0, (window.innerHeight * .82 - r.top) / (r.height * .75 + 1)));
  }
  function paint() {
    var tl = reduce ? (tlRoot ? 1 : 0) : prog(tlRoot);
    var ch = reduce ? (chainRoot ? 1 : 0) : prog(chainRoot);
    if (tlRoot) {
      var bar = tlRoot.querySelector(".tl-bar");
      if (bar) bar.style.width = Math.round(Math.min(1, tl) * 100) + "%";
      tlRoot.querySelectorAll(".tl-step").forEach(function (n) {
        var i = Number(n.dataset.step);
        n.style.opacity = tl > i * .2 + .04 ? 1 : .3;
      });
    }
    if (chainRoot) {
      chainRoot.querySelectorAll(".chain-seg").forEach(function (n) {
        var i = Number(n.dataset.seg);
        var p = Math.round(Math.min(1, Math.max(0, (ch - i * .2) / .2)) * 100) + "%";
        n.style.background = "linear-gradient(#38BDF8 " + p + ", rgba(148,163,184,.25) " + p + ")";
      });
      chainRoot.querySelectorAll(".chain-dot").forEach(function (n) {
        var i = Number(n.dataset.dot);
        n.style.background = ch > i * .2 + .02 ? "#38BDF8" : "rgba(148,163,184,.4)";
      });
    }
  }
  if (tlRoot || chainRoot) {
    addEventListener("scroll", paint, { passive: true });
    addEventListener("resize", paint);
  }

  // ---- scroll reveal --------------------------------------------------------
  // Sections fade up as they enter the viewport. Deliberately restrained: one
  // short move, once per element, and never on the first screen — animating
  // what the visitor is already looking at delays the page for no reason.
  //
  // Progressive by construction: the `.reveal` class is only ever added by
  // this function, so with JS disabled every section renders as normal.
  function reveal() {
    if (!("IntersectionObserver" in window)) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    var targets = [].slice.call(document.querySelectorAll("main .s-band"));
    // Skip the hero: it is above the fold and must be there immediately.
    targets = targets.slice(1);
    if (!targets.length) return;

    targets.forEach(function (el) { el.classList.add("reveal"); });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        io.unobserve(entry.target);   // once is enough; re-animating on scroll-up is nausea
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.05 });

    targets.forEach(function (el) { io.observe(el); });
  }

  // ---- boot -----------------------------------------------------------------
  translate();
  paint();
  reveal();
})();
