// MILLER: VOID RUN — Persistent Save, Progression, Achievements, Customisation & Stats Manager
// 100% backwards-compatible with existing save data; safe, non-manipulative progression.

import {
  VOID_POWERS,
  CHARACTERS,
  SKILL_TREE,
  WORLDS,
  CONSUMABLES,
  SKINS,
  TRAILS,
  AURA_FX,
  ACHIEVEMENTS,
  GEAR_WEAPONS,
  GEAR_ARMORS,
  GEAR_RELICS,
  xpForNextLevel,
  heroXpForNextLevel,
  getHeroLevelBonuses,
} from '../config/gameData.js';

const SAVE_KEY = 'miller_void_run_save_v1';

function todayKey() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
}

function weekKey() {
  const d = new Date();
  const jan1 = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const wk = Math.ceil((((d - jan1) / 86400000) + jan1.getUTCDay() + 1) / 7);
  return `${d.getUTCFullYear()}-W${wk}`;
}

export function getDailySeedNumber() {
  const s = todayKey();
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (Math.abs(h) % 999999) + 1;
}

function createDefaultSave() {
  return {
    playerName: 'MillerRunner',
    codexLevel: 1,
    codexXP: 0,
    skillPoints: 0,
    unlockedSPNodes: [],
    vs: 400,
    bc: 0,
    vc: 0,
    bestDistance: 0,
    bestScore: 0,
    bestCombo: 0,
    bestNoHit: 0,
    highestWorld: 1,
    totalRuns: 0,
    totalDistance: 0,
    totalScore: 0,
    totalShards: 0,
    totalNearMisses: 0,
    totalPowersUsed: 0,
    totalBonusRings: 0,
    totalBossesDefeated: 0,
    totalEnemiesDefeated: 0,
    totalPlaySeconds: 0,
    selectedChar: 'miller',
    unlockedChars: ['miller'],
    heroProgress: {
      miller: { level: 1, xp: 0 },
    },
    equippedWeapon: 'steel_blade',
    equippedArmor: 'hunter_coat',
    equippedRelic: 'guild_tag',
    unlockedWeapons: ['steel_blade'],
    unlockedArmors: ['hunter_coat'],
    unlockedRelics: ['guild_tag'],
    selectedSkin: 'default',
    unlockedSkins: ['default'],
    selectedTrail: 'violet_spark',
    unlockedTrails: ['violet_spark'],
    selectedAura: 'standard',
    unlockedAuras: ['standard'],
    selectedWorld: 1,
    equippedSlot1: 'flicker',
    equippedSlot2: 'void_sense',
    equippedPassive: null,
    equippedUltimate: null,
    abilityTiers: { flicker: 0, void_sense: 0 },
    consumableStock: {
      ve_potion: 1,
      chaser_repel: 0,
      lucky_charm: 0,
      codex_boost: 0,
      beast_lure: 0,
    },
    activeLoadoutConsumables: [],
    fragmentsCollected: [],
    unlockedAchievements: [],
    seenStoryBeats: [],
    lastMillerPowerUsed: 'flicker',
    // Optional Daily & Weekly goals (zero punishment for skipping days!)
    dailyDate: todayKey(),
    dailyGiftClaimed: false,
    dailySeedPlayed: false,
    dailySeedBest: 0,
    dailyMissions: generateDailyMissions(),
    weeklyId: weekKey(),
    weeklyMissions: generateWeeklyMissions(),
    perRunMissions: generatePerRunMissions(),
    bestGhost: null,
    settings: {
      muted: false,
      musicVol: 0.65,
      sfxVol: 0.85,
      voiceBarks: true,
      highGraphics: true,
      reducedMotion: false,
      colorblind: false,
      touchButtons: false, // Optional on-screen directional pad for accessibility
      healthyReminder: true, // Gentle break suggestion after 25 min continuous play
      uiScale: 'normal',
    },
  };
}

export function generatePerRunMissions() {
  const pool = [
    { id: 'pr_dist', text: 'Run 1,000 m in one run', target: 1000, progress: 0, rewardVS: 60, type: 'dist' },
    { id: 'pr_score', text: 'Score 8,000 points in one run', target: 8000, progress: 0, rewardVS: 75, type: 'score' },
    { id: 'pr_shards', text: 'Collect 90 Void Shards', target: 90, progress: 0, rewardVS: 65, type: 'shards' },
    { id: 'pr_powers', text: 'Use Void Powers 4 times', target: 4, progress: 0, rewardVS: 50, type: 'powers' },
    { id: 'pr_nearmiss', text: 'Achieve 6 near-misses', target: 6, progress: 0, rewardVS: 85, type: 'nearmiss' },
    { id: 'pr_nohit', text: 'Run 350 m without stumbling', target: 350, progress: 0, rewardVS: 95, type: 'nohit' },
    { id: 'pr_ring', text: 'Pass through 2 Golden Bonus Rings', target: 2, progress: 0, rewardVS: 80, type: 'rings' },
  ];
  return pool.sort(() => Math.random() - 0.5).slice(0, 3).map((m) => ({ ...m, done: false }));
}

function generateDailyMissions() {
  return [
    { id: 'd_dist', text: 'Run 2,500 m total (optional)', target: 2500, progress: 0, rewardVS: 160, rewardCE: 10, claimed: false },
    { id: 'd_powers', text: 'Use Void Powers 6 times', target: 6, progress: 0, rewardVS: 110, rewardCE: 6, claimed: false },
    { id: 'd_shards', text: 'Collect 250 Void Shards', target: 250, progress: 0, rewardVS: 140, rewardCE: 8, claimed: false },
  ];
}

function generateWeeklyMissions() {
  return [
    { id: 'w_world', text: 'Reach World 3 in a run', target: 3, progress: 1, rewardVS: 500, rewardBC: 2, claimed: false },
    { id: 'w_boss', text: 'Escape 3 Boss Chases', target: 3, progress: 0, rewardVS: 450, rewardCE: 20, claimed: false },
    { id: 'w_shards', text: 'Collect 2,500 Void Shards', target: 2500, progress: 0, rewardVS: 600, rewardCE: 0, claimed: false },
    { id: 'w_nm', text: 'Achieve 40 near-misses', target: 40, progress: 0, rewardVS: 350, rewardBC: 1, claimed: false },
    { id: 'w_runs', text: 'Complete 12 runs', target: 12, progress: 0, rewardVS: 500, rewardCE: 30, claimed: false },
  ];
}

class SaveManager {
  constructor() {
    this.data = this.load();
    this.checkResets();
  }

  load() {
    const def = createDefaultSave();
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return def;
      const parsed = JSON.parse(raw);
      return {
        ...def,
        ...parsed,
        settings: { ...def.settings, ...(parsed.settings || {}) },
        consumableStock: { ...def.consumableStock, ...(parsed.consumableStock || {}) },
        abilityTiers: { ...def.abilityTiers, ...(parsed.abilityTiers || {}) },
        unlockedTrails: parsed.unlockedTrails || def.unlockedTrails,
        unlockedAuras: parsed.unlockedAuras || def.unlockedAuras,
        unlockedAchievements: parsed.unlockedAchievements || [],
        heroProgress: { ...def.heroProgress, ...(parsed.heroProgress || {}) },
        unlockedWeapons: parsed.unlockedWeapons || def.unlockedWeapons,
        unlockedArmors: parsed.unlockedArmors || def.unlockedArmors,
        unlockedRelics: parsed.unlockedRelics || def.unlockedRelics,
      };
    } catch (_) {
      return def;
    }
  }

  save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
    } catch (_) {}
  }

  checkResets() {
    const td = todayKey();
    if (this.data.dailyDate !== td) {
      this.data.dailyDate = td;
      this.data.dailyGiftClaimed = false;
      this.data.dailySeedPlayed = false;
      this.data.dailySeedBest = 0;
      this.data.dailyMissions = generateDailyMissions();
    }
    const wk = weekKey();
    if (this.data.weeklyId !== wk) {
      this.data.weeklyId = wk;
      this.data.weeklyMissions = generateWeeklyMissions();
    }
    this.syncUnlockedAbilities();
    this.save();
  }

  syncUnlockedAbilities() {
    for (const p of VOID_POWERS) {
      if (this.data.codexLevel >= p.unlockLv && this.data.abilityTiers[p.id] === undefined) {
        this.data.abilityTiers[p.id] = 0;
      }
    }
    if (this.data.codexLevel >= 55 && !this.data.equippedPassive) this.data.equippedPassive = 'void_resonance';
    if (this.data.codexLevel >= 85 && !this.data.equippedUltimate) this.data.equippedUltimate = 'singularity_soul';
  }

  getHeroState(charId = null) {
    const cid = charId || this.data.selectedChar || 'miller';
    if (!this.data.heroProgress[cid]) {
      this.data.heroProgress[cid] = { level: 1, xp: 0 };
    }
    return this.data.heroProgress[cid];
  }

  getEquippedGear() {
    const d = this.data;
    return {
      weapon: GEAR_WEAPONS.find((w) => w.id === d.equippedWeapon) || GEAR_WEAPONS[0],
      armor: GEAR_ARMORS.find((a) => a.id === d.equippedArmor) || GEAR_ARMORS[0],
      relic: GEAR_RELICS.find((r) => r.id === d.equippedRelic) || GEAR_RELICS[0],
    };
  }

  addHeroXP(charId, rawAmount) {
    const st = this.getHeroState(charId);
    const gear = this.getEquippedGear();
    const gain = Math.max(10, Math.round(rawAmount * (gear.relic.xpMult || 1)));
    const prevLevel = st.level;
    const prevXp = st.xp;
    st.xp += gain;
    const leveledUp = [];
    while (st.level < 50) {
      const req = heroXpForNextLevel(st.level);
      if (st.xp >= req) {
        st.xp -= req;
        st.level += 1;
        // Smooth reward per hero level up!
        this.data.vs += 45 + st.level * 10;
        leveledUp.push(st.level);
      } else {
        break;
      }
    }
    this.save();
    return { gain, prevLevel, prevXp, newLevel: st.level, newXp: st.xp, leveledUp };
  }

  buyGear(slot, id) {
    const d = this.data;
    const map = {
      weapon: { list: GEAR_WEAPONS, unlockedKey: 'unlockedWeapons', eqKey: 'equippedWeapon' },
      armor: { list: GEAR_ARMORS, unlockedKey: 'unlockedArmors', eqKey: 'equippedArmor' },
      relic: { list: GEAR_RELICS, unlockedKey: 'unlockedRelics', eqKey: 'equippedRelic' },
    }[slot];
    if (!map) return false;
    const item = map.list.find((x) => x.id === id);
    if (!item) return false;
    if (d[map.unlockedKey].includes(id)) {
      d[map.eqKey] = id;
      this.save();
      return true;
    }
    const heroLv = this.getHeroState().level;
    const maxLv = Math.max(d.codexLevel, heroLv);
    if (maxLv < item.reqLv || d.vs < item.costVS) return false;
    d.vs -= item.costVS;
    d[map.unlockedKey].push(id);
    d[map.eqKey] = id;
    this.evaluateAchievements();
    this.save();
    return true;
  }

  getMaxVE() {
    const heroBonus = getHeroLevelBonuses(this.getHeroState().level).bonusMaxVE;
    return 100 + (this.data.codexLevel - 1) * 5 + heroBonus;
  }

  hasSPNode(id) {
    return this.data.unlockedSPNodes.includes(id);
  }

  isWorldUnlocked(worldId) {
    const w = WORLDS.find((x) => x.id === worldId);
    if (!w) return false;
    return this.data.highestWorld >= worldId || this.data.codexLevel >= w.unlockCodexLv;
  }

  addCodexXP(amount) {
    const mult = this.data.selectedChar === 'miller' ? 1.1 : 1.0;
    const xpGain = Math.round(amount * mult);
    this.data.codexXP += xpGain;
    const leveledUp = [];
    while (this.data.codexLevel < 100) {
      const req = xpForNextLevel(this.data.codexLevel);
      if (this.data.codexXP >= req) {
        this.data.codexXP -= req;
        this.data.codexLevel += 1;
        if (this.data.codexLevel % 3 === 0) this.data.skillPoints += 1;
        if (this.data.codexLevel === 5) this.data.vs += 500;
        leveledUp.push(this.data.codexLevel);
      } else {
        break;
      }
    }
    this.syncUnlockedAbilities();
    this.save();
    return { xpGain, leveledUp };
  }

  evaluateAchievements() {
    const newlyUnlocked = [];
    for (const ach of ACHIEVEMENTS) {
      if (!this.data.unlockedAchievements.includes(ach.id) && ach.check(this.data)) {
        this.data.unlockedAchievements.push(ach.id);
        this.data.vs += ach.rewardVS;
        this.addCodexXP(ach.rewardXP);
        newlyUnlocked.push(ach);
      }
    }
    if (newlyUnlocked.length > 0) this.save();
    return newlyUnlocked;
  }

  recordRunResults(summary) {
    const d = this.data;
    const earnedVS = Math.round(summary.vs);
    const runScore = Math.floor(summary.score || 0);
    const runDist = Math.floor(summary.distance || 0);

    d.vs += earnedVS;
    d.bc += summary.bc;
    d.totalRuns += 1;
    d.totalDistance += runDist;
    d.totalScore += runScore;
    d.totalShards += earnedVS;
    d.totalNearMisses += summary.nearMisses;
    d.totalPowersUsed += summary.powersUsed;
    d.totalBonusRings += summary.bonusRings || 0;
    d.totalBossesDefeated += summary.bossesEscaped;
    d.totalEnemiesDefeated = (d.totalEnemiesDefeated || 0) + (summary.enemiesDefeated || 0);
    d.totalPlaySeconds += Math.round(summary.durationSec || 0);

    if (runDist > d.bestDistance) {
      d.bestDistance = runDist;
      if (summary.ghostData) d.bestGhost = summary.ghostData;
    }
    if (runScore > d.bestScore) d.bestScore = runScore;
    if ((summary.bestCombo || 0) > d.bestCombo) d.bestCombo = summary.bestCombo;
    if (Math.floor(summary.longestNoHit || 0) > d.bestNoHit) d.bestNoHit = Math.floor(summary.longestNoHit);
    if (summary.maxWorld > d.highestWorld) d.highestWorld = summary.maxWorld;

    if (summary.isDaily) {
      d.dailySeedPlayed = true;
      if (runDist > d.dailySeedBest) d.dailySeedBest = runDist;
    }
    for (const frag of summary.fragmentsFound || []) {
      if (!d.fragmentsCollected.includes(frag)) d.fragmentsCollected.push(frag);
    }
    if (d.selectedChar === 'miller' && summary.lastPowerUsed) {
      d.lastMillerPowerUsed = summary.lastPowerUsed;
    }

    // Per-run skill missions
    let missionBonusVS = 0;
    let missionBonusCE = 0;
    let allPerRunDone = true;
    for (const m of d.perRunMissions) {
      if (m.type === 'dist') m.progress = runDist;
      if (m.type === 'score') m.progress = runScore;
      if (m.type === 'shards') m.progress = earnedVS;
      if (m.type === 'powers') m.progress = summary.powersUsed;
      if (m.type === 'nearmiss') m.progress = summary.nearMisses;
      if (m.type === 'nohit') m.progress = Math.floor(summary.longestNoHit || 0);
      if (m.type === 'rings') m.progress = summary.bonusRings || 0;
      if (m.progress >= m.target) {
        m.done = true;
        missionBonusVS += m.rewardVS || 0;
      } else {
        allPerRunDone = false;
      }
    }
    if (allPerRunDone) {
      missionBonusVS += 60;
      missionBonusCE += 5;
    }
    d.vs += missionBonusVS;

    // Optional daily & weekly goals
    if (d.dailyMissions[0]) d.dailyMissions[0].progress += runDist;
    if (d.dailyMissions[1]) d.dailyMissions[1].progress += summary.powersUsed;
    if (d.dailyMissions[2]) d.dailyMissions[2].progress += earnedVS;

    if (d.weeklyMissions[0]) d.weeklyMissions[0].progress = Math.max(d.weeklyMissions[0].progress, summary.maxWorld);
    if (d.weeklyMissions[1]) d.weeklyMissions[1].progress += summary.bossesEscaped;
    if (d.weeklyMissions[2]) d.weeklyMissions[2].progress += earnedVS;
    if (d.weeklyMissions[3]) d.weeklyMissions[3].progress += summary.nearMisses;
    if (d.weeklyMissions[4]) d.weeklyMissions[4].progress += 1;

    let rawXP =
      Math.floor(runDist / 10) +
      Math.floor(runScore / 250) +
      Math.floor(earnedVS * 0.5) +
      summary.nearMisses * 4 +
      (summary.enemiesDefeated || 0) * 14 +
      (summary.bonusRings || 0) * 12 +
      summary.pushbacks * 5 +
      summary.bossesEscaped * 55 +
      summary.worldsCompleted * 35 +
      (summary.ce + missionBonusCE) * 10;

    if (summary.usedCodexBoost) rawXP = Math.round(rawXP * 1.25);

    const levelResult = this.addCodexXP(rawXP);
    const heroXpRaw =
      Math.floor(runDist / 8) +
      (summary.enemiesDefeated || 0) * 18 +
      summary.nearMisses * 6 +
      (summary.bonusRings || 0) * 16 +
      summary.bossesEscaped * 65 +
      25; // Guaranteed smooth progress even on short beginner runs!
    const heroLevelResult = this.addHeroXP(d.selectedChar, heroXpRaw);
    const newlyUnlockedAchievements = this.evaluateAchievements();
    const completedPerRun = d.perRunMissions.filter((m) => m.done);
    d.perRunMissions = generatePerRunMissions();
    this.save();

    return {
      earnedVS: earnedVS + missionBonusVS,
      xpGain: levelResult.xpGain,
      leveledUp: levelResult.leveledUp,
      heroLevelResult,
      completedPerRun,
      allPerRunDone,
      newlyUnlockedAchievements,
    };
  }

  unlockSPNode(nodeId) {
    const node = SKILL_TREE.find((n) => n.id === nodeId);
    if (!node || this.hasSPNode(nodeId) || this.data.skillPoints < node.costSP) return false;
    this.data.skillPoints -= node.costSP;
    this.data.unlockedSPNodes.push(nodeId);
    this.save();
    return true;
  }

  upgradeAbility(abilityId) {
    const cur = this.data.abilityTiers[abilityId];
    if (cur === undefined || cur >= 3) return false;
    const costs = [{ vs: 200, sp: 0 }, { vs: 500, sp: 1 }, { vs: 1200, sp: 2 }][cur];
    if (this.data.vs < costs.vs || this.data.skillPoints < costs.sp) return false;
    this.data.vs -= costs.vs;
    this.data.skillPoints -= costs.sp;
    this.data.abilityTiers[abilityId] = cur + 1;
    this.save();
    return true;
  }

  unlockCharacter(charId) {
    const c = CHARACTERS.find((x) => x.id === charId);
    if (!c || this.data.unlockedChars.includes(charId)) return false;
    if (this.data.codexLevel < c.reqLv || this.data.vs < c.costVS || this.data.bc < c.costBC) return false;
    this.data.vs -= c.costVS;
    this.data.bc -= c.costBC;
    this.data.unlockedChars.push(charId);
    this.data.selectedChar = charId;
    this.evaluateAchievements();
    this.save();
    return true;
  }

  buySkin(skinId) {
    const sk = SKINS.find((x) => x.id === skinId);
    if (!sk) return false;
    if (this.data.unlockedSkins.includes(skinId)) {
      this.data.selectedSkin = skinId;
      this.save();
      return true;
    }
    if (this.data.vs < sk.costVS) return false;
    this.data.vs -= sk.costVS;
    this.data.unlockedSkins.push(skinId);
    this.data.selectedSkin = skinId;
    this.evaluateAchievements();
    this.save();
    return true;
  }

  buyTrail(trailId) {
    const tr = TRAILS.find((x) => x.id === trailId);
    if (!tr) return false;
    if (this.data.unlockedTrails.includes(trailId)) {
      this.data.selectedTrail = trailId;
      this.save();
      return true;
    }
    if (this.data.vs < tr.costVS) return false;
    this.data.vs -= tr.costVS;
    this.data.unlockedTrails.push(trailId);
    this.data.selectedTrail = trailId;
    this.evaluateAchievements();
    this.save();
    return true;
  }

  buyAura(auraId) {
    const au = AURA_FX.find((x) => x.id === auraId);
    if (!au) return false;
    if (this.data.unlockedAuras.includes(auraId)) {
      this.data.selectedAura = auraId;
      this.save();
      return true;
    }
    if (this.data.vs < au.costVS) return false;
    this.data.vs -= au.costVS;
    this.data.unlockedAuras.push(auraId);
    this.data.selectedAura = auraId;
    this.evaluateAchievements();
    this.save();
    return true;
  }

  buyConsumable(itemId) {
    const item = CONSUMABLES.find((x) => x.id === itemId);
    if (!item || this.data.vs < item.costVS) return false;
    this.data.vs -= item.costVS;
    this.data.consumableStock[itemId] = (this.data.consumableStock[itemId] || 0) + 1;
    this.save();
    return true;
  }
}

export const saveManager = new SaveManager();
