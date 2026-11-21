import * as THREE from './vendor/three.module.min.js';

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

  /* ---------- WebGL data globe ---------- */
  try { initGlobe(gsap, ScrollTrigger); } catch (err) { console.warn('WebGL globe disabled:', err); }
}

function initGlobe(gsap, ScrollTrigger) {
  const canvas = document.getElementById('globe');
  const holder = document.getElementById('hero-visual');
  if (!canvas || !holder) return;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(pixelRatio);
  root.classList.add('webgl');

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0, 8.2);

  const globe = new THREE.Group();
  scene.add(globe);
  const R = 2.2;

  // Points on a sphere (Fibonacci distribution).
  const COUNT = 4200;
  const pos = new Float32Array(COUNT * 3);
  const col = new Float32Array(COUNT * 3);
  const size = new Float32Array(COUNT);
  const phase = new Float32Array(COUNT);
  const cyan = new THREE.Color('#38BDF8');
  const blue = new THREE.Color('#3B82F6');
  const white = new THREE.Color('#E0F2FE');
  const amber = new THREE.Color('#F5B83D');
  const surface = [];
  for (let i = 0; i < COUNT; i++) {
    const y = 1 - (i / (COUNT - 1)) * 2;
    const rad = Math.sqrt(1 - y * y);
    const th = i * Math.PI * (3 - Math.sqrt(5));
    const v = new THREE.Vector3(Math.cos(th) * rad, y, Math.sin(th) * rad).multiplyScalar(R);
    surface.push(v);
    pos.set([v.x, v.y, v.z], i * 3);
    const r = Math.random();
    const c = r < 0.03 ? amber : r < 0.12 ? white : r < 0.55 ? cyan : blue;
    col.set([c.r, c.g, c.b], i * 3);
    size[i] = r < 0.03 ? 5.5 : 2 + Math.random() * 2.2;
    phase[i] = Math.random() * Math.PI * 2;
  }

  const pointMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uPixelRatio: { value: pixelRatio } },
    vertexShader: `
      attribute float aSize; attribute float aPhase; attribute vec3 aColor;
      uniform float uTime; uniform float uPixelRatio;
      varying vec3 vColor; varying float vAlpha;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vec4 mv = viewMatrix * world;
        gl_Position = projectionMatrix * mv;
        float tw = 0.6 + 0.4 * sin(uTime * 1.8 + aPhase);
        gl_PointSize = aSize * uPixelRatio * (7.0 / -mv.z) * (0.85 + 0.3 * tw);
        vAlpha = (0.18 + 0.82 * smoothstep(-2.4, 2.2, world.z)) * tw;
        vColor = aColor;
      }`,
    fragmentShader: `
      varying vec3 vColor; varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d);
        gl_FragColor = vec4(vColor, a * vAlpha);
      }`
  });
  const pointGeo = new THREE.BufferGeometry();
  pointGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  pointGeo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  pointGeo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  pointGeo.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
  globe.add(new THREE.Points(pointGeo, pointMat));

  // Data arcs with travelling packets.
  const arcs = [];
  const arcMat = new THREE.LineBasicMaterial({ color: '#38BDF8', transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false });
  for (let i = 0; i < 22; i++) {
    let a, b, ang;
    do {
      a = surface[(Math.random() * COUNT) | 0];
      b = surface[(Math.random() * COUNT) | 0];
      ang = a.angleTo(b);
    } while (ang < 0.6 || ang > 2.0);
    const mid = a.clone().add(b).normalize().multiplyScalar(R * (1 + ang * 0.28));
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    globe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(64)), arcMat));
    arcs.push({ curve, offset: Math.random(), speed: 0.12 + Math.random() * 0.18 });
  }
  const pkPos = new Float32Array(arcs.length * 3);
  const pkCol = new Float32Array(arcs.length * 3);
  const pkSize = new Float32Array(arcs.length).fill(9);
  const pkPhase = new Float32Array(arcs.length);
  arcs.forEach((_, i) => { const c = i % 3 === 0 ? amber : white; pkCol.set([c.r, c.g, c.b], i * 3); });
  const pkGeo = new THREE.BufferGeometry();
  pkGeo.setAttribute('position', new THREE.BufferAttribute(pkPos, 3));
  pkGeo.setAttribute('aColor', new THREE.BufferAttribute(pkCol, 3));
  pkGeo.setAttribute('aSize', new THREE.BufferAttribute(pkSize, 1));
  pkGeo.setAttribute('aPhase', new THREE.BufferAttribute(pkPhase, 1));
  globe.add(new THREE.Points(pkGeo, pointMat));

  // Orbit rings.
  const rings = new THREE.Group();
  scene.add(rings);
  [[2.75, 0.55, '#38BDF8', 0.5], [3.1, -0.35, '#60A5FA', 0.3], [3.45, 0.9, '#F5B83D', 0.35]].forEach(([r, tilt, c, o]) => {
    const pts = [];
    for (let i = 0; i <= 160; i++) { const t = (i / 160) * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(t) * r, 0, Math.sin(t) * r)); }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineDashedMaterial({ color: c, dashSize: 0.18, gapSize: 0.12, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false });
    const loop = new THREE.Line(geo, mat);
    loop.computeLineDistances();
    loop.rotation.x = Math.PI / 2 + tilt;
    loop.rotation.z = tilt * 0.6;
    rings.add(loop);
  });

  // Soft core glow.
  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = glowCanvas.height = 256;
  const g = glowCanvas.getContext('2d');
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, 'rgba(125,211,252,0.9)');
  grad.addColorStop(0.35, 'rgba(56,189,248,0.35)');
  grad.addColorStop(1, 'rgba(37,99,235,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 256, 256);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(glowCanvas), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.55 }));
  glow.scale.set(7.5, 7.5, 1);
  scene.add(glow);

  // Size to the holder.
  function resize() {
    const r = canvas.getBoundingClientRect();
    const w = Math.max(1, r.width), h = Math.max(1, r.height);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.z = 8.2 * Math.max(1, 1.15 / camera.aspect);
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  // Pointer parallax.
  const target = { x: 0, y: 0 };
  window.addEventListener('pointermove', (e) => {
    target.x = (e.clientX / window.innerWidth - 0.5);
    target.y = (e.clientY / window.innerHeight - 0.5);
  });

  // Scroll links to rotation speed and zoom.
  const scrollState = { p: 0 };
  ScrollTrigger.create({
    trigger: '#accueil', start: 'top top', end: 'bottom top', scrub: true,
    onUpdate: (self) => { scrollState.p = self.progress; }
  });

  // Render only while the hero is on screen.
  let visible = true;
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(holder);

  const clock = new THREE.Clock();
  let spin = 0;
  function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    pointMat.uniforms.uTime.value = t;
    spin += dt * (0.14 + scrollState.p * 0.6);
    globe.rotation.y = spin + target.x * 0.6;
    globe.rotation.x += ((0.25 + target.y * 0.45) - globe.rotation.x) * 0.05;
    rings.rotation.y = -spin * 0.6;
    rings.rotation.x += ((target.y * 0.3) - rings.rotation.x) * 0.05;
    const s = 1 - scrollState.p * 0.25;
    globe.scale.setScalar(s); rings.scale.setScalar(s);
    glow.material.opacity = 0.45 + Math.sin(t * 1.6) * 0.12;
    arcs.forEach((a, i) => {
      const p = a.curve.getPoint((t * a.speed + a.offset) % 1);
      pkPos[i * 3] = p.x; pkPos[i * 3 + 1] = p.y; pkPos[i * 3 + 2] = p.z;
    });
    pkGeo.attributes.position.needsUpdate = true;
    renderer.render(scene, camera);
  }
  frame();
}
