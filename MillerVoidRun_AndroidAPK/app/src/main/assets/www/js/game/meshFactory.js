// MILLER: VOID RUN — Vibrant Arcade 3D Procedural Mesh, Texture & Glow Factory
// Generates procedural neon-lit CanvasTextures per world, atmospheric gradient sky domes,
// glowing Golden Bonus Rift Rings, readable obstacles with warning chevrons, and fluid runner rigs.

import { CHARACTERS, CHASERS, BOSSES, SKINS, PALETTE, PORTAL_ENEMIES, resolveCharacterArt } from '../config/gameData.js';

const trackTextureCache = new Map();
const skyTextureCache = new Map();
const spriteTextureCache = new Map();
const skeletalPartsCache = new Map();
const environTextureCache = new Map();
let contactShadowTex = null;

// Soft radial-gradient grounded contact shadow texture (allocated once & shared across all meshes!)
export function createContactShadow(THREE, radius = 0.72, opacity = 0.58) {
  if (!contactShadowTex) {
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 64;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(32, 32, 4, 32, 32, 30);
    g.addColorStop(0, 'rgba(2, 4, 12, 0.92)');
    g.addColorStop(0.55, 'rgba(4, 8, 22, 0.45)');
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    contactShadowTex = new THREE.CanvasTexture(c);
  }
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(radius * 2, radius * 2),
    new THREE.MeshBasicMaterial({
      map: contactShadowTex,
      transparent: true,
      opacity,
      depthWrite: false,
    })
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.03;
  return m;
}

// Per-hero anatomical landmarks (normalized 0..1 top-down on 512x512 transparent back sprite)
// Measured directly from miller_back.png, brann_back.png, elara_back.png, nyx_back.png
const HERO_RIG_LAYOUT = {
  miller: {
    neckY: 0.185, headX0: 0.40, headX1: 0.60,
    lShoulder: [0.39, 0.24], lElbow: [0.30, 0.36], lCut: [[0.395, 0.19], [0.39, 0.35], [0.31, 0.52]],
    rShoulder: [0.61, 0.24], rElbow: [0.70, 0.36], rCut: [[0.605, 0.19], [0.60, 0.35], [0.69, 0.52]],
    hipY: 0.56, kneeY: 0.74, midX: 0.495, legMinX: 0.37,
  },
  brann: {
    neckY: 0.165, headX0: 0.42, headX1: 0.58,
    lShoulder: [0.33, 0.27], lElbow: [0.24, 0.38], lCut: [[0.35, 0.21], [0.34, 0.35], [0.28, 0.53]],
    rShoulder: [0.66, 0.27], rElbow: [0.75, 0.38], rCut: [[0.64, 0.21], [0.64, 0.35], [0.72, 0.53]],
    hipY: 0.55, kneeY: 0.72, midX: 0.49, legMinX: 0.34,
  },
  elara: {
    neckY: 0.19, headX0: 0.43, headX1: 0.58,
    lShoulder: [0.38, 0.26], lElbow: [0.29, 0.36], lCut: [[0.39, 0.22], [0.39, 0.35], [0.30, 0.51]],
    rShoulder: [0.61, 0.26], rElbow: [0.70, 0.36], rCut: [[0.61, 0.22], [0.60, 0.35], [0.70, 0.51]],
    hipY: 0.57, kneeY: 0.76, midX: 0.49, legMinX: 0.30,
  },
  nyx: {
    neckY: 0.19, headX0: 0.41, headX1: 0.59,
    lShoulder: [0.40, 0.25], lElbow: [0.31, 0.37], lCut: [[0.40, 0.21], [0.39, 0.35], [0.31, 0.52]],
    rShoulder: [0.59, 0.25], rElbow: [0.69, 0.37], rCut: [[0.59, 0.21], [0.60, 0.35], [0.68, 0.52]],
    hipY: 0.54, kneeY: 0.72, midX: 0.495, legMinX: 0.35,
  },
  // Balanced humanoid default for newly-extracted SharedArt/characters sheets (leonard, precious, rumbidzai, harry, felix, miller_wolf)
  standard_sheet: {
    neckY: 0.18, headX0: 0.41, headX1: 0.59,
    lShoulder: [0.39, 0.24], lElbow: [0.33, 0.38], lCut: [[0.40, 0.19], [0.39, 0.36], [0.34, 0.53]],
    rShoulder: [0.61, 0.24], rElbow: [0.67, 0.38], rCut: [[0.60, 0.19], [0.61, 0.36], [0.66, 0.53]],
    hipY: 0.54, kneeY: 0.74, midX: 0.50, legMinX: 0.35,
  },
  // Heavy armored tank layout for Alton Dam & James Stole
  alton: {
    neckY: 0.19, headX0: 0.40, headX1: 0.60,
    lShoulder: [0.31, 0.27], lElbow: [0.22, 0.42], lCut: [[0.34, 0.20], [0.33, 0.38], [0.26, 0.55]],
    rShoulder: [0.69, 0.27], rElbow: [0.78, 0.42], rCut: [[0.66, 0.20], [0.67, 0.38], [0.74, 0.55]],
    hipY: 0.57, kneeY: 0.75, midX: 0.50, legMinX: 0.31,
  },
  james: {
    neckY: 0.18, headX0: 0.41, headX1: 0.59,
    lShoulder: [0.35, 0.25], lElbow: [0.28, 0.39], lCut: [[0.37, 0.20], [0.36, 0.37], [0.31, 0.54]],
    rShoulder: [0.65, 0.25], rElbow: [0.72, 0.39], rCut: [[0.63, 0.20], [0.64, 0.37], [0.69, 0.54]],
    hipY: 0.55, kneeY: 0.74, midX: 0.50, legMinX: 0.33,
  },
};

function sliceSkeletalPartsFromImage(THREE, heroId, img) {
  const layout = HERO_RIG_LAYOUT[heroId] || HERO_RIG_LAYOUT.standard_sheet;
  const S = 512;

  const makePartTex = (drawMaskFn) => {
    const c = document.createElement('canvas');
    c.width = S;
    c.height = S;
    const ctx = c.getContext('2d');
    ctx.save();
    drawMaskFn(ctx, S);
    ctx.clip('nonzero');
    ctx.drawImage(img, 0, 0, S, S);
    ctx.restore();
    const tex = new THREE.CanvasTexture(c);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
    return tex;
  };
  const addCircle = (ctx, cx, cy, r) => {
    ctx.moveTo(cx + r, cy);
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
  };

  // Helper: interpolate piecewise cut line X at given normalized Y
  const cutX = (pts, y) => {
    if (y <= pts[0][1]) return pts[0][0];
    if (y >= pts[pts.length - 1][1]) return pts[pts.length - 1][0];
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[i + 1];
      if (y >= y0 && y <= y1) return x0 + ((y - y0) / (y1 - y0)) * (x1 - x0);
    }
    return pts[0][0];
  };

  const { neckY, headX0, headX1, lShoulder, lElbow, lCut, rShoulder, rElbow, rCut, hipY, kneeY, midX, legMinX } = layout;
  const rCap = 0.042; // Rounded joint overlap radius so rotating limbs NEVER tear a seam!

  // 1. HEAD (clean head/hood crop above neckY; keeps Elara's diagonal staff attached to torso!)
  const head = makePartTex((ctx, s) => {
    ctx.beginPath();
    ctx.rect(headX0 * s, 0, (headX1 - headX0) * s, (neckY + 0.028) * s);
    addCircle(ctx, 0.5 * s, neckY * s, 0.055 * s);
  });

  // 2. TORSO + BACK GEAR (excludes head box, outer left/right arms & lower legs, keeping belt sword & diagonal staff intact!)
  const torso = (() => {
    const c = document.createElement('canvas');
    c.width = S;
    c.height = S;
    const ctx = c.getContext('2d');
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(S, 0);
    ctx.lineTo(S, rCut[0][1] * S);
    ctx.lineTo((rCut[0][0] + 0.025) * S, rCut[0][1] * S);
    ctx.lineTo((rCut[1][0] + 0.012) * S, rCut[1][1] * S);
    ctx.lineTo((rCut[2][0] - 0.01) * S, rCut[2][1] * S);
    ctx.lineTo((rCut[2][0] - 0.01) * S, (hipY + 0.03) * S);
    ctx.lineTo(legMinX * S, (hipY + 0.03) * S);
    // Keep Miller's belt sword scabbard (left of legMinX below hipY) attached cleanly to torso!
    ctx.lineTo(legMinX * S, 0.85 * S);
    ctx.lineTo(0, 0.85 * S);
    ctx.lineTo(0, lCut[2][1] * S);
    ctx.lineTo((lCut[2][0] + 0.01) * S, lCut[2][1] * S);
    ctx.lineTo((lCut[1][0] - 0.012) * S, lCut[1][1] * S);
    ctx.lineTo((lCut[0][0] - 0.025) * S, lCut[0][1] * S);
    ctx.lineTo(0, lCut[0][1] * S);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, 0, 0, S, S);
    ctx.restore();
    // Carve out the head region so headPivot moves cleanly without ghosting behind it!
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillRect(headX0 * S, 0, (headX1 - headX0) * S, (neckY - 0.008) * S);
    ctx.globalCompositeOperation = 'source-over';
    const tex = new THREE.CanvasTexture(c);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
    return tex;
  })();

  // 3. LEFT UPPER ARM (between shoulder seam and elbow, with rounded joint caps)
  const leftUpperArm = makePartTex((ctx, s) => {
    ctx.beginPath();
    ctx.moveTo(0, (lShoulder[1] - 0.06) * s);
    ctx.lineTo((lCut[0][0] + 0.02) * s, (lShoulder[1] - 0.06) * s);
    ctx.lineTo((lCut[1][0] + 0.01) * s, lCut[1][1] * s);
    ctx.lineTo((cutX(lCut, lElbow[1] + 0.03)) * s, (lElbow[1] + 0.03) * s);
    ctx.lineTo((lElbow[0] - 0.05) * s, (lElbow[1] + 0.03) * s);
    ctx.lineTo(0, (lElbow[1] + 0.02) * s);
    ctx.closePath();
    addCircle(ctx, lShoulder[0] * s, lShoulder[1] * s, rCap * s);
    addCircle(ctx, lElbow[0] * s, lElbow[1] * s, rCap * s);
  });

  // 4. LEFT FOREARM + HAND (from elbow outward to fingertips)
  const leftForearm = makePartTex((ctx, s) => {
    ctx.beginPath();
    ctx.moveTo(0, (lElbow[1] - 0.03) * s);
    ctx.lineTo((lElbow[0] + 0.04) * s, (lElbow[1] - 0.03) * s);
    ctx.lineTo((cutX(lCut, 0.54) - 0.005) * s, 0.54 * s);
    ctx.lineTo(0, 0.56 * s);
    ctx.closePath();
    addCircle(ctx, lElbow[0] * s, lElbow[1] * s, rCap * s);
  });

  // 5. RIGHT UPPER ARM (between shoulder seam and elbow)
  const rightUpperArm = makePartTex((ctx, s) => {
    ctx.beginPath();
    ctx.moveTo(s, (rShoulder[1] - 0.06) * s);
    ctx.lineTo((rCut[0][0] - 0.02) * s, (rShoulder[1] - 0.06) * s);
    ctx.lineTo((rCut[1][0] - 0.01) * s, rCut[1][1] * s);
    ctx.lineTo((cutX(rCut, rElbow[1] + 0.03)) * s, (rElbow[1] + 0.03) * s);
    ctx.lineTo((rElbow[0] + 0.05) * s, (rElbow[1] + 0.03) * s);
    ctx.lineTo(s, (rElbow[1] + 0.02) * s);
    ctx.closePath();
    addCircle(ctx, rShoulder[0] * s, rShoulder[1] * s, rCap * s);
    addCircle(ctx, rElbow[0] * s, rElbow[1] * s, rCap * s);
  });

  // 6. RIGHT FOREARM + HAND (from elbow outward to fingertips)
  const rightForearm = makePartTex((ctx, s) => {
    ctx.beginPath();
    ctx.moveTo(s, (rElbow[1] - 0.03) * s);
    ctx.lineTo((rElbow[0] - 0.04) * s, (rElbow[1] - 0.03) * s);
    ctx.lineTo((cutX(rCut, 0.54) + 0.005) * s, 0.54 * s);
    ctx.lineTo(s, 0.56 * s);
    ctx.closePath();
    addCircle(ctx, rElbow[0] * s, rElbow[1] * s, rCap * s);
  });

  // 7. LEFT THIGH (hipY..kneeY, inside legMinX..midX, with overlap caps)
  const leftThigh = makePartTex((ctx, s) => {
    ctx.beginPath();
    ctx.rect(legMinX * s, (hipY - 0.02) * s, (midX - legMinX + 0.004) * s, (kneeY - hipY + 0.045) * s);
  });

  // 8. LEFT SHIN + BOOT (kneeY..1.0, inside legMinX..midX)
  const leftShin = makePartTex((ctx, s) => {
    ctx.beginPath();
    ctx.rect(legMinX * s, (kneeY - 0.022) * s, (midX - legMinX + 0.004) * s, (1.0 - kneeY + 0.022) * s);
  });

  // 9. RIGHT THIGH (hipY..kneeY, right of midX)
  const rightThigh = makePartTex((ctx, s) => {
    ctx.beginPath();
    ctx.rect((midX - 0.004) * s, (hipY - 0.02) * s, (0.72 - midX) * s, (kneeY - hipY + 0.045) * s);
  });

  // 10. RIGHT SHIN + BOOT (kneeY..1.0, right of midX)
  const rightShin = makePartTex((ctx, s) => {
    ctx.beginPath();
    ctx.rect((midX - 0.004) * s, (kneeY - 0.022) * s, (0.72 - midX) * s, (1.0 - kneeY + 0.022) * s);
  });

  return {
    layout,
    textures: { head, torso, leftUpperArm, leftForearm, rightUpperArm, rightForearm, leftThigh, leftShin, rightThigh, rightShin },
  };
}

function getSkeletalParts(THREE, cacheKey, backSpriteUrl, onReady) {
  if (skeletalPartsCache.has(cacheKey)) {
    const cached = skeletalPartsCache.get(cacheKey);
    if (cached.ready) onReady(cached.data);
    else cached.waiters.push(onReady);
    return;
  }
  const entry = { ready: false, data: null, waiters: [onReady] };
  skeletalPartsCache.set(cacheKey, entry);

  const img = new Image();
  img.onload = () => {
    entry.data = sliceSkeletalPartsFromImage(THREE, cacheKey, img);
    entry.ready = true;
    for (const fn of entry.waiters) fn(entry.data);
    entry.waiters = [];
  };
  img.src = backSpriteUrl;
}

function createHeroHandWeapon(THREE, weaponType, accentHex, isOffhand = false) {
  const g = new THREE.Group();
  const steelMat = new THREE.MeshStandardMaterial({ color: 0xc8d4e8, roughness: 0.25, metalness: 0.85 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1b1e2c, roughness: 0.5, metalness: 0.5 });
  const glowMat = new THREE.MeshBasicMaterial({ color: accentHex });

  if (weaponType === 'hammer') {
    // Heavy Forged Warhammer / Seismic Crusher with glowing core
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 1.05, 7), darkMat);
    shaft.position.y = 0.35;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.26, 0.26), steelMat);
    head.position.y = 0.86;
    const core = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.1, 0.14), glowMat);
    core.position.y = 0.86;
    g.add(shaft, head, core);
  } else if (weaponType === 'staff') {
    // Arcane Runic Staff with glowing crystal core
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.032, 1.32, 7), darkMat);
    shaft.position.y = 0.42;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.028, 6, 16), steelMat);
    ring.position.y = 1.12;
    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), glowMat);
    crystal.position.y = 1.12;
    g.add(shaft, ring, crystal);
  } else if (weaponType === 'daggers') {
    // Dual-Wield Curved Phantom Daggers (Nyx & Rumbidzai)
    const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.2, 6), darkMat);
    const blade = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.58, 4), steelMat);
    blade.position.set(isOffhand ? -0.04 : 0.04, 0.36, 0);
    blade.rotation.z = isOffhand ? 0.22 : -0.22;
    const edge = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.62, 4), glowMat);
    edge.position.set(isOffhand ? -0.055 : 0.055, 0.37, 0.01);
    edge.rotation.z = isOffhand ? 0.24 : -0.24;
    g.add(hilt, blade, edge);
  } else if (weaponType === 'datapad' || weaponType === 'grimoire') {
    // Holographic Tech Emitter / Runic Spellbook with glowing pulse plate
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.34, 0.06), darkMat);
    frame.position.y = 0.24;
    const screen = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.28, 0.075), glowMat);
    screen.position.y = 0.24;
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.022, 6, 14), glowMat);
    halo.position.set(0, 0.28, -0.08);
    g.add(frame, screen, halo);
  } else if (weaponType === 'threads') {
    // Luminous Medic Healing Thread Spindles
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.024, 6, 16), glowMat);
    ring1.position.y = 0.22;
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.018, 6, 16), glowMat);
    ring2.position.y = 0.36;
    ring2.rotation.x = Math.PI * 0.35;
    g.add(ring1, ring2);
  } else {
    // Miller Redwolf & Default: Blazing Umbral Void Longsword!
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.24, 6), darkMat);
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.045, 0.06), steelMat);
    guard.position.y = 0.12;
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.92, 0.024), steelMat);
    blade.position.y = 0.6;
    const auraEdge = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.96, 0.014), glowMat);
    auraEdge.position.y = 0.61;
    g.add(grip, guard, blade, auraEdge);
  }
  return g;
}

function loadEnvironTexture(THREE, url) {
  if (environTextureCache.has(url)) return environTextureCache.get(url);
  const loader = new THREE.TextureLoader();
  const tex = loader.load(url);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  environTextureCache.set(url, tex);
  return tex;
}

function loadSpriteTexture(THREE, url) {
  if (spriteTextureCache.has(url)) return spriteTextureCache.get(url);
  const loader = new THREE.TextureLoader();
  const tex = loader.load(url);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  spriteTextureCache.set(url, tex);
  return tex;
}

// Helper: creates a PlaneGeometry mapped to an exact UV sub-rectangle [u0..u1, v0..v1]
// so upper body + left leg + right leg animate smoothly from the single crisp PNG cutout!
function createUVPlane(THREE, w, h, u0, v0, u1, v1) {
  const geo = new THREE.PlaneGeometry(w, h);
  const uv = geo.attributes.uv;
  // PlaneGeometry vertex order: 0(TL), 1(TR), 2(BL), 3(BR)
  uv.setXY(0, u0, v1);
  uv.setXY(1, u1, v1);
  uv.setXY(2, u0, v0);
  uv.setXY(3, u1, v0);
  uv.needsUpdate = true;
  return geo;
}

function createArticulatedImageRunnerRig(THREE, charData, skin, isGhost) {
  const root = new THREE.Group();
  const bodyPivot = new THREE.Group();
  root.add(bodyPivot);

  const accent = skin && skin.id !== 'default' ? skin.accent : charData.accentColor;
  const artOverrideKey = skin?.charArtOverride?.[charData.id] || null;
  const resolvedArt = artOverrideKey ? resolveCharacterArt(charData.id, true, artOverrideKey) : charData;
  const activeSprites = resolvedArt.sprites || charData.sprites;
  const rigKey = artOverrideKey || charData.id;
  const tintColor = isGhost ? 0xb44fff : (skin && skin.id !== 'default' && !artOverrideKey ? new THREE.Color(0xffffff).lerp(new THREE.Color(skin.accent), 0.22) : 0xffffff);

  const texFront = loadSpriteTexture(THREE, activeSprites.front);
  const texSide = loadSpriteTexture(THREE, activeSprites.side);
  const texBack = loadSpriteTexture(THREE, activeSprites.back);

  const makeSpriteMat = (tex) =>
    new THREE.MeshBasicMaterial({
      map: tex,
      color: tintColor,
      transparent: true,
      opacity: isGhost ? 0.55 : 1.0,
      alphaTest: 0.08,
      side: THREE.DoubleSide,
      depthWrite: true,
    });

  const H = 2.05; // Runner visual height in meters
  const W = 2.05;
  const layout = HERO_RIG_LAYOUT[rigKey] || HERO_RIG_LAYOUT.standard_sheet;

  // Helper: convert normalized top-down image coords (px, py) to character-local (x, y)
  const toWorld = (px, py) => [(px - 0.5) * W, (1.0 - py) * H];
  // Volumetric 3-slice layered sprite part so limbs stay solid and NEVER turn paper-thin when swinging in 3D!
  const makePartMesh = (mat, pivotPx, pivotPy, zOff = 0, thick = 0.036) => {
    const grp = new THREE.Group();
    const ox = (0.5 - pivotPx) * W;
    const oy = (pivotPy - 0.5) * H;
    const planeGeo = new THREE.PlaneGeometry(W, H);
    for (const dz of [-thick, 0, thick]) {
      const m = new THREE.Mesh(planeGeo, mat);
      m.position.set(ox, oy, zOff + dz);
      grp.add(m);
    }
    return grp;
  };

  // 1) FULL 10-PART ARTICULATED SKELETAL BACK-VIEW RUNNER RIG (Torso, Head, Left/Right UpperArm+Forearm/Hand, Left/Right Thigh+Knee/Boot!)
  const backRunGroup = new THREE.Group();
  const matBack = makeSpriteMat(texBack);

  const partMats = {};
  const spriteMats = [matBack];
  const partNames = [
    'head', 'torso',
    'leftUpperArm', 'leftForearm',
    'rightUpperArm', 'rightForearm',
    'leftThigh', 'leftShin',
    'rightThigh', 'rightShin',
  ];
  for (const pn of partNames) {
    const m = makeSpriteMat(texBack);
    m.visible = false; // Enabled once crisp alpha-masked skeletal textures finish slicing (~2ms)
    partMats[pn] = m;
    spriteMats.push(m);
  }

  // Fallback intact back plane shown for the ~2ms before async image slicing completes (and in Menu 360 turnaround!)
  const backFullPlane = new THREE.Mesh(new THREE.PlaneGeometry(W, H), matBack);
  backFullPlane.position.set(0, H * 0.5, 0);
  backRunGroup.add(backFullPlane);

  // Skeletal hierarchy rooted at Hips!
  const skelGroup = new THREE.Group();
  skelGroup.visible = false;
  backRunGroup.add(skelGroup);

  const [hipWx, hipWy] = toWorld(0.5, layout.hipY);
  const hipsPivot = new THREE.Group();
  hipsPivot.position.set(hipWx, hipWy, 0);
  skelGroup.add(hipsPivot);

  // TORSO PIVOT (child of Hips)
  const torsoPivot = new THREE.Group();
  hipsPivot.add(torsoPivot);
  const torsoMesh = makePartMesh(partMats.torso, 0.5, layout.hipY, 0.01);
  torsoPivot.add(torsoMesh);

  // HEAD PIVOT (child of Torso)
  const headPivot = new THREE.Group();
  headPivot.position.set(0, (layout.hipY - layout.neckY) * H, 0.02);
  torsoPivot.add(headPivot);
  headPivot.add(makePartMesh(partMats.head, 0.5, layout.neckY, 0));

  // LEFT ARM: SHOULDER -> ELBOW/FOREARM/HAND (child of Torso)
  const lShoulderPivot = new THREE.Group();
  lShoulderPivot.position.set((layout.lShoulder[0] - 0.5) * W, (layout.hipY - layout.lShoulder[1]) * H, -0.02);
  torsoPivot.add(lShoulderPivot);
  lShoulderPivot.add(makePartMesh(partMats.leftUpperArm, layout.lShoulder[0], layout.lShoulder[1], 0));

  const lElbowPivot = new THREE.Group();
  lElbowPivot.position.set((layout.lElbow[0] - layout.lShoulder[0]) * W, (layout.lShoulder[1] - layout.lElbow[1]) * H, -0.01);
  lShoulderPivot.add(lElbowPivot);
  lElbowPivot.add(makePartMesh(partMats.leftForearm, layout.lElbow[0], layout.lElbow[1], 0, 0.032));

  // Optional Left-Hand Weapon (Dual-wield for dagger characters: Nyx & Rumbidzai) + Forearm Aegis Shield & Left Mage Orb!
  const weaponType = charData.weaponType || 'sword';
  const lHandMount = new THREE.Group();
  lHandMount.position.set(-0.22, -0.24, -0.06);
  lElbowPivot.add(lHandMount);
  let lWeaponMesh = null;
  if (weaponType === 'daggers') {
    lWeaponMesh = createHeroHandWeapon(THREE, 'daggers', accent, true);
    lWeaponMesh.rotation.set(-0.8, 0, 0.45);
    lHandMount.add(lWeaponMesh);
  }
  const aegisShieldMesh = new THREE.Group();
  const shieldDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.32, 0.045, 16),
    new THREE.MeshStandardMaterial({ color: 0x182844, roughness: 0.25, metalness: 0.8, emissive: accent, emissiveIntensity: 0.35 })
  );
  shieldDisc.rotation.x = Math.PI / 2;
  const shieldRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.32, 0.032, 6, 16),
    new THREE.MeshBasicMaterial({ color: PALETTE.shardCyan })
  );
  aegisShieldMesh.add(shieldDisc, shieldRim);
  aegisShieldMesh.position.set(-0.12, -0.05, -0.12);
  aegisShieldMesh.visible = false;
  lHandMount.add(aegisShieldMesh);

  const lCastOrb = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.11, 1),
    new THREE.MeshBasicMaterial({ color: 0x4cf3ff, transparent: true, opacity: 0.9 })
  );
  lCastOrb.position.set(-0.08, -0.14, -0.1);
  lCastOrb.visible = false;
  lHandMount.add(lCastOrb);

  // RIGHT ARM: SHOULDER -> ELBOW/FOREARM/HAND (child of Torso)
  const rShoulderPivot = new THREE.Group();
  rShoulderPivot.position.set((layout.rShoulder[0] - 0.5) * W, (layout.hipY - layout.rShoulder[1]) * H, -0.02);
  torsoPivot.add(rShoulderPivot);
  rShoulderPivot.add(makePartMesh(partMats.rightUpperArm, layout.rShoulder[0], layout.rShoulder[1], 0, 0.034));

  const rElbowPivot = new THREE.Group();
  rElbowPivot.position.set((layout.rElbow[0] - layout.rShoulder[0]) * W, (layout.rShoulder[1] - layout.rElbow[1]) * H, -0.01);
  rShoulderPivot.add(rElbowPivot);
  rElbowPivot.add(makePartMesh(partMats.rightForearm, layout.rElbow[0], layout.rElbow[1], 0, 0.032));

  // Right-Hand Signature 3D Hero Weapon + Right Mage Spell Orb driven from character data!
  const rHandMount = new THREE.Group();
  rHandMount.position.set(0.22, -0.24, -0.06);
  rElbowPivot.add(rHandMount);
  const rWeaponMesh = createHeroHandWeapon(THREE, weaponType, accent, false);
  rWeaponMesh.rotation.set(-0.85, 0, -0.35);
  rHandMount.add(rWeaponMesh);

  const rCastOrb = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.11, 1),
    new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.9 })
  );
  rCastOrb.position.set(0.08, -0.14, -0.1);
  rCastOrb.visible = false;
  rHandMount.add(rCastOrb);

  // Overhead Foldable 3D Void Paraglider Canopy + Control Bar (Paraglider-Blueprints.mp4)
  const gliderMesh = new THREE.Group();
  gliderMesh.position.set(0, 2.18, 0.05);
  const canopyMat = new THREE.MeshStandardMaterial({
    color: 0x0b2545,
    emissive: accent,
    emissiveIntensity: 0.55,
    roughness: 0.3,
    side: THREE.DoubleSide,
  });
  const wingL = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.045, 0.68), canopyMat);
  wingL.position.set(-0.56, 0.12, 0);
  wingL.rotation.z = 0.16;
  wingL.rotation.y = -0.18;
  const wingR = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.045, 0.68), canopyMat);
  wingR.position.set(0.56, 0.12, 0);
  wingR.rotation.z = -0.16;
  wingR.rotation.y = 0.18;
  const wingTrim = new THREE.Mesh(
    new THREE.BoxGeometry(2.36, 0.03, 0.06),
    new THREE.MeshBasicMaterial({ color: PALETTE.shardCyan })
  );
  wingTrim.position.set(0, 0.14, -0.32);
  const barMat = new THREE.MeshBasicMaterial({ color: 0xc8e6ff });
  const ctrlBar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.92, 6), barMat);
  ctrlBar.rotation.z = Math.PI / 2;
  ctrlBar.position.set(0, -0.28, -0.05);
  const strutL = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.46, 6), barMat);
  strutL.position.set(-0.42, -0.06, -0.02);
  const strutR = strutL.clone();
  strutR.position.x = 0.42;
  gliderMesh.add(wingL, wingR, wingTrim, ctrlBar, strutL, strutR);
  gliderMesh.visible = false;
  bodyPivot.add(gliderMesh);

  // LEFT LEG: HIP -> THIGH -> KNEE/SHIN/3D BOOT SOLE (child of Hips)
  const bootMat = new THREE.MeshStandardMaterial({ color: 0x261d1c, roughness: 0.75, metalness: 0.2 });
  const soleGlowMat = new THREE.MeshBasicMaterial({ color: accent });
  const makeBootSole = () => {
    const bg = new THREE.Group();
    const sole = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.09, 0.34), bootMat);
    const heelRim = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.035, 0.28), soleGlowMat);
    heelRim.position.y = -0.04;
    bg.add(sole, heelRim);
    return bg;
  };

  const lHipPx = layout.midX - 0.055;
  const lHipPivot = new THREE.Group();
  lHipPivot.position.set((lHipPx - 0.5) * W, 0, -0.015);
  hipsPivot.add(lHipPivot);
  lHipPivot.add(makePartMesh(partMats.leftThigh, lHipPx, layout.hipY, 0, 0.04));

  const lKneePivot = new THREE.Group();
  lKneePivot.position.set(0, (layout.hipY - layout.kneeY) * H, 0.01);
  lHipPivot.add(lKneePivot);
  lKneePivot.add(makePartMesh(partMats.leftShin, lHipPx, layout.kneeY, 0, 0.04));
  const lBootSole = makeBootSole();
  lBootSole.position.set(0, -(1.0 - layout.kneeY - 0.04) * H, -0.04);
  lKneePivot.add(lBootSole);

  // RIGHT LEG: HIP -> THIGH -> KNEE/SHIN/3D BOOT SOLE (child of Hips)
  const rHipPx = layout.midX + 0.055;
  const rHipPivot = new THREE.Group();
  rHipPivot.position.set((rHipPx - 0.5) * W, 0, -0.015);
  hipsPivot.add(rHipPivot);
  rHipPivot.add(makePartMesh(partMats.rightThigh, rHipPx, layout.hipY, 0, 0.04));

  const rKneePivot = new THREE.Group();
  rKneePivot.position.set(0, (layout.hipY - layout.kneeY) * H, 0.01);
  rHipPivot.add(rKneePivot);
  rKneePivot.add(makePartMesh(partMats.rightShin, rHipPx, layout.kneeY, 0, 0.04));
  const rBootSole = makeBootSole();
  rBootSole.position.set(0, -(1.0 - layout.kneeY - 0.04) * H, -0.04);
  rKneePivot.add(rBootSole);

  // Live 3D Glowing Crescent Slash Arc & Arcane Cast Sigil attached to Runner!
  const slashArcMat = new THREE.MeshBasicMaterial({
    color: accent,
    transparent: true,
    opacity: 0.88,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const slashArcMesh = new THREE.Mesh(new THREE.RingGeometry(0.88, 1.58, 22, 1, -0.4, Math.PI * 1.15), slashArcMat);
  slashArcMesh.position.set(0, 1.15, -0.35);
  slashArcMesh.rotation.x = Math.PI * 0.44;
  slashArcMesh.visible = false;
  bodyPivot.add(slashArcMesh);

  const castRingMesh = new THREE.Mesh(
    new THREE.RingGeometry(0.55, 0.72, 24),
    new THREE.MeshBasicMaterial({ color: 0x4cf3ff, transparent: true, opacity: 0.82, side: THREE.DoubleSide, depthWrite: false })
  );
  castRingMesh.position.set(0, 1.18, -0.78);
  castRingMesh.visible = false;
  bodyPivot.add(castRingMesh);

  bodyPivot.add(backRunGroup);

  // 2) SIDE-VIEW PROFILE PLANE (Used for Menu 360 turnaround & kinetic afterimage silhouettes!)
  const matSide = makeSpriteMat(texSide);
  spriteMats.push(matSide);
  const sidePlane = new THREE.Mesh(new THREE.PlaneGeometry(W, H), matSide);
  sidePlane.position.set(0, H * 0.5, 0);
  sidePlane.visible = false;
  bodyPivot.add(sidePlane);

  // 3) FRONT-VIEW SHOWCASE PLANE (Used for Character Select & Menu 360 turnaround!)
  const matFront = makeSpriteMat(texFront);
  spriteMats.push(matFront);
  const frontPlane = new THREE.Mesh(new THREE.PlaneGeometry(W, H), matFront);
  frontPlane.position.set(0, H * 0.5, 0);
  frontPlane.visible = false;
  bodyPivot.add(frontPlane);

  // 4) Grounded soft contact shadow + neon ring beneath boots (scales smoothly with jump height!)
  const shadowBlob = createContactShadow(THREE, 0.62, 0.65);
  root.add(shadowBlob);
  const footRing = new THREE.Mesh(
    new THREE.RingGeometry(0.34, 0.5, 22),
    new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.72, side: THREE.DoubleSide })
  );
  footRing.rotation.x = -Math.PI / 2;
  footRing.position.y = 0.04;
  root.add(footRing);

  // 5) Shield & Void Resonance orbs
  const shieldMesh = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.22, 1),
    new THREE.MeshBasicMaterial({ color: PALETTE.shardCyan, wireframe: true, transparent: true, opacity: 0.72 })
  );
  shieldMesh.position.y = 1.0;
  shieldMesh.visible = false;
  root.add(shieldMesh);

  const orbGroup = new THREE.Group();
  orbGroup.position.y = 1.05;
  for (let i = 0; i < 3; i++) {
    const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), new THREE.MeshBasicMaterial({ color: 0xc77dff }));
    const a = (i / 3) * Math.PI * 2;
    orb.position.set(Math.cos(a) * 0.96, 0, Math.sin(a) * 0.96);
    orbGroup.add(orb);
  }
  orbGroup.visible = false;
  root.add(orbGroup);

  // CRITICAL: Initialize root.userData BEFORE calling getSkeletalParts() so synchronous cache hits NEVER get overwritten!
  root.userData = {
    isSpriteRig: true,
    charId: charData.id,
    accentColor: accent,
    skeletalReady: false,
    bodyPivot,
    backRunGroup,
    backFullPlane,
    skelGroup,
    hipsPivot,
    hipBaseY: hipWy,
    torsoPivot,
    headPivot,
    lShoulderPivot,
    lElbowPivot,
    rShoulderPivot,
    rElbowPivot,
    lHipPivot,
    lKneePivot,
    rHipPivot,
    rKneePivot,
    rWeaponMesh,
    lWeaponMesh,
    aegisShieldMesh,
    lCastOrb,
    rCastOrb,
    gliderMesh,
    slashArcMesh,
    slashArcMat,
    castRingMesh,
    sidePlane,
    frontPlane,
    spriteMats,
    footRing,
    shadowBlob,
    shieldMesh,
    orbGroup,
    matBody: matBack,
    matAccent: matBack,
    baseTint: tintColor,
  };

  // Trigger clean offscreen canvas limb slicing & bind each skeletal texture (works both sync-cached & async!)
  getSkeletalParts(THREE, rigKey, activeSprites.back, (partsData) => {
    for (const pn of partNames) {
      partMats[pn].map = partsData.textures[pn];
      partMats[pn].visible = true;
      partMats[pn].needsUpdate = true;
    }
    root.userData.skeletalReady = true;
  });

  return root;
}

function hexToCss(hexNum) {
  return '#' + hexNum.toString(16).padStart(6, '0');
}

export function getWorldTrackTexture(THREE, world) {
  if (trackTextureCache.has(world.id)) return trackTextureCache.get(world.id);
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');

  const style = world.environStyle || 'emerald_ruins';
  const base = hexToCss(world.groundColor);
  const acc = world.accentHex || '#3DFF7A';
  const sec = hexToCss(world.secondaryAccent || PALETTE.voidGlow);
  const laneCenters = [88, 256, 424];

  if (style === 'emerald_ruins') {
    // Cracked dark cavern stone bridge slabs with glowing emerald/cyan runes & moss!
    ctx.fillStyle = '#151a24';
    ctx.fillRect(0, 0, 512, 512);
    const slabGrad = ctx.createLinearGradient(0, 0, 512, 0);
    slabGrad.addColorStop(0, '#0a0d14');
    slabGrad.addColorStop(0.1, base);
    slabGrad.addColorStop(0.5, '#1d2633');
    slabGrad.addColorStop(0.9, base);
    slabGrad.addColorStop(1, '#0a0d14');
    ctx.fillStyle = slabGrad;
    ctx.fillRect(14, 0, 484, 512);

    // Bold comic-inked stone block seams & jagged stone cracks
    ctx.strokeStyle = '#07090f';
    ctx.lineWidth = 4;
    for (let y = 0; y < 512; y += 64) {
      ctx.beginPath();
      ctx.moveTo(14, y);
      ctx.lineTo(170, y + 6);
      ctx.lineTo(342, y - 5);
      ctx.lineTo(498, y + 3);
      ctx.stroke();
      const offset = ((y / 64) % 2) * 44;
      for (let x = 90 + offset; x < 460; x += 130) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 8, y + 64);
        ctx.stroke();
      }
    }

    // Glowing etched ancient runes down all 3 lanes
    ctx.strokeStyle = acc;
    ctx.shadowColor = acc;
    ctx.shadowBlur = 10;
    ctx.lineWidth = 3.5;
    ctx.globalAlpha = 0.72;
    for (const cx of laneCenters) {
      for (let y = 32; y < 512; y += 128) {
        ctx.beginPath();
        ctx.moveTo(cx - 14, y + 12);
        ctx.lineTo(cx, y - 14);
        ctx.lineTo(cx + 14, y + 12);
        ctx.moveTo(cx - 8, y + 2);
        ctx.lineTo(cx + 8, y + 2);
        ctx.stroke();
      }
    }
    ctx.shadowBlur = 0;

    // Moss & glowing energy cracks along bridge shoulders
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = world.id === 5 ? '#35a9c4' : '#2d7a36';
    for (let i = 0; i < 16; i++) {
      const sideX = i % 2 === 0 ? 18 + (i % 3) * 8 : 478 - (i % 3) * 8;
      ctx.beginPath();
      ctx.ellipse(sideX, (i * 37) % 512, 12, 22, 0.2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (style === 'industrial_catwalk') {
    // Sunset rusted steel catwalk with riveted iron deck plates, diamond grate center & amber work lamps!
    ctx.fillStyle = '#241c1d';
    ctx.fillRect(0, 0, 512, 512);
    const deckGrad = ctx.createLinearGradient(0, 0, 512, 0);
    deckGrad.addColorStop(0, '#1a1214');
    deckGrad.addColorStop(0.14, '#4c3834');
    deckGrad.addColorStop(0.35, '#3b2e2e');
    deckGrad.addColorStop(0.65, '#3b2e2e');
    deckGrad.addColorStop(0.86, '#4c3834');
    deckGrad.addColorStop(1, '#1a1214');
    ctx.fillStyle = deckGrad;
    ctx.fillRect(10, 0, 492, 512);

    // Center steel mesh diamond grating
    ctx.fillStyle = '#1d181e';
    ctx.fillRect(172, 0, 168, 512);
    ctx.strokeStyle = 'rgba(255,176,90,0.22)';
    ctx.lineWidth = 2;
    for (let y = -168; y < 512; y += 22) {
      ctx.beginPath();
      ctx.moveTo(172, y);
      ctx.lineTo(340, y + 168);
      ctx.moveTo(340, y);
      ctx.lineTo(172, y + 168);
      ctx.stroke();
    }

    // Iron plate seams & rivets
    ctx.strokeStyle = '#120c0d';
    ctx.lineWidth = 4;
    for (let y = 0; y < 512; y += 64) {
      ctx.beginPath();
      ctx.moveTo(10, y);
      ctx.lineTo(502, y);
      ctx.stroke();
      ctx.fillStyle = '#7c5d4c';
      for (const rx of [32, 152, 360, 480]) {
        ctx.beginPath();
        ctx.arc(rx, y + 12, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Warm orange-amber glowing walkway lamps & industrial cables along edges
    ctx.fillStyle = '#ffb040';
    ctx.shadowColor = '#ff8822';
    ctx.shadowBlur = 14;
    for (let y = 40; y < 512; y += 128) {
      ctx.beginPath();
      ctx.arc(22, y, 7, 0, Math.PI * 2);
      ctx.arc(490, y, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  } else if (style === 'crimson_magma') {
    // Jagged fractured dark obsidian rock road split by glowing molten lava veins & crimson sigils!
    ctx.fillStyle = '#14090e';
    ctx.fillRect(0, 0, 512, 512);
    const rockGrad = ctx.createLinearGradient(0, 0, 512, 0);
    rockGrad.addColorStop(0, '#0a0407');
    rockGrad.addColorStop(0.12, '#2a1620');
    rockGrad.addColorStop(0.5, '#1d1018');
    rockGrad.addColorStop(0.88, '#2a1620');
    rockGrad.addColorStop(1, '#0a0407');
    ctx.fillStyle = rockGrad;
    ctx.fillRect(10, 0, 492, 512);

    // Branching molten lava cracks across fractured basalt
    ctx.strokeStyle = acc;
    ctx.shadowColor = acc;
    ctx.shadowBlur = 12;
    ctx.lineWidth = 4;
    for (let y = 16; y < 512; y += 85) {
      ctx.beginPath();
      ctx.moveTo(12, y);
      ctx.lineTo(118, y + 18);
      ctx.lineTo(240, y - 10);
      ctx.lineTo(385, y + 20);
      ctx.lineTo(500, y + 4);
      ctx.stroke();
    }
    // Glowing inner magma core
    ctx.strokeStyle = '#ffdd66';
    ctx.lineWidth = 1.6;
    for (let y = 16; y < 512; y += 85) {
      ctx.beginPath();
      ctx.moveTo(12, y);
      ctx.lineTo(118, y + 18);
      ctx.lineTo(240, y - 10);
      ctx.lineTo(385, y + 20);
      ctx.lineTo(500, y + 4);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;

    // Crimson arcane sigil rings along center lane
    ctx.strokeStyle = acc;
    ctx.globalAlpha = 0.52;
    ctx.lineWidth = 3;
    for (let y = 128; y < 512; y += 256) {
      ctx.beginPath();
      ctx.arc(256, y, 42, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(256, y - 48);
      ctx.lineTo(304, y);
      ctx.lineTo(256, y + 48);
      ctx.lineTo(208, y);
      ctx.closePath();
      ctx.stroke();
    }
  } else {
    // void_singularity: Shattered dark cliff stone with glowing violet cracks & stark white-lightning seams!
    ctx.fillStyle = '#0d0c16';
    ctx.fillRect(0, 0, 512, 512);
    const voidGrad = ctx.createLinearGradient(0, 0, 512, 0);
    voidGrad.addColorStop(0, '#07060d');
    voidGrad.addColorStop(0.14, '#241e32');
    voidGrad.addColorStop(0.5, '#191726');
    voidGrad.addColorStop(0.86, '#241e32');
    voidGrad.addColorStop(1, '#07060d');
    ctx.fillStyle = voidGrad;
    ctx.fillRect(10, 0, 492, 512);

    // Cracked marble/obsidian joints with glowing magenta/violet energy beneath
    ctx.strokeStyle = '#d64dff';
    ctx.shadowColor = '#b44fff';
    ctx.shadowBlur = 10;
    ctx.lineWidth = 3.2;
    for (let y = 24; y < 512; y += 72) {
      ctx.beginPath();
      ctx.moveTo(14, y);
      ctx.lineTo(160, y - 10);
      ctx.lineTo(330, y + 12);
      ctx.lineTo(498, y - 4);
      ctx.stroke();
    }
    // Stark white-cyan lightning forward chevrons
    ctx.strokeStyle = '#e8f4ff';
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 3.5;
    for (const cx of laneCenters) {
      for (let y = 48; y < 512; y += 128) {
        ctx.beginPath();
        ctx.moveTo(cx - 24, y + 18);
        ctx.lineTo(cx, y - 12);
        ctx.lineTo(cx + 24, y + 18);
        ctx.stroke();
      }
    }
    ctx.shadowBlur = 0;
  }

  // Crisp glowing outer edge rails & subtle lane dividers for instant arcade readability
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = acc;
  ctx.fillRect(4, 0, 10, 512);
  ctx.fillRect(498, 0, 10, 512);

  ctx.globalAlpha = 0.5;
  ctx.fillStyle = sec;
  ctx.fillRect(169, 0, 4, 512);
  ctx.fillRect(339, 0, 4, 512);

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 3);
  trackTextureCache.set(world.id, tex);
  return tex;
}

export function createEnvironmentBackdrop(THREE, world) {
  const group = new THREE.Group();
  const artUrl = world.environArt || 'assets/art/environ/environ_emerald_ruins.jpg';
  const tex = loadEnvironTexture(THREE, artUrl);

  // Curved panoramic illustrated horizon wall wrapping smoothly across forward FOV!
  const radius = 114;
  const height = 84;
  const arcGeo = new THREE.CylinderGeometry(radius, radius, height, 36, 1, true, Math.PI * 0.62, Math.PI * 0.76);
  // Flip U horizontally on BackSide cylinder so source artwork renders un-mirrored!
  const uv = arcGeo.attributes.uv;
  const isVoid = world.environStyle === 'void_singularity';
  for (let i = 0; i < uv.count; i++) {
    const u = 1.0 - uv.getX(i);
    // For Void Singularity, crop up slightly to frame the towering lightning eclipse & ruined columns above horizon
    const v = isVoid ? 0.14 + uv.getY(i) * 0.86 : uv.getY(i);
    uv.setXY(i, u, v);
  }
  uv.needsUpdate = true;

  const arcMat = new THREE.MeshBasicMaterial({
    map: tex,
    color: world.environTint || 0xffffff,
    side: THREE.BackSide,
    fog: false,
    depthWrite: false,
  });
  const arcMesh = new THREE.Mesh(arcGeo, arcMat);
  arcMesh.position.set(0, 22, 6);
  group.add(arcMesh);

  // Atmospheric abyss floor beneath the elevated track (emerald cavern mist / sunset water / molten lava / void chasm)
  const abyssColor =
    world.environStyle === 'crimson_magma' ? 0x6b0c18 :
    world.environStyle === 'industrial_catwalk' ? 0x262822 :
    world.environStyle === 'void_singularity' ? 0x0c081a : 0x061b18;
  const abyssPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(180, 170),
    new THREE.MeshBasicMaterial({ color: abyssColor, transparent: true, opacity: 0.75 })
  );
  abyssPlane.rotation.x = -Math.PI / 2;
  abyssPlane.position.set(0, -10.5, -55);
  group.add(abyssPlane);

  group.userData = { arcMesh, abyssPlane };
  return group;
}

export function createChunkScenery(THREE, world, chunkIdx, rng) {
  const group = new THREE.Group();
  const floaters = [];
  const style = world.environStyle || 'emerald_ruins';
  const len = 30;
  const acc = world.accent || 0x3dff7a;
  const sec = world.secondaryAccent || 0xb44fff;

  if (style === 'emerald_ruins') {
    // Ancient mossy stone ruin pillars, rune bands, floating cavern islands & broken emerald portal arches!
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x24303a, roughness: 0.82, metalness: 0.08 });
    const mossMat = new THREE.MeshStandardMaterial({ color: world.id === 5 ? 0x389bb8 : 0x297834, roughness: 0.9 });
    const runeMat = new THREE.MeshBasicMaterial({ color: acc });

    for (const side of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        const z = -(i * 10 + 4);
        const h = 4.2 + rng() * 4.5;
        const x = side * (3.25 + rng() * 1.4);

        const col = new THREE.Group();
        col.position.set(x, 0, z);
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.58, h, 7), stoneMat);
        shaft.position.y = h * 0.5 - 1.2;
        col.add(shaft);

        // Glowing carved rune ring mid-pillar
        const runeBand = new THREE.Mesh(new THREE.CylinderGeometry(0.51, 0.51, 0.24, 7), runeMat);
        runeBand.position.y = h * 0.42;
        col.add(runeBand);

        // Hanging moss cap / ledge
        const cap = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.36, 1.3), mossMat);
        cap.position.y = h - 1.2;
        col.add(cap);
        group.add(col);

        // Floating mossy rock islet & glowing cavern wisp
        if (i === 1) {
          const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.75 + rng() * 0.45, 0), stoneMat);
          rock.position.set(side * (5.2 + rng() * 2.2), 3.4 + rng() * 2.5, z - 3);
          group.add(rock);
          floaters.push({ mesh: rock, baseY: rock.position.y, phase: rng() * 6.28, amp: 0.45 });

          const wisp = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), new THREE.MeshBasicMaterial({ color: rng() < 0.5 ? acc : sec }));
          wisp.position.set(side * 2.5, 2.2 + rng() * 1.8, z);
          group.add(wisp);
          floaters.push({ mesh: wisp, baseY: wisp.position.y, phase: rng() * 6.28, amp: 0.55 });
        }
      }
    }

    // Ancient broken stone archway spanning the track every 2 chunks!
    if (chunkIdx % 2 === 0) {
      const arch = new THREE.Group();
      arch.position.set(0, 0, -len * 0.5);
      for (const side of [-1, 1]) {
        const pier = new THREE.Mesh(new THREE.BoxGeometry(0.95, 5.2, 0.95), stoneMat);
        pier.position.set(side * 2.85, 2.2, 0);
        arch.add(pier);
        const strip = new THREE.Mesh(new THREE.BoxGeometry(0.16, 4.2, 0.16), runeMat);
        strip.position.set(side * 2.35, 2.3, 0.42);
        arch.add(strip);
      }
      const lintel = new THREE.Mesh(new THREE.TorusGeometry(2.9, 0.34, 6, 16, Math.PI), stoneMat);
      lintel.position.set(0, 4.4, 0);
      arch.add(lintel);
      const glowArc = new THREE.Mesh(new THREE.TorusGeometry(2.55, 0.08, 6, 18, Math.PI), runeMat);
      glowArc.position.set(0, 4.4, 0.12);
      arch.add(glowArc);
      group.add(arch);
    }
  } else if (style === 'industrial_catwalk') {
    // Rusted refinery steel girder towers, catwalk guardrails with glowing amber work-lamps & overhead pipe gantries!
    const rustMat = new THREE.MeshStandardMaterial({ color: 0x4b312a, roughness: 0.72, metalness: 0.42 });
    const darkSteel = new THREE.MeshStandardMaterial({ color: 0x262128, roughness: 0.55, metalness: 0.55 });
    const lampMat = new THREE.MeshBasicMaterial({ color: 0xffb040 });

    // Side safety guardrails running along both sides of the elevated catwalk
    for (const side of [-1, 1]) {
      const railTop = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, len), darkSteel);
      railTop.position.set(side * 2.06, 0.92, -len * 0.5);
      group.add(railTop);

      for (let i = 0; i < 4; i++) {
        const z = -(i * 7.5 + 2.5);
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.0, 0.1), rustMat);
        post.position.set(side * 2.06, 0.45, z);
        group.add(post);

        if (i % 2 === 0) {
          const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), lampMat);
          lamp.position.set(side * 2.06, 1.02, z);
          group.add(lamp);
        }
      }

      // Tall refinery smokestack / girder tower outside the catwalk
      for (let i = 0; i < 2; i++) {
        const z = -(i * 15 + 6);
        const h = 6.5 + rng() * 5.0;
        const x = side * (4.1 + rng() * 2.2);
        const tower = new THREE.Mesh(
          i === 0 ? new THREE.CylinderGeometry(0.55, 0.72, h, 8) : new THREE.BoxGeometry(1.4, h, 1.4),
          i === 0 ? rustMat : darkSteel
        );
        tower.position.set(x, h * 0.4 - 1.5, z);
        group.add(tower);

        // Glowing warning beacon atop tower
        const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6), new THREE.MeshBasicMaterial({ color: i === 0 ? 0xff7a28 : 0x00e5ff }));
        beacon.position.set(x, h * 0.9 - 1.3, z);
        group.add(beacon);
      }
    }

    // Overhead industrial steel pipe gantry every 2 chunks
    if (chunkIdx % 2 === 0) {
      const gantry = new THREE.Group();
      gantry.position.set(0, 0, -len * 0.5);
      for (const side of [-1, 1]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.35, 5.6, 0.35), rustMat);
        leg.position.set(side * 2.45, 2.5, 0);
        gantry.add(leg);
      }
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 5.4, 8), darkSteel);
      pipe.rotation.z = Math.PI / 2;
      pipe.position.set(0, 5.1, 0);
      gantry.add(pipe);
      const cable = new THREE.Mesh(new THREE.TorusGeometry(2.3, 0.04, 6, 14, Math.PI), lampMat);
      cable.rotation.z = Math.PI;
      cable.position.set(0, 5.1, 0.25);
      gantry.add(cable);
      group.add(gantry);
    }
  } else if (style === 'crimson_magma') {
    // Jagged volcanic obsidian spires, floating fractured lava boulders & blazing crimson monoliths!
    const obsidianMat = new THREE.MeshStandardMaterial({ color: 0x1e1118, roughness: 0.72, metalness: 0.22 });
    const magmaMat = new THREE.MeshBasicMaterial({ color: acc });

    for (const side of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        const z = -(i * 10 + 4);
        const h = 4.5 + rng() * 5.5;
        const x = side * (3.2 + rng() * 2.0);

        // Razor-sharp volcanic spire
        const spire = new THREE.Mesh(new THREE.ConeGeometry(0.85 + rng() * 0.45, h, 5), obsidianMat);
        spire.position.set(x, h * 0.42 - 1.2, z);
        spire.rotation.z = -side * (0.1 + rng() * 0.16);
        group.add(spire);

        // Glowing magma fissure blade beside spire
        const vein = new THREE.Mesh(new THREE.ConeGeometry(0.18, h * 0.75, 4), magmaMat);
        vein.position.set(x - side * 0.42, h * 0.34 - 0.8, z + 0.25);
        group.add(vein);

        // Hovering jagged basalt rock suspended over the lava chasm
        const boulder = new THREE.Mesh(new THREE.DodecahedronGeometry(0.65 + rng() * 0.5, 0), obsidianMat);
        boulder.position.set(side * (4.8 + rng() * 2.2), 2.8 + rng() * 3.0, z - 4);
        group.add(boulder);
        floaters.push({ mesh: boulder, baseY: boulder.position.y, phase: rng() * 6.28, amp: 0.55 });
      }
    }

    // Towering spiked crimson rift gate overhead every 2 chunks
    if (chunkIdx % 2 === 0) {
      const riftArc = new THREE.Mesh(
        new THREE.TorusGeometry(3.2, 0.13, 6, 18, Math.PI),
        new THREE.MeshBasicMaterial({ color: acc, transparent: true, opacity: 0.72 })
      );
      riftArc.position.set(0, 0.4, -len * 0.5);
      group.add(riftArc);
    }
  } else {
    // void_singularity: Shattered ancient fluted marble pillars, floating stone slabs, blue-violet crystals & white lightning arcs!
    const marbleMat = new THREE.MeshStandardMaterial({ color: 0xbac2d4, roughness: 0.58, metalness: 0.12 });
    const cliffMat = new THREE.MeshStandardMaterial({ color: 0x1c1728, roughness: 0.8 });
    const crystalMat = new THREE.MeshBasicMaterial({ color: world.id === 3 ? 0x5c9eff : 0xa566ff });
    const boltMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    for (const side of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        const z = -(i * 10 + 4);
        const h = 3.6 + rng() * 4.8;
        const x = side * (3.3 + rng() * 1.8);

        // Shattered fluted marble column tilted dramatically
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.52, h, 8), marbleMat);
        col.position.set(x, h * 0.42 - 1.0, z);
        col.rotation.z = side * (0.08 + rng() * 0.18);
        group.add(col);

        // Glowing blue-violet crystal cluster growing right beside the cliff edge!
        const cluster = new THREE.Group();
        cluster.position.set(side * 2.38, 0.05, z + 1.5);
        for (let k = 0; k < 3; k++) {
          const ch = 0.7 + k * 0.32;
          const shard = new THREE.Mesh(new THREE.ConeGeometry(0.16, ch, 5), crystalMat);
          shard.position.set((k - 1) * 0.22, ch * 0.45, (k % 2) * 0.15);
          shard.rotation.z = (k - 1) * 0.28 - side * 0.22;
          cluster.add(shard);
        }
        group.add(cluster);

        // Floating fractured marble platform suspended in mid-air
        if (i === 1) {
          const slab = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.34, 1.5), cliffMat);
          slab.position.set(side * (4.6 + rng() * 1.8), 3.2 + rng() * 2.2, z - 2);
          slab.rotation.set(0.15, rng() * 1.2, -side * 0.2);
          group.add(slab);
          floaters.push({ mesh: slab, baseY: slab.position.y, phase: rng() * 6.28, amp: 0.5 });
        }
      }
    }

    // Jagged white-violet void lightning arc tearing across the sky every 2 chunks!
    if (chunkIdx % 2 === 0) {
      const bolt = new THREE.Mesh(new THREE.TorusGeometry(3.35, 0.09, 5, 10, Math.PI), boltMat);
      bolt.position.set(0, 0.8, -len * 0.5);
      group.add(bolt);
      const aura = new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.2, 5, 10, Math.PI), new THREE.MeshBasicMaterial({ color: acc, transparent: true, opacity: 0.38 }));
      aura.position.set(0, 0.8, -len * 0.5);
      group.add(aura);
    }
  }

  return { group, floaters };
}

export function createSkyDome(THREE, world) {
  let tex = skyTextureCache.get(world.id);
  if (!tex) {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 512;
    const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, hexToCss(world.skyTop));
    g.addColorStop(0.5, hexToCss(world.skyBottom));
    g.addColorStop(0.75, world.accentHex || '#B44FFF');
    g.addColorStop(1, '#080610');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 512);

    // Soft aurora ribbons
    ctx.globalAlpha = 0.25;
    const rGrad = ctx.createRadialGradient(128, 240, 15, 128, 240, 140);
    rGrad.addColorStop(0, hexToCss(world.secondaryAccent || PALETTE.shardCyan));
    rGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = rGrad;
    ctx.fillRect(0, 80, 256, 300);

    tex = new THREE.CanvasTexture(c);
    skyTextureCache.set(world.id, tex);
  }
  return new THREE.Mesh(
    new THREE.SphereGeometry(145, 20, 14),
    new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false })
  );
}

export function createRunnerMesh(THREE, charId = 'miller', skinId = 'default', isGhost = false) {
  const charData = CHARACTERS.find((c) => c.id === charId) || CHARACTERS[0];
  const skin = SKINS.find((s) => s.id === skinId) || SKINS[0];
  // Use the user's real Front/Side/Back source artwork for animated 2.5D gameplay motion!
  if (charData.sprites) {
    return createArticulatedImageRunnerRig(THREE, charData, skin, isGhost);
  }
  // Allow applying custom unlocked skin colours across any runner while keeping character silhouette!
  const useSkinColors = skinId !== 'default';
  const primary = useSkinColors ? skin.primary : charData.primaryColor;
  const accent = useSkinColors ? skin.accent : charData.accentColor;

  const root = new THREE.Group();
  const bodyPivot = new THREE.Group();
  root.add(bodyPivot);

  const matBody = new THREE.MeshStandardMaterial({
    color: isGhost ? 0x9b30ff : primary,
    roughness: 0.42,
    metalness: 0.25,
    transparent: isGhost,
    opacity: isGhost ? 0.45 : 1,
    emissive: isGhost ? 0x6b2fa0 : primary,
    emissiveIntensity: isGhost ? 0.9 : 0.12,
  });

  const matAccent = new THREE.MeshStandardMaterial({
    color: accent,
    emissive: accent,
    emissiveIntensity: isGhost ? 1.3 : 0.95,
    roughness: 0.22,
    transparent: isGhost,
    opacity: isGhost ? 0.65 : 1,
  });

  const skinTone =
    charData.style === 'vanguard' ? 0x8f5d42 :
    charData.style === 'rogue' ? 0xb48468 :
    charData.style === 'arcane' ? 0xc89578 : 0xdcb8a2;

  const matSkin = new THREE.MeshStandardMaterial({
    color: isGhost ? 0xb44fff : skinTone,
    roughness: 0.6,
    transparent: isGhost,
    opacity: isGhost ? 0.4 : 1,
  });

  const makeMat = (hex, rough = 0.5, metal = 0.15, emissive = 0x000000, emInt = 0) =>
    new THREE.MeshStandardMaterial({
      color: isGhost ? 0x9b30ff : hex,
      roughness: rough,
      metalness: metal,
      emissive: isGhost ? 0x6b2fa0 : emissive,
      emissiveIntensity: isGhost ? 0.7 : emInt,
      transparent: isGhost,
      opacity: isGhost ? 0.45 : 1,
    });

  // Torso width tailored to character build from turnaround references
  const torsoWidth =
    charData.style === 'vanguard' ? 0.62 :
    charData.style === 'tech' ? 0.54 :
    charData.style === 'rogue' || charData.style === 'assassin' || charData.style === 'arcane' ? 0.41 : 0.46;
  const torso = new THREE.Mesh(new THREE.BoxGeometry(torsoWidth, 0.68, 0.3), matBody);
  torso.position.y = 1.04;
  bodyPivot.add(torso);

  // Luminous void trim belt & chest stripe
  const belt = new THREE.Mesh(new THREE.BoxGeometry(torsoWidth + 0.05, 0.1, 0.34), matAccent);
  belt.position.y = 0.74;
  bodyPivot.add(belt);

  // Flowing animated energy scarf/coat-tail on back
  const scarfColor =
    charData.style === 'miller' ? 0x3b2a20 :
    charData.style === 'arcane' ? 0x22384c :
    charData.style === 'rogue' ? 0x7d3ad4 : accent;
  const scarf = new THREE.Mesh(
    new THREE.BoxGeometry(charData.style === 'vanguard' ? 0.2 : 0.36, 0.52, 0.06),
    charData.style === 'miller' || charData.style === 'arcane' ? makeMat(scarfColor, 0.65) : matAccent
  );
  scarf.position.set(0, 0.62, 0.2);
  scarf.rotation.x = 0.25;
  if (charData.style !== 'vanguard') bodyPivot.add(scarf);

  // Head
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 0.32), matSkin);
  head.position.y = 1.56;
  bodyPivot.add(head);

  const eyeColor =
    charData.style === 'rogue' ? 0xffb820 :
    charData.style === 'arcane' ? 0x3dffcc : accent;
  const matEye = new THREE.MeshBasicMaterial({ color: eyeColor });
  const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.045, 0.04), matEye);
  eyeL.position.set(-0.08, 1.58, -0.165);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.08;
  bodyPivot.add(eyeL, eyeR);

  // === TURNAROUND-ACCURATE 3D CHARACTER SCULPTING (SharedArt/characters) ===
  if (charData.style === 'miller') {
    // Miller Redwolf: tousled dark hair, grey dropped hoodie collar on back, tattered brown leather trench coat, F-rank tag, steel sword on left hip!
    const hairMat = makeMat(0x211b18, 0.75);
    const hairTop = new THREE.Mesh(new THREE.BoxGeometry(0.37, 0.16, 0.37), hairMat);
    hairTop.position.set(0, 1.71, 0.01);
    const hairBack = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.26, 0.14), hairMat);
    hairBack.position.set(0, 1.59, 0.14);
    bodyPivot.add(hairTop, hairBack);

    // Grey hoodie layer & draped back hood
    const greyHoodMat = makeMat(0x6d7178, 0.7);
    const backHood = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.22, 0.2), greyHoodMat);
    backHood.position.set(0, 1.32, 0.17);
    const chestHoodie = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.56, 0.32), greyHoodMat);
    chestHoodie.position.set(0, 1.05, -0.01);
    bodyPivot.add(backHood, chestHoodie);

    // F-Rank Guild Tag hanging on chest
    const fTag = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.14, 0.03), makeMat(0xc7b086, 0.5, 0.1, 0xb44fff, 0.35));
    fTag.position.set(0, 1.24, -0.18);
    bodyPivot.add(fTag);

    // Tattered leather coat lower panels
    const coatL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.42, 0.32), matBody);
    coatL.position.set(-0.15, 0.56, 0.03);
    const coatR = coatL.clone();
    coatR.position.x = 0.15;
    bodyPivot.add(coatL, coatR);

    // Steel longsword in diagonal scabbard on left hip (glowing violet rune edge)
    const scabbard = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.92, 0.07), makeMat(0x2a201c, 0.5, 0.4));
    scabbard.position.set(-0.32, 0.58, 0.14);
    scabbard.rotation.x = 0.35;
    scabbard.rotation.z = 0.14;
    const hilt = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.05, 0.06), matAccent);
    hilt.position.set(-0.27, 1.0, -0.02);
    bodyPivot.add(scabbard, hilt);
  } else if (charData.style === 'vanguard') {
    // Brann Kest: muscular build, topknot bun + full beard, steel lamellar armor, asymmetric left steel/gold pauldron,
    // iconic round iron-rimmed wooden shield strapped on back + warhammer on left hip!
    const darkHair = makeMat(0x1f1916, 0.8);
    const steelMat = makeMat(0x6b727c, 0.35, 0.72);
    const goldTrim = makeMat(0xd4a438, 0.3, 0.75, 0xffb020, 0.25);
    const woodMat = makeMat(0x6b472b, 0.75);
    const greenWrap = makeMat(0x4b6a35, 0.8);

    const mohawk = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.34), darkHair);
    mohawk.position.set(0, 1.74, 0.02);
    const bun = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), darkHair);
    bun.position.set(0, 1.78, 0.17);
    const beard = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 0.16), darkHair);
    beard.position.set(0, 1.44, -0.12);
    bodyPivot.add(mohawk, bun, beard);

    // Riveted steel chest cuirass over crimson tunic
    const cuirass = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.56, 0.34), steelMat);
    cuirass.position.set(0, 1.07, 0);
    bodyPivot.add(cuirass);

    // Heavy left shoulder pauldron with gold emblem
    const pauldron = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.24, 0.36), steelMat);
    pauldron.position.set(-0.38, 1.32, 0);
    const pCrest = new THREE.Mesh(new THREE.OctahedronGeometry(0.09, 0), goldTrim);
    pCrest.position.set(-0.46, 1.35, 0);
    bodyPivot.add(pauldron, pCrest);

    // Iconic round iron-rimmed wooden shield mounted on back!
    const shieldRim = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.08, 18), steelMat);
    shieldRim.rotation.x = Math.PI / 2;
    shieldRim.position.set(0, 1.12, 0.24);
    const shieldWood = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.09, 16), woodMat);
    shieldWood.rotation.x = Math.PI / 2;
    shieldWood.position.set(0, 1.12, 0.245);
    const shieldBoss = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.11), greenWrap);
    shieldBoss.position.set(0, 1.12, 0.255);
    bodyPivot.add(shieldRim, shieldWood, shieldBoss);

    // Forged warhammer at left hip
    const hHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.62, 6), woodMat);
    hHandle.position.set(-0.36, 0.62, 0.02);
    const hHead = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.18, 0.28), steelMat);
    hHead.position.set(-0.36, 0.88, 0.02);
    bodyPivot.add(hHandle, hHead);
  } else if (charData.style === 'arcane') {
    // Elara Vey: copper-auburn hair + long side braid, deep navy-slate coat w/ gold trim, cream split tunic,
    // teal rune sash, twin hip scrolls, and diagonal bronze sun-ring staff w/ teal crystal on back!
    const auburnMat = makeMat(0xa64a24, 0.55);
    const creamMat = makeMat(0xe5dec9, 0.65);
    const goldMat = makeMat(0xd4a448, 0.32, 0.72);
    const runeGlow = new THREE.MeshBasicMaterial({ color: 0x3dffcc });

    const hairCrown = new THREE.Mesh(new THREE.BoxGeometry(0.37, 0.18, 0.37), auburnMat);
    hairCrown.position.set(0, 1.7, 0.02);
    const hairBack = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.28, 0.14), auburnMat);
    hairBack.position.set(0, 1.54, 0.15);
    // Signature thick copper braid hanging over shoulder/back
    const braid = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.035, 0.62, 6), auburnMat);
    braid.position.set(0.17, 1.24, 0.13);
    braid.rotation.z = 0.15;
    bodyPivot.add(hairCrown, hairBack, braid);

    // Cream tunic center & flared navy/gold coat skirt
    const innerRobe = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.66, 0.31), creamMat);
    innerRobe.position.set(0, 0.66, -0.01);
    const runeSash = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.55, 0.33), makeMat(0x225a62, 0.4, 0.2, 0x3dffcc, 0.45));
    runeSash.position.set(0, 0.62, -0.01);
    const coatFlare = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.42, 0.58, 8, 1, true), matBody);
    coatFlare.position.set(0, 0.58, 0.04);
    bodyPivot.add(innerRobe, runeSash, coatFlare);

    // Twin parchment scrolls strapped to left hip
    for (let i = 0; i < 2; i++) {
      const scroll = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.34, 8), creamMat);
      scroll.position.set(-0.26 - i * 0.08, 0.68, 0.06);
      scroll.rotation.z = 0.18;
      bodyPivot.add(scroll);
    }

    // Ornate bronze sun-ring arcane staff diagonally across back with glowing teal crystal!
    const staffGroup = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.55, 6), goldMat);
    const sunRing = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.035, 6, 14), goldMat);
    sunRing.position.y = 0.85;
    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.08, 0), runeGlow);
    crystal.position.y = 0.85;
    const dangle = new THREE.Mesh(new THREE.OctahedronGeometry(0.055, 0), runeGlow);
    dangle.position.set(0, 0.56, 0);
    staffGroup.add(pole, sunRing, crystal, dangle);
    staffGroup.position.set(0.06, 1.12, 0.23);
    staffGroup.rotation.z = 0.52;
    bodyPivot.add(staffGroup);
  } else if (charData.style === 'rogue') {
    // Nyx Aderyn: two-tone silver-white & charcoal bob hair, pointed elven ears, glowing amber eyes,
    // charcoal hooded coat with vibrant violet inner lining, crossed grey tunic & twin curved back daggers!
    const silverHair = makeMat(0xdcdde6, 0.55);
    const darkHair = makeMat(0x282934, 0.65);
    const violetLining = makeMat(0x8842d6, 0.4, 0.2, 0x9b30ff, 0.45);
    const greyWrap = makeMat(0x6d6e78, 0.6);

    const hairTop = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.17, 0.38), silverHair);
    hairTop.position.set(0, 1.7, 0.01);
    const hairTips = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.14, 0.34), darkHair);
    hairTips.position.set(0, 1.56, 0.06);
    bodyPivot.add(hairTop, hairTips);

    // Pointed elven ears
    for (const s of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.18, 4), matSkin);
      ear.position.set(s * 0.21, 1.57, 0);
      ear.rotation.z = -s * 1.15;
      bodyPivot.add(ear);
    }

    // Hooded collar & violet-lined swallowtail coat panels
    const hoodCollar = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.2, 0.24), matBody);
    hoodCollar.position.set(0, 1.32, 0.14);
    const wrapChest = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.56, 0.32), greyWrap);
    wrapChest.position.set(0, 1.04, -0.01);
    const tailL = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.58, 4), violetLining);
    tailL.rotation.x = Math.PI;
    tailL.position.set(-0.18, 0.54, 0.16);
    const tailR = tailL.clone();
    tailR.position.x = 0.18;
    bodyPivot.add(hoodCollar, wrapChest, tailL, tailR);

    // Twin curved crescent void-purple daggers mounted X-style on lower back!
    for (const s of [-1, 1]) {
      const dagger = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.52, 4), matAccent);
      dagger.position.set(s * 0.18, 0.82, 0.22);
      dagger.rotation.z = s * 0.65;
      dagger.rotation.x = 0.2;
      bodyPivot.add(dagger);
    }
  } else if (charData.style === 'hood') {
    const hood = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.39, 0.39), matBody);
    hood.position.set(0, 1.59, 0.03);
    bodyPivot.add(hood);
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.0, 0.04), matAccent);
    blade.position.set(0.2, 1.25, 0.22);
    blade.rotation.z = -0.35;
    bodyPivot.add(blade);
  } else if (charData.style === 'tech') {
    const phoneRing = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.045, 6, 14), matAccent);
    phoneRing.rotation.x = Math.PI / 2;
    phoneRing.position.set(0, 1.38, 0);
    bodyPivot.add(phoneRing);
  } else if (charData.style === 'medic') {
    const pony = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.38, 6), new THREE.MeshStandardMaterial({ color: 0x6b3a1f }));
    pony.position.set(0, 1.54, 0.24);
    pony.rotation.x = 0.6;
    bodyPivot.add(pony);
    const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.24, 0.04), matAccent);
    crossV.position.set(0, 1.08, 0.18);
    const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.07, 0.04), matAccent);
    crossH.position.set(0, 1.08, 0.18);
    bodyPivot.add(crossV, crossH);
  } else if (charData.style === 'assassin') {
    const mask = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.14, 0.35), matBody);
    mask.position.set(0, 1.49, 0);
    bodyPivot.add(mask);
    const daggerL = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.5, 4), matAccent);
    daggerL.position.set(-0.46, 1.0, 0.04);
    daggerL.rotation.x = -Math.PI / 2;
    const daggerR = daggerL.clone();
    daggerR.position.x = 0.46;
    bodyPivot.add(daggerL, daggerR);
  } else if (charData.style === 'detective') {
    const coat = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.48, 0.34), matBody);
    coat.position.set(0, 0.56, 0.05);
    bodyPivot.add(coat);
    const sigil = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.028, 6, 16), matAccent);
    sigil.position.set(0, 1.1, 0.21);
    bodyPivot.add(sigil);
  } else if (charData.style === 'scout') {
    const bag = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.34, 0.16), matAccent);
    bag.position.set(0.14, 0.96, 0.22);
    bodyPivot.add(bag);
    bodyPivot.scale.set(0.92, 0.92, 0.92);
  } else if (charData.style === 'frost') {
    const hair = new THREE.Mesh(new THREE.DodecahedronGeometry(0.26, 0), matAccent);
    hair.position.set(0, 1.66, 0.06);
    bodyPivot.add(hair);
  }

  // Articulated limbs
  const limbGeo = new THREE.BoxGeometry(0.14, 0.58, 0.14);
  const armL = new THREE.Mesh(limbGeo, matBody);
  armL.position.set(-torsoWidth / 2 - 0.1, 1.04, 0);
  const armR = new THREE.Mesh(limbGeo, matBody);
  armR.position.set(torsoWidth / 2 + 0.1, 1.04, 0);

  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.68, 0.16), matBody);
  legL.position.set(-0.14, 0.36, 0);
  const legR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.68, 0.16), matBody);
  legR.position.set(0.14, 0.36, 0);

  const bootGlowL = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.11, 0.24), matAccent);
  bootGlowL.position.set(0, -0.3, -0.02);
  legL.add(bootGlowL);
  const bootGlowR = bootGlowL.clone();
  legR.add(bootGlowR);

  bodyPivot.add(armL, armR, legL, legR);

  // Soft neon ground ring shadow under runner (improves jump height perception!)
  const footRing = new THREE.Mesh(
    new THREE.RingGeometry(0.3, 0.44, 20),
    new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.65, side: THREE.DoubleSide })
  );
  footRing.rotation.x = -Math.PI / 2;
  footRing.position.y = 0.04;
  root.add(footRing);

  // Shield & resonance orbs
  const shieldMesh = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.18, 1),
    new THREE.MeshBasicMaterial({ color: PALETTE.shardCyan, wireframe: true, transparent: true, opacity: 0.72 })
  );
  shieldMesh.position.y = 0.95;
  shieldMesh.visible = false;
  root.add(shieldMesh);

  const orbGroup = new THREE.Group();
  orbGroup.position.y = 1.0;
  for (let i = 0; i < 3; i++) {
    const orb = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.16, 0),
      new THREE.MeshBasicMaterial({ color: 0xc77dff })
    );
    const a = (i / 3) * Math.PI * 2;
    orb.position.set(Math.cos(a) * 0.92, 0, Math.sin(a) * 0.92);
    orbGroup.add(orb);
  }
  orbGroup.visible = false;
  root.add(orbGroup);

  root.userData = { bodyPivot, armL, armR, legL, legR, torso, scarf, footRing, shieldMesh, orbGroup, matBody, matAccent };
  return root;
}

// === SHARED CANON CREATURE BUILDER ("Miller: The God of Void" — 7 Beast Tiers) ===
// Builds multi-jointed animated 3D creatures facing `dirZ` (+1 = charging toward player, -1 = pursuing behind player!)
function buildCanonCreatureParts(THREE, opts) {
  const { creatureType, color, secondaryColor, eyeColor, scale = 1.0, dirZ = 1 } = opts;
  const body = new THREE.Group();
  body.scale.setScalar(scale);

  const mainMat = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.24,
    roughness: 0.38,
    metalness: 0.3,
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: secondaryColor || 0x161224,
    roughness: 0.55,
    metalness: 0.35,
  });
  const glowMat = new THREE.MeshBasicMaterial({ color: eyeColor });
  const parts = { creatureType, dirZ, legs: [], wings: [], tentacles: [], segments: [], rings: [], mirages: [] };

  if (creatureType === 'quadruped') {
    // WORLD 1 — ADVANCED TIER: Thornhound / Thornmaw (4-legged snarling predator with snapping jaw & spiked tail!)
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.54, 1.25), mainMat);
    torso.position.set(0, 0.78, 0);
    body.add(torso);
    parts.torso = torso;

    // Dorsal emerald thorn spines along back
    for (let i = 0; i < 4; i++) {
      const spine = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.36, 4), glowMat);
      spine.position.set(0, 1.16, (i - 1.5) * 0.28 * dirZ);
      spine.rotation.x = -0.35 * dirZ;
      body.add(spine);
    }

    // Snarling horned head + articulated snapping lower jaw!
    const headPivot = new THREE.Group();
    headPivot.position.set(0, 0.96, 0.62 * dirZ);
    const skull = new THREE.Mesh(new THREE.DodecahedronGeometry(0.32, 0), mainMat);
    skull.scale.set(0.95, 0.85, 1.2);
    headPivot.add(skull);

    const jawPivot = new THREE.Group();
    jawPivot.position.set(0, -0.14, 0.1 * dirZ);
    const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.14, 0.42), darkMat);
    jaw.position.set(0, 0, 0.14 * dirZ);
    jawPivot.add(jaw);
    for (const s of [-1, 1]) {
      const fang = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.16, 4), glowMat);
      fang.position.set(s * 0.11, 0.09, 0.28 * dirZ);
      jawPivot.add(fang);
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.065, 6, 6), glowMat);
      eye.position.set(s * 0.14, 0.08, 0.26 * dirZ);
      headPivot.add(eye);
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.42, 4), darkMat);
      horn.position.set(s * 0.2, 0.28, -0.05 * dirZ);
      horn.rotation.set(-0.4 * dirZ, 0, -s * 0.35);
      headPivot.add(horn);
    }
    headPivot.add(jawPivot);
    body.add(headPivot);
    parts.headPivot = headPivot;
    parts.jawPivot = jawPivot;

    // 4 Articulated galloping predator legs!
    const legCoords = [
      [-0.34, 0.62, 0.42 * dirZ],
      [0.34, 0.62, 0.42 * dirZ],
      [-0.34, 0.62, -0.45 * dirZ],
      [0.34, 0.62, -0.45 * dirZ],
    ];
    for (const [lx, ly, lz] of legCoords) {
      const lp = new THREE.Group();
      lp.position.set(lx, ly, lz);
      const limb = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.58, 0.18), darkMat);
      limb.position.y = -0.28;
      const claw = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 4), glowMat);
      claw.position.set(0, -0.56, 0.08 * dirZ);
      claw.rotation.x = Math.PI / 2 * dirZ;
      lp.add(limb, claw);
      body.add(lp);
      parts.legs.push(lp);
    }

    // Lashing spiked tail
    const tailPivot = new THREE.Group();
    tailPivot.position.set(0, 0.85, -0.62 * dirZ);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.85, 5), mainMat);
    tail.rotation.x = -1.25 * dirZ;
    tail.position.set(0, 0.12, -0.36 * dirZ);
    tailPivot.add(tail);
    body.add(tailPivot);
    parts.tailPivot = tailPivot;
  } else if (creatureType === 'morph_brute' || creatureType === 'shapeshifter') {
    // WORLD 2 — KING TIER: Skeld Morph-Draker (Shapeshifting volcanic beast with huge slashing claws & molten core!)
    const torso = new THREE.Group();
    torso.position.set(0, 1.02, 0);
    const chest = new THREE.Mesh(new THREE.OctahedronGeometry(0.56, 0), mainMat);
    chest.scale.set(1.18, 1.15, 0.92);
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), glowMat);
    core.position.z = 0.28 * dirZ;
    torso.add(chest, core);
    body.add(torso);
    parts.torso = torso;

    const headPivot = new THREE.Group();
    headPivot.position.set(0, 1.62, 0.18 * dirZ);
    const head = new THREE.Mesh(new THREE.DodecahedronGeometry(0.32, 0), darkMat);
    headPivot.add(head);
    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.08), glowMat);
      eye.position.set(s * 0.13, 0.04, 0.26 * dirZ);
      const crest = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.45, 4), glowMat);
      crest.position.set(s * 0.24, 0.22, -0.04 * dirZ);
      crest.rotation.z = -s * 0.55;
      headPivot.add(eye, crest);
    }
    body.add(headPivot);
    parts.headPivot = headPivot;

    // Massive asymmetric volcanic slashing arms + heavy legs
    for (const s of [-1, 1]) {
      const armP = new THREE.Group();
      armP.position.set(s * 0.62, 1.18, 0.06 * dirZ);
      const upper = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.64, 0.24), mainMat);
      upper.position.y = -0.26;
      const blade = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.62, 4), glowMat);
      blade.position.set(0, -0.68, 0.16 * dirZ);
      blade.rotation.x = 0.8 * dirZ;
      armP.add(upper, blade);
      body.add(armP);
      parts.wings.push(armP); // Animated as heavy slashing claws

      const legP = new THREE.Group();
      legP.position.set(s * 0.26, 0.58, 0);
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.58, 0.24), darkMat);
      leg.position.y = -0.28;
      legP.add(leg);
      body.add(legP);
      parts.legs.push(legP);
    }
  } else if (creatureType === 'arachnid') {
    // WORLD 3 — EMPEROR TIER: Dreadwhisper Chimera (6 blade-tipped scuttling legs + concentric cyan psychic eyes + mirages!)
    const torso = new THREE.Mesh(new THREE.OctahedronGeometry(0.5, 0), darkMat);
    torso.scale.set(1.0, 0.72, 1.45);
    torso.position.set(0, 0.92, 0);
    body.add(torso);
    parts.torso = torso;

    // Elongated eyeless alien skull with concentric glowing cyan ocular sensor ring!
    const headPivot = new THREE.Group();
    headPivot.position.set(0, 1.05, 0.68 * dirZ);
    const skull = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.68, 6), mainMat);
    skull.rotation.x = Math.PI / 2 * dirZ;
    headPivot.add(skull);
    const eyeRing = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.04, 6, 16), glowMat);
    eyeRing.position.set(0, 0.04, 0.24 * dirZ);
    const centerEye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), glowMat);
    centerEye.position.set(0, 0.04, 0.26 * dirZ);
    headPivot.add(eyeRing, centerEye);
    body.add(headPivot);
    parts.headPivot = headPivot;
    parts.rings.push(eyeRing);

    // 6 Articulated blade-tipped scuttling arachnid legs!
    for (const s of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        const legP = new THREE.Group();
        legP.position.set(s * 0.42, 0.88, (i - 1) * 0.34);
        const femur = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.1, 0.1), mainMat);
        femur.position.set(s * 0.22, 0.14, 0);
        femur.rotation.z = s * 0.45;
        const blade = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.82, 4), glowMat);
        blade.position.set(s * 0.44, -0.26, 0);
        blade.rotation.z = -s * 0.18 + Math.PI;
        legP.add(femur, blade);
        body.add(legP);
        parts.legs.push(legP);
      }
    }

    // Translucent psychic mirage silhouettes flanking left & right!
    const mirageMat = new THREE.MeshBasicMaterial({ color: eyeColor, transparent: true, opacity: 0.28, wireframe: true });
    for (const s of [-1, 1]) {
      const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.36, 0), mirageMat);
      m.position.set(s * 0.82, 1.05, -0.2 * dirZ);
      body.add(m);
      parts.mirages.push(m);
    }
  } else if (creatureType === 'drake') {
    // WORLD 4 — LEGENDARY TIER: Pyreclad Flame-Drake (Flapping fiery dragon wings, snapping horned jaw & barbed flame tail!)
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.42, 1.05, 7), mainMat);
    torso.rotation.x = 0.85 * dirZ;
    torso.position.set(0, 1.15, 0);
    body.add(torso);
    parts.torso = torso;

    const headPivot = new THREE.Group();
    headPivot.position.set(0, 1.48, 0.56 * dirZ);
    const snout = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.56, 5), mainMat);
    snout.rotation.x = Math.PI / 2 * dirZ;
    headPivot.add(snout);
    const jawPivot = new THREE.Group();
    jawPivot.position.set(0, -0.1, 0.08 * dirZ);
    const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.09, 0.36), darkMat);
    jaw.position.z = 0.14 * dirZ;
    jawPivot.add(jaw);
    headPivot.add(jawPivot);
    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), glowMat);
      eye.position.set(s * 0.12, 0.08, 0.14 * dirZ);
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.45, 4), glowMat);
      horn.position.set(s * 0.16, 0.22, -0.1 * dirZ);
      horn.rotation.set(-0.65 * dirZ, 0, -s * 0.3);
      headPivot.add(eye, horn);
    }
    body.add(headPivot);
    parts.headPivot = headPivot;
    parts.jawPivot = jawPivot;

    // Sweeping articulated dragon wings (flapping rhythmically!)
    const wingMembraneMat = new THREE.MeshBasicMaterial({ color: eyeColor, transparent: true, opacity: 0.72, side: THREE.DoubleSide });
    for (const s of [-1, 1]) {
      const wPivot = new THREE.Group();
      wPivot.position.set(s * 0.34, 1.28, -0.05 * dirZ);
      const spar = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.09, 0.1), darkMat);
      spar.position.set(s * 0.46, 0.12, 0);
      const membrane = new THREE.Mesh(new THREE.PlaneGeometry(0.96, 0.64), wingMembraneMat);
      membrane.position.set(s * 0.48, -0.1, -0.12 * dirZ);
      membrane.rotation.x = 0.25 * dirZ;
      wPivot.add(spar, membrane);
      body.add(wPivot);
      parts.wings.push(wPivot);
    }

    const tailPivot = new THREE.Group();
    tailPivot.position.set(0, 0.92, -0.52 * dirZ);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.95, 5), glowMat);
    tail.rotation.x = -1.35 * dirZ;
    tail.position.set(0, 0.05, -0.42 * dirZ);
    tailPivot.add(tail);
    body.add(tailPivot);
    parts.tailPivot = tailPivot;
  } else if (creatureType === 'wyrm') {
    // WORLD 5 — DEMIGOD TIER: Chronal Wyrm (6-segment coiling glacial serpent + snapping mandibles + orbiting temporal rings!)
    for (let i = 0; i < 6; i++) {
      const seg = new THREE.Group();
      const rad = 0.42 - i * 0.045;
      const mesh = new THREE.Mesh(new THREE.OctahedronGeometry(rad, 0), i % 2 === 0 ? mainMat : darkMat);
      seg.add(mesh);
      seg.position.set(0, 1.18, (0.65 - i * 0.48) * dirZ);
      body.add(seg);
      parts.segments.push(seg);

      if (i === 0) {
        // Serpentine head with blinding dimensional eye & crystalline mandibles
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), glowMat);
        eye.position.set(0, 0.04, 0.34 * dirZ);
        seg.add(eye);
        for (const s of [-1, 1]) {
          const mand = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.34, 4), glowMat);
          mand.position.set(s * 0.22, -0.1, 0.28 * dirZ);
          mand.rotation.set(1.1 * dirZ, 0, s * 0.35);
          seg.add(mand);
        }
      } else if (i <= 3) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(rad * 1.48, 0.04, 6, 18), glowMat);
        seg.add(ring);
        parts.rings.push(ring);
      }
    }
  } else if (creatureType === 'tendril_fiend' || creatureType === 'demon') {
    // WORLD 6 — DEMON TIER: Voidstalker Fiend (Hovering horned void demon with 4 writhing multi-joint shadow tentacles!)
    const torso = new THREE.Mesh(new THREE.DodecahedronGeometry(0.46, 0), darkMat);
    torso.scale.set(1.0, 1.32, 0.88);
    torso.position.set(0, 1.24, 0);
    body.add(torso);
    parts.torso = torso;

    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 0), glowMat);
    core.position.set(0, 1.18, 0.32 * dirZ);
    body.add(core);

    const headPivot = new THREE.Group();
    headPivot.position.set(0, 1.82, 0.1 * dirZ);
    const skull = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), mainMat);
    headPivot.add(skull);
    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.065, 6, 6), glowMat);
      eye.position.set(s * 0.11, 0.04, 0.22 * dirZ);
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.52, 4), glowMat);
      horn.position.set(s * 0.22, 0.28, -0.02 * dirZ);
      horn.rotation.z = -s * 0.42;
      headPivot.add(eye, horn);
    }
    body.add(headPivot);
    parts.headPivot = headPivot;

    // 4 Writhing shadow tentacles!
    for (let i = 0; i < 4; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const rowY = i < 2 ? 1.38 : 0.92;
      const tPivot = new THREE.Group();
      tPivot.position.set(side * 0.38, rowY, 0);
      const seg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.56, 6), mainMat);
      seg1.rotation.z = side * 1.15;
      seg1.position.set(side * 0.26, -0.06, 0.06 * dirZ);
      const seg2 = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.58, 5), glowMat);
      seg2.rotation.z = side * 1.65;
      seg2.position.set(side * 0.68, -0.14, 0.18 * dirZ);
      tPivot.add(seg1, seg2);
      body.add(tPivot);
      parts.tentacles.push(tPivot);
    }
  } else {
    // WORLD 7 — YIGYANG / ABYSSAL TIER: Abyssal Seraph-Stalker / Null Sovereign (Bifurcated white-obsidian core + 6 fanning blade-wings!)
    const torso = new THREE.Group();
    torso.position.set(0, 1.35, 0);
    const lightHalf = new THREE.Mesh(new THREE.OctahedronGeometry(0.48, 0), mainMat);
    lightHalf.position.x = -0.06;
    const darkHalf = new THREE.Mesh(new THREE.OctahedronGeometry(0.46, 0), darkMat);
    darkHalf.position.x = 0.06;
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 10), glowMat);
    eye.position.z = 0.38 * dirZ;
    torso.add(lightHalf, darkHalf, eye);
    body.add(torso);
    parts.torso = torso;

    // Dual counter-rotating celestial-void halos
    const r1 = new THREE.Mesh(new THREE.TorusGeometry(0.76, 0.045, 6, 22), glowMat);
    r1.position.set(0, 1.35, 0);
    const r2 = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.032, 6, 22), new THREE.MeshBasicMaterial({ color: 0xb466ff }));
    r2.position.set(0, 1.35, 0);
    body.add(r1, r2);
    parts.rings.push(r1, r2);

    // 6 Articulated geometric blade-wings fanning symmetrically!
    for (const s of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        const wP = new THREE.Group();
        wP.position.set(s * 0.42, 1.52 - i * 0.24, -0.08 * dirZ);
        const blade = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.95 - i * 0.12, 4), i === 1 ? glowMat : mainMat);
        blade.rotation.z = -s * (1.1 + i * 0.25);
        blade.position.set(s * 0.46, 0.05, 0);
        wP.add(blade);
        body.add(wP);
        parts.wings.push(wP);
      }
    }
  }

  return { body, parts };
}

export function createChaserMesh(THREE, chaserId) {
  const data = CHASERS[chaserId] || CHASERS.thornmaw;
  const group = new THREE.Group();
  const typeMap = {
    quadruped: 'quadruped',
    shapeshifter: 'morph_brute',
    arachnid: 'arachnid',
    drake: 'drake',
    wyrm: 'wyrm',
    demon: 'tendril_fiend',
    sovereign: 'seraph',
  };
  const built = buildCanonCreatureParts(THREE, {
    creatureType: typeMap[data.shape] || 'quadruped',
    color: data.color,
    secondaryColor: 0x140d1e,
    eyeColor: data.eyeColor,
    scale: 1.78,
    dirZ: -1, // Pursuing forward toward -Z!
  });
  group.add(createContactShadow(THREE, 1.45, 0.68));
  group.add(built.body);
  group.userData = { creature: built.parts, body: built.body, data };
  return group;
}

export function createBossMesh(THREE, bossId) {
  const data = BOSSES[bossId] || BOSSES.alton_dam;
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({
    color: data.color,
    emissive: data.accent,
    emissiveIntensity: 0.42,
    roughness: 0.3,
    metalness: 0.48,
  });
  const glowMat = new THREE.MeshBasicMaterial({ color: data.accent });

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.78, 2.25, 8), bodyMat);
  body.position.y = 1.4;
  g.add(body);

  const head = new THREE.Mesh(new THREE.OctahedronGeometry(0.58, 0), bodyMat);
  head.position.y = 2.88;
  g.add(head);

  const crown = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.09, 6, 20), glowMat);
  crown.rotation.x = Math.PI / 2;
  crown.position.y = 3.15;
  g.add(crown);

  const aura = new THREE.Mesh(
    new THREE.RingGeometry(1.15, 1.55, 24),
    new THREE.MeshBasicMaterial({ color: data.accent, side: THREE.DoubleSide, transparent: true, opacity: 0.8 })
  );
  aura.rotation.x = -Math.PI / 2;
  aura.position.y = 0.12;
  g.add(aura);

  g.userData = { crown, aura, data };
  return g;
}

export function createPortalGateMesh(THREE, accentColor, scale = 1) {
  const g = new THREE.Group();
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0x161224,
    emissive: accentColor,
    emissiveIntensity: 1.0,
    roughness: 0.25,
  });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.6 * scale, 0.26 * scale, 10, 32), ringMat);
  ring.position.y = 2.6 * scale;
  g.add(ring);

  const innerRing = new THREE.Mesh(
    new THREE.TorusGeometry(2.05 * scale, 0.08 * scale, 6, 28),
    new THREE.MeshBasicMaterial({ color: 0xe8d5ff })
  );
  innerRing.position.y = 2.6 * scale;
  g.add(innerRing);

  const vortex = new THREE.Mesh(
    new THREE.CircleGeometry(2.35 * scale, 28),
    new THREE.MeshBasicMaterial({ color: accentColor, transparent: true, opacity: 0.38, side: THREE.DoubleSide })
  );
  vortex.position.y = 2.6 * scale;
  g.add(vortex);

  g.userData = { ring, innerRing, vortex };
  return g;
}

// Golden Bonus Rift Ring — secret high-thrill arcade bonus gate!
export function createBonusRingMesh(THREE) {
  const g = new THREE.Group();
  const outer = new THREE.Mesh(
    new THREE.TorusGeometry(0.68, 0.1, 8, 22),
    new THREE.MeshBasicMaterial({ color: PALETTE.goldGlow })
  );
  const inner = new THREE.Mesh(
    new THREE.TorusGeometry(0.5, 0.04, 6, 18),
    new THREE.MeshBasicMaterial({ color: PALETTE.shardCyan })
  );
  g.add(outer, inner);
  g.position.y = 1.25;
  g.userData = { outer, inner };
  return g;
}

export function createObstacleMesh(THREE, type, world, isIllusion = false) {
  const g = new THREE.Group();
  const opacity = isIllusion ? 0.52 : 1.0;
  if (type !== 'hazard_floor' && type !== 'sonic_low' && type !== 'sonic_high') {
    g.add(createContactShadow(THREE, 0.72, isIllusion ? 0.22 : 0.54));
  }

  if (type === 'ground') {
    // High-contrast glowing warm hurdle (instant "JUMP!" readability)
    const mat = new THREE.MeshStandardMaterial({
      color: 0x4f242c,
      emissive: isIllusion ? 0x00e5ff : 0xff6633,
      emissiveIntensity: isIllusion ? 0.7 : 0.35,
      roughness: 0.45,
      transparent: isIllusion,
      opacity,
    });
    const block = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.88, 0.88), mat);
    block.position.y = 0.44;
    g.add(block);
    const cap = new THREE.Mesh(
      new THREE.BoxGeometry(1.04, 0.16, 0.94),
      new THREE.MeshBasicMaterial({ color: isIllusion ? 0x00e5ff : 0xffb020, transparent: isIllusion, opacity })
    );
    cap.position.y = 0.92;
    g.add(cap);
  } else if (type === 'overhead') {
    // Luminous cyan energy gate (instant "SLIDE!" readability)
    const mat = new THREE.MeshStandardMaterial({
      color: 0x1d4b82,
      emissive: 0x00e5ff,
      emissiveIntensity: 0.65,
      transparent: true,
      opacity: isIllusion ? 0.42 : 0.88,
    });
    const beam = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.5, 0.68), mat);
    beam.position.y = 1.48;
    g.add(beam);
    const neonEdge = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.08, 0.74),
      new THREE.MeshBasicMaterial({ color: 0x5cf2ff })
    );
    neonEdge.position.y = 1.22;
    g.add(neonEdge);
    const postGeo = new THREE.BoxGeometry(0.1, 1.75, 0.1);
    const pL = new THREE.Mesh(postGeo, mat);
    pL.position.set(-0.52, 0.87, 0);
    const pR = pL.clone();
    pR.position.x = 0.52;
    g.add(pL, pR);
  } else if (type === 'tall') {
    // Towering crystal monolith (instant "SWITCH LANES!" readability)
    const mat = new THREE.MeshStandardMaterial({
      color: 0x351442,
      emissive: world.accent,
      emissiveIntensity: 0.48,
      transparent: isIllusion,
      opacity,
    });
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.96, 2.55, 0.92), mat);
    pillar.position.y = 1.28;
    g.add(pillar);
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(1.04, 0.2, 0.98),
      new THREE.MeshBasicMaterial({ color: 0xff2244, transparent: isIllusion, opacity })
    );
    stripe.position.y = 1.45;
    g.add(stripe);
  } else if (type === 'moving') {
    const mat = new THREE.MeshStandardMaterial({
      color: 0xa0144c,
      emissive: 0xff44c8,
      emissiveIntensity: 0.95,
      transparent: isIllusion,
      opacity,
    });
    const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.56, 0), mat);
    orb.position.y = 0.88;
    g.add(orb);
    // Warning halo on ground
    const warn = new THREE.Mesh(
      new THREE.RingGeometry(0.45, 0.65, 16),
      new THREE.MeshBasicMaterial({ color: 0xff44c8, side: THREE.DoubleSide, transparent: true, opacity: 0.7 })
    );
    warn.rotation.x = -Math.PI / 2;
    warn.position.y = 0.05;
    g.add(warn);
  } else if (type === 'hazard_floor') {
    const col = world.id === 5 ? 0x5cf2ff : world.id === 6 ? 0xff44c8 : 0xff5511;
    const pad = new THREE.Mesh(
      new THREE.BoxGeometry(1.08, 0.09, 3.8),
      new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.78 })
    );
    pad.position.y = 0.05;
    g.add(pad);
    // Telegraph rim
    const rim = new THREE.Mesh(
      new THREE.BoxGeometry(1.14, 0.04, 4.0),
      new THREE.MeshBasicMaterial({ color: 0xffd84d, transparent: true, opacity: 0.6 })
    );
    rim.position.y = 0.03;
    g.add(rim);
  } else if (type === 'sonic_low' || type === 'sonic_high') {
    const wave = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 0.45, 0.42),
      new THREE.MeshBasicMaterial({ color: type === 'sonic_low' ? 0xffaa22 : 0x00e5ff, transparent: true, opacity: 0.9 })
    );
    wave.position.y = type === 'sonic_low' ? 0.44 : 1.5;
    g.add(wave);
  } else if (type === 'launch_ramp') {
    // Glowing Acrobatic Launch Ramp (Flips-and-Tricks / Paraglider takeoff pad!)
    const rampMat = new THREE.MeshStandardMaterial({
      color: 0x16384c,
      emissive: 0x00e5ff,
      emissiveIntensity: 0.72,
      roughness: 0.28,
    });
    const wedge = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.24, 1.85), rampMat);
    wedge.position.set(0, 0.34, 0);
    wedge.rotation.x = 0.32;
    const chev = new THREE.Mesh(
      new THREE.BoxGeometry(0.92, 0.06, 1.6),
      new THREE.MeshBasicMaterial({ color: 0xffd84d })
    );
    chev.position.set(0, 0.46, 0);
    chev.rotation.x = 0.32;
    g.add(wedge, chev);
  } else if (type === 'wall_panel') {
    // Flanking Vertical Wall-Run Energy Panel (Dynamic-Wall-Run-Blueprints.mp4)
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x122642,
      emissive: world.accent || 0x00e5ff,
      emissiveIntensity: 0.58,
      roughness: 0.3,
      transparent: true,
      opacity: 0.9,
    });
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.45, 6.2), wallMat);
    panel.position.y = 1.28;
    const railTop = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.1, 6.3),
      new THREE.MeshBasicMaterial({ color: 0x4cf3ff })
    );
    railTop.position.y = 2.48;
    const railMid = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.08, 6.2),
      new THREE.MeshBasicMaterial({ color: 0xffd84d })
    );
    railMid.position.y = 1.25;
    g.add(panel, railTop, railMid);
  } else if (type === 'climb_wall') {
    // Stepped Vertical Ascent Wall with Glowing Climb Rungs (Climbing-Animation-Set.mp4)
    const cliffMat = new THREE.MeshStandardMaterial({
      color: 0x241d38,
      emissive: 0x6b2fa0,
      emissiveIntensity: 0.42,
      roughness: 0.5,
    });
    const wall = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.45, 0.95), cliffMat);
    wall.position.y = 1.22;
    g.add(wall);
    const rungMat = new THREE.MeshBasicMaterial({ color: 0x3dff7a });
    for (let r = 0; r < 4; r++) {
      const rung = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.09, 0.12), rungMat);
      rung.position.set(0, 0.52 + r * 0.52, 0.5);
      g.add(rung);
    }
  } else if (type === 'updraft_column') {
    // Swirling Cyan Updraft Wind Column (Paraglider-Blueprints.mp4)
    const windMat = new THREE.MeshBasicMaterial({
      color: 0x4cf3ff,
      transparent: true,
      opacity: 0.38,
      side: THREE.DoubleSide,
    });
    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.52, 3.4, 14, 1, true), windMat);
    cyl.position.y = 1.7;
    const baseRing = new THREE.Mesh(
      new THREE.RingGeometry(0.42, 0.62, 18),
      new THREE.MeshBasicMaterial({ color: 0x88ffff, side: THREE.DoubleSide })
    );
    baseRing.rotation.x = -Math.PI / 2;
    baseRing.position.y = 0.06;
    g.add(cyl, baseRing);
  }

  return g;
}

export function createCollectibleMesh(THREE, kind) {
  if (kind === 'shard') {
    const g = new THREE.Group();
    const core = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.26, 0),
      new THREE.MeshBasicMaterial({ color: PALETTE.shardCyan })
    );
    const halo = new THREE.Mesh(
      new THREE.RingGeometry(0.28, 0.36, 12),
      new THREE.MeshBasicMaterial({ color: 0xe8d5ff, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
    );
    g.add(core, halo);
    g.position.y = 0.8;
    return g;
  }
  if (kind === 'bonus_ring') {
    return createBonusRingMesh(THREE);
  }
  if (kind === 'essence') {
    const g = new THREE.Group();
    const core = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.34, 0),
      new THREE.MeshBasicMaterial({ color: PALETTE.essencePurple })
    );
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.48, 0.055, 6, 16),
      new THREE.MeshBasicMaterial({ color: 0xffd84d })
    );
    g.add(core, ring);
    g.position.y = 0.95;
    return g;
  }
  if (kind === 'core') {
    const g = new THREE.Group();
    const m = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.4, 0),
      new THREE.MeshBasicMaterial({ color: PALETTE.coreAmber })
    );
    const r = new THREE.Mesh(
      new THREE.TorusGeometry(0.55, 0.05, 6, 16),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    g.add(m, r);
    g.position.y = 0.98;
    return g;
  }
  if (kind === 'fragment') {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(0.44, 0.58, 0.08),
      new THREE.MeshBasicMaterial({ color: 0xfff0aa })
    );
    m.position.y = 1.02;
    return m;
  }
  // Power-ups: magnet, barrier, double, surge
  const colorMap = { magnet: 0x00e5ff, barrier: 0xb44fff, double: 0xffd84d, surge: 0xffffff };
  const g = new THREE.Group();
  const sphere = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.44, 1),
    new THREE.MeshBasicMaterial({ color: colorMap[kind] || 0xb44fff })
  );
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.38, 3.6, 8, 1, true),
    new THREE.MeshBasicMaterial({ color: colorMap[kind] || 0xb44fff, transparent: true, opacity: 0.32, side: THREE.DoubleSide })
  );
  beam.position.y = 1.65;
  g.add(sphere, beam);
  g.position.y = 0.92;
  return g;
}

// === PORTAL-BASED CHARGING CANON CREATURE (Emerges from Mini-Rift & Charges Player) ===
export function createPortalEnemyMesh(THREE, worldId = 1) {
  const spec = PORTAL_ENEMIES[worldId] || PORTAL_ENEMIES[1];
  const g = new THREE.Group();

  const built = buildCanonCreatureParts(THREE, {
    creatureType: spec.creatureType || 'quadruped',
    color: spec.color,
    secondaryColor: spec.secondaryColor,
    eyeColor: spec.eyeColor,
    scale: 0.96,
    dirZ: 1, // Charging directly toward the player (+Z)!
  });
  g.add(built.body);

  // Pulsing ground threat ring + grounded contact shadow beneath creature
  g.add(createContactShadow(THREE, 0.78, 0.62));
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.52, 0.68, 18),
    new THREE.MeshBasicMaterial({ color: spec.eyeColor, side: THREE.DoubleSide, transparent: true, opacity: 0.8 })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.05;
  g.add(ring);

  // Mini-rift portal ring that opens behind creature as it leaps out!
  const riftRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.05, 0.09, 6, 20),
    new THREE.MeshBasicMaterial({ color: spec.eyeColor, transparent: true, opacity: 0.88 })
  );
  riftRing.position.set(0, 1.08, -0.65);
  g.add(riftRing);

  g.userData = { creature: built.parts, body: built.body, ring, riftRing, spec };
  return g;
}

// === GEAR WEAPON CRESCENT SLASH / ENERGY WAVE VFX ===
export function createStrikeWaveMesh(THREE, colorHex, lanes = 1) {
  const width = lanes >= 3 ? 3.5 : lanes === 2 ? 2.35 : 1.15;
  const g = new THREE.Group();
  const arc = new THREE.Mesh(
    new THREE.TorusGeometry(width * 0.52, 0.11, 6, 18, Math.PI),
    new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.92 })
  );
  arc.rotation.x = Math.PI / 2;
  arc.position.y = 0.95;
  const core = new THREE.Mesh(
    new THREE.BoxGeometry(width, 0.22, 0.45),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75 })
  );
  core.position.y = 0.95;
  g.add(arc, core);
  return g;
}
