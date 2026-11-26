// MILLER: VOID RUN — In-Game Motion Library & Aligned Set-Piece Scene Definitions
// Derived from timing & biomechanical phase analysis of the 8 reference videos in SharedArt/motions:
//   1. Dynamic-Locomotion-animations       -> locomotion (accel lean, sprint cadence, decel brake, lane pivot)
//   2. Rolls-and-Dodges-Animation-set      -> roll & dodge_roll (tucked ground roll & diagonal lane-dodge roll)
//   3. Flips-and-Tricks-Animation-Set      -> front_flip, back_flip, side_aerial (acrobatic jump & ring tricks)
//   4. Dynamic-Wall-Run-Blueprints         -> wall_run_left, wall_run_right, wall_jump (banked wall stride & kick-off)
//   5. Climbing-Animation-Set              -> climb_ascend, climb_mantle (back-view hand-over-hand climb & ledge pull-up)
//   6. Paraglider-Blueprints               -> paraglider_glide, updraft_rise (overhead wing deploy, bar hang & banking)
//   7. Mage-Animation-Set                  -> mage_cast, mage_channel (dual glowing hand orbs, wind-up & spell throw)
//   8. First-Person-Sword-and-Shield       -> sword_combo_1..3, shield_block, shield_bash (3-hit cadence & aegis bash)

export const MOTION_SPECS = {
  locomotion: {
    id: 'locomotion',
    sourceVideo: 'YTDown.com_YouTube_Media_PsYYDN6tTAQ_Dynamic-Locomotion-animations-for-UE4_001_1080p.mp4',
    title: 'Dynamic Locomotion',
    duration: 0, // Continuous base state
    phases: [
      { name: 'accel_lean', range: [0.0, 0.25], torsoPitch: -0.34, strideRate: 1.15 },
      { name: 'steady_sprint', range: [0.25, 0.75], torsoPitch: -0.26, strideRate: 1.0 },
      { name: 'decel_brake', range: [0.75, 0.9], torsoPitch: 0.16, strideRate: 0.85 },
      { name: 'lane_pivot', range: [0.9, 1.0], bankAngle: 0.36, pelvisTwist: 0.28 },
    ],
    signatureChars: ['miller', 'leonard', 'nyx'],
  },
  roll: {
    id: 'roll',
    sourceVideo: 'YTDown.com_YouTube_Media_xqFnBhpoyw0_Rolls-and-Dodges-Animation-set-for-UE4_001_1080p.mp4',
    title: 'Tactical Ground Roll & Dodge Roll',
    duration: 0.52,
    phases: [
      { name: 'crouch_gather', range: [0.0, 0.18] },
      { name: 'tucked_somersault', range: [0.18, 0.82] },
      { name: 'recovery_push', range: [0.82, 1.0] },
    ],
    signatureChars: ['nyx', 'rumbidzai', 'miller'],
  },
  flip: {
    id: 'flip',
    sourceVideo: 'YTDown.com_YouTube_Media_UxxcXMbZfFM_Flips-and-Tricks-Animation-Set-for-UE4_001_1080p.mp4',
    title: 'Acrobatic Flips & Aerial Tricks',
    duration: 0.62,
    variants: ['front_flip', 'back_flip', 'side_aerial'],
    phases: [
      { name: 'launch_set', range: [0.0, 0.16] },
      { name: 'aerial_tuck_spin', range: [0.16, 0.78] },
      { name: 'landing_extend', range: [0.78, 1.0] },
    ],
    signatureChars: ['nyx', 'rumbidzai', 'leonard'],
  },
  wall_run: {
    id: 'wall_run',
    sourceVideo: 'YTDown.com_YouTube_Media_sJUMDcvUsNY_Dynamic-Wall-Run-Blueprints-and-Animations-for-UE4_001_1080p.mp4',
    title: 'Dynamic Wall-Run & Wall-Jump',
    duration: 1.15,
    phases: [
      { name: 'wall_latch', range: [0.0, 0.15], bodyRoll: 0.46, heightY: 1.15 },
      { name: 'wall_stride', range: [0.15, 0.85], bodyRoll: 0.48, heightY: 1.18 },
      { name: 'wall_kickoff', range: [0.85, 1.0], bodyRoll: -0.25, kickVelY: 9.5 },
    ],
    signatureChars: ['rumbidzai', 'nyx', 'leonard'],
  },
  climb: {
    id: 'climb',
    sourceVideo: 'YTDown.com_YouTube_Media_kYeV-AK24jE_Climbing-Animation-Set-for-UE4_001_1080p.mp4',
    title: 'Vertical Ascent Climb & Ledge Mantle',
    duration: 0.82,
    phases: [
      { name: 'wall_grab', range: [0.0, 0.15] },
      { name: 'hand_over_hand_climb', range: [0.15, 0.76] },
      { name: 'ledge_mantle_vault', range: [0.76, 1.0] },
    ],
    signatureChars: ['james', 'brann', 'miller'],
  },
  paraglider: {
    id: 'paraglider',
    sourceVideo: 'YTDown.com_YouTube_Media_uq1axwa3Das_Paraglider-Blueprints-and-Animations-for-UE4_001_1080p.mp4',
    title: 'Void Paraglider & Updraft Soar',
    duration: 2.8,
    phases: [
      { name: 'canopy_deploy', range: [0.0, 0.14], cruiseY: 2.35 },
      { name: 'suspended_bank_glide', range: [0.14, 0.88], cruiseY: 2.35 },
      { name: 'flare_touchdown', range: [0.88, 1.0], cruiseY: 0.0 },
    ],
    signatureChars: ['felix', 'leonard', 'elara'],
  },
  mage_cast: {
    id: 'mage_cast',
    sourceVideo: 'YTDown.com_YouTube_Media_15pr8o-GAVk_Mage-Animation-Set-for-UE4_001_1080p.mp4',
    title: 'Arcane Dual-Orb Spellcast & Barrage',
    duration: 0.54,
    phases: [
      { name: 'orb_charge_gather', range: [0.0, 0.26] },
      { name: 'dual_palm_projection', range: [0.26, 0.7] },
      { name: 'arcane_followthrough', range: [0.7, 1.0] },
    ],
    signatureChars: ['elara', 'harry', 'felix', 'miller', 'precious'],
  },
  sword_shield: {
    id: 'sword_shield',
    sourceVideo: 'YTDown.com_YouTube_Media_sU7jk2OQlgc_First-Person-Sword-and-Shield-animations-for-UE4_001_1080p.mp4',
    title: '3-Hit Weapon Cadence & Aegis Shield Bash',
    duration: 0.52,
    variants: ['combo_slash_1', 'combo_cleave_2', 'combo_thrust_3', 'shield_bash'],
    phases: [
      { name: 'guard_windup', range: [0.0, 0.22] },
      { name: 'strike_or_bash_impact', range: [0.22, 0.68] },
      { name: 'guard_recovery', range: [0.68, 1.0] },
    ],
    signatureChars: ['brann', 'alton', 'james', 'miller'],
  },
};

/**
 * 8 In-Game Aligned Set-Piece Scenes.
 * Each scene configures chunk obstacles, interactive motion props, camera framing, and environmental pacing
 * to directly showcase its paired motion during active gameplay runs (and can be selected directly in Loadout).
 */
export const MOTION_SCENES = [
  {
    id: 'scene_sprint_gauntlet',
    motionId: 'locomotion',
    name: 'Sprint Gauntlet',
    icon: '🏃',
    subtitle: 'Dynamic Locomotion · High-Speed Slalom',
    sourceVideo: MOTION_SPECS.locomotion.sourceVideo,
    preferredWorlds: [1, 2],
    camera: { camYOffset: -0.35, fovOffset: 4, rollMult: 1.35, lookYOffset: -0.1 },
    speedMult: 1.12,
    desc: 'High-cadence sprint corridor with staggered slalom monoliths that showcase acceleration lean and sharp lane-pivot banking.',
  },
  {
    id: 'scene_roll_corridor',
    motionId: 'roll',
    name: 'Tactical Roll Corridor',
    icon: '🛞',
    subtitle: 'Rolls & Dodges · Low Beam & Sweeper Weaving',
    sourceVideo: MOTION_SPECS.roll.sourceVideo,
    preferredWorlds: [1, 3, 6],
    camera: { camYOffset: -0.5, fovOffset: 2, rollMult: 1.25, lookYOffset: -0.2 },
    speedMult: 1.04,
    desc: 'Sequential overhead energy gates paired with lateral moving orbs designed for tucked ground rolls and diagonal dodge-rolls.',
  },
  {
    id: 'scene_trick_canyon',
    motionId: 'flip',
    name: 'Aerial Trick Canyon',
    icon: '🤸',
    subtitle: 'Flips & Tricks · Launch Ramps & Apex Rings',
    sourceVideo: MOTION_SPECS.flip.sourceVideo,
    preferredWorlds: [1, 4, 7],
    camera: { camYOffset: 0.45, fovOffset: 5, rollMult: 1.2, lookYOffset: 0.25 },
    speedMult: 1.06,
    desc: 'Glowing Launch Ramps and elevated Golden Bonus Rings that trigger front flips, backflips, and mid-air side aerials.',
  },
  {
    id: 'scene_wall_run_alley',
    motionId: 'wall_run',
    name: 'Wall-Run Alley',
    icon: '🧱',
    subtitle: 'Dynamic Wall-Run · Flanking Energy Walls',
    sourceVideo: MOTION_SPECS.wall_run.sourceVideo,
    preferredWorlds: [2, 3, 5],
    camera: { camYOffset: -0.15, fovOffset: 4, rollMult: 1.85, lookYOffset: 0.1 },
    speedMult: 1.08,
    desc: 'Outer-lane vertical Wall-Run Panels above floor hazards — latch onto left/right walls and chain wall-to-wall jumps.',
  },
  {
    id: 'scene_obsidian_ascent',
    motionId: 'climb',
    name: 'Obsidian Ascent',
    icon: '🧗',
    subtitle: 'Climbing Set · Vertical Cliff & Ledge Mantle',
    sourceVideo: MOTION_SPECS.climb.sourceVideo,
    preferredWorlds: [2, 4, 5],
    camera: { camYOffset: 0.35, fovOffset: 2, rollMult: 1.0, lookYOffset: 0.55 },
    speedMult: 0.98,
    desc: 'Stepped vertical Ascent Climb Walls with vertical shard ladders that trigger hand-over-hand climbing and top-ledge mantles.',
  },
  {
    id: 'scene_rift_updraft',
    motionId: 'paraglider',
    name: 'Rift Updraft Skyway',
    icon: '🪂',
    subtitle: 'Paraglider Set · Wind Columns & High Glide',
    sourceVideo: MOTION_SPECS.paraglider.sourceVideo,
    preferredWorlds: [3, 5, 7],
    camera: { camYOffset: 0.65, fovOffset: 6, rollMult: 1.45, lookYOffset: 0.35 },
    speedMult: 1.1,
    desc: 'Launch ramps into cyan Updraft Wind Columns that deploy the Void Paraglider for high-altitude banking flight.',
  },
  {
    id: 'scene_arcane_barrage',
    motionId: 'mage_cast',
    name: 'Arcane Barrage Rift',
    icon: '🔮',
    subtitle: 'Mage Set · Dual-Orb Spellcast & Essence Surge',
    sourceVideo: MOTION_SPECS.mage_cast.sourceVideo,
    preferredWorlds: [3, 6, 7],
    camera: { camYOffset: 0.1, fovOffset: 3, rollMult: 1.15, lookYOffset: 0.05 },
    speedMult: 1.03,
    desc: 'Codex Essence clusters and synchronized Portal Creature waves built for dual-hand Mage spell projection and arcane blasts.',
  },
  {
    id: 'scene_vanguard_duel',
    motionId: 'sword_shield',
    name: 'Vanguard Shield Duel',
    icon: '🛡️',
    subtitle: 'Sword & Shield · 3-Hit Combo & Aegis Bash',
    sourceVideo: MOTION_SPECS.sword_shield.sourceVideo,
    preferredWorlds: [1, 2, 4, 6],
    camera: { camYOffset: -0.2, fovOffset: 2, rollMult: 1.1, lookYOffset: -0.05 },
    speedMult: 1.02,
    desc: 'Armored Portal Creature waves and shield gates showcasing the 3-hit sword combo cadence and Aegis Shield Block & Bash.',
  },
];

export function getMotionSceneById(sceneId) {
  return MOTION_SCENES.find((s) => s.id === sceneId) || null;
}

export function pickAlignedSceneForChunk(worldId, chunkIdx, forcedSceneId = null) {
  if (forcedSceneId && forcedSceneId !== 'auto') {
    const forced = getMotionSceneById(forcedSceneId);
    if (forced) return forced;
  }
  // Every chunk after chunk 1 activates an aligned motion set-piece, rotating through all 8 scenes!
  if (chunkIdx < 1) return null;
  const worldMatches = MOTION_SCENES.filter((s) => s.preferredWorlds.includes(worldId));
  if (chunkIdx % 2 === 1 && worldMatches.length > 0) {
    return worldMatches[Math.floor(chunkIdx / 2) % worldMatches.length];
  }
  return MOTION_SCENES[chunkIdx % MOTION_SCENES.length];
}
