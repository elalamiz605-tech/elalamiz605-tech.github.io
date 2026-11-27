/* ==========================================================
   Ziad El Alami · Portfolio scripts
   - EN/FR language toggle (remembered in localStorage)
   - Contact form that opens the visitor's email app
   - Scroll reveal animations
   - Subtle animated starfield
   ========================================================== */

const CONTACT_EMAIL = "elalamiz605@gmail.com";

/* ---------- Translations (English is written in the HTML) ---------- */
const FR = {
  "nav.services": "Services",
  "nav.projects": "Projets",
  "nav.contact": "Contact",
  "hero.eyebrow": "Développeur Full-Stack · À distance, partout dans le monde",
  "hero.hello": "Bonjour, je suis",
  "hero.tagline": "Je crée des sites web rapides, des chatbots IA et des outils d'automatisation qui aident les petites entreprises à gagner des clients et du temps.",
  "hero.cta1": "Lancer un projet",
  "hero.cta2": "Voir mes projets",
  "services.title": "Services",
  "services.sub": "Des solutions concrètes, des prix clairs, une livraison rapide.",
  "services.web.title": "Sites web",
  "services.web.text": "Sites vitrines et landing pages modernes et responsives : rapides, optimisés pour le référencement et faciles à mettre à jour.",
  "services.bot.title": "Chatbots IA",
  "services.bot.text": "Assistants de service client propulsés par l'IA générative, qui répondent à vos clients 24h/24, dans leur langue.",
  "services.auto.title": "Automatisation Python",
  "services.auto.text": "Des scripts qui suppriment les tâches répétitives : traitement de données, rapports, web scraping et intégrations d'API.",
  "projects.title": "Projets",
  "projects.sub": "Une sélection de travaux récents.",
  "projects.demo": "Voir la démo →",
  "projects.p1.title": "Site de restaurant (démo)",
  "projects.p1.text": "Un site vitrine moderne pour un restaurant fictif : menu, horaires, localisation et réservation.",
  "projects.p2.title": "Chatbot IA pour entreprise",
  "projects.p2.text": "Un assistant basé sur Gemini qui répond aux questions des clients d'une petite entreprise, avec un backend sécurisé.",
  "projects.p3.title": "Ce portfolio",
  "projects.p3.text": "Un site d'une page, léger et bilingue, réalisé en HTML, CSS et JavaScript.",
  "projects.p4.title": "Site d'agence animé (démo)",
  "projects.p4.text": "Un site vitrine cinématique pour une agence fictive d'automatisation et d'IA : vidéo en arrière-plan, animations holographiques et effets au défilement.",
  "projects.soon": "Bientôt disponible",
  "projects.code": "Voir le code →",
  "contact.title": "Travaillons ensemble",
  "contact.sub": "Parlez-moi de votre projet. Je réponds généralement sous 24 heures.",
  "contact.name": "Nom",
  "contact.email": "Email",
  "contact.message": "Message",
  "contact.send": "Envoyer le message",
  "contact.location": "Localisation",
  "contact.city": "Espagne · À distance partout",
  "footer.made": "Réalisé en HTML, CSS et JavaScript",
};

const NOTES = {
  en: { missing: "Please fill in all fields with a valid email.", opening: "Opening your email app…" },
  fr: { missing: "Merci de remplir tous les champs avec un email valide.", opening: "Ouverture de votre messagerie…" },
};

/* Save the original English text so we can switch back */
const i18nNodes = document.querySelectorAll("[data-i18n]");
const EN = {};
i18nNodes.forEach((el) => { EN[el.dataset.i18n] = el.textContent.trim(); });

let currentLang = "en";

function setLanguage(lang) {
  currentLang = lang;
  const dict = lang === "fr" ? FR : EN;
  i18nNodes.forEach((el) => {
    const text = dict[el.dataset.i18n];
    if (text) el.textContent = text;
  });
  document.documentElement.lang = lang;
  document.getElementById("lang-toggle").textContent = lang === "fr" ? "EN" : "FR";
  try { localStorage.setItem("lang", lang); } catch (_) { /* storage may be blocked */ }
}

document.getElementById("lang-toggle").addEventListener("click", () => {
  setLanguage(currentLang === "en" ? "fr" : "en");
});

/* Initial language: saved choice, then browser language */
(function initLanguage() {
  let saved = null;
  try { saved = localStorage.getItem("lang"); } catch (_) {}
  const browserFr = (navigator.language || "").toLowerCase().startsWith("fr");
  if (saved === "fr" || (!saved && browserFr)) setLanguage("fr");
})();

/* ---------- Contact form → mailto ---------- */
document.getElementById("contact-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const fields = event.target.elements; // use .elements: form.name would return the form's own name
  const note = document.getElementById("form-note");
  const name = fields.name.value.trim();
  const email = fields.email.value.trim();
  const message = fields.message.value.trim();

  if (!name || !message || !email || !fields.email.checkValidity()) {
    note.textContent = NOTES[currentLang].missing;
    return;
  }

  const subject = encodeURIComponent(`New project inquiry from ${name}`);
  const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`);
  note.textContent = NOTES[currentLang].opening;
  window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
});

/* ---------- Footer year ---------- */
document.getElementById("year").textContent = new Date().getFullYear();

/* ---------- Scroll reveal ---------- */
const revealObserver = new IntersectionObserver(
  (entries) => entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    }
  }),
  { threshold: 0.15 }
);
document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

/* ---------- Starfield background ---------- */
(function starfield() {
  const canvas = document.getElementById("stars");
  const ctx = canvas.getContext("2d");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let stars = [];

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    canvas.style.width = innerWidth + "px";
    canvas.style.height = innerHeight + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.min(140, Math.floor((innerWidth * innerHeight) / 9000));
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * innerWidth,
      y: Math.random() * innerHeight,
      r: Math.random() * 1.2 + 0.2,
      phase: Math.random() * Math.PI * 2,
      cyan: Math.random() < 0.15,
    }));
  }

  function draw(time) {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const s of stars) {
      const alpha = 0.35 + 0.45 * Math.sin(time / 1400 + s.phase) ** 2;
      ctx.fillStyle = s.cyan ? `rgba(103,232,249,${alpha})` : `rgba(236,235,245,${alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    if (!reduceMotion) requestAnimationFrame(draw);
  }

  resize();
  addEventListener("resize", resize);
  requestAnimationFrame(draw);
})();
