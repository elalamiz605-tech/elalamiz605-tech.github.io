import { initScene } from './scene.js';

const root = document.documentElement;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(pointer: fine)').matches;
const preloader = document.getElementById('preloader');
const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

function removePreloader() {
  if (preloader && preloader.parentNode) preloader.parentNode.removeChild(preloader);
}

function showEverything() {
  removePreloader();
  document.querySelectorAll('[data-intro], [data-intro-visual], [data-reveal], .line-inner').forEach((el) => {
    el.style.opacity = '';
    el.style.visibility = '';
    el.style.transform = '';
  });
}

// Keep the background videos playing (some browsers need a nudge).
document.querySelectorAll('video').forEach((v) => {
  v.muted = true;
  const p = v.play && v.play();
  if (p && p.catch) p.catch(() => {});
});

if (reduceMotion || !hasGsap) {
  removePreloader();
} else {
  // Fail-safe: never leave the page hidden if something goes wrong.
  const failSafe = setTimeout(showEverything, 7000);
  try {
    start(failSafe);
  } catch (err) {
    console.error(err);
    showEverything();
  }
}

function start(failSafe) {
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (typeof window.Lenis !== 'undefined') {
    lenis = new window.Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    a.addEventListener('click', (e) => {
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { duration: 1.4 });
      else target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  /* ---------- Initial states ---------- */
  gsap.set('[data-intro]', { autoAlpha: 0, y: 30 });
  gsap.set('.line-inner', { yPercent: 115 });
  gsap.set('[data-intro-visual]', { autoAlpha: 0, scale: 0.82 });

  /* ---------- Preloader → hero intro ---------- */
  const counter = { v: 0 };
  const num = document.getElementById('pre-num');
  const bar = document.querySelector('.pre-bar span');
  const tl = gsap.timeline();
  tl.to(counter, {
    v: 100, duration: 1.8, ease: 'power2.inOut',
    onUpdate: () => { if (num) num.textContent = String(Math.round(counter.v)).padStart(3, '0'); }
  })
    .to(bar, { scaleX: 1, duration: 1.8, ease: 'power2.inOut' }, 0)
    .to(preloader, { yPercent: -100, duration: 1, ease: 'expo.inOut' }, '+=0.15')
    .add(() => { removePreloader(); clearTimeout(failSafe); if (lenis) lenis.start(); })
    .to('[data-intro="nav"]', { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out' }, '-=0.45')
    .to('.line-inner', { yPercent: 0, duration: 1.1, stagger: 0.12, ease: 'expo.out' }, '-=0.6')
    .to('[data-intro-visual]', { autoAlpha: 1, scale: 1, duration: 1.6, ease: 'expo.out' }, '<')
    .to('[data-intro]:not([data-intro="nav"])', { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.1, ease: 'power3.out' }, '-=1.2');

  /* ---------- Scroll reveals ---------- */
  gsap.utils.toArray('[data-reveal]:not([data-reveal="card"])').forEach((el) => {
    gsap.from(el, {
      autoAlpha: 0, y: 60, duration: 1.1, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%' }
    });
  });
  gsap.set('[data-reveal="card"]', { autoAlpha: 0, y: 70, rotationX: -14, transformPerspective: 900, transformOrigin: '50% 0%' });
  ScrollTrigger.batch('[data-reveal="card"]', {
    start: 'top 92%',
    onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, rotationX: 0, duration: 1, stagger: 0.09, ease: 'power3.out', overwrite: true })
  });

  // Process line draws itself while scrolling.
  const line = document.querySelector('.aj-draw');
  if (line) {
    gsap.fromTo(line, { scaleX: 0 }, {
      scaleX: 1, transformOrigin: 'left center', ease: 'none',
      scrollTrigger: { trigger: '#methode', start: 'top 70%', end: 'bottom 75%', scrub: true }
    });
  }

  // Hero parallax on scroll.
  gsap.to('#hero-visual', {
    yPercent: 18, ease: 'none',
    scrollTrigger: { trigger: '#accueil', start: 'top top', end: 'bottom top', scrub: true }
  });

  /* ---------- Pointer effects (mouse only) ---------- */
  if (finePointer) {
    const ring = document.getElementById('cursor-ring');
    const dot = document.getElementById('cursor-dot');
    const ringX = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3' });
    const ringY = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3' });
    const dotX = gsap.quickTo(dot, 'x', { duration: 0.1 });
    const dotY = gsap.quickTo(dot, 'y', { duration: 0.1 });
    let shown = false;
    window.addEventListener('pointermove', (e) => {
      if (!shown) { gsap.to([ring, dot], { opacity: 1, duration: 0.3 }); shown = true; }
      ringX(e.clientX); ringY(e.clientY); dotX(e.clientX); dotY(e.clientY);
    });
    document.querySelectorAll('a, button, input, select, textarea, .aj-card').forEach((el) => {
      el.addEventListener('pointerenter', () => ring.classList.add('is-hover'));
      el.addEventListener('pointerleave', () => ring.classList.remove('is-hover'));
    });

    // Magnetic buttons.
    document.querySelectorAll('.aj-btn').forEach((btn) => {
      const xTo = gsap.quickTo(btn, 'x', { duration: 0.5, ease: 'power3' });
      const yTo = gsap.quickTo(btn, 'y', { duration: 0.5, ease: 'power3' });
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.35);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.45);
      });
      btn.addEventListener('pointerleave', () => gsap.to(btn, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.4)' }));
    });

    // 3D tilt + glare on cards.
    document.querySelectorAll('.aj-card').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
        gsap.to(card, { rotationY: (px - 0.5) * 12, rotationX: (0.5 - py) * 10, y: -6, transformPerspective: 900, duration: 0.5, ease: 'power3.out', overwrite: 'auto' });
      });
      card.addEventListener('pointerleave', () => gsap.to(card, { rotationY: 0, rotationX: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.5)' }));
    });
  }

  /* ---------- Real-time isometric 3D scene ---------- */
  const sceneCanvas = document.getElementById('scene3d');
  if (sceneCanvas) {
    try {
      initScene({ canvas: sceneCanvas, gsap, ScrollTrigger, onReady: () => root.classList.add('webgl') });
    } catch (err) { console.warn('3D scene disabled:', err); }
  }
}
