// MILLER: VOID RUN — Arcade-Upgraded Game Design Data
// Preserves all 7 Portal Worlds, 7 Chasers, 7 Bosses, 15 Void Powers, 7 Characters & 5-Act Story
// Adds: 16 Skill Achievements, 6 Unlockable Void Trails, 4 Impact Aura FX, Colour Variants & Kid-Safe Rewards

export const PALETTE = {
  voidBlack: 0x0a0a14,
  deepPurple: 0x2d1b4e,
  voidPurple: 0x6b2fa0,
  voidGlow: 0xb44fff,
  voidWhite: 0xe8d5ff,
  shardCyan: 0x00e5ff,
  essencePurple: 0x9b30ff,
  coreAmber: 0xffb020,
  dangerRed: 0xff2244,
  healGreen: 0x44ff88,
  neonPink: 0xff38a8,
  goldGlow: 0xffd447,
};

export const TRACK_CONFIG = {
  laneWidth: 1.2,
  laneX: [-1.2, 0, 1.2],
  chunkLength: 30,
  activeChunksAhead: 6,
  activeChunksBehind: 2,
  baseSpeed: 12.0,
  bossTriggerDist: 1400,
  bossEndDist: 1800,
  finalBossEndDist: 2000,
  inputBufferMs: 160,
  jumpDuration: 0.6,
  jumpHeight: 1.9,
  slideDuration: 0.52,
  stumbleDuration: 0.45,
};

export const WORLDS = [
  {
    id: 1,
    name: 'Verdant Breach',
    portalType: 'Green Portal',
    tierRange: 'Basic → Advanced',
    accentHex: '#3DFF7A',
    accent: 0x3dff7a,
    secondaryAccent: 0xb44fff,
    groundColor: 0x162b22,
    trimColor: 0x3dff7a,
    skyTop: 0x091c22,
    skyBottom: 0x2c1a54,
    fogColor: 0x102428,
    lightColor: 0xffe099,
    rimColor: 0xb44fff,
    chaserId: 'thornmaw',
    bossId: 'alton_dam',
    uniqueMechanic: 'none',
    mechanicName: 'Fundamentals',
    mechanicDesc: 'Ancient emerald-lit cavern ruins, carved runic stone bridges & floating mossy monoliths.',
    environStyle: 'emerald_ruins',
    environArt: 'assets/art/environ/environ_emerald_ruins.jpg',
    environTint: 0xffffff,
    unlockDesc: 'Available at Start',
    unlockWorldDist: 0,
    unlockCodexLv: 1,
    bpm: 122,
    scale: [293.66, 329.63, 349.23, 440.0, 523.25, 587.33],
    distProfile: { ground: 0.5, overhead: 0.3, moving: 0.0, collapse: 0.2 },
    difficultyStars: 1,
  },
  {
    id: 2,
    name: 'Ember Corridor',
    portalType: 'Green / Orange',
    tierRange: 'Advanced → King',
    accentHex: '#FF7A28',
    accent: 0xff7a28,
    secondaryAccent: 0xffd447,
    groundColor: 0x2a1410,
    trimColor: 0xff7a28,
    skyTop: 0x1e080c,
    skyBottom: 0x5c1d0c,
    fogColor: 0x30110c,
    lightColor: 0xff9944,
    rimColor: 0xff3b00,
    chaserId: 'skeld',
    bossId: 'james_stole',
    uniqueMechanic: 'lava_lanes',
    mechanicName: 'Lava Lanes',
    mechanicDesc: 'Sunset industrial steel catwalks, rusted refinery towers & crackling horizon portals.',
    environStyle: 'industrial_catwalk',
    environArt: 'assets/art/environ/environ_industrial_sunset.jpg',
    environTint: 0xffffff,
    unlockDesc: 'Reach 1,400m in World 1 or Codex Lv 5',
    unlockWorldDist: 1400,
    unlockCodexLv: 5,
    bpm: 130,
    scale: [174.61, 196.0, 207.65, 261.63, 311.13, 349.23],
    distProfile: { ground: 0.4, overhead: 0.3, moving: 0.1, collapse: 0.2 },
    difficultyStars: 2,
  },
  {
    id: 3,
    name: 'Obsidian Rift',
    portalType: 'Orange Portal',
    tierRange: 'Advanced → Emperor',
    accentHex: '#3B7BFF',
    accent: 0x3b7bff,
    secondaryAccent: 0x00e5ff,
    groundColor: 0x10152e,
    trimColor: 0x00e5ff,
    skyTop: 0x06081a,
    skyBottom: 0x1e2860,
    fogColor: 0x0e1434,
    lightColor: 0x99ccff,
    rimColor: 0xe8d5ff,
    chaserId: 'dreadwhisper',
    bossId: 'felix_torrot',
    uniqueMechanic: 'illusions',
    mechanicName: 'Illusion Obstacles',
    mechanicDesc: 'Shattered reality pillars, blue-violet void crystals & crackling lightning rifts — phase mirages for +5 VE!',
    environStyle: 'void_singularity',
    environArt: 'assets/art/environ/environ_void_singularity.jpg',
    environTint: 0xd8e4ff,
    unlockDesc: 'Reach 1,400m in World 2 or Codex Lv 12',
    unlockWorldDist: 1400,
    unlockCodexLv: 12,
    bpm: 118,
    scale: [207.65, 233.08, 246.94, 311.13, 369.99, 415.3],
    distProfile: { ground: 0.35, overhead: 0.25, moving: 0.15, collapse: 0.25 },
    difficultyStars: 3,
  },
  {
    id: 4,
    name: 'Crimson Depths',
    portalType: 'Orange / Red',
    tierRange: 'King → Legendary',
    accentHex: '#FF2E4C',
    accent: 0xff2e4c,
    secondaryAccent: 0xffaa22,
    groundColor: 0x280c14,
    trimColor: 0xff2e4c,
    skyTop: 0x180408,
    skyBottom: 0x520a18,
    fogColor: 0x2a0810,
    lightColor: 0xff5566,
    rimColor: 0xff1144,
    chaserId: 'pyreclad',
    bossId: 'shawn_tami',
    uniqueMechanic: 'fire_trail',
    mechanicName: 'Fire Trail',
    mechanicDesc: 'Fractured obsidian islands over a blazing magma chasm & colossal crimson rift pillar.',
    environStyle: 'crimson_magma',
    environArt: 'assets/art/environ/environ_crimson_magma.jpg',
    environTint: 0xffffff,
    unlockDesc: 'Reach 1,400m in World 3 or Codex Lv 20',
    unlockWorldDist: 1400,
    unlockCodexLv: 20,
    bpm: 138,
    scale: [233.08, 261.63, 277.18, 349.23, 415.3, 466.16],
    distProfile: { ground: 0.3, overhead: 0.25, moving: 0.2, collapse: 0.25 },
    difficultyStars: 3,
  },
  {
    id: 5,
    name: 'Frozen Archive',
    portalType: 'Red Portal',
    tierRange: 'King → Demigod',
    accentHex: '#5CF2FF',
    accent: 0x5cf2ff,
    secondaryAccent: 0xc07dff,
    groundColor: 0x122b3e,
    trimColor: 0x5cf2ff,
    skyTop: 0x081a2c,
    skyBottom: 0x2e1f5a,
    fogColor: 0x132c40,
    lightColor: 0xcbf7ff,
    rimColor: 0xb44fff,
    chaserId: 'chronal_wyrm',
    bossId: 'sil_talen',
    uniqueMechanic: 'ice_physics',
    mechanicName: 'Aurora Ice & Time Zones',
    mechanicDesc: 'Frost-veined ancient ruin vaults extending slides & boosting Time Bleed by 30%.',
    environStyle: 'emerald_ruins',
    environArt: 'assets/art/environ/environ_emerald_ruins.jpg',
    environTint: 0x8cecff,
    unlockDesc: 'Reach 1,400m in World 4 or Codex Lv 30',
    unlockWorldDist: 1400,
    unlockCodexLv: 30,
    bpm: 112,
    scale: [261.63, 293.66, 311.13, 392.0, 466.16, 523.25],
    distProfile: { ground: 0.3, overhead: 0.2, moving: 0.2, collapse: 0.3 },
    difficultyStars: 4,
  },
  {
    id: 6,
    name: 'Abyssal Maw',
    portalType: 'Red / White',
    tierRange: 'Demon → Yigyang',
    accentHex: '#FF44C8',
    accent: 0xff44c8,
    secondaryAccent: 0x00e5ff,
    groundColor: 0x150822,
    trimColor: 0xff44c8,
    skyTop: 0x06020e,
    skyBottom: 0x330848,
    fogColor: 0x160624,
    lightColor: 0xe680ff,
    rimColor: 0xff44c8,
    chaserId: 'voidstalker',
    bossId: 'ashley_moses',
    uniqueMechanic: 'void_infestation',
    mechanicName: 'Void Infestation',
    mechanicDesc: 'Violet-crimson shattered abyss where Void Power casts cleanse and surge forward!',
    environStyle: 'crimson_magma',
    environArt: 'assets/art/environ/environ_crimson_magma.jpg',
    environTint: 0xd888ff,
    unlockDesc: 'Reach 1,400m in World 5 or Codex Lv 45',
    unlockWorldDist: 1400,
    unlockCodexLv: 45,
    bpm: 134,
    scale: [311.13, 349.23, 369.99, 466.16, 554.37, 622.25],
    distProfile: { ground: 0.25, overhead: 0.2, moving: 0.25, collapse: 0.3 },
    difficultyStars: 4,
  },
  {
    id: 7,
    name: 'The Terminus',
    portalType: 'White Portal',
    tierRange: 'Yigyang → Abyssal',
    accentHex: '#FFD84D',
    accent: 0xffd84d,
    secondaryAccent: 0xb44fff,
    groundColor: 0x201c32,
    trimColor: 0xffd84d,
    skyTop: 0x161028,
    skyBottom: 0x453566,
    fogColor: 0x1f1934,
    lightColor: 0xfff6d6,
    rimColor: 0xffd84d,
    chaserId: 'null_sovereign',
    bossId: 'tay_sonder',
    uniqueMechanic: 'reality_shift',
    mechanicName: 'Reality Shift',
    mechanicDesc: 'Blinding Void Singularity eclipse shattering ancient ruins as reality warps every 10s.',
    environStyle: 'void_singularity',
    environArt: 'assets/art/environ/environ_void_singularity.jpg',
    environTint: 0xfff5dc,
    unlockDesc: 'Reach 1,400m in World 6 or Codex Lv 65',
    unlockWorldDist: 1400,
    unlockCodexLv: 65,
    bpm: 144,
    scale: [261.63, 293.66, 329.63, 392.0, 440.0, 523.25],
    distProfile: { ground: 0.25, overhead: 0.2, moving: 0.25, collapse: 0.3 },
    difficultyStars: 5,
  },
];

export const CHASERS = {
  thornmaw: { id: 'thornmaw', name: 'Thornmaw', tier: 'Advanced Tier', color: 0x2f7d42, eyeColor: 0xff4422, baseCloseRate: 0.26, trait: 'Linear brute charge, smashes debris', shape: 'quadruped' },
  skeld: { id: 'skeld', name: 'Skeld', tier: 'King Tier', color: 0xdd4c18, eyeColor: 0xffcc22, baseCloseRate: 0.31, trait: 'Shapeshifts every 300m; reacts to lane camping', shape: 'shapeshifter' },
  dreadwhisper: { id: 'dreadwhisper', name: 'Dreadwhisper', tier: 'Emperor Tier', color: 0x222a5a, eyeColor: 0x00eeff, baseCloseRate: 0.34, trait: 'Projects illusion mirages & psychic pulses', shape: 'arachnid' },
  pyreclad: { id: 'pyreclad', name: 'Pyreclad', tier: 'Legendary Tier', color: 0xbd1528, eyeColor: 0xffbb00, baseCloseRate: 0.37, trait: 'Pyrokinesis fire trails & lane fireballs', shape: 'drake' },
  chronal_wyrm: { id: 'chronal_wyrm', name: 'Chronal Wyrm', tier: 'Demigod Tier', color: 0x2499bd, eyeColor: 0xffd84d, baseCloseRate: 0.4, trait: 'Time-slow bubbles & aurora gravity tilt', shape: 'wyrm' },
  voidstalker: { id: 'voidstalker', name: 'Voidstalker', tier: 'Demon Tier', color: 0x4b0d64, eyeColor: 0xff44c8, baseCloseRate: 0.43, trait: 'Summons shadow minions & void surges', shape: 'demon' },
  null_sovereign: { id: 'null_sovereign', name: 'Null Sovereign', tier: 'Yigyang Tier', color: 0xe6e0ff, eyeColor: 0xb44fff, baseCloseRate: 0.46, trait: 'Celestial phase, Dark Veil & Sonic Waves', shape: 'sovereign' },
};

export const BOSSES = {
  alton_dam: {
    id: 'alton_dam', name: 'Alton Dam', faction: 'Obscura Guild', title: 'Second Best Hunter — Density Shift',
    color: 0x6238a0, accent: 0xb44fff, qteWindow: 2.2, qtePrompt: 'TAP VOID POWER TO SHATTER DENSITY!', qteAction: 'power',
    phases: [
      { start: 1400, end: 1550, name: 'Phase 1: Density Boulders', mechanic: 'boulders' },
      { start: 1550, end: 1700, name: 'Phase 2: Density Wall', mechanic: 'density_wall' },
      { start: 1700, end: 1800, name: 'Phase 3: Phased Charge — Escape!', mechanic: 'qte_power' },
    ],
    bark: 'Thief! Hand over those Beast Cores!',
  },
  james_stole: {
    id: 'james_stole', name: 'James Stole', faction: 'Obscura Tracker', title: 'Master Earth Shaper',
    color: 0x99622e, accent: 0xff7a28, qteWindow: 2.0, qtePrompt: 'SWIPE UP TO LAUNCH OFF EARTH RAMP!', qteAction: 'jump',
    phases: [
      { start: 1400, end: 1550, name: 'Phase 1: Earth Spikes', mechanic: 'earth_spikes' },
      { start: 1550, end: 1700, name: 'Phase 2: Earthen Tunnel', mechanic: 'tunnel' },
      { start: 1700, end: 1800, name: 'Phase 3: Ramp Launch — Escape!', mechanic: 'qte_jump' },
    ],
    bark: 'Nowhere left to run, F-Rank!',
  },
  felix_torrot: {
    id: 'felix_torrot', name: 'Felix Torrot', faction: 'Obscura Guild', title: 'Temporal Anchor Specialist',
    color: 0x264ec2, accent: 0x00e5ff, qteWindow: 2.0, qtePrompt: 'TIME BLEED SURGE — SWIPE UP TO LEAP PORTAL!', qteAction: 'jump',
    phases: [
      { start: 1400, end: 1550, name: 'Phase 1: Time Stutter', mechanic: 'time_stutter' },
      { start: 1550, end: 1700, name: 'Phase 2: Echo Clones', mechanic: 'echo_clones' },
      { start: 1700, end: 1800, name: 'Phase 3: Temporal Escape!', mechanic: 'qte_time' },
    ],
    bark: 'Your timeline ends inside this Rift!',
  },
  shawn_tami: {
    id: 'shawn_tami', name: 'Shawn Tami', faction: 'Crimson Hand', title: 'Blood Captain — Necromancer',
    color: 0xb01224, accent: 0xff2e4c, qteWindow: 2.0, qtePrompt: 'TAP VOID POWER TO OBLITERATE UNDEAD WALL!', qteAction: 'power',
    phases: [
      { start: 1400, end: 1550, name: 'Phase 1: Undead Horde', mechanic: 'undead_horde' },
      { start: 1550, end: 1700, name: 'Phase 2: Necro Storm', mechanic: 'necro_storm' },
      { start: 1700, end: 1800, name: 'Phase 3: Void Blast Escape!', mechanic: 'qte_power' },
    ],
    bark: 'Power is meant to be DISPLAYED!',
  },
  sil_talen: {
    id: 'sil_talen', name: 'Sil Talen', faction: 'Veridian Accord', title: 'Bio-Forger — Tissue Manipulation',
    color: 0x208852, accent: 0x44ff88, qteWindow: 1.9, qtePrompt: 'TAP VOID POWER TO SEVER BIO-CONSTRUCT!', qteAction: 'power',
    phases: [
      { start: 1400, end: 1550, name: 'Phase 1: Bio Growth', mechanic: 'bio_growth' },
      { start: 1550, end: 1700, name: 'Phase 2: Evolution Wave', mechanic: 'evo_wave' },
      { start: 1700, end: 1800, name: 'Phase 3: Gauntlet Sprint Escape!', mechanic: 'qte_power' },
    ],
    bark: 'Fascinating! You are the ultimate catalyst!',
  },
  ashley_moses: {
    id: 'ashley_moses', name: 'Ashley Moses', faction: 'Crimson Hand', title: 'Huntress — Emotion Pulse',
    color: 0x7c1442, accent: 0xff44c8, qteWindow: 1.9, qtePrompt: 'SWIPE DOWN TO SLIDE UNDER HER BLADE!', qteAction: 'slide',
    phases: [
      { start: 1400, end: 1550, name: 'Phase 1: Homing Darts', mechanic: 'homing_darts' },
      { start: 1550, end: 1700, name: 'Phase 2: Emotion Pulse', mechanic: 'emotion_pulse' },
      { start: 1700, end: 1800, name: 'Phase 3: Final Standoff!', mechanic: 'qte_slide' },
    ],
    bark: 'Marked and cornered. Keep up if you can!',
  },
  tay_sonder: {
    id: 'tay_sonder', name: 'Tay Sonder', faction: 'Dominion Authority', title: 'World Leader — Dual Tether',
    color: 0xede6ff, accent: 0xffd84d, qteWindow: 3.2, qtePrompt: 'UNLEASH VOID ERUPTION! TAP VOID BUTTON!', qteAction: 'power',
    phases: [
      { start: 1400, end: 1600, name: 'Phase 1: Five S-Rank Elites', mechanic: 'elites' },
      { start: 1600, end: 1750, name: 'Phase 2: Dual Tether Twins', mechanic: 'dual_tether' },
      { start: 1750, end: 1900, name: 'Phase 3: Combined Assault', mechanic: 'combined_assault' },
      { start: 1900, end: 2000, name: 'Phase 4: VOID ERUPTION CLIMAX!', mechanic: 'qte_eruption' },
    ],
    bark: 'No one holds forbidden power unchallenged!',
  },
};

export const VOID_POWERS = [
  { id: 'flicker', name: 'Flicker', stage: 1, stageName: 'Awakening', unlockLv: 1, slotType: 'active', icon: '⚡', color: '#B44FFF', desc: 'Void blink forward, phasing through obstacles in your path.', tiers: [{ ve: 25, cd: 8, duration: 0.35, power: 15, note: '15m blink' }, { ve: 22, cd: 7, duration: 0.4, power: 18, note: '18m blink' }, { ve: 20, cd: 6, duration: 0.45, power: 22, note: '22m blink' }, { ve: 18, cd: 5, duration: 0.5, power: 28, note: '28m blink + flash' }] },
  { id: 'void_sense', name: 'Void Sense', stage: 1, stageName: 'Awakening', unlockLv: 1, slotType: 'active', icon: '👁', color: '#00E5FF', desc: 'Highlights the safest lane sequence & exposes illusions/hidden essence.', tiers: [{ ve: 15, cd: 12, duration: 3, power: 0, note: 'Optimal path glow' }, { ve: 13, cd: 11, duration: 4, power: 1, note: '+Reveals hidden shards' }, { ve: 12, cd: 10, duration: 5, power: 2, note: '+Reveals Codex Essence' }, { ve: 10, cd: 8, duration: 6, power: 5, note: '+5m chaser pushback' }] },
  { id: 'stillstep', name: 'Stillstep', stage: 1, stageName: 'Awakening', unlockLv: 2, slotType: 'active', icon: '🪶', color: '#88FFD0', desc: 'Silent weightless hover that glides over all ground obstacles.', tiers: [{ ve: 20, cd: 10, duration: 2.0, power: 0.6, note: '2s ground hover' }, { ve: 18, cd: 9, duration: 2.5, power: 0.7, note: '2.5s hover' }, { ve: 15, cd: 7, duration: 3.5, power: 0.9, note: '3.5s high hover' }, { ve: 14, cd: 6, duration: 4.0, power: 1.0, note: '4s weightless glide' }] },
  { id: 'shadow_shield', name: 'Shadow Shield', stage: 2, stageName: 'The Embrace', unlockLv: 10, slotType: 'active', icon: '🛡', color: '#7D3CFF', desc: 'Compressed shadow barrier absorbs hits and blasts the chaser back.', tiers: [{ ve: 30, cd: 15, duration: 5, power: 1, pushback: 10, note: '1 hit, 10m push' }, { ve: 28, cd: 14, duration: 6, power: 1, pushback: 12, note: '1 hit, 12m push' }, { ve: 25, cd: 12, duration: 8, power: 2, pushback: 15, note: '2 hits, 15m push' }, { ve: 22, cd: 10, duration: 10, power: 2, pushback: 18, note: '2 hits + shockwave' }] },
  { id: 'voidwalk', name: 'Voidwalk', stage: 2, stageName: 'The Embrace', unlockLv: 12, slotType: 'active', icon: '👻', color: '#A566FF', desc: 'Shift into the void plane — phase through ALL obstacles with bonus shards.', tiers: [{ ve: 40, cd: 18, duration: 2.0, power: 1.0, note: '2s phase' }, { ve: 38, cd: 16, duration: 2.5, power: 1.2, note: '2.5s +20% shards' }, { ve: 35, cd: 14, duration: 3.0, power: 1.3, note: '3s +30% shards' }, { ve: 30, cd: 12, duration: 4.0, power: 1.5, note: '4s +50% shards' }] },
  { id: 'grasping_dark', name: 'Grasping Dark', stage: 2, stageName: 'The Embrace', unlockLv: 15, slotType: 'active', icon: '🧲', color: '#D44FFF', desc: 'Void tendrils magnetically pull collectibles across lanes straight to you.', tiers: [{ ve: 20, cd: 10, duration: 4, power: 2.0, note: 'Adjacent lanes' }, { ve: 18, cd: 9, duration: 5, power: 3.8, note: 'All 3 lanes' }, { ve: 15, cd: 7, duration: 7, power: 10.0, note: 'All lanes + 10m ahead' }, { ve: 14, cd: 6, duration: 8, power: 14.0, note: 'Void vortex pull' }] },
  { id: 'time_bleed', name: 'Time Bleed', stage: 3, stageName: 'The Descent', unlockLv: 25, slotType: 'active', icon: '⏳', color: '#5CE8E4', desc: 'Slows world, obstacles & chaser to bullet-time while you stay agile.', tiers: [{ ve: 45, cd: 20, duration: 3.0, power: 0.4, note: '0.4x world time' }, { ve: 42, cd: 18, duration: 3.5, power: 0.35, note: '0.35x world time' }, { ve: 38, cd: 16, duration: 4.0, power: 0.3, note: '0.3x world time' }, { ve: 35, cd: 14, duration: 5.0, power: 0.25, note: '0.25x world time' }] },
  { id: 'eclipse_veil', name: 'Eclipse Veil', stage: 3, stageName: 'The Descent', unlockLv: 27, slotType: 'active', icon: '🌑', color: '#5B3E96', desc: 'Vanish from the chaser — decelerates and pushes the pursuing beast back.', tiers: [{ ve: 35, cd: 22, duration: 4, power: 0.5, note: 'Chaser 50% speed' }, { ve: 32, cd: 20, duration: 5, power: 0.4, note: 'Chaser 40% speed' }, { ve: 28, cd: 16, duration: 6, power: 0.3, note: '30% + 10m retreat' }, { ve: 25, cd: 14, duration: 7, power: 0.2, note: '20% + 15m retreat' }] },
  { id: 'chronal_haven', name: 'Chronal Haven', stage: 3, stageName: 'The Descent', unlockLv: 30, slotType: 'active', icon: '🫧', color: '#FFD447', desc: 'Time-locked invulnerable bubble shatters nearby obstacles into shards.', tiers: [{ ve: 50, cd: 25, duration: 2.0, power: 10, note: '10m shatter radius' }, { ve: 45, cd: 22, duration: 2.5, power: 15, note: '15m shatter radius' }, { ve: 40, cd: 18, duration: 3.0, power: 20, note: '20m shatter radius' }, { ve: 36, cd: 16, duration: 3.5, power: 25, note: '25m golden bubble' }] },
  { id: 'void_domain', name: 'Void Domain', stage: 4, stageName: 'The Apex', unlockLv: 45, slotType: 'active', icon: '🌌', color: '#9B30FF', desc: 'Transform track into your Void Domain: phase all obstacles, 2x loot, freeze chaser.', tiers: [{ ve: 70, cd: 30, duration: 4, power: 1.0, note: 'Intangible + 2x loot' }, { ve: 65, cd: 28, duration: 5, power: 1.1, note: '+Chaser frozen' }, { ve: 60, cd: 25, duration: 6, power: 1.3, note: '+1.3x speed boost' }, { ve: 55, cd: 22, duration: 8, power: 1.4, note: '+Bonus Essence' }] },
  { id: 'erasure_wave', name: 'Erasure Wave', stage: 4, stageName: 'The Apex', unlockLv: 50, slotType: 'active', icon: '💥', color: '#FF38A8', desc: 'Blast a cone of void energy ahead, erasing all obstacles across 3 lanes.', tiers: [{ ve: 55, cd: 25, duration: 0.6, power: 30, note: '30m erase cone' }, { ve: 50, cd: 22, duration: 0.7, power: 40, note: '40m + shard drops' }, { ve: 45, cd: 18, duration: 0.8, power: 50, note: '50m + 20m pushback' }, { ve: 40, cd: 15, duration: 0.9, power: 60, note: '60m void detonation' }] },
  { id: 'void_resonance', name: 'Void Resonance', stage: 4, stageName: 'The Apex', unlockLv: 55, slotType: 'passive', icon: '🪐', color: '#C77DFF', desc: 'Passive orbiting void orbs auto-deflect obstacles every few seconds.', tiers: [{ ve: 5, cd: 5, duration: 999, power: 5, note: 'Auto-deflect / 5s' }, { ve: 4, cd: 4, duration: 999, power: 4, note: 'Auto-deflect / 4s' }, { ve: 3, cd: 3, duration: 999, power: 3, note: 'Auto-deflect / 3s' }, { ve: 2, cd: 2.5, duration: 999, power: 2.5, note: 'Constellation / 2.5s' }] },
  { id: 'voidlight_synthesis', name: 'Voidlight Synthesis', stage: 5, stageName: 'Transcendence', unlockLv: 75, slotType: 'active', icon: '☄️', color: '#FFF0AA', desc: 'Become a blinding comet of void-light: 2x+ speed, invincible, auto-collect all.', tiers: [{ ve: 80, cd: 35, duration: 4, power: 2.0, note: '2.0x comet sprint' }, { ve: 75, cd: 30, duration: 5, power: 2.2, note: '2.2x light tendrils' }, { ve: 65, cd: 25, duration: 7, power: 2.5, note: '2.5x void supernova' }, { ve: 60, cd: 22, duration: 8, power: 2.6, note: '8s transcendence' }] },
  { id: 'singularity_soul', name: 'Singularity Soul', stage: 5, stageName: 'Transcendence', unlockLv: 85, slotType: 'ultimate', icon: '🕳️', color: '#FFFFFF', desc: 'Ultimate: collapse reality, erase 60m, push chaser to max, skip +200m!', tiers: [{ ve: 100, cd: 60, duration: 3, power: 200, note: '60m erase + 200m skip' }, { ve: 90, cd: 45, duration: 4, power: 250, note: '+2x shards for 10s' }, { ve: 85, cd: 40, duration: 4, power: 280, note: '280m rift warp' }, { ve: 80, cd: 35, duration: 4.5, power: 320, note: 'Supreme singularity' }] },
  { id: 'concept_reversal', name: 'Concept Reversal', stage: 5, stageName: 'Transcendence', unlockLv: 90, slotType: 'active', icon: '🔄', color: '#FFB020', desc: 'Inverts obstacle reality — running INTO obstacles awards Void Shards & Score instead!', tiers: [{ ve: 85, cd: 40, duration: 3, power: 5, note: '3s obstacles → +5 VS' }, { ve: 75, cd: 30, duration: 5, power: 8, note: '5s obstacles → +8 VS' }, { ve: 70, cd: 26, duration: 6, power: 10, note: '6s obstacles → +10 VS' }, { ve: 65, cd: 22, duration: 7, power: 12, note: '7s reality inversion' }] },
];

export const ABILITY_UPGRADE_COSTS = [
  { vs: 200, sp: 0 },
  { vs: 500, sp: 1 },
  { vs: 1200, sp: 2 },
];

export const CHARACTERS = [
  {
    id: 'miller',
    name: 'Miller Redwolf',
    initials: 'MR',
    title: 'F-Rank Hunter · Codex Bearer',
    passiveName: 'Codex Bearer',
    passiveDesc: '+10% bonus Codex XP from all sources.',
    sigName: 'All 15 Void Powers',
    sigDesc: 'Full access to the entire Umbral Codex ability tree.',
    costVS: 0,
    costBC: 0,
    reqLv: 1,
    primaryColor: 0x422f24,
    accentColor: 0xb44fff,
    style: 'miller',
    featured: true,
    portrait: 'assets/art/characters/miller_portrait.jpg',
    splash: 'assets/art/characters/miller_splash.jpg',
    refSheet: 'assets/art/characters/miller_ref.jpg',
    sprites: {
      front: 'assets/art/characters/sprites/miller_front.png',
      side: 'assets/art/characters/sprites/miller_side.png',
      back: 'assets/art/characters/sprites/miller_back.png',
    },
  },
  {
    id: 'brann',
    name: 'Brann Kest',
    initials: 'BK',
    title: 'Iron Vanguard · Shieldbearer',
    passiveName: 'Aegis Guard',
    passiveDesc: 'Starts every run with +1 free Shield Charge that deflects a hit & pushes the chaser back 12m.',
    sigName: 'Hammer Shockwave',
    sigDesc: 'Slams forged warhammer to shatter obstacles 24m ahead & blast chaser back 18m. (28 VE, 14s CD)',
    costVS: 0,
    costBC: 0,
    reqLv: 1,
    primaryColor: 0x7a261e,
    accentColor: 0xffb020,
    style: 'vanguard',
    featured: true,
    portrait: 'assets/art/characters/brann_portrait.jpg',
    splash: 'assets/art/characters/brann_splash.jpg',
    refSheet: 'assets/art/characters/brann_ref.jpg',
    sprites: {
      front: 'assets/art/characters/sprites/brann_front.png',
      side: 'assets/art/characters/sprites/brann_side.png',
      back: 'assets/art/characters/sprites/brann_back.png',
    },
  },
  {
    id: 'elara',
    name: 'Elara Vey',
    initials: 'EV',
    title: 'Arcane Runeweaver · Portal Scholar',
    passiveName: 'Arcane Resonance',
    passiveDesc: '+30% faster Void Energy regen & +40% bonus score from Golden Rings & Codex Essence.',
    sigName: 'Runic Ward Circle',
    sigDesc: 'Projects a cyan-gold rune circle for 6s that vaporizes lane obstacles & pulls shards. (26 VE, 14s CD)',
    costVS: 0,
    costBC: 0,
    reqLv: 1,
    primaryColor: 0x22384c,
    accentColor: 0x3dffcc,
    style: 'arcane',
    featured: true,
    portrait: 'assets/art/characters/elara_portrait.jpg',
    splash: 'assets/art/characters/elara_splash.jpg',
    refSheet: 'assets/art/characters/elara_ref.jpg',
    sprites: {
      front: 'assets/art/characters/sprites/elara_front.png',
      side: 'assets/art/characters/sprites/elara_side.png',
      back: 'assets/art/characters/sprites/elara_back.png',
    },
  },
  {
    id: 'nyx',
    name: 'Nyx Aderyn',
    initials: 'NA',
    title: 'Shadow Rogue · Twin-Fang Phantom',
    passiveName: 'Shadow Dash',
    passiveDesc: '35% faster lane switches, auto-phases 1st obstacle & extends Near-Miss Combos +0.8s.',
    sigName: 'Twin-Fang Blitz',
    sigDesc: 'Phases through all obstacles for 2.5s while slicing nearby hazards into Void Shards! (28 VE, 12s CD)',
    costVS: 0,
    costBC: 0,
    reqLv: 1,
    primaryColor: 0x1d1a26,
    accentColor: 0xa052ff,
    style: 'rogue',
    featured: true,
    portrait: 'assets/art/characters/nyx_portrait.jpg',
    splash: 'assets/art/characters/nyx_splash.jpg',
    refSheet: 'assets/art/characters/nyx_ref.jpg',
    sprites: {
      front: 'assets/art/characters/sprites/nyx_front.png',
      side: 'assets/art/characters/sprites/nyx_side.png',
      back: 'assets/art/characters/sprites/nyx_back.png',
    },
  },
  { id: 'leonard', name: 'Leonard Meleak', initials: 'LM', title: 'C-Rank Hunter · Power Mimicry', passiveName: 'Power Echo', passiveDesc: 'First Void Power cooldown reduced by 50% echoing Miller.', sigName: 'Mimicry Surge', sigDesc: 'Re-activates last collected power-up (or random) for 3.5s. (25 VE, 20s CD)', costVS: 1500, costBC: 3, reqLv: 10, primaryColor: 0x2a2f3d, accentColor: 0x00e5ff, style: 'tech' },
  { id: 'precious', name: 'Precious Trisky', initials: 'PT', title: 'Military Medic · Thread Manipulation', passiveName: "Healer's Thread", passiveDesc: '30% faster stumble recovery & +25% passive VE regen.', sigName: 'Thread Mend', sigDesc: 'Clears stumble + 2s immunity, or +50% VE regen aura for 5s. (20 VE, 15s CD)', costVS: 2500, costBC: 4, reqLv: 15, primaryColor: 0xe6eaf2, accentColor: 0x44ff88, style: 'medic' },
  { id: 'rumbidzai', name: 'Rumbidzai Mash', initials: 'RM', title: 'The Phantom Blade · Elytra Leader', passiveName: 'Phantom Step', passiveDesc: '30% faster lane changes & auto-phases the first obstacle each run.', sigName: 'Blade Phase', sigDesc: 'Summons phantom blades destroying 3 nearest obstacles + 1s phase. (30 VE, 12s CD)', costVS: 3000, costBC: 5, reqLv: 20, primaryColor: 0x151320, accentColor: 0xff38a8, style: 'assassin' },
  { id: 'harry', name: 'Harry Koera', initials: 'HK', title: 'Military Detective · Ritual Magic', passiveName: "Detective's Instinct", passiveDesc: '+25% rare drop chance (Cores/Fragments) & always reveals hidden paths.', sigName: 'Ritual Ward', sigDesc: 'Places an 8s ritual lane ward that destroys all obstacles in your lane. (35 VE, 22s CD)', costVS: 4000, costBC: 7, reqLv: 30, primaryColor: 0x3b2d22, accentColor: 0xffb020, style: 'detective' },
  { id: 'garfield', name: 'Garfield Thorn', initials: 'GT', title: 'Young Sentinel · Energy Conversion', passiveName: 'Energy Convert', passiveDesc: 'Every obstacle destroyed by any power converts into +3 Void Shards.', sigName: 'Duplicate Burst', sigDesc: 'Duplicates active/last power-up or doubles nearby shards. (30 VE, 25s CD)', costVS: 6000, costBC: 10, reqLv: 45, primaryColor: 0x264432, accentColor: 0xffee44, style: 'scout' },
  { id: 'ruth', name: 'Ruth Swait', initials: 'RS', title: 'Guild Architect · Cryokinesis', passiveName: 'Frost Architect', passiveDesc: 'Overhead obstacles automatically shatter on contact with zero stumble.', sigName: 'Cryo Path', sigDesc: 'Freezes track for 4s — smash through brittle ice obstacles for +2 VS each. (40 VE, 20s CD)', costVS: 8000, costBC: 15, reqLv: 60, primaryColor: 0x203b54, accentColor: 0x5ce8e4, style: 'frost' },
];

export const SKILL_TREE = [
  { id: 'void_dur', path: 'Void Path', name: 'Power Duration +0.5s', costSP: 3, desc: 'All active Void Powers last +0.5s longer.' },
  { id: 'void_dmg', path: 'Void Path', name: 'Power Yield +15%', costSP: 4, desc: 'Powers earn +15% bonus shards & destruction range.' },
  { id: 'void_push', path: 'Void Path', name: 'Chaser Pushback +25%', costSP: 5, desc: 'Void Powers knock chasers 25% further back.' },
  { id: 'shadow_hp', path: 'Shadow Path', name: 'Shield HP +1', costSP: 3, desc: 'Shadow Shield & Barrier absorb +1 additional hit.' },
  { id: 'shadow_rec', path: 'Shadow Path', name: 'Stumble -100ms', costSP: 3, desc: 'Recover from stumbles 100ms faster.' },
  { id: 'shadow_2nd', path: 'Shadow Path', name: 'Second Chance', costSP: 5, desc: 'Auto-revive once per run with 2s invulnerability.' },
  { id: 'codex_ve', path: 'Codex Path', name: 'VE Regen +1/s', costSP: 2, desc: 'Passive Void Energy regeneration +1 VE/s.' },
  { id: 'codex_cd', path: 'Codex Path', name: 'Cooldown -10%', costSP: 4, desc: 'All Void Power cooldowns reduced by 10%.' },
  { id: 'codex_mag', path: 'Codex Path', name: 'Shard Magnet +50%', costSP: 4, desc: 'Pickup forgiveness & magnet radius increased 50%.' },
];

export const CONSUMABLES = [
  { id: 've_potion', name: 'VE Potion', costVS: 100, icon: '🧪', desc: 'Start run with +50 VE' },
  { id: 'chaser_repel', name: 'Chaser Repel', costVS: 250, icon: '🛡️', desc: 'Chaser starts at 80m' },
  { id: 'lucky_charm', name: 'Lucky Charm', costVS: 300, icon: '🍀', desc: '+15% rare drop chance' },
  { id: 'codex_boost', name: 'Codex Boost', costVS: 500, icon: '📖', desc: '+25% Codex XP for 1 run' },
  { id: 'beast_lure', name: 'Beast Lure', costVS: 400, icon: '🔥', desc: 'Guarantees extra Beast Core on boss' },
];

// All Skins, Trails & Aura FX are 100% earned through gameplay & skill (Zero Pay-to-Win!)
export const SKINS = [
  { id: 'default', name: 'F-Rank Void Standard', tier: 'Starter', costVS: 0, primary: 0x1c182c, accent: 0xb44fff, hex: '#B44FFF' },
  { id: 'verdant_cloak', name: 'Verdant Neon Scout', tier: 'Common', costVS: 400, primary: 0x133824, accent: 0x3dff7a, hex: '#3DFF7A' },
  { id: 'cyber_cyan', name: 'Pulse Arc Runner', tier: 'Common', costVS: 650, primary: 0x12263e, accent: 0x00e5ff, hex: '#00E5FF' },
  { id: 'ember_walker', name: 'Ember Solar Walker', tier: 'Rare', costVS: 1400, primary: 0x3f150a, accent: 0xff7a28, hex: '#FF7A28' },
  { id: 'obscura_disguise', name: 'Obscura Astral Suit', tier: 'Rare', costVS: 1800, primary: 0x151e44, accent: 0x3b7bff, hex: '#3B7BFF' },
  { id: 'crimson_raider', name: 'Crimson Blitz Armor', tier: 'Epic', costVS: 3200, primary: 0x420a16, accent: 0xff2e4c, hex: '#FF2E4C' },
  { id: 'void_initiate', name: 'Void Initiate Prism', tier: 'Epic', costVS: 4200, primary: 0x220d42, accent: 0xff44c8, hex: '#FF44C8' },
  { id: 'transcendence_form', name: 'God of Void (Radiant)', tier: 'Mastery', costVS: 6500, primary: 0xf6f0ff, accent: 0xffd84d, hex: '#FFD84D' },
];

export const TRAILS = [
  { id: 'violet_spark', name: 'Violet Void Spark', color: 0xb44fff, hex: '#B44FFF', costVS: 0, desc: 'Classic shimmering ultraviolet void trail.' },
  { id: 'cyan_plasma', name: 'Cyan Hyper Plasma', color: 0x00e5ff, hex: '#00E5FF', costVS: 350, desc: 'Electric cyan plasma ribbons behind every stride.' },
  { id: 'emerald_spore', name: 'Verdant Biolume', color: 0x3dff7a, hex: '#3DFF7A', costVS: 500, desc: 'Glowing emerald firefly trail from World 1.' },
  { id: 'solar_ember', name: 'Solar Ember Stream', color: 0xff7a28, hex: '#FF7A28', costVS: 900, desc: 'Fiery orange-gold sparks from the Ember Corridor.' },
  { id: 'neon_magenta', name: 'Abyssal Neon Wave', color: 0xff44c8, hex: '#FF44C8', costVS: 1400, desc: 'Vibrant neon-pink rift energy trail.' },
  { id: 'prismatic_gold', name: 'Transcendent Prism', color: 0xffd84d, hex: '#FFD84D', costVS: 2500, rainbow: true, desc: 'Radiant cycling rainbow-gold comet trail.' },
];

export const AURA_FX = [
  { id: 'standard', name: 'Void Burst', hex: '#B44FFF', color: 0xb44fff, costVS: 0, desc: 'Crisp violet crystal bursts on pickups & jumps.' },
  { id: 'starlight', name: 'Cyan Starlight', hex: '#00E5FF', color: 0x00e5ff, costVS: 450, desc: 'Sparkling cyan starbursts on every action.' },
  { id: 'supernova', name: 'Golden Supernova', hex: '#FFD84D', color: 0xffd84d, costVS: 1100, desc: 'Brilliant golden shockwave particles.' },
  { id: 'aurora', name: 'Aurora Prism', hex: '#44FF88', color: 0x44ff88, costVS: 1800, rainbow: true, desc: 'Multi-colour aurora confetti explosions.' },
];

// === CANON PORTAL CREATURES FROM "MILLER: THE GOD OF VOID" (7 Beast Tiers) ===
export const PORTAL_ENEMIES = {
  1: { name: 'Thornhound Stalker', tier: 'Advanced Tier', creatureType: 'quadruped', color: 0x266e3c, secondaryColor: 0x163820, eyeColor: 0x3dff7a, speed: 6.5, slowPct: 0.34, slowDur: 2.0, weave: false, hp: 1 },
  2: { name: 'Skeld Morph-Draker', tier: 'King Tier', creatureType: 'morph_brute', color: 0xb83814, secondaryColor: 0x3d140a, eyeColor: 0xffd84d, speed: 7.4, slowPct: 0.36, slowDur: 2.1, weave: false, hp: 1 },
  3: { name: 'Dreadwhisper Chimera', tier: 'Emperor Tier', creatureType: 'arachnid', color: 0x1b234d, secondaryColor: 0x0b0f24, eyeColor: 0x00e5ff, speed: 8.0, slowPct: 0.38, slowDur: 2.2, weave: true, hp: 1 },
  4: { name: 'Pyreclad Flame-Drake', tier: 'Legendary Tier', creatureType: 'drake', color: 0x9c1026, secondaryColor: 0x330710, eyeColor: 0xff8822, speed: 8.6, slowPct: 0.4, slowDur: 2.3, weave: true, hp: 1 },
  5: { name: 'Chronal Ice-Wyrmling', tier: 'Demigod Tier', creatureType: 'wyrm', color: 0x1c79a6, secondaryColor: 0x0c3452, eyeColor: 0x5cf2ff, speed: 8.8, slowPct: 0.44, slowDur: 2.5, weave: true, hp: 1 },
  6: { name: 'Voidstalker Fiend', tier: 'Demon Tier', creatureType: 'tendril_fiend', color: 0x450d66, secondaryColor: 0x150424, eyeColor: 0xff44c8, speed: 9.4, slowPct: 0.42, slowDur: 2.4, weave: true, hp: 1 },
  7: { name: 'Abyssal Seraph-Stalker', tier: 'Yigyang Tier', creatureType: 'seraph', color: 0xe6e2ff, secondaryColor: 0x18142b, eyeColor: 0xffd84d, speed: 10.2, slowPct: 0.45, slowDur: 2.5, weave: true, hp: 1 },
};

// === UNLOCKABLE GEAR ARMORY (Weapons, Armor & Relics — 100% Skill-Earned) ===
export const GEAR_WEAPONS = [
  { id: 'steel_blade', name: 'Steel Hunter Blade', icon: '🗡️', tier: 'Starter', costVS: 0, reqLv: 1, range: 7.5, cd: 1.35, lanes: 1, pushback: 2, scoreBonus: 1.0, veGain: 5, color: 0x00e5ff, hex: '#00E5FF', desc: 'Crisp single-lane slash that defeats charging portal enemies.' },
  { id: 'verdant_blade', name: 'Verdant Runeblade', icon: '⚔️', tier: 'Common', costVS: 300, reqLv: 2, range: 9.5, cd: 1.15, lanes: 1, pushback: 3, scoreBonus: 1.25, veGain: 6, color: 0x3dff7a, hex: '#3DFF7A', desc: 'Longer emerald slash arc +25% bonus score on enemy defeats.' },
  { id: 'ember_hammer', name: 'Ember Warhammer', icon: '🔨', tier: 'Rare', costVS: 650, reqLv: 4, range: 11.0, cd: 1.05, lanes: 2, pushback: 5, scoreBonus: 1.35, veGain: 7, color: 0xff7a28, hex: '#FF7A28', desc: 'Shockwave cleave hits adjacent lanes & pushes chaser back 5m.' },
  { id: 'sun_staff', name: 'Arcane Sunstaff', icon: '🪄', tier: 'Rare', costVS: 1100, reqLv: 6, range: 14.5, cd: 0.95, lanes: 1, pushback: 4, scoreBonus: 1.45, veGain: 10, color: 0x3dffcc, hex: '#3DFFCC', desc: 'Long-range piercing rune beam restores +10 VE per enemy defeated.' },
  { id: 'umbra_fangs', name: 'Umbra Twin-Fangs', icon: '⚡', tier: 'Epic', costVS: 1800, reqLv: 9, range: 13.0, cd: 0.68, lanes: 2, pushback: 5, scoreBonus: 1.6, veGain: 9, color: 0xb44fff, hex: '#B44FFF', desc: 'Ultra-fast twin dagger blitz with rapid 0.68s cooldown.' },
  { id: 'voidheart_blade', name: 'Voidheart Blade', icon: '🌌', tier: 'Mastery', costVS: 3200, reqLv: 14, range: 18.0, cd: 0.78, lanes: 3, pushback: 8, scoreBonus: 2.0, veGain: 12, color: 0xffd84d, hex: '#FFD84D', desc: 'Unleashes a 3-lane void crescent wave wiping all oncoming enemies!' },
];

export const GEAR_ARMORS = [
  { id: 'hunter_coat', name: 'F-Rank Hunter Coat', icon: '🧥', tier: 'Starter', costVS: 0, reqLv: 1, deflects: 0, slowResist: 0.15, regenEveryDist: 0, hex: '#8A7E99', desc: 'Light traveler coat reducing enemy slow duration by 15%.' },
  { id: 'vanguard_mail', name: 'Ironclad Vanguard Mail', icon: '🛡️', tier: 'Common', costVS: 350, reqLv: 2, deflects: 1, slowResist: 0.3, regenEveryDist: 0, hex: '#FFB020', desc: '+1 Auto-Deflect Shield against portal enemies & 30% slow resist.' },
  { id: 'rune_mantle', name: 'Runeweaver Mantle', icon: '💠', tier: 'Rare', costVS: 750, reqLv: 5, deflects: 1, slowResist: 0.5, regenEveryDist: 0, veRegenBonus: 0.15, hex: '#3DFFCC', desc: '+1 Deflect Shield, 50% slow resist & +15% faster VE regen.' },
  { id: 'shadow_shroud', name: 'Shadowstep Shroud', icon: '🦇', tier: 'Epic', costVS: 1400, reqLv: 8, deflects: 2, slowResist: 0.6, regenEveryDist: 0, hex: '#A052FF', desc: '+2 Auto-Deflect Shields & counter-blasts enemies on contact!' },
  { id: 'dominion_aegis', name: 'Dominion Aegis Plate', icon: '👑', tier: 'Mastery', costVS: 2600, reqLv: 12, deflects: 2, slowResist: 0.75, regenEveryDist: 450, hex: '#FFD84D', desc: '+2 Deflect Shields + regenerates +1 Shield every 450m run!' },
];

export const GEAR_RELICS = [
  { id: 'guild_tag', name: 'F-Rank Guild Tag', icon: '🏷️', tier: 'Starter', costVS: 0, reqLv: 1, xpMult: 1.1, enemySlow: 1.0, veOnKill: 0, hex: '#C7B086', desc: '+10% smooth Hero XP gain on every run.' },
  { id: 'rift_magnet', name: 'Rift Magnet Core', icon: '🧲', tier: 'Common', costVS: 400, reqLv: 2, xpMult: 1.12, enemySlow: 1.0, veOnKill: 3, shardMagnetBonus: 0.35, hex: '#00E5FF', desc: 'Wider shard pickup radius & +3 VE per enemy defeated.' },
  { id: 'chrono_watch', name: 'Chrono Pocket Watch', icon: '⏱️', tier: 'Rare', costVS: 900, reqLv: 5, xpMult: 1.18, enemySlow: 0.78, veOnKill: 4, hex: '#5CF2FF', desc: 'Slows oncoming portal enemies by 22% for easier timing!' },
  { id: 'codex_resonator', name: 'Codex Resonator', icon: '🔮', tier: 'Epic', costVS: 1600, reqLv: 9, xpMult: 1.3, enemySlow: 0.85, veOnKill: 10, cdReduction: 0.12, hex: '#FF44C8', desc: '+30% Hero XP, +10 VE per kill & -12% Void Power cooldown!' },
];

// Smooth, steady per-hero level curve (Lv 1 -> 50)
export function heroXpForNextLevel(level) {
  return 80 + (level - 1) * 45 + Math.floor((level - 1) * (level - 1) * 3);
}

export function getHeroLevelBonuses(level) {
  const lv = Math.max(1, level || 1);
  const rank =
    lv >= 25 ? 'Transcendent' :
    lv >= 15 ? 'Void Champion' :
    lv >= 10 ? 'Rift Veteran' :
    lv >= 5 ? 'Portal Slayer' :
    lv >= 3 ? 'Swift Striker' : 'Initiate';
  return {
    level: lv,
    rank,
    rangeMult: 1 + (lv - 1) * 0.025,       // Smooth +2.5% strike range/power per hero lv
    slowResist: Math.min(0.5, (lv - 1) * 0.015), // Smooth +1.5% slow resist per hero lv
    bonusMaxVE: (lv - 1) * 3,              // Smooth +3 Max VE per hero lv
    scoreBonus: 1 + (lv - 1) * 0.015,      // Smooth +1.5% score multiplier per hero lv
  };
}

// 16 Meaningful Skill-Based Achievements (Section 2B)
export const ACHIEVEMENTS = [
  { id: 'ach_first_run', icon: '🚀', tier: 'Bronze', title: 'Into the Rift', desc: 'Complete your first run through a portal.', rewardVS: 100, rewardXP: 40, check: (d) => d.totalRuns >= 1 },
  { id: 'ach_100_shards', icon: '💎', tier: 'Bronze', title: 'Crystal Collector', desc: 'Collect 100 Void Shards total.', rewardVS: 120, rewardXP: 50, check: (d) => d.totalShards >= 100 },
  { id: 'ach_1000_shards', icon: '👑', tier: 'Silver', title: 'Void Hoarder', desc: 'Collect 1,000 Void Shards across runs.', rewardVS: 350, rewardXP: 120, check: (d) => d.totalShards >= 1000 },
  { id: 'ach_dist_1000', icon: '🏃', tier: 'Bronze', title: 'Kilometer Sprinter', desc: 'Reach 1,000 m in a single run.', rewardVS: 150, rewardXP: 70, check: (d) => d.bestDistance >= 1000 },
  { id: 'ach_dist_3000', icon: '⚡', tier: 'Gold', title: 'Dimensional Marathon', desc: 'Reach 3,000 m in a single run.', rewardVS: 500, rewardXP: 200, check: (d) => d.bestDistance >= 3000 },
  { id: 'ach_score_10k', icon: '🌟', tier: 'Bronze', title: 'Arcade Rising Star', desc: 'Score 10,000+ points in a single run.', rewardVS: 180, rewardXP: 80, check: (d) => d.bestScore >= 10000 },
  { id: 'ach_score_50k', icon: '🏆', tier: 'Gold', title: 'Void Legend', desc: 'Score 50,000+ points in a single run.', rewardVS: 600, rewardXP: 250, check: (d) => d.bestScore >= 50000 },
  { id: 'ach_nohit_500', icon: '🛡️', tier: 'Silver', title: 'Untouchable Flow', desc: 'Run 500 m without stumbling.', rewardVS: 250, rewardXP: 100, check: (d) => d.bestNoHit >= 500 },
  { id: 'ach_combo_4', icon: '🔥', tier: 'Silver', title: 'Adrenaline Master', desc: 'Chain a ×4 Near-Miss Combo in a run.', rewardVS: 250, rewardXP: 110, check: (d) => d.bestCombo >= 4 },
  { id: 'ach_nearmiss_25', icon: '💨', tier: 'Silver', title: 'Razor Reflexes', desc: 'Pull off 25 total near-misses.', rewardVS: 220, rewardXP: 90, check: (d) => d.totalNearMisses >= 25 },
  { id: 'ach_boss_1', icon: '⚔️', tier: 'Silver', title: 'Faction Breaker', desc: 'Escape your first Faction Boss Chase.', rewardVS: 300, rewardXP: 150, check: (d) => d.totalBossesDefeated >= 1 },
  { id: 'ach_world_3', icon: '🌌', tier: 'Gold', title: 'Realm Explorer', desc: 'Reach World 3 (Obsidian Rift) or beyond.', rewardVS: 400, rewardXP: 180, check: (d) => d.highestWorld >= 3 },
  { id: 'ach_bonus_ring', icon: '🎯', tier: 'Bronze', title: 'Secret Seeker', desc: 'Fly through a Golden Bonus Rift Ring.', rewardVS: 180, rewardXP: 80, check: (d) => d.totalBonusRings >= 1 },
  { id: 'ach_powers_20', icon: '✨', tier: 'Silver', title: 'Codex Weaver', desc: 'Activate Void Powers 20 times.', rewardVS: 250, rewardXP: 100, check: (d) => d.totalPowersUsed >= 20 },
  { id: 'ach_codex_10', icon: '📖', tier: 'Gold', title: 'The Embrace', desc: 'Reach Umbral Codex Level 10.', rewardVS: 400, rewardXP: 160, check: (d) => d.codexLevel >= 10 },
  { id: 'ach_customise', icon: '🎨', tier: 'Bronze', title: 'Signature Style', desc: 'Unlock a new Skin, Trail, Aura, or Runner.', rewardVS: 150, rewardXP: 60, check: (d) => (d.unlockedSkins.length + d.unlockedTrails.length + d.unlockedAuras.length + d.unlockedChars.length) > 4 },
];

export const CODEX_MILESTONES = [
  { lv: 1, title: 'First Awakening', reward: 'Flicker & Void Sense Unlocked' },
  { lv: 3, title: 'System Online', reward: 'Customisation Studio Unlocked' },
  { lv: 5, title: 'Void Initiate', reward: '+500 VS Bonus & World 2 Access' },
  { lv: 10, title: 'The Embrace Begins', reward: 'Shadow Shield + Leonard Unlockable' },
  { lv: 15, title: 'Clinic Tether', reward: 'Grasping Dark + Precious Unlockable' },
  { lv: 20, title: "Phantom's Gaze", reward: 'Rumbidzai Unlockable + World 4 Access' },
  { lv: 25, title: 'The Descent', reward: '2nd Active Power Slot + Time Bleed' },
  { lv: 30, title: 'Core Harnessing', reward: 'Beast Core Mastery + Harry + Chronal Haven' },
  { lv: 45, title: 'The Apex', reward: 'Passive Slot + Void Domain + Garfield' },
  { lv: 65, title: "World's Enemy", reward: 'World 7: The Terminus Unlocked' },
  { lv: 75, title: 'Approaching Transcendence', reward: 'Ultimate Slot + Voidlight Synthesis' },
  { lv: 100, title: 'God of Void', reward: 'Transcendence Mastery Title' },
];

export const STORY_ACTS = [
  {
    act: 1, name: 'Act 1 — Awakening', stage: 'Lv 1–10 · Worlds 1–2',
    beats: [
      { id: '1.1', title: 'The Mysterious Key', reqLv: 1, panels: [{ speaker: 'Narrator', text: 'An F-Rank Guild Card. A mysterious dungeon key. One emerald portal.' }, { speaker: 'Umbral Codex', text: '[SYSTEM MATERIALIZED — STAGE 1: AWAKENING. KEEP THIS SECRET.]' }, { speaker: 'Miller', text: "Whatever this Codex is... it's my only way out alive." }] },
      { id: '1.2', title: 'First Beast', reqLv: 3, panels: [{ speaker: 'Thornmaw', text: '*ROARS — cracking the mossy ruins behind Miller!*' }, { speaker: 'Leonard', text: 'Whoa! An F-Rank outrunning an Advanced beast?! How?!' }, { speaker: 'Miller', text: 'Pure luck, Leo. Just... keep running!' }] },
      { id: '1.3', title: 'The Secret', reqLv: 5, panels: [{ speaker: 'Leonard', text: 'Your eyes glowed violet back there, Miller.' }, { speaker: 'Miller', text: 'Must be portal dust. Trust me, nothing weird.' }, { speaker: 'Umbral Codex', text: '[WARNING: DISCLOSURE THREATENS HOST SURVIVAL.]' }] },
    ],
  },
  {
    act: 2, name: 'Act 2 — The Embrace', stage: 'Lv 10–25 · Worlds 2–3',
    beats: [
      { id: '2.1', title: 'The Healer', reqLv: 12, panels: [{ speaker: 'Precious', text: 'Hold still! Wait... your wounds are already closing?' }, { speaker: 'Miller', text: 'Guess my stamina training finally paid off.' }, { speaker: 'Precious', text: 'My threads never lie, Miller. Be careful out there.' }] },
      { id: '2.2', title: 'Phantom Contact', reqLv: 16, panels: [{ speaker: 'Rumbidzai', text: 'Just a girl from drama class... who noticed your footwork.' }, { speaker: 'Miller', text: 'Drama students carry intangible blades now?' }, { speaker: 'Rumbidzai', text: 'Only when Elytra watches a rising anomaly.' }] },
      { id: '2.3', title: 'Obscura Eyes', reqLv: 20, panels: [{ speaker: 'Alton Dam', text: 'Three Advanced cores and a King core on an F-Rank?!' }, { speaker: 'Alton Dam', text: 'He stole them. Dispatch James Stole and seal the Rift.' }, { speaker: 'Umbral Codex', text: '[STAGE 2 COMPLETE — OBSCURA HOSTILITY DETECTED.]' }] },
    ],
  },
  {
    act: 3, name: 'Act 3 — The Descent', stage: 'Lv 25–40 · Worlds 4–5',
    beats: [
      { id: '3.1', title: 'Crimson Hand', reqLv: 25, panels: [{ speaker: 'Shawn Tami', text: 'A hidden powerhouse? Either a weapon to claim, or a rival to crush.' }, { speaker: 'Ashley Moses', text: 'I have his scent, Blood Captain. Hunting him now.' }, { speaker: 'Miller', text: 'Time Bleed online. Let them try to keep up.' }] },
      { id: '3.2', title: 'Core Harnessing', reqLv: 30, panels: [{ speaker: 'Sil Talen', text: 'Look at that cellular resonance! The ultimate evolutionary catalyst!' }, { speaker: 'Umbral Codex', text: '[LV 30 UNLOCKED: BEAST CORE HARNESSING ACTIVE.]' }, { speaker: 'Ruth Swait', text: 'Excuse me — journalist here! Care to comment on the Rift?' }] },
    ],
  },
  {
    act: 4, name: 'Act 4 — The Apex', stage: 'Lv 45–70 · Worlds 5–6',
    beats: [
      { id: '4.1', title: 'The Dominion Watches', reqLv: 45, panels: [{ speaker: 'Tay Sonder', text: 'Anyone holding unregulated power is a threat to the world.' }, { speaker: 'Harry Koera', text: 'My rituals picked up Dominion trackers, kid. You are not alone.' }, { speaker: 'Ruth Swait', text: "I'm done with Obscura. Count my frost on your side, Miller." }] },
      { id: '4.2', title: 'The Abyssal Gate', reqLv: 60, panels: [{ speaker: 'Garfield', text: 'A White Portal?! Those are supposed to be myth!' }, { speaker: 'Miller', text: 'The Codex is pulling toward it. Everyone stay sharp.' }, { speaker: 'Umbral Codex', text: '[STAGE 4 APEX REACHED — THE TERMINUS AWAITS.]' }] },
    ],
  },
  {
    act: 5, name: 'Act 5 — Transcendence', stage: 'Lv 75–100 · World 7',
    beats: [
      { id: '5.1', title: "Tay Sonder's Challenge", reqLv: 75, panels: [{ speaker: 'Tay Sonder', text: 'Miller Redwolf is declared Enemy of the State. Deploy the Five Elites.' }, { speaker: 'Leonard', text: 'Five S-Ranks?! Okay, maybe panic a tiny bit!' }, { speaker: 'Miller', text: 'No more hiding. Stage 5 — Transcendence.' }] },
      { id: '5.2', title: 'God of Void', reqLv: 90, panels: [{ speaker: 'Tay Sonder', text: 'Impossible! You shattered Dual Tether?!' }, { speaker: 'Miller', text: 'The Void was never a tool. It is who I am.' }, { speaker: 'Narrator', text: 'All allies stand behind him before a new horizon. This is only the awakening.' }] },
    ],
  },
];

export function xpForNextLevel(level) {
  if (level <= 10) return 100 + level * 20;
  if (level <= 25) return 300 + level * 25;
  if (level <= 40) return 500 + level * 35;
  if (level <= 70) return 700 + level * 50;
  return 1000 + level * 80;
}

export function getCodexStageInfo(level) {
  if (level < 10) return { stage: 1, name: 'Awakening' };
  if (level < 25) return { stage: 2, name: 'The Embrace' };
  if (level < 45) return { stage: 3, name: 'The Descent' };
  if (level < 75) return { stage: 4, name: 'The Apex' };
  return { stage: 5, name: 'Transcendence' };
}

export function getUnlockedSlots(level) {
  return {
    activeSlots: level >= 25 ? 2 : 1,
    hasPassive: level >= 45,
    hasUltimate: level >= 75,
  };
}
