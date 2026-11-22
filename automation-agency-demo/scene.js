// Isometric 3D "automation studio" scene, rendered in real time with three.js.
import * as THREE from 'three';
import { RoundedBoxGeometry } from './vendor/RoundedBoxGeometry.js';

const C = {
  white: '#F4F8FF', paper: '#FFFFFF', light: '#DCE8FB', side: '#B8CBEA',
  blue: '#2563EB', blue2: '#3B82F6', cyan: '#38BDF8', navy: '#0F1E3D',
  amber: '#F5B83D', skin: '#F1C3A1', hair: '#1E293B', green: '#22C55E'
};

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.05, ...opts });
}
function rbox(w, h, d, r, material) {
  const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, r), material);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

// A canvas texture we can redraw every few frames.
function livePanel(w, h, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return { tex, update: (t) => { draw(ctx, w, h, t); tex.needsUpdate = true; } };
}
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

function gearGeometry(rOuter, rInner, teeth, depth) {
  const shape = new THREE.Shape();
  const step = (Math.PI * 2) / teeth;
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    const pts = [
      [rInner, a], [rOuter, a + step * 0.18], [rOuter, a + step * 0.48], [rInner, a + step * 0.66]
    ];
    pts.forEach(([r, ang], k) => {
      const x = Math.cos(ang) * r, y = Math.sin(ang) * r;
      if (i === 0 && k === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
    });
  }
  shape.closePath();
  const hole = new THREE.Path();
  hole.absarc(0, 0, rInner * 0.38, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2, curveSegments: 24 });
  g.center();
  return g;
}

export function initScene({ canvas, gsap, ScrollTrigger, onReady }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog('#020617', 38, 70);

  // Isometric orthographic camera.
  const camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 200);
  const camBase = new THREE.Vector3(24, 20, 24);
  const lookAt = new THREE.Vector3(0, 2.4, 0);
  camera.position.copy(camBase);
  camera.lookAt(lookAt);

  // Lights.
  scene.add(new THREE.HemisphereLight('#DDE9FF', '#0B1630', 1.1));
  const sun = new THREE.DirectionalLight('#FFFFFF', 2.2);
  sun.position.set(10, 18, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 50 });
  sun.shadow.bias = -0.0004;
  sun.shadow.radius = 4;
  scene.add(sun);
  const rim = new THREE.PointLight('#38BDF8', 30, 30, 2);
  rim.position.set(-6, 6, -6);
  scene.add(rim);

  const world = new THREE.Group();
  scene.add(world);

  // Ground grid that fades away.
  const grid = new THREE.GridHelper(60, 60, '#1D4ED8', '#12306B');
  grid.material.transparent = true; grid.material.opacity = 0.35;
  grid.position.y = -0.62;
  world.add(grid);

  // Main platform.
  const platform = rbox(11, 1.0, 9, 0.35, mat(C.white));
  platform.position.y = -0.1;
  world.add(platform);
  const edge = rbox(11.3, 0.25, 9.3, 0.12, mat(C.blue, { emissive: C.blue, emissiveIntensity: 0.35 }));
  edge.position.y = -0.62;
  world.add(edge);

  // Workstation (desk, laptop, chair, worker) turned to face the camera in 3/4.
  const station = new THREE.Group();
  world.add(station);

  // Desk.
  const desk = new THREE.Group();
  const top = rbox(4.2, 0.18, 2.2, 0.08, mat(C.paper));
  top.position.y = 1.6;
  desk.add(top);
  [[-1.9, -0.9], [1.9, -0.9], [-1.9, 0.9], [1.9, 0.9]].forEach(([x, z]) => {
    const leg = rbox(0.14, 1.5, 0.14, 0.05, mat(C.side));
    leg.position.set(x, 0.85, z); desk.add(leg);
  });
  desk.position.set(-0.6, 0.4, -1.2);
  station.add(desk);

  // Laptop with live code screen.
  const code = livePanel(512, 320, (ctx, w, h, t) => {
    ctx.fillStyle = '#071330'; ctx.fillRect(0, 0, w, h);
    const colors = ['#38BDF8', '#93C5FD', '#F5B83D', '#A5F3FC', '#60A5FA'];
    const off = (t * 40) % 26;
    for (let i = 0; i < 16; i++) {
      const y = 20 + i * 26 - off;
      const indent = ((i * 37) % 4) * 22;
      const len = 80 + ((i * 53) % 220);
      ctx.fillStyle = colors[i % colors.length];
      ctx.globalAlpha = 0.85;
      roundRect(ctx, 28 + indent, y, len, 9, 4); ctx.fill();
      ctx.globalAlpha = 0.4;
      roundRect(ctx, 40 + indent + len, y, 50 + ((i * 29) % 90), 9, 4); ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (Math.floor(t * 2) % 2) { ctx.fillStyle = '#FFFFFF'; ctx.fillRect(40, h - 34, 12, 18); }
  });
  const laptop = new THREE.Group();
  const base = rbox(1.5, 0.07, 1.0, 0.03, mat('#CBD5E1', { metalness: 0.4, roughness: 0.35 }));
  laptop.add(base);
  const lid = new THREE.Group();
  const lidBody = rbox(1.5, 0.95, 0.05, 0.03, mat('#CBD5E1', { metalness: 0.4, roughness: 0.35 }));
  lidBody.position.y = 0.48; lid.add(lidBody);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.36, 0.82), new THREE.MeshBasicMaterial({ map: code.tex, toneMapped: false }));
  screen.position.set(0, 0.48, 0.03); lid.add(screen);
  lid.position.set(0, 0.03, -0.48); lid.rotation.x = -0.22;
  laptop.add(lid);
  laptop.position.set(-0.6, 2.13, -1.25);
  laptop.rotation.y = Math.PI; // screen faces the worker
  station.add(laptop);

  // Coffee mug and plant (small details).
  const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.12, 0.28, 20), mat(C.amber));
  mug.position.set(0.9, 1.94, -1.0); mug.castShadow = true; station.add(mug);
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.22, 0.5, 20), mat(C.paper));
  pot.position.set(4.3, 0.65, -3.4); pot.castShadow = true; world.add(pot);
  const leaves = new THREE.Group();
  for (let i = 0; i < 7; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), mat(i % 2 ? '#22C55E' : '#16A34A'));
    leaf.scale.set(0.6, 1.4, 0.35);
    const a = (i / 7) * Math.PI * 2;
    leaf.position.set(Math.cos(a) * 0.18, 0.4 + (i % 3) * 0.15, Math.sin(a) * 0.18);
    leaf.rotation.set(Math.sin(a) * 0.5, a, Math.cos(a) * 0.5);
    leaf.castShadow = true; leaves.add(leaf);
  }
  leaves.position.copy(pot.position).add(new THREE.Vector3(0, 0.2, 0));
  world.add(leaves);

  // Chair + stylised worker.
  const chair = new THREE.Group();
  const seat = rbox(1.1, 0.16, 1.0, 0.06, mat(C.navy));
  seat.position.y = 1.15; chair.add(seat);
  const back = rbox(1.1, 1.2, 0.14, 0.06, mat(C.navy));
  back.position.set(0, 1.85, 0.48); chair.add(back);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.7, 12), mat('#64748B'));
  pole.position.y = 0.75; chair.add(pole);
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.08, 20), mat('#64748B'));
  foot.position.y = 0.42; chair.add(foot);
  chair.position.set(-0.6, 0, 0.35);
  station.add(chair);

  const worker = new THREE.Group();
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.36, 0.55, 8, 16), mat(C.blue));
  torso.position.y = 1.85; torso.rotation.x = -0.12; torso.castShadow = true; worker.add(torso);
  const head = new THREE.Group();
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 18), mat(C.skin));
  face.castShadow = true; head.add(face);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.315, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.55), mat(C.hair));
  hair.rotation.x = 0.35; head.add(hair);
  head.position.set(0, 2.72, -0.05);
  worker.add(head);
  const arms = [];
  [-1, 1].forEach((s) => {
    const arm = new THREE.Group();
    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.55, 6, 12), mat(C.blue));
    upper.position.y = -0.3; upper.castShadow = true; arm.add(upper);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), mat(C.skin));
    hand.position.y = -0.68; arm.add(hand);
    arm.position.set(s * 0.42, 2.2, -0.1);
    arm.rotation.set(-1.15, 0, s * 0.18);
    worker.add(arm); arms.push(arm);
  });
  const legs = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.7, 6, 12), mat(C.navy));
  legs.rotation.x = Math.PI / 2; legs.position.set(0, 1.35, -0.4); worker.add(legs);
  worker.position.set(-0.6, 0, 0.35);
  station.add(worker);

  station.rotation.y = -Math.PI / 2;
  station.position.set(-0.4, 0, -0.2);
  station.scale.setScalar(1.15);
  station.updateMatrixWorld(true);

  // Floating holographic panels.
  const panels = [];
  function addPanel(texPanel, w, h, pos, rotY, phase) {
    const g = new THREE.Group();
    const frame = rbox(w + 0.16, h + 0.16, 0.08, 0.06, mat(C.paper, { emissive: '#BFDBFE', emissiveIntensity: 0.15 }));
    g.add(frame);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: texPanel.tex, toneMapped: false }));
    face.position.z = 0.05; g.add(face);
    g.position.copy(pos); g.rotation.y = rotY; g.scale.setScalar(1.3);
    world.add(g);
    panels.push({ g, base: pos.clone(), phase, tex: texPanel });
    return g;
  }

  const bars = livePanel(512, 320, (ctx, w, h, t) => {
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#0F1E3D'; ctx.font = '700 34px Inter, Arial, sans-serif'; ctx.fillText('Temps gagné', 28, 46);
    ctx.fillStyle = '#64748B'; ctx.font = '24px Inter, Arial, sans-serif'; ctx.fillText('par semaine', 28, 80);
    for (let i = 0; i < 7; i++) {
      const v = 0.35 + 0.55 * (0.5 + 0.5 * Math.sin(t * 1.4 + i * 0.9));
      const bh = v * 170;
      ctx.fillStyle = i === 6 ? '#F5B83D' : (i % 2 ? '#3B82F6' : '#93C5FD');
      roundRect(ctx, 34 + i * 64, 290 - bh, 40, bh, 8); ctx.fill();
    }
  });
  const line = livePanel(512, 320, (ctx, w, h, t) => {
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#0F1E3D'; ctx.font = '700 34px Inter, Arial, sans-serif'; ctx.fillText('Chiffre d’affaires', 28, 46);
    ctx.strokeStyle = '#E2E8F0'; ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(28, 110 + i * 50); ctx.lineTo(484, 110 + i * 50); ctx.stroke(); }
    ctx.strokeStyle = '#2563EB'; ctx.lineWidth = 6; ctx.lineJoin = 'round';
    ctx.beginPath();
    const pts = [];
    for (let i = 0; i <= 40; i++) {
      const x = 28 + i * 11.4;
      const y = 270 - i * 3.6 - Math.sin(i * 0.5 + t * 1.2) * 18;
      pts.push([x, y]); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
    const k = Math.floor(((t * 0.25) % 1) * 40);
    ctx.fillStyle = '#F5B83D'; ctx.beginPath(); ctx.arc(pts[k][0], pts[k][1], 11, 0, Math.PI * 2); ctx.fill();
  });
  const tasks = ['Devis envoyé', 'Facture classée', 'Relance planifiée', 'RDV confirmé'];
  const checklist = livePanel(512, 400, (ctx, w, h, t) => {
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#0F1E3D'; ctx.font = '700 36px Inter, Arial, sans-serif'; ctx.fillText('Automatisations', 30, 52);
    const done = Math.floor((t * 0.7) % (tasks.length + 2));
    tasks.forEach((label, i) => {
      const y = 100 + i * 72;
      ctx.fillStyle = i < done ? '#EFF6FF' : '#F8FAFC';
      roundRect(ctx, 26, y, 460, 56, 14); ctx.fill();
      ctx.fillStyle = i < done ? '#22C55E' : '#CBD5E1';
      ctx.beginPath(); ctx.arc(60, y + 28, 15, 0, Math.PI * 2); ctx.fill();
      if (i < done) {
        ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 4; ctx.beginPath();
        ctx.moveTo(52, y + 28); ctx.lineTo(58, y + 34); ctx.lineTo(69, y + 21); ctx.stroke();
      }
      ctx.fillStyle = '#1E293B'; ctx.font = '600 28px Inter, Arial, sans-serif'; ctx.fillText(label, 92, y + 36);
    });
  });
  const mail = livePanel(320, 320, (ctx, w, h, t) => {
    ctx.fillStyle = '#2563EB'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 12; ctx.lineJoin = 'round';
    roundRect(ctx, 60, 95, 200, 140, 16); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(66, 104); ctx.lineTo(160, 175); ctx.lineTo(254, 104); ctx.stroke();
    const n = 1 + (Math.floor(t * 0.7) % 9);
    ctx.fillStyle = '#F5B83D'; ctx.beginPath(); ctx.arc(250, 90, 34, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0F1E3D'; ctx.font = '700 36px Inter, Arial, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(String(n), 250, 103); ctx.textAlign = 'left';
  });
  addPanel(bars, 2.6, 1.62, new THREE.Vector3(-4.4, 6.0, -1.2), Math.PI / 4, 0);
  addPanel(line, 2.6, 1.62, new THREE.Vector3(0.8, 7.2, -4.2), Math.PI / 4, 1.3);
  addPanel(checklist, 2.4, 1.88, new THREE.Vector3(5.2, 4.9, -1.6), Math.PI / 4, 2.4);
  addPanel(mail, 1.2, 1.2, new THREE.Vector3(-4.6, 3.2, 2.4), Math.PI / 4, 3.1);

  // Interlocking gears.
  const gears = [];
  const gA = new THREE.Mesh(gearGeometry(1.15, 0.95, 14, 0.28), mat(C.blue, { metalness: 0.3, roughness: 0.4 }));
  gA.position.set(-3.9, 1.45, -3.6); gA.castShadow = true; world.add(gA); gears.push([gA, 1]);
  const gB = new THREE.Mesh(gearGeometry(0.72, 0.56, 9, 0.28), mat(C.amber, { metalness: 0.3, roughness: 0.4 }));
  gB.position.set(-2.32, 2.0, -3.6); gB.castShadow = true; world.add(gB); gears.push([gB, -14 / 9]);
  const gC = new THREE.Mesh(gearGeometry(0.6, 0.46, 8, 0.24), mat(C.cyan, { metalness: 0.3, roughness: 0.4 }));
  gC.position.set(-4.95, 2.85, -3.6); gC.castShadow = true; world.add(gC); gears.push([gC, -14 / 8]);

  // Conveyor belt with documents passing through a scanner.
  const belt = rbox(9.2, 0.22, 1.1, 0.08, mat('#1E293B', { roughness: 0.8 }));
  belt.position.set(0.2, 0.55, 3.3); world.add(belt);
  for (let i = 0; i < 10; i++) {
    const roller = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.14, 12), mat('#64748B'));
    roller.rotation.x = Math.PI / 2; roller.position.set(-4.2 + i * 0.95, 0.42, 3.3); world.add(roller);
  }
  const arch = new THREE.Group();
  const archMat = mat(C.paper);
  const pL = rbox(0.25, 1.4, 0.25, 0.08, archMat); pL.position.set(0, 0.7, -0.68); arch.add(pL);
  const pR = rbox(0.25, 1.4, 0.25, 0.08, archMat); pR.position.set(0, 0.7, 0.68); arch.add(pR);
  const beam = rbox(0.35, 0.3, 1.6, 0.1, archMat); beam.position.set(0, 1.45, 0); arch.add(beam);
  const laser = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 1.1), new THREE.MeshBasicMaterial({ color: C.cyan, transparent: true, opacity: 0.85, side: THREE.DoubleSide, toneMapped: false }));
  laser.rotation.y = Math.PI / 2; laser.position.y = 0.85; arch.add(laser);
  arch.position.set(0.2, 0.55, 3.3); world.add(arch);
  const docs = [];
  const docWhite = new THREE.Color(C.paper), docDone = new THREE.Color('#BBF7D0');
  for (let i = 0; i < 6; i++) {
    const d = rbox(0.75, 0.06, 0.95, 0.03, mat(C.paper));
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.01, 0.1), mat(C.blue2));
    stripe.position.set(0, 0.04, -0.25); d.add(stripe);
    world.add(d); docs.push({ d, offset: i / 6 });
  }

  // Data streams: glowing tubes from the laptop to each panel, with packets.
  const streams = [];
  const tubeMat = new THREE.MeshBasicMaterial({ color: C.cyan, transparent: true, opacity: 0.28, toneMapped: false });
  const packetMat = new THREE.MeshBasicMaterial({ color: '#E0F2FE', toneMapped: false });
  const packetMatAmber = new THREE.MeshBasicMaterial({ color: C.amber, toneMapped: false });
  const start = laptop.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0.6, 0));
  panels.forEach((p, i) => {
    const end = p.base.clone();
    const mid = start.clone().lerp(end, 0.5).add(new THREE.Vector3(0, 2.2, 0));
    const curve = new THREE.CatmullRomCurve3([start, mid, end]);
    world.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.025, 6, false), tubeMat));
    for (let k = 0; k < 2; k++) {
      const pk = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 10), (i + k) % 3 === 0 ? packetMatAmber : packetMat);
      world.add(pk);
      streams.push({ curve, pk, offset: k * 0.5 + i * 0.13, speed: 0.22 + i * 0.03 });
    }
  });

  // Floating cubes for depth.
  const floaters = [];
  for (let i = 0; i < 14; i++) {
    const s = 0.18 + Math.random() * 0.3;
    const cube = rbox(s, s, s, s * 0.2, mat(i % 4 === 0 ? C.amber : i % 2 ? C.cyan : C.blue2, { emissive: i % 2 ? C.cyan : C.blue, emissiveIntensity: 0.25 }));
    let tries = 0;
    do {
      const a = Math.random() * Math.PI * 2, r = 7.5 + Math.random() * 4;
      cube.position.set(Math.cos(a) * r, 1 + Math.random() * 7, Math.sin(a) * r);
      tries++;
    } while (tries < 60 && (panels.some((p) => p.base.distanceTo(cube.position) < 3.4) || cube.position.x - cube.position.z < -8));
    world.add(cube);
    floaters.push({ cube, base: cube.position.clone(), phase: Math.random() * 6, spin: 0.3 + Math.random() * 0.6 });
  }

  // Sizing and framing: on wide screens the scene sits on the right.
  let viewW = 1, viewH = 1;
  function resize() {
    const r = canvas.getBoundingClientRect();
    viewW = Math.max(1, r.width); viewH = Math.max(1, r.height);
    renderer.setSize(viewW, viewH, false);
    const aspect = viewW / viewH;
    const wide = viewW > 900;
    // Wide screens: fixed height framing, scene on the right.
    // Narrow screens: fit the scene to the width and place it under the text.
    const frustum = wide ? 16.5 : 14.5 / aspect;
    camera.left = (-frustum * aspect) / 2; camera.right = (frustum * aspect) / 2;
    camera.top = frustum / 2; camera.bottom = -frustum / 2;
    if (wide) camera.setViewOffset(viewW, viewH, -viewW * 0.2, -viewH * 0.05, viewW, viewH);
    else {
      // Centre the scene on the empty hero-visual area under the text.
      const spot = document.getElementById('hero-visual');
      let y = 0;
      if (spot) {
        const hv = spot.getBoundingClientRect();
        y = viewH / 2 - (hv.top + hv.height / 2 - r.top);
      }
      camera.setViewOffset(viewW, viewH, 0, y, viewW, viewH);
    }
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('load', resize);
  setTimeout(resize, 600);

  // Pointer parallax and scroll.
  const pointer = { x: 0, y: 0 };
  window.addEventListener('pointermove', (e) => {
    pointer.x = e.clientX / window.innerWidth - 0.5;
    pointer.y = e.clientY / window.innerHeight - 0.5;
  });
  const scroll = { p: 0 };
  if (ScrollTrigger) {
    ScrollTrigger.create({ trigger: canvas.parentElement, start: 'top top', end: 'bottom top', scrub: true, onUpdate: (s) => { scroll.p = s.progress; } });
  }

  // Intro: the world rises and scales in.
  world.scale.setScalar(0.001);
  if (gsap) {
    gsap.to(world.scale, { x: 1, y: 1, z: 1, duration: 1.8, ease: 'expo.out', delay: 0.2 });
    gsap.from(world.position, { y: -4, duration: 1.8, ease: 'expo.out', delay: 0.2 });
  } else world.scale.setScalar(1);

  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);

  const clock = new THREE.Clock();
  let lastTex = 0;
  let readyCalled = false;
  function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;
    const t = clock.getElapsedTime();

    // Camera sway, pointer parallax, scroll dolly.
    const ang = Math.sin(t * 0.15) * 0.06 + pointer.x * 0.25;
    const cs = Math.cos(ang), sn = Math.sin(ang);
    camera.position.set(camBase.x * cs - camBase.z * sn, camBase.y - pointer.y * 3 + scroll.p * 6, camBase.x * sn + camBase.z * cs);
    camera.lookAt(lookAt.x, lookAt.y + scroll.p * 2, lookAt.z);
    world.rotation.y = scroll.p * 0.5;

    panels.forEach((p) => {
      p.g.position.y = p.base.y + Math.sin(t * 1.1 + p.phase) * 0.18;
      p.g.rotation.z = Math.sin(t * 0.8 + p.phase) * 0.025;
    });
    gears.forEach(([g, ratio]) => { g.rotation.z = t * 0.6 * ratio; });
    arms.forEach((a, i) => { a.rotation.x = -1.15 + Math.sin(t * 14 + i * Math.PI) * 0.06; });
    head.rotation.y = Math.sin(t * 0.5) * 0.25;
    head.rotation.x = Math.sin(t * 0.7) * 0.05;

    docs.forEach((o) => {
      const u = (t * 0.09 + o.offset) % 1;
      const x = -4.3 + u * 9;
      o.d.position.set(x, 0.72, 3.3);
      o.d.material.color.copy(x > 0.2 ? docDone : docWhite);
      o.d.visible = u > 0.02 && u < 0.98;
    });
    laser.material.opacity = 0.55 + Math.sin(t * 9) * 0.3;

    streams.forEach((s) => {
      const u = (t * s.speed + s.offset) % 1;
      s.pk.position.copy(s.curve.getPoint(u));
      s.pk.scale.setScalar(0.6 + Math.sin(u * Math.PI) * 0.8);
    });
    floaters.forEach((f) => {
      f.cube.position.y = f.base.y + Math.sin(t * 0.9 + f.phase) * 0.35;
      f.cube.rotation.x = t * f.spin; f.cube.rotation.y = t * f.spin * 0.8;
    });
    rim.intensity = 26 + Math.sin(t * 1.3) * 6;

    if (t - lastTex > 1 / 15) {
      lastTex = t;
      code.update(t); bars.update(t); line.update(t); checklist.update(t); mail.update(t);
    }
    renderer.render(scene, camera);
    if (!readyCalled) { readyCalled = true; if (onReady) onReady(); }
  }
  frame();
}
