// MILLER: VOID RUN — Vibrant Arcade 3D Procedural Mesh, Texture & Glow Factory
// Generates procedural neon-lit CanvasTextures per world, atmospheric gradient sky domes,
// glowing Golden Bonus Rift Rings, readable obstacles with warning chevrons, and fluid runner rigs.

import { CHARACTERS, CHASERS, BOSSES, SKINS, PALETTE, PORTAL_ENEMIES } from '../config/gameData.js';

const trackTextureCache = new Map();
const skyTextureCache = new Map();

function hexToCss(hexNum) {
  return '#' + hexNum.toString(16).padStart(6, '0');
}

export function getWorldTrackTexture(THREE, world) {
  if (trackTextureCache.has(world.id)) return trackTextureCache.get(world.id);
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');

  // Rich base gradient
  const grad = ctx.createLinearGradient(0, 0, 512, 0);
  const base = hexToCss(world.groundColor);
  const acc = world.accentHex || '#B44FFF';
  grad.addColorStop(0, '#090712');
  grad.addColorStop(0.12, base);
  grad.addColorStop(0.5, base);
  grad.addColorStop(0.88, base);
  grad.addColorStop(1, '#090712');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Subtle geometric sci-fi/rune tile grid
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 2;
  for (let y = 0; y < 512; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  // Luminous forward speed chevrons in each of the 3 lanes
  ctx.strokeStyle = acc;
  ctx.globalAlpha = 0.24;
  ctx.lineWidth = 5;
  const laneCenters = [88, 256, 424];
  for (const cx of laneCenters) {
    for (let y = 48; y < 512; y += 128) {
      ctx.beginPath();
      ctx.moveTo(cx - 28, y + 20);
      ctx.lineTo(cx, y - 10);
      ctx.lineTo(cx + 28, y + 20);
      ctx.stroke();
    }
  }

  // Glowing neon lane divider seams & bright outer trim
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = acc;
  ctx.fillRect(4, 0, 12, 512);
  ctx.fillRect(496, 0, 12, 512);

  ctx.globalAlpha = 0.55;
  ctx.fillStyle = hexToCss(world.secondaryAccent || PALETTE.voidGlow);
  ctx.fillRect(168, 0, 5, 512);
  ctx.fillRect(339, 0, 5, 512);

  // World-themed surface accents (moss glow / lava veins / frost shards / void runes)
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = acc;
  for (let i = 0; i < 18; i++) {
    const x = 30 + ((i * 97) % 450);
    const y = (i * 73) % 500;
    ctx.beginPath();
    ctx.arc(x, y, 4 + (i % 5) * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 3);
  trackTextureCache.set(world.id, tex);
  return tex;
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

export function createChaserMesh(THREE, chaserId) {
  const data = CHASERS[chaserId] || CHASERS.thornmaw;
  const group = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({
    color: data.color,
    roughness: 0.4,
    metalness: 0.32,
    emissive: data.color,
    emissiveIntensity: 0.25,
  });
  const eyeMat = new THREE.MeshBasicMaterial({ color: data.eyeColor });

  if (data.shape === 'wyrm') {
    for (let i = 0; i < 5; i++) {
      const seg = new THREE.Mesh(new THREE.OctahedronGeometry(0.95 - i * 0.1, 0), bodyMat);
      seg.position.set(0, 1.5 + Math.sin(i) * 0.35, i * 1.15);
      group.add(seg);
      if (i < 3) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(1.28 - i * 0.1, 0.07, 6, 18), eyeMat);
        ring.position.copy(seg.position);
        group.add(ring);
      }
    }
  } else if (data.shape === 'sovereign') {
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(1.3, 0), bodyMat);
    core.position.y = 1.9;
    group.add(core);
    const halo = new THREE.Mesh(new THREE.TorusGeometry(1.75, 0.09, 6, 24), eyeMat);
    halo.position.y = 2.0;
    group.add(halo);
  } else {
    const hull = new THREE.Mesh(new THREE.BoxGeometry(2.15, 1.55, 2.5), bodyMat);
    hull.position.y = 1.2;
    group.add(hull);
    const head = new THREE.Mesh(new THREE.DodecahedronGeometry(0.88, 0), bodyMat);
    head.position.set(0, 1.75, -1.3);
    group.add(head);
    for (let s = -1; s <= 1; s += 2) {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.24, 1.05, 5), eyeMat);
      horn.position.set(s * 0.62, 2.38, -1.1);
      horn.rotation.z = -s * 0.35;
      group.add(horn);
      const claw = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.38, 1.35), bodyMat);
      claw.position.set(s * 1.12, 0.75, -1.35);
      group.add(claw);
    }
  }

  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), eyeMat);
  eyeL.position.set(-0.42, 1.85, -1.95);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.42;
  group.add(eyeL, eyeR);
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

// === PORTAL-BASED CHARGING ENEMY (Emerges from Mini-Rift & Charges Player) ===
export function createPortalEnemyMesh(THREE, worldId = 1) {
  const spec = PORTAL_ENEMIES[worldId] || PORTAL_ENEMIES[1];
  const g = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({
    color: spec.color,
    emissive: spec.eyeColor,
    emissiveIntensity: 0.35,
    roughness: 0.4,
    metalness: 0.3,
  });
  const glowMat = new THREE.MeshBasicMaterial({ color: spec.eyeColor });

  // Aggressive hunched charger torso
  const torso = new THREE.Mesh(new THREE.OctahedronGeometry(0.46, 0), bodyMat);
  torso.scale.set(1.0, 1.25, 0.95);
  torso.position.y = 1.0;
  g.add(torso);

  // Horned head facing player (+Z)
  const head = new THREE.Mesh(new THREE.DodecahedronGeometry(0.3, 0), bodyMat);
  head.position.set(0, 1.54, 0.14);
  g.add(head);

  const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.055, 0.06), glowMat);
  eyeL.position.set(-0.1, 1.56, 0.38);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.1;
  g.add(eyeL, eyeR);

  for (const s of [-1, 1]) {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.36, 4), glowMat);
    horn.position.set(s * 0.22, 1.76, 0.08);
    horn.rotation.z = -s * 0.45;
    g.add(horn);
  }

  // Animated thrashing arms & legs
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.56, 0.16), bodyMat);
  armL.position.set(-0.46, 1.02, 0.18);
  const armR = armL.clone();
  armR.position.x = 0.46;

  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.58, 0.18), bodyMat);
  legL.position.set(-0.18, 0.32, 0);
  const legR = legL.clone();
  legR.position.x = 0.18;
  g.add(armL, armR, legL, legR);

  // Pulsing ground threat ring
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.46, 0.62, 16),
    new THREE.MeshBasicMaterial({ color: spec.eyeColor, side: THREE.DoubleSide, transparent: true, opacity: 0.78 })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.05;
  g.add(ring);

  // Mini-rift portal ring that opens behind enemy when it spawns!
  const riftRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.95, 0.09, 6, 18),
    new THREE.MeshBasicMaterial({ color: spec.eyeColor, transparent: true, opacity: 0.85 })
  );
  riftRing.position.set(0, 1.05, -0.5);
  g.add(riftRing);

  g.userData = { armL, armR, legL, legR, ring, riftRing, spec };
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
