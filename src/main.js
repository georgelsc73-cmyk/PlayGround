import * as THREE from 'three';
import './style.css';

const mount = document.querySelector('#game');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#91c8c0');
scene.fog = new THREE.FogExp2('#9ac9bc', 0.0085);
const camera = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, 0.1, 180);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
mount.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight('#e5fff0', '#526d4a', 2.0));
const sun = new THREE.DirectionalLight('#fff1cf', 3.2);
sun.position.set(-18, 30, 12);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -34; sun.shadow.camera.right = 34; sun.shadow.camera.top = 38; sun.shadow.camera.bottom = -38;
sun.shadow.bias = -0.0003;
scene.add(sun);
const fill = new THREE.DirectionalLight('#a3e6e5', 1.1); fill.position.set(15, 11, -18); scene.add(fill);

const mat = (color, roughness = .82, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, ...extra });
const grassMat = mat('#69a86c');
const ground = new THREE.Mesh(new THREE.PlaneGeometry(130, 130), grassMat);
ground.rotation.x = -Math.PI / 2; ground.position.y = -0.08; ground.receiveShadow = true; scene.add(ground);

// Soft, storybook hills and the stepping-stone trail.
function makeHill(x, z, sx, sy, sz, color) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 12), mat(color));
  mesh.position.set(x, sy * .45 - .2, z); mesh.scale.set(sx, sy, sz); mesh.castShadow = true; mesh.receiveShadow = true; scene.add(mesh);
}
makeHill(-17, -8, 8, 5, 9, '#77ae72'); makeHill(18, 0, 9, 6, 8, '#7ab276');
makeHill(-12, 22, 8, 4, 7, '#80b77b'); makeHill(13, -24, 8, 4, 7, '#70a96c');
const pathStoneMat = mat('#c4b789');
for (let i = 0; i < 38; i++) {
  const z = 25 - i * 1.42;
  const x = Math.sin(i * 1.31) * 1.35 + Math.sin(i * .32) * .55;
  const stone = new THREE.Mesh(new THREE.CylinderGeometry(.8 + Math.sin(i) * .12, .92, .13, 7), pathStoneMat);
  stone.position.set(x, .015, z); stone.rotation.y = i * .72; stone.receiveShadow = true; stone.castShadow = true; scene.add(stone);
}

// Stylized trees, wildflowers and giant mushrooms dress the meadow without blocking the trail.
const trunkMat = mat('#806043');
const leafMats = ['#408767', '#4b9970', '#62a77b', '#78b77e'].map(c => mat(c));
function makeTree(x, z, size = 1) {
  const group = new THREE.Group(); group.position.set(x, 0, z); group.scale.setScalar(size);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.18, .28, 2.05, 7), trunkMat); trunk.position.y = 1; trunk.castShadow = true; group.add(trunk);
  for (let i = 0; i < 3; i++) {
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), leafMats[(Math.random() * leafMats.length) | 0]);
    crown.position.set((i - 1) * .55, 2.05 + (i % 2) * .32, 0); crown.scale.set(1.05, 1.0, .9); crown.castShadow = true; group.add(crown);
  }
  scene.add(group);
}
for (let i = 0; i < 58; i++) {
  const z = -32 + Math.random() * 64;
  const side = Math.random() < .5 ? -1 : 1;
  const x = side * (7.5 + Math.random() * 22);
  makeTree(x, z, .65 + Math.random() * .8);
}
const flowerColors = ['#ffdc7d', '#f3a899', '#d2a7d8', '#f4f0dc', '#f19c70'];
for (let i = 0; i < 155; i++) {
  const x = (Math.random() - .5) * 49, z = (Math.random() - .5) * 58;
  if (Math.abs(x) < 3.5 && z > -26 && z < 28) continue;
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(.018, .024, .28, 5), mat('#4c8755'));
  stem.position.set(x, .13, z); scene.add(stem);
  const bloom = new THREE.Mesh(new THREE.SphereGeometry(.09, 7, 6), mat(flowerColors[(Math.random() * flowerColors.length) | 0], .56));
  bloom.position.set(x, .3, z); bloom.scale.y = .55; scene.add(bloom);
}
for (let i = 0; i < 12; i++) {
  const x = (Math.random() < .5 ? -1 : 1) * (4.5 + Math.random() * 4);
  const z = 22 - Math.random() * 48;
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(.13, .18, .55, 8), mat('#e9d8bd')); stem.position.set(x, .27, z); stem.castShadow = true; scene.add(stem);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(.55, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(i % 2 ? '#ee9978' : '#dc8291'));
  cap.scale.y = .56; cap.position.set(x, .52, z); cap.castShadow = true; scene.add(cap);
}

// Procedural, fully 3D storybook heroine: embroidered blouse, teal skirt, curls and round glasses.
function makeMirabel() {
  const root = new THREE.Group();
  const skin = mat('#c9825f'); const blouse = mat('#f3eee0'); const skirtMat = mat('#318c88');
  const hair = mat('#252b2a'); const shoeMat = mat('#754e46');
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(.29, .45, 4, 8), blouse); torso.position.y = 1.1; torso.castShadow = true; root.add(torso);
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(.25, .48, .64, 12), skirtMat); skirt.position.y = .61; skirt.castShadow = true; root.add(skirt);
  const waistband = new THREE.Mesh(new THREE.TorusGeometry(.27, .045, 6, 14), mat('#e7c56e')); waistband.rotation.x = Math.PI / 2; waistband.position.y = .9; root.add(waistband);
  // Colorful little flower embroidery on the front of the blouse and skirt.
  const embroideries = ['#e7aa65', '#e38883', '#82ad7a', '#b48fbe'].map(c => mat(c, .6));
  for (let i = 0; i < 11; i++) {
    const y = i < 6 ? .53 + (i % 3) * .13 : 1.0 + ((i - 6) % 3) * .14;
    const x = ((i * 7) % 5 - 2) * .12;
    const z = i < 6 ? -.455 : -.286;
    const flower = new THREE.Mesh(new THREE.SphereGeometry(.045, 7, 6), embroideries[i % 4]);
    flower.scale.set(1, .7, .45); flower.position.set(x, y, z); root.add(flower);
  }
  const head = new THREE.Mesh(new THREE.SphereGeometry(.36, 16, 14), skin); head.position.set(0, 1.83, -.025); head.scale.set(.9, 1.05, .86); head.castShadow = true; root.add(head);
  const hairCap = new THREE.Mesh(new THREE.SphereGeometry(.385, 14, 11, 0, Math.PI * 2, 0, Math.PI * .65), hair);
  hairCap.position.set(0, 1.91, .015); hairCap.scale.set(1.05, .92, 1); root.add(hairCap);
  const curls = [];
  for (let i = 0; i < 13; i++) {
    const a = (i / 13) * Math.PI * 2;
    const curl = new THREE.Mesh(new THREE.SphereGeometry(.145 + (i % 3) * .012, 9, 8), hair);
    curl.position.set(Math.sin(a) * .31, 1.89 + Math.cos(a) * .21, Math.cos(a) * .27);
    curl.castShadow = true; root.add(curl); curls.push(curl);
  }
  const fringe = new THREE.Mesh(new THREE.SphereGeometry(.19, 10, 8), hair); fringe.position.set(0, 2.08, -.26); fringe.scale.set(1.2, .55, .65); root.add(fringe);
  const eyeMat = mat('#2e2724', .4); const eyes = [];
  for (const x of [-.125, .125]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(.035, 8, 7), eyeMat); eye.position.set(x, 1.86, -.333); root.add(eye); eyes.push(eye);
  }
  const glassesMat = new THREE.MeshStandardMaterial({ color: '#342f2b', roughness: .36, metalness: .2 });
  for (const x of [-.13, .13]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.105, .018, 6, 16), glassesMat); ring.position.set(x, 1.86, -.35); root.add(ring);
  }
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(.075, .018, .018), glassesMat); bridge.position.set(0, 1.86, -.35); root.add(bridge);
  const smile = new THREE.Mesh(new THREE.TorusGeometry(.055, .009, 5, 12, Math.PI), mat('#7d3e37')); smile.position.set(0, 1.69, -.332); smile.rotation.z = Math.PI; root.add(smile);
  const limbs = [];
  for (const side of [-1, 1]) {
    const leg = new THREE.Group(); leg.position.set(side * .15, .45, 0); root.add(leg); limbs.push(leg);
    const legMesh = new THREE.Mesh(new THREE.CylinderGeometry(.075, .085, .43, 8), skin); legMesh.position.y = -.19; legMesh.castShadow = true; leg.add(legMesh);
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(.13, 9, 7), shoeMat); shoe.scale.set(1, .55, 1.45); shoe.position.set(0, -.41, -.07); leg.add(shoe);
    const arm = new THREE.Group(); arm.position.set(side * .31, 1.3, 0); root.add(arm); limbs.push(arm);
    const armMesh = new THREE.Mesh(new THREE.CapsuleGeometry(.085, .35, 3, 7), blouse); armMesh.position.set(side * .02, -.23, 0); armMesh.rotation.z = side * -.18; arm.add(armMesh);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(.095, 8, 7), skin); hand.position.set(side * .045, -.47, 0); arm.add(hand);
    const cuff = new THREE.Mesh(new THREE.TorusGeometry(.087, .016, 5, 10), embroideries[side === -1 ? 0 : 1]); cuff.position.set(side * .045, -.39, 0); cuff.rotation.x = Math.PI / 2; arm.add(cuff);
  }
  root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  root.userData.limbs = limbs;
  return root;
}
const player = makeMirabel(); player.position.set(0, 0, 24); scene.add(player);
camera.position.set(0, 5.3, 33.6); camera.lookAt(0, 1.05, 24);

function makeHector() {
  const root = new THREE.Group();
  const skin = mat('#b97857'), shirt = mat('#f2c466'), pants = mat('#536b83'), hair = mat('#352e2a'), shoeMat = mat('#754e46');
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(.25, .4, 4, 8), shirt); torso.position.y = 1.0; root.add(torso);
  const shorts = new THREE.Mesh(new THREE.CylinderGeometry(.25, .3, .32, 9), pants); shorts.position.y = .57; root.add(shorts);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.31, 12, 10), skin); head.position.y = 1.69; root.add(head);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(.32, 12, 9), hair); cap.position.set(0, 1.82, .02); cap.scale.set(1, .7, 1); root.add(cap);
  for (const x of [-.1, .1]) { const eye = new THREE.Mesh(new THREE.SphereGeometry(.028, 6, 6), mat('#292522')); eye.position.set(x, 1.69, -.29); root.add(eye); }
  const limbs = [];
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(.07, .08, .42, 7), pants); leg.position.set(side * .13, .28, 0); root.add(leg);
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(.07, .35, 3, 7), shirt); arm.position.set(side * .3, .94, 0); arm.rotation.z = side * -.25; root.add(arm); limbs.push(arm);
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(.11, 7, 6), shoeMat); shoe.position.set(side * .13, .04, -.05); root.add(shoe);
  }
  root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  root.userData.arms = limbs;
  return root;
}
const hector = makeHector(); hector.position.set(.35, 0, -26); hector.rotation.y = Math.PI; scene.add(hector);

// A glowing doorway at the end of the meadow.
const portal = new THREE.Group(); portal.position.set(0, 0, -26.15); scene.add(portal);
const archCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-1.35, .1, 0), new THREE.Vector3(-1.35, 1.25, 0), new THREE.Vector3(-1.0, 2.35, 0),
  new THREE.Vector3(0, 2.75, 0), new THREE.Vector3(1.0, 2.35, 0), new THREE.Vector3(1.35, 1.25, 0), new THREE.Vector3(1.35, .1, 0)
]);
const arch = new THREE.Mesh(new THREE.TubeGeometry(archCurve, 36, .12, 8, false), new THREE.MeshStandardMaterial({ color: '#85f4dc', emissive: '#32bfae', emissiveIntensity: 1.8, roughness: .3 })); portal.add(arch);
const portalFill = new THREE.Mesh(new THREE.CircleGeometry(1.24, 32), new THREE.MeshBasicMaterial({ color: '#65c9c4', transparent: true, opacity: .32, side: THREE.DoubleSide })); portalFill.position.set(0, 1.42, .05); portal.add(portalFill);
const base = new THREE.Mesh(new THREE.CylinderGeometry(1.42, 1.55, .22, 12), mat('#d7ba78')); base.position.y = .05; base.castShadow = true; portal.add(base);
const portalLight = new THREE.PointLight('#62e6d3', 2.8, 10); portalLight.position.set(0, 1.6, .1); portal.add(portalLight);

// Keep every memory spark close to the stepping-stone trail so a first-time player can find them by following it.
const sparkPositions = [new THREE.Vector3(-.5, .9, 15), new THREE.Vector3(-1.7, 1.05, 6), new THREE.Vector3(1.3, .9, -3), new THREE.Vector3(-.2, 1.15, -13), new THREE.Vector3(-1.3, 1.25, -21)];
const sparks = [];
for (const pos of sparkPositions) {
  const group = new THREE.Group(); group.position.copy(pos);
  const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(.38, 0), new THREE.MeshStandardMaterial({ color: '#fff2a1', emissive: '#ffcb53', emissiveIntensity: 2.1, roughness: .23, metalness: .08 }));
  crystal.scale.set(.78, 1.2, .78); crystal.castShadow = true; group.add(crystal);
  const core = new THREE.Mesh(new THREE.SphereGeometry(.12, 8, 8), new THREE.MeshBasicMaterial({ color: '#fffbea' })); group.add(core);
  const halo = new THREE.Mesh(new THREE.TorusGeometry(.53, .018, 5, 32), new THREE.MeshBasicMaterial({ color: '#ffe394', transparent: true, opacity: .76 })); halo.rotation.x = Math.PI / 2; group.add(halo);
  const light = new THREE.PointLight('#ffda77', 1.05, 5); group.add(light);
  scene.add(group); sparks.push({ group, crystal, halo, baseY: pos.y, collected: false });
}

const motes = [];
for (let i = 0; i < 50; i++) {
  const mote = new THREE.Mesh(new THREE.SphereGeometry(.035 + Math.random() * .035, 6, 5), new THREE.MeshBasicMaterial({ color: i % 3 ? '#fff1b7' : '#d1fff0', transparent: true, opacity: .55 + Math.random() * .3 }));
  mote.position.set((Math.random() - .5) * 23, .6 + Math.random() * 4.5, (Math.random() - .5) * 52);
  scene.add(mote); motes.push({ mesh: mote, phase: Math.random() * 8 });
}

const keys = new Set();
const touch = { forward: false, back: false, left: false, right: false, jump: false };
let started = false, won = false, jumpVelocity = 0, grounded = true, elapsed = 0, collected = 0;
let audioOn = true, audioContext = null, toastTimer;
const sparkCount = document.querySelector('#spark-count');
const pips = [...document.querySelectorAll('#spark-pips span')];
const toast = document.querySelector('#toast');
const questText = document.querySelector('#quest-text');
const winOverlay = document.querySelector('#win-overlay');

function showToast(message) {
  toast.textContent = message; toast.classList.add('show'); clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}
function chime() {
  if (!audioOn) return;
  try {
    audioContext ??= new AudioContext();
    const now = audioContext.currentTime;
    [660, 880, 1100].forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator(), gain = audioContext.createGain();
      oscillator.type = 'sine'; oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(.0001, now + index * .075); gain.gain.exponentialRampToValueAtTime(.07, now + index * .075 + .02); gain.gain.exponentialRampToValueAtTime(.0001, now + index * .075 + .32);
      oscillator.connect(gain); gain.connect(audioContext.destination); oscillator.start(now + index * .075); oscillator.stop(now + index * .075 + .34);
    });
  } catch { /* Audio is an optional flourish; gameplay does not depend on it. */ }
}
function resetGame() {
  player.position.set(0, 0, 24); player.rotation.y = 0; hector.position.set(.35, 0, -26);
  jumpVelocity = 0; grounded = true; keys.clear(); Object.keys(touch).forEach(action => { touch[action] = false; });
  sparks.forEach(s => { s.collected = false; s.group.visible = true; });
  collected = 0; sparkCount.textContent = '0'; pips.forEach(p => p.classList.remove('active'));
  questText.textContent = 'Find the memory sparks'; won = false;
}
function beginGame() {
  started = true; document.querySelector('#intro-overlay').classList.add('hidden');
  if (audioOn) { try { audioContext ??= new AudioContext(); audioContext.resume(); } catch {} }
  renderer.domElement.focus();
}
document.querySelector('#play-button').addEventListener('click', beginGame);
document.querySelector('#again-button').addEventListener('click', () => { resetGame(); winOverlay.classList.add('hidden'); started = true; });
document.querySelector('#sound-button').addEventListener('click', e => { audioOn = !audioOn; e.currentTarget.textContent = audioOn ? '♫' : '♪'; e.currentTarget.setAttribute('aria-label', audioOn ? 'Mute sound effects' : 'Enable sound effects'); if (audioOn) chime(); });

window.addEventListener('keydown', e => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
  keys.add(e.key.toLowerCase());
  if (e.code === 'Space') { keys.add('space'); }
});
window.addEventListener('keyup', e => { keys.delete(e.key.toLowerCase()); if (e.code === 'Space') keys.delete('space'); });
window.addEventListener('blur', () => keys.clear());
for (const button of document.querySelectorAll('[data-move]')) {
  const action = button.dataset.move;
  const down = e => { e.preventDefault(); touch[action] = true; button.classList.add('pressed'); button.setPointerCapture?.(e.pointerId); };
  const up = e => { e.preventDefault(); touch[action] = false; button.classList.remove('pressed'); };
  button.addEventListener('pointerdown', down); button.addEventListener('pointerup', up); button.addEventListener('pointercancel', up); button.addEventListener('lostpointercapture', up);
}

function update(dt) {
  elapsed += dt;
  sparks.forEach((s, i) => {
    if (!s.collected) {
      s.group.position.y = s.baseY + Math.sin(elapsed * 2.3 + i) * .14;
      s.crystal.rotation.y += dt * .75; s.crystal.rotation.x = Math.sin(elapsed + i) * .14;
      s.halo.rotation.z -= dt * .45;
    }
  });
  motes.forEach(({ mesh, phase }) => { mesh.position.y += Math.sin(elapsed * .6 + phase) * dt * .13; mesh.position.x += Math.sin(elapsed * .4 + phase) * dt * .08; });
  portal.rotation.y = Math.sin(elapsed * .55) * .035;
  hector.position.y = Math.sin(elapsed * 2) * .06;
  hector.userData.arms.forEach((arm, i) => { arm.rotation.z = (i ? 1 : -1) * (.18 + Math.sin(elapsed * 2) * .12); });

  if (started && !won) {
    const forward = keys.has('w') || keys.has('arrowup') || touch.forward;
    const back = keys.has('s') || keys.has('arrowdown') || touch.back;
    const left = keys.has('a') || keys.has('arrowleft') || touch.left;
    const right = keys.has('d') || keys.has('arrowright') || touch.right;
    const dx = (right ? 1 : 0) - (left ? 1 : 0), dz = (back ? 1 : 0) - (forward ? 1 : 0);
    const length = Math.hypot(dx, dz);
    if (length > 0) {
      const speed = 5.3;
      player.position.x += (dx / length) * speed * dt;
      player.position.z += (dz / length) * speed * dt;
      player.rotation.y = Math.atan2(-dx, -dz);
      const swing = Math.sin(elapsed * 11) * .52;
      player.userData.limbs[0].rotation.x = swing;
      player.userData.limbs[2].rotation.x = -swing;
      player.userData.limbs[1].rotation.x = -swing * .65;
      player.userData.limbs[3].rotation.x = swing * .65;
    } else {
      player.userData.limbs.forEach(limb => { limb.rotation.x *= .84; });
    }
    player.position.x = THREE.MathUtils.clamp(player.position.x, -29, 29);
    player.position.z = THREE.MathUtils.clamp(player.position.z, -32, 30);
    if ((keys.has('space') || touch.jump) && grounded) { jumpVelocity = 6.3; grounded = false; }
    player.position.y += jumpVelocity * dt;
    jumpVelocity -= 16 * dt;
    if (player.position.y <= 0) { player.position.y = 0; jumpVelocity = 0; grounded = true; }

    for (const s of sparks) {
      if (!s.collected && Math.hypot(player.position.x - s.group.position.x, player.position.z - s.group.position.z) < 1.85) {
        s.collected = true; s.group.visible = false; collected++;
        sparkCount.textContent = String(collected); pips[collected - 1].classList.add('active'); chime();
        showToast(collected === 5 ? 'The way home is glowing!' : 'A memory found!');
        if (collected === 5) questText.textContent = 'The way home is open';
      }
    }
    if (collected === 5 && Math.hypot(player.position.x, player.position.z + 26) < 2.15) {
      won = true; questText.textContent = 'Hector is safe'; winOverlay.classList.remove('hidden'); chime();
    }
  }
  const cameraTarget = new THREE.Vector3(player.position.x, player.position.y + 1.05, player.position.z);
  const cameraPosition = new THREE.Vector3(player.position.x, player.position.y + 5.3, player.position.z + 9.6);
  camera.position.lerp(cameraPosition, 1 - Math.exp(-4.2 * dt)); camera.lookAt(cameraTarget);
}
let previous = performance.now();
function render(now) {
  const dt = Math.min((now - previous) / 1000, .1); previous = now;
  update(dt); renderer.render(scene, camera); requestAnimationFrame(render);
}
requestAnimationFrame(render);
window.addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7)); });
