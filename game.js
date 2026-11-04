const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const statsEl = document.getElementById('stats');
const messageEl = document.getElementById('message');
const inventoryEl = document.getElementById('inventory');

const tileSize = 32;
const worldSize = 14;
const world = [];
const crystals = [];
const blockTypes = {
  stone: { color: '#7a7d82', accent: '#9aa0a6', solid: true },
  grass: { color: '#5ebd68', accent: '#7ad98c', solid: false },
  dirt: { color: '#8a5c39', accent: '#b87e52', solid: true },
  wood: { color: '#9d6b3d', accent: '#c59358', solid: true },
  crystal: { color: '#7ef0d7', accent: '#d5fff9', solid: false },
};

const state = {
  selectedIndex: 0,
  inventory: ['stone', 'grass', 'dirt', 'wood'],
  player: { x: 1.5, z: 1.5, dir: 0, radius: 0.32 },
  crystalCount: 0,
  portal: { x: 11.5, z: 11.5 },
  won: false,
  keys: {},
  lastTime: 0,
  moveCooldown: 0,
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function buildWorld() {
  for (let x = 0; x < worldSize; x++) {
    const row = [];
    for (let z = 0; z < worldSize; z++) {
      const edge = x === 0 || z === 0 || x === worldSize - 1 || z === worldSize - 1;
      const center = x > 2 && x < 11 && z > 2 && z < 11;
      if (edge) row.push('stone');
      else if (center && (x + z) % 5 === 0) row.push('grass');
      else row.push(null);
    }
    world.push(row);
  }

  for (let x = 2; x < 12; x++) {
    for (let z = 2; z < 12; z++) {
      const onWall = x === 4 || x === 8 || z === 4 || z === 8;
      const doorway =
        ((x === 4 || x === 8) && [2, 6, 10].includes(z)) ||
        ((z === 4 || z === 8) && [2, 6, 10].includes(x));
      if (onWall && !doorway) {
        world[x][z] = 'wood';
      }
    }
  }

  world[2][2] = null;
  world[2][10] = null;
  world[10][2] = null;
  world[10][10] = null;

  crystals.length = 0;
  const crystalSpots = [
    [1.5, 3.5], [3.5, 9.5], [5.5, 6.5], [7.5, 9.5], [9.5, 3.5], [10.5, 6.5], [9.5, 9.5], [3.5, 11.5],
  ];
  crystalSpots.forEach(([x, z]) => {
    crystals.push({ x, z, glow: Math.random() * Math.PI * 2, active: true });
  });
}

function drawInventory() {
  inventoryEl.innerHTML = '';
  state.inventory.forEach((type, index) => {
    const slot = document.createElement('div');
    slot.className = 'inventory-slot' + (index === state.selectedIndex ? ' active' : '');
    slot.dataset.key = index + 1;
    slot.textContent = type === 'stone' ? 'S' : type === 'grass' ? 'G' : type === 'dirt' ? 'D' : 'W';
    slot.title = type;
    slot.addEventListener('click', () => {
      state.selectedIndex = index;
      drawInventory();
    });
    inventoryEl.appendChild(slot);
  });
}

function updateHud() {
  statsEl.textContent = `Crystals ${state.crystalCount}/8 • Block: ${state.inventory[state.selectedIndex]}`;
  if (state.won) {
    messageEl.textContent = 'Portal reached! You saved the crystal shrine.';
  } else if (state.crystalCount >= 8) {
    messageEl.textContent = 'The portal is open. Walk to the glowing gate.';
  } else {
    messageEl.textContent = 'Collect 8 crystals and reach the portal.';
  }
}

function canMoveTo(x, z) {
  const cx = Math.floor(x);
  const cz = Math.floor(z);
  if (cx < 0 || cz < 0 || cx >= worldSize || cz >= worldSize) return false;
  const type = world[cx][cz];
  return type === null || !blockTypes[type]?.solid;
}

function tryMove(dx, dz) {
  const nextX = state.player.x + dx;
  const nextZ = state.player.z + dz;
  const step = 0.28;
  if (
    canMoveTo(nextX + step, nextZ + step) &&
    canMoveTo(nextX - step, nextZ + step) &&
    canMoveTo(nextX + step, nextZ - step) &&
    canMoveTo(nextX - step, nextZ - step)
  ) {
    state.player.x = clamp(nextX, 0.8, worldSize - 0.8);
    state.player.z = clamp(nextZ, 0.8, worldSize - 0.8);
  }
}

function pickupCrystals() {
  for (let i = crystals.length - 1; i >= 0; i--) {
    const crystal = crystals[i];
    const dx = crystal.x - state.player.x;
    const dz = crystal.z - state.player.z;
    if (Math.hypot(dx, dz) < 0.65 && crystal.active) {
      crystal.active = false;
      state.crystalCount += 1;
    }
  }
}

function handlePortal() {
  const dx = state.player.x - state.portal.x;
  const dz = state.player.z - state.portal.z;
  if (Math.hypot(dx, dz) < 0.8 && state.crystalCount >= 8) {
    state.won = true;
  }
}

function resize() {
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.floor(window.innerWidth * ratio);
  canvas.height = Math.floor(window.innerHeight * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function shadeColor(color, amount) {
  const value = Number.parseInt(color.slice(1), 16);
  const red = clamp(Math.round(((value >> 16) & 255) * amount), 0, 255);
  const green = clamp(Math.round(((value >> 8) & 255) * amount), 0, 255);
  const blue = clamp(Math.round((value & 255) * amount), 0, 255);
  return `rgb(${red}, ${green}, ${blue})`;
}

function castRay(angle) {
  const rayX = Math.sin(angle);
  const rayZ = Math.cos(angle);
  let mapX = Math.floor(state.player.x);
  let mapZ = Math.floor(state.player.z);
  const deltaX = Math.abs(1 / (rayX || 0.000001));
  const deltaZ = Math.abs(1 / (rayZ || 0.000001));
  const stepX = rayX < 0 ? -1 : 1;
  const stepZ = rayZ < 0 ? -1 : 1;
  let sideX = (rayX < 0 ? state.player.x - mapX : mapX + 1 - state.player.x) * deltaX;
  let sideZ = (rayZ < 0 ? state.player.z - mapZ : mapZ + 1 - state.player.z) * deltaZ;
  let side = 0;

  for (let steps = 0; steps < 40; steps++) {
    if (sideX < sideZ) {
      sideX += deltaX;
      mapX += stepX;
      side = 0;
    } else {
      sideZ += deltaZ;
      mapZ += stepZ;
      side = 1;
    }
    const type = world[mapX]?.[mapZ];
    if (type && blockTypes[type]?.solid) {
      const distance = (side === 0 ? sideX - deltaX : sideZ - deltaZ) * Math.cos(angle - state.player.dir);
      return { distance: Math.max(0.1, distance), side, type };
    }
  }

  return { distance: 24, side: 0, type: 'stone' };
}

function drawWorld() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const horizon = height * 0.49;
  const fieldOfView = Math.PI / 3;
  const sky = ctx.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, '#75d0ff');
  sky.addColorStop(1, '#d7f2ff');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, horizon);

  const ground = ctx.createLinearGradient(0, horizon, 0, height);
  ground.addColorStop(0, '#71985b');
  ground.addColorStop(1, '#253b32');
  ctx.fillStyle = ground;
  ctx.fillRect(0, horizon, width, height - horizon);

  const rayCount = Math.ceil(width / 2);
  const stripWidth = width / rayCount + 1;
  const wallDepths = new Array(rayCount);
  for (let ray = 0; ray < rayCount; ray++) {
    const cameraOffset = (ray / rayCount - 0.5) * 2;
    const angle = state.player.dir + cameraOffset * fieldOfView / 2;
    const hit = castRay(angle);
    wallDepths[ray] = hit.distance;
    const wallHeight = Math.min(height * 2, height * 0.92 / hit.distance);
    const top = horizon - wallHeight / 2;
    const baseColor = blockTypes[hit.type].color;
    const lighting = Math.max(0.38, 1 - hit.distance / 19) * (hit.side ? 0.74 : 1);
    ctx.fillStyle = shadeColor(baseColor, lighting);
    ctx.fillRect(ray * stripWidth, top, stripWidth + 1, wallHeight);
    ctx.fillStyle = shadeColor(blockTypes[hit.type].accent, lighting * 0.76);
    ctx.fillRect(ray * stripWidth, top, stripWidth + 1, Math.max(2, wallHeight * 0.07));
    if (wallHeight > 18 && ray % 5 === 0) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
      ctx.fillRect(ray * stripWidth, top + wallHeight * 0.52, stripWidth + 1, 2);
    }
  }

  const sprites = crystals.filter((crystal) => crystal.active).map((crystal) => ({
    x: crystal.x, z: crystal.z, kind: 'crystal', glow: crystal.glow,
  }));
  sprites.push({ x: state.portal.x, z: state.portal.z, kind: 'portal' });
  sprites.sort((a, b) => {
    const distance = (sprite) => Math.hypot(sprite.x - state.player.x, sprite.z - state.player.z);
    return distance(b) - distance(a);
  });

  const focalLength = width / (2 * Math.tan(fieldOfView / 2));
  sprites.forEach((sprite) => {
    const dx = sprite.x - state.player.x;
    const dz = sprite.z - state.player.z;
    const depth = dx * Math.sin(state.player.dir) + dz * Math.cos(state.player.dir);
    if (depth <= 0.25) return;
    const lateral = dx * Math.cos(state.player.dir) - dz * Math.sin(state.player.dir);
    const screenX = width / 2 + lateral * focalLength / depth;
    const rayIndex = clamp(Math.floor(screenX / stripWidth), 0, rayCount - 1);
    if (depth >= wallDepths[rayIndex]) return;

    if (sprite.kind === 'crystal') {
      const pulse = 0.82 + Math.sin(sprite.glow + performance.now() * 0.006) * 0.18;
      const size = clamp(height * 0.22 / depth, 7, height * 0.32) * pulse;
      const centerY = horizon + height * 0.22 / depth;
      ctx.fillStyle = 'rgba(92, 255, 232, 0.24)';
      ctx.beginPath();
      ctx.arc(screenX, centerY, size * 0.85, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#79f7eb';
      ctx.beginPath();
      ctx.moveTo(screenX, centerY - size);
      ctx.lineTo(screenX + size * 0.62, centerY);
      ctx.lineTo(screenX, centerY + size);
      ctx.lineTo(screenX - size * 0.62, centerY);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#eaffff';
      ctx.fillRect(screenX - size * 0.1, centerY - size * 0.65, size * 0.2, size * 0.9);
    } else {
      const gateHeight = clamp(height * 0.78 / depth, 20, height * 0.85);
      const gateWidth = gateHeight * 0.56;
      const bottom = horizon + height * 0.38 / depth;
      ctx.fillStyle = state.crystalCount >= 8 ? 'rgba(75, 255, 213, 0.24)' : 'rgba(116, 143, 180, 0.2)';
      ctx.fillRect(screenX - gateWidth / 2, bottom - gateHeight, gateWidth, gateHeight);
      ctx.strokeStyle = state.crystalCount >= 8 ? '#7ef0d2' : '#a9c5e8';
      ctx.lineWidth = Math.max(2, gateWidth * 0.08);
      ctx.strokeRect(screenX - gateWidth / 2, bottom - gateHeight, gateWidth, gateHeight);
      ctx.fillStyle = state.crystalCount >= 8 ? 'rgba(126, 240, 210, 0.46)' : 'rgba(90, 112, 142, 0.4)';
      ctx.fillRect(screenX - gateWidth * 0.34, bottom - gateHeight * 0.86, gateWidth * 0.68, gateHeight * 0.86);
    }
  });
}

function gameLoop(ts) {
  const dt = Math.min(0.05, (ts - state.lastTime || 16) / 1000);
  state.lastTime = ts;

  if (!state.won) {
    const turn = (state.keys['arrowright'] ? 1 : 0) - (state.keys['arrowleft'] ? 1 : 0);
    state.player.dir += turn * dt * 1.8;

    const forward = (state.keys['arrowup'] || state.keys.w ? 1 : 0) - (state.keys['arrowdown'] || state.keys.s ? 1 : 0);
    const strafe = (state.keys.d ? 1 : 0) - (state.keys.a ? 1 : 0);
    if (forward || strafe) {
      const length = Math.hypot(forward, strafe) || 1;
      const moveX = (Math.sin(state.player.dir) * forward + Math.cos(state.player.dir) * strafe) / length;
      const moveZ = (Math.cos(state.player.dir) * forward - Math.sin(state.player.dir) * strafe) / length;
      tryMove(moveX * dt * 2.2, moveZ * dt * 2.2);
    }

    pickupCrystals();
    handlePortal();
  }

  updateHud();
  drawWorld();
  requestAnimationFrame(gameLoop);
}

window.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  state.keys[key] = true;
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) e.preventDefault();
  if (['1', '2', '3', '4'].includes(key)) {
    state.selectedIndex = Number(key) - 1;
    drawInventory();
  }
});

window.addEventListener('keyup', (e) => {
  state.keys[e.key.toLowerCase()] = false;
});

resize();
buildWorld();
drawInventory();
updateHud();
requestAnimationFrame(gameLoop);
