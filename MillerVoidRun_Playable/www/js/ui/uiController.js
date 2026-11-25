// MILLER: VOID RUN — Upgraded Commercial Arcade UI Controller
// Features: Main Menu, Style Studio (7 Runners, 8 Colour Skins, 6 Trails, 4 Aura FX),
// 16 Achievements with Celebration Toast, Player Stats, Codex, Skill Goals, Leaderboards,
// Unified Celebratory Results Screen (animated score count-up, zero FOMO), Accessibility & Healthy Play Care.

import {
  WORLDS,
  VOID_POWERS,
  ABILITY_UPGRADE_COSTS,
  CHARACTERS,
  SKILL_TREE,
  CONSUMABLES,
  SKINS,
  TRAILS,
  AURA_FX,
  GEAR_WEAPONS,
  GEAR_ARMORS,
  GEAR_RELICS,
  ACHIEVEMENTS,
  CODEX_MILESTONES,
  STORY_ACTS,
  xpForNextLevel,
  heroXpForNextLevel,
  getHeroLevelBonuses,
  getCodexStageInfo,
  getUnlockedSlots,
} from '../config/gameData.js';
import { saveManager, getDailySeedNumber } from '../core/saveManager.js';
import { audioEngine } from '../core/audioEngine.js';
import { NativeBridge, SERVICE_CONFIG } from '../config/servicesConfig.js';
import { VoidRunEngine } from '../game/engine.js';

const $ = (id) => document.getElementById(id);

class UIController {
  constructor() {
    this.currentScreen = 'splash';
    this.selectedCharIdx = Math.max(0, CHARACTERS.findIndex((c) => c.id === saveManager.data.selectedChar));
    this.activeCustTab = 'runners';
    this.csViewMode = 'front';
    this.csRunPreviewIv = null;
    this.lastRunSummary = null;
    this.lastRunRecord = null;
    this.clipReplayIv = null;
    this.pendingChallenge = null;
    this.sessionStartMs = performance.now();
    this.breakReminded = false;

    this.applySettingsVisuals();
    this.parseDeepLink();

    this.engine = new VoidRunEngine($('game-canvas'), {
      onHudUpdate: (s) => this.updateHud(s),
      onGameOver: (info) => this.handleGameOver(info),
      onBossAlert: (b) => this.updateBossHud(b),
      onPowerToast: (msg) => this.showToast(msg),
      onFloatingPopup: (text, color) => this.spawnFloatingPopup(text, color),
      onWorldShift: (w) => this.showToast(`🌀 WORLD ${w.id}: ${w.name.toUpperCase()}`),
      onPauseRequest: () => this.togglePauseModal(),
    });

    this.bindEvents();
    this.refreshStatusBars();

    setTimeout(() => {
      if (this.currentScreen === 'splash') this.goTo('menu');
    }, 1800);
  }

  parseDeepLink() {
    try {
      const params = new URLSearchParams(window.location.search);
      const d = Number(params.get('d'));
      const u = params.get('u');
      const seed = Number(params.get('seed'));
      if (d > 0 && u) this.pendingChallenge = { dist: d, user: u, seed: seed || 424242 };
    } catch (_) {}
  }

  applySettingsVisuals() {
    const s = saveManager.data.settings;
    audioEngine.applySettings(s);
    document.body.classList.toggle('colorblind', !!s.colorblind);
    $('hud-touch-pad')?.classList.toggle('hidden', !s.touchButtons);
    const muteIcon = s.muted ? '🔇' : '🔊';
    if ($('btn-mute-quick')) $('btn-mute-quick').textContent = muteIcon;
    if ($('btn-pause-mute')) $('btn-pause-mute').textContent = `${muteIcon} Sound: ${s.muted ? 'MUTED' : 'ON'}`;
  }

  toggleMute() {
    saveManager.data.settings.muted = !saveManager.data.settings.muted;
    saveManager.save();
    this.applySettingsVisuals();
    if (!saveManager.data.settings.muted) audioEngine.playUiClick();
  }

  goTo(screenName) {
    const wipe = $('void-wipe');
    if (wipe && this.currentScreen !== 'splash' && !saveManager.data.settings.reducedMotion) {
      wipe.classList.add('active');
      setTimeout(() => wipe.classList.remove('active'), 175);
    }

    document.querySelectorAll('.screen').forEach((el) => el.classList.add('hidden'));
    const target = $(`screen-${screenName}`);
    if (target) target.classList.remove('hidden');
    this.currentScreen = screenName;

    this.refreshStatusBars();
    if (screenName !== 'charselect') this.stopCharSelectPreview();

    if (screenName === 'menu') {
      this.engine.showMenuMode();
      this.renderMenuBadges();
      audioEngine.startMenuAmbience();
      if (this.pendingChallenge) this.openChallengePrompt(this.pendingChallenge);
      this.checkHealthyPlayReminder();
    } else if (screenName === 'charselect') {
      this.selectedCharIdx = Math.max(0, CHARACTERS.findIndex((c) => c.id === saveManager.data.selectedChar));
      this.renderCharSelect();
    } else if (screenName === 'loadout') {
      this.renderLoadout();
    } else if (screenName === 'customise') {
      this.engine.showMenuMode();
      this.renderCustomiseStudio(this.activeCustTab);
    } else if (screenName === 'codex') {
      this.renderCodex('abilities');
    } else if (screenName === 'achievements') {
      this.renderAchievements();
    } else if (screenName === 'stats') {
      this.renderStats();
    } else if (screenName === 'missions') {
      this.renderMissions();
    } else if (screenName === 'social') {
      this.renderLeaderboard();
    } else if (screenName === 'story') {
      this.renderStoryJournal();
    } else if (screenName === 'settings') {
      this.renderSettings();
    }
  }

  checkHealthyPlayReminder() {
    if (!saveManager.data.settings.healthyReminder || this.breakReminded) return;
    const mins = (performance.now() - this.sessionStartMs) / 60000;
    if (mins >= 25) {
      this.breakReminded = true;
      this.showToast('💙 Great runs! Remember to stretch & rest your eyes.');
    }
  }

  bindEvents() {
    $('screen-splash').addEventListener('click', () => {
      audioEngine.init();
      audioEngine.playUiClick();
      this.goTo('menu');
    });

    // Main Menu
    $('btn-mute-quick').addEventListener('click', () => this.toggleMute());
    $('btn-play').addEventListener('click', () => { audioEngine.playUiClick(); this.goTo('loadout'); });
    $('btn-char-select').addEventListener('click', () => { audioEngine.playUiClick(); this.goTo('charselect'); });
    $('menu-hero-avatar').addEventListener('click', () => { audioEngine.playUiClick(); this.goTo('charselect'); });
    $('btn-loadout-switch-hero').addEventListener('click', () => { audioEngine.playUiClick(); this.goTo('charselect'); });
    $('btn-daily').addEventListener('click', () => { audioEngine.playUiClick(); this.launchDailyChallenge(); });

    // Character Select View Toggle Buttons
    document.querySelectorAll('[data-cs-view]').forEach((btn) => {
      btn.addEventListener('click', () => {
        audioEngine.playUiClick();
        this.csViewMode = btn.dataset.csView;
        this.renderCharSelect();
      });
    });
    $('nav-customise').addEventListener('click', () => { audioEngine.playUiClick(); this.goTo('customise'); });
    $('nav-codex').addEventListener('click', () => { audioEngine.playUiClick(); this.goTo('codex'); });
    $('nav-missions').addEventListener('click', () => { audioEngine.playUiClick(); this.goTo('missions'); });
    $('nav-social').addEventListener('click', () => { audioEngine.playUiClick(); this.goTo('social'); });
    $('btn-achievements').addEventListener('click', () => { audioEngine.playUiClick(); this.goTo('achievements'); });
    $('btn-stats').addEventListener('click', () => { audioEngine.playUiClick(); this.goTo('stats'); });
    $('btn-story').addEventListener('click', () => { audioEngine.playUiClick(); this.goTo('story'); });
    $('btn-settings').addEventListener('click', () => { audioEngine.playUiClick(); this.goTo('settings'); });
    $('btn-daily-gift').addEventListener('click', () => this.claimFreeDailyGift());

    document.querySelectorAll('[data-back]').forEach((b) => {
      b.addEventListener('click', () => { audioEngine.playUiClick(); this.goTo(b.dataset.back || 'menu'); });
    });

    // Loadout Start Run
    $('btn-start-run').addEventListener('click', () => {
      audioEngine.playUiClick();
      this.startStandardRun({ worldId: saveManager.data.selectedWorld });
    });

    // HUD Void Power Button (Tap = Cast, Double-Tap = Swap)
    let lastVoidTap = 0;
    const voidBtn = $('btn-void-power');
    const handleVoidPress = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const now = performance.now();
      if (now - lastVoidTap < 280) {
        this.engine.swapVoidPower();
        lastVoidTap = 0;
      } else {
        lastVoidTap = now;
        this.engine.triggerVoidPower();
      }
    };
    voidBtn.addEventListener('touchstart', handleVoidPress, { passive: false });
    voidBtn.addEventListener('click', (e) => { if (e.detail > 0) handleVoidPress(e); });

    const strikeBtn = $('btn-gear-strike');
    const handleStrike = (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.engine.triggerGearStrike();
    };
    strikeBtn.addEventListener('touchstart', handleStrike, { passive: false });
    strikeBtn.addEventListener('click', (e) => { if (e.detail > 0) handleStrike(e); });

    $('btn-void-ult').addEventListener('click', (e) => { e.stopPropagation(); this.engine.triggerUltimate(); });
    $('btn-hud-cam').addEventListener('click', (e) => { e.stopPropagation(); this.engine.manualBookmarkClip(); });
    $('btn-hud-pause').addEventListener('click', (e) => { e.stopPropagation(); this.togglePauseModal(); });

    // Accessible On-Screen Tap Buttons
    const bindPad = (id, dir) => {
      const el = $(id);
      if (!el) return;
      el.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); this.engine.handleInput(dir); }, { passive: false });
      el.addEventListener('click', (e) => { e.stopPropagation(); if (e.detail > 0) this.engine.handleInput(dir); });
    };
    bindPad('pad-left', 'left');
    bindPad('pad-up', 'up');
    bindPad('pad-down', 'down');
    bindPad('pad-right', 'right');

    // Pause Modal
    $('btn-pause-mute').addEventListener('click', () => this.toggleMute());
    $('btn-resume').addEventListener('click', () => this.togglePauseModal());
    $('btn-pause-restart').addEventListener('click', () => {
      $('modal-pause').classList.add('hidden');
      this.startStandardRun({ worldId: saveManager.data.selectedWorld });
    });
    $('btn-quit-run').addEventListener('click', () => {
      $('modal-pause').classList.add('hidden');
      this.engine.triggerGameOver('Ended Run');
    });

    // Results Screen
    $('btn-second-wind').addEventListener('click', () => {
      if (this.engine.reviveWithSecondWind()) {
        this.goTo('hud');
      }
    });
    $('btn-play-again').addEventListener('click', () => {
      audioEngine.playUiClick();
      this.startStandardRun({ worldId: saveManager.data.selectedWorld });
    });
    $('btn-results-menu').addEventListener('click', () => {
      audioEngine.playUiClick();
      this.goTo('menu');
    });
    $('btn-res-clip').addEventListener('click', () => this.openBestMomentModal());
    $('btn-res-share').addEventListener('click', () => this.shareBeatDistance());

    $('btn-close-clip').addEventListener('click', () => {
      clearInterval(this.clipReplayIv);
      $('modal-clip').classList.add('hidden');
    });
    $('btn-share-clip').addEventListener('click', () => {
      const s = this.lastRunSummary;
      NativeBridge.shareText(
        'MILLER: VOID RUN — Best Moment',
        `🔥 "${s.bestMomentLabel}" at ${Math.floor(s.bestMomentDist)}m · Score ${s.score.toLocaleString()} in MILLER: VOID RUN!`
      );
      this.showToast('📤 Highlight Share Copied!');
    });

    // Customisation Studio Tabs
    document.querySelectorAll('[data-cust-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        audioEngine.playUiClick();
        this.activeCustTab = btn.dataset.custTab;
        this.renderCustomiseStudio(this.activeCustTab);
      });
    });

    // Codex Tabs
    document.querySelectorAll('[data-codex-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        audioEngine.playUiClick();
        this.renderCodex(btn.dataset.codexTab);
      });
    });

    $('btn-close-story-modal').addEventListener('click', () => $('modal-story').classList.add('hidden'));
    $('btn-close-art-modal').addEventListener('click', () => $('modal-art').classList.add('hidden'));
  }

  openArtModal(title, imgSrc) {
    $('art-modal-title').textContent = title;
    $('art-modal-img').src = imgSrc;
    $('modal-art').classList.remove('hidden');
  }

  togglePauseModal() {
    const paused = this.engine.togglePause();
    $('modal-pause').classList.toggle('hidden', !paused);
  }

  refreshStatusBars() {
    const d = saveManager.data;
    const req = xpForNextLevel(d.codexLevel);
    const pct = Math.min(100, Math.round((d.codexXP / req) * 100));
    const stage = getCodexStageInfo(d.codexLevel);

    $('menu-codex-lv').textContent = `Codex Lv ${d.codexLevel} · ${stage.name}`;
    $('menu-xp-bar').style.width = `${pct}%`;
    $('menu-vs').textContent = `${d.vs.toLocaleString()} 🔮`;
    $('menu-bc').textContent = `${d.bc} 🟡`;
    $('menu-best-score').textContent = `★ BEST: ${d.bestScore.toLocaleString()}`;
    $('menu-best-dist').textContent = `🏃 ${d.bestDistance.toLocaleString()} m`;
    $('ach-count-mini').textContent = `${d.unlockedAchievements.length}/${ACHIEVEMENTS.length}`;
    if ($('cust-vs-pill')) $('cust-vs-pill').textContent = `${d.vs.toLocaleString()} 🔮`;
    if ($('cs-vs-pill')) $('cs-vs-pill').textContent = `${d.vs.toLocaleString()} 🔮`;

    // Sync active runner portrait across Menu, Loadout & HUD
    const curChar = CHARACTERS.find((c) => c.id === d.selectedChar) || CHARACTERS[0];
    const portraitSrc = curChar.portrait || 'assets/art/characters/miller_portrait.jpg';
    ['menu-hero-avatar', 'loadout-hero-avatar', 'hud-hero-avatar'].forEach((id) => {
      const img = $(id);
      if (img) img.src = portraitSrc;
    });
    if ($('hud-callsign')) $('hud-callsign').textContent = curChar.name.split(' ')[0].toUpperCase();
  }

  renderMenuBadges() {
    const d = saveManager.data;
    $('gift-dot').classList.toggle('hidden', d.dailyGiftClaimed);
    $('btn-daily').textContent = d.dailySeedPlayed
      ? `📅 DAILY SEED COMPLETE (Best: ${d.dailySeedBest}m)`
      : `📅 OPTIONAL DAILY SEED #${getDailySeedNumber()}`;
  }

  claimFreeDailyGift() {
    const d = saveManager.data;
    if (d.dailyGiftClaimed) {
      this.showToast('🎁 Today’s Free Gift is already in your pouch!');
      return;
    }
    const vs = 200;
    d.vs += vs;
    d.dailyGiftClaimed = true;
    saveManager.save();
    audioEngine.playAchievement();
    this.refreshStatusBars();
    this.renderMenuBadges();
    this.showToast(`🎁 Free Daily Gift Claimed: +${vs} Void Shards!`);
  }

  showAchievementToast(ach) {
    $('ach-toast-icon').textContent = ach.icon;
    $('ach-toast-title').textContent = `${ach.title} (${ach.tier})`;
    $('ach-toast-reward').textContent = `+${ach.rewardVS} VS · +${ach.rewardXP} XP`;
    $('ach-toast').classList.add('show');
    audioEngine.playAchievement();
    setTimeout(() => $('ach-toast').classList.remove('show'), 3200);
  }

  spawnFloatingPopup(text, color = '#00E5FF') {
    const box = $('floating-popups');
    if (!box) return;
    const el = document.createElement('div');
    el.className = 'float-pop';
    el.style.color = color;
    el.textContent = text;
    box.appendChild(el);
    setTimeout(() => el.remove(), 1100);
  }

  // --- DEDICATED CHARACTER SELECT SCREEN ---
  stopCharSelectPreview() {
    if (this.csRunPreviewIv) {
      clearInterval(this.csRunPreviewIv);
      this.csRunPreviewIv = null;
    }
    $('screen-charselect')?.classList.remove('cs-live-3d');
    this.engine?.setMenuPreviewMotion('idle');
  }

  renderCharSelect() {
    const d = saveManager.data;
    const c = CHARACTERS[this.selectedCharIdx] || CHARACTERS[0];
    const unlocked = d.unlockedChars.includes(c.id);
    const equipped = d.selectedChar === c.id;

    // Keep live 3D runner synced in background too
    this.engine.refreshMenuCharacter(c.id, d.selectedSkin);

    // Update splash art backdrop (falls back to key art for unlockable GDD allies)
    const bgImg = $('cs-bg-splash');
    bgImg.src = c.splash || 'assets/art/key_art_poster.jpg';

    // Update full-body sprite stage: Front/Side/Back show crisp 2D cutouts; Run & Atk run the LIVE 3D 10-part skeletal rig!
    this.stopCharSelectPreview();
    const csScreen = $('screen-charselect');
    const spriteImg = $('cs-sprite-img');
    const fallbackEl = $('cs-stage-fallback');
    const viewBar = document.querySelector('.cs-view-bar');
    document.querySelectorAll('[data-cs-view]').forEach((b) => b.classList.toggle('active', b.dataset.csView === this.csViewMode));

    if (c.sprites) {
      fallbackEl.classList.add('hidden');
      if (viewBar) viewBar.style.display = 'flex';
      spriteImg.classList.remove('anim-breathe', 'anim-run', 'anim-attack');

      if (this.csViewMode === 'run' || this.csViewMode === 'attack') {
        // Reveal the REAL LIVE 3D skeletal runner sprinting or attacking right on the Character Select stage!
        spriteImg.classList.add('hidden');
        csScreen.classList.add('cs-live-3d');
        this.engine.setMenuPreviewMotion(this.csViewMode, c.id);
      } else {
        spriteImg.classList.remove('hidden');
        csScreen.classList.remove('cs-live-3d');
        this.engine.setMenuPreviewMotion('idle', c.id);
        spriteImg.src = c.sprites[this.csViewMode] || c.sprites.front;
        spriteImg.classList.add('anim-breathe');
      }
    } else {
      spriteImg.classList.add('hidden');
      fallbackEl.classList.remove('hidden');
      fallbackEl.textContent = c.initials;
      if (viewBar) viewBar.style.display = 'none';
    }

    const splashBtn = $('cs-btn-splash');
    if (splashBtn) {
      splashBtn.style.display = c.splash ? 'inline-block' : 'none';
      splashBtn.onclick = () => this.openArtModal(`${c.name} — Hero Splash`, c.splash);
    }

    // Hero Level, smooth XP progress & combat stats
    const hSt = saveManager.getHeroState(c.id);
    const hReq = heroXpForNextLevel(hSt.level);
    const hPct = Math.min(100, Math.round((hSt.xp / hReq) * 100));
    const hBon = getHeroLevelBonuses(hSt.level);

    $('cs-name').textContent = c.name;
    $('cs-badge').classList.toggle('hidden', !c.featured);
    $('cs-title').textContent = c.title;
    $('cs-hero-lv').textContent = `Hero Lv ${hSt.level} (${hSt.xp}/${hReq} XP)`;
    $('cs-hero-rank').textContent = hBon.rank;
    $('cs-hero-xp-bar').style.width = `${hPct}%`;
    $('cs-bonuses').innerHTML = `Bonuses: <strong>+${Math.round((hBon.rangeMult - 1) * 100)}% Strike</strong> · <strong>+${Math.round(hBon.slowResist * 100)}% Slow Resist</strong> · <strong>+${hBon.bonusMaxVE} VE</strong>`;
    $('cs-passive').innerHTML = `<strong>Passive:</strong> ${c.passiveName} — ${c.passiveDesc}`;
    $('cs-sig').innerHTML = `<strong>Signature:</strong> ${c.sigName} — ${c.sigDesc}`;

    // Visual Portrait Roster Cards
    const roster = $('cs-roster');
    roster.innerHTML = '';
    CHARACTERS.forEach((ch, idx) => {
      const isUnlocked = d.unlockedChars.includes(ch.id);
      const isEquipped = d.selectedChar === ch.id;
      const isSelected = idx === this.selectedCharIdx;
      const card = document.createElement('button');
      card.className = `cs-card ${isSelected ? 'selected' : ''} ${isEquipped ? 'equipped' : ''} ${!isUnlocked ? 'locked' : ''}`;
      const thumb = ch.portrait
        ? `<img class="cs-card-thumb" src="${ch.portrait}" alt="${ch.name}" />`
        : `<div class="cs-card-init">${ch.initials}</div>`;
      const firstName = ch.name.split(' ')[0];
      card.innerHTML = `${thumb}<div class="cs-card-label">${isUnlocked ? firstName : `🔒 ${firstName}`}</div>`;
      card.onclick = () => {
        audioEngine.playUiClick();
        this.selectedCharIdx = idx;
        this.renderCharSelect();
      };
      roster.appendChild(card);
    });

    // Equip / Unlock + Instant Play CTA
    const equipBtn = $('cs-btn-equip');
    const playBtn = $('cs-btn-play');
    if (equipped) {
      equipBtn.className = 'btn btn-sm';
      equipBtn.textContent = '✅ EQUIPPED';
      equipBtn.onclick = () => this.showToast(`${c.name} is ready to run!`);
      playBtn.className = 'btn btn-primary btn-sm';
      playBtn.textContent = `▶ PLAY ${c.name.split(' ')[0].toUpperCase()}`;
      playBtn.onclick = () => {
        audioEngine.playUiClick();
        this.startStandardRun({ worldId: saveManager.data.selectedWorld });
      };
    } else if (unlocked) {
      equipBtn.className = 'btn btn-gold btn-sm';
      equipBtn.textContent = '✓ SELECT RUNNER';
      equipBtn.onclick = () => {
        d.selectedChar = c.id;
        saveManager.save();
        audioEngine.playEssence();
        this.refreshStatusBars();
        this.renderCharSelect();
        this.showToast(`👤 Equipped ${c.name}!`);
      };
      playBtn.className = 'btn btn-primary btn-sm';
      playBtn.textContent = `▶ PLAY ${c.name.split(' ')[0].toUpperCase()}`;
      playBtn.onclick = () => {
        d.selectedChar = c.id;
        saveManager.save();
        audioEngine.playUiClick();
        this.refreshStatusBars();
        this.startStandardRun({ worldId: saveManager.data.selectedWorld });
      };
    } else {
      equipBtn.className = 'btn btn-gold btn-sm';
      equipBtn.textContent = `🔓 ${c.costVS.toLocaleString()} VS${c.costBC ? ` + ${c.costBC} BC` : ''}`;
      equipBtn.onclick = () => {
        if (saveManager.unlockCharacter(c.id)) {
          audioEngine.playAchievement();
          this.refreshStatusBars();
          this.renderCharSelect();
          this.showToast(`🎉 Unlocked & Equipped ${c.name}!`);
        } else {
          this.showToast(`Requires Codex Lv ${c.reqLv}, ${c.costVS} VS${c.costBC ? ` & ${c.costBC} BC` : ''}`);
        }
      };
      playBtn.className = 'btn btn-sm';
      playBtn.textContent = `🔒 Lv ${c.reqLv}`;
      playBtn.onclick = () => this.showToast(`Unlock ${c.name} first!`);
    }
  }

  // --- LOADOUT ---
  renderLoadout() {
    const d = saveManager.data;
    const slots = getUnlockedSlots(d.codexLevel);
    const charData = CHARACTERS.find((c) => c.id === d.selectedChar);
    const heroSt = saveManager.getHeroState(d.selectedChar);
    const heroBonus = getHeroLevelBonuses(heroSt.level);
    const gear = saveManager.getEquippedGear();
    $('loadout-char-label').textContent = `${charData.name} · Hero Lv ${heroSt.level} (${heroBonus.rank})`;
    $('loadout-style-label').textContent = `Gear: ${gear.weapon.icon} ${gear.weapon.name} · ${gear.armor.icon} ${gear.armor.name} · ${gear.relic.icon} ${gear.relic.name}`;

    const wGrid = $('loadout-worlds');
    wGrid.innerHTML = '';
    WORLDS.forEach((w) => {
      const unlocked = saveManager.isWorldUnlocked(w.id);
      const active = d.selectedWorld === w.id;
      const btn = document.createElement('button');
      btn.className = `list-item ${active ? 'active-item' : ''}`;
      btn.style.width = '100%';
      btn.style.textAlign = 'left';
      btn.style.cursor = unlocked ? 'pointer' : 'not-allowed';
      btn.style.opacity = unlocked ? '1' : '0.5';
      btn.innerHTML = `
        <img class="world-thumb" src="${w.environArt || 'assets/art/environ/environ_emerald_ruins.jpg'}" alt="${w.name}" />
        <div style="flex:1">
          <strong style="color:${w.accentHex}">W${w.id}: ${w.name}</strong>
          <div style="font-size:11px;opacity:.85">${w.portalType} · ${w.mechanicName}</div>
        </div>
        <span class="pill">${unlocked ? (active ? 'SELECTED' : 'SELECT') : `🔒 Lv ${w.unlockCodexLv}`}</span>
      `;
      if (unlocked) {
        btn.addEventListener('click', () => {
          audioEngine.playUiClick();
          d.selectedWorld = w.id;
          saveManager.save();
          this.renderLoadout();
        });
      }
      wGrid.appendChild(btn);
    });

    const pDiv = $('loadout-powers');
    pDiv.innerHTML = '';
    const unlockedActives = VOID_POWERS.filter((p) => p.slotType === 'active' && d.codexLevel >= p.unlockLv);

    const makeSlotCard = (label, currentId, isLocked, lockMsg, onChange) => {
      const box = document.createElement('div');
      box.className = 'card';
      box.style.marginBottom = '0';
      if (isLocked) {
        box.innerHTML = `<div style="font-size:11px;opacity:.7">${label}</div><strong>🔒 ${lockMsg}</strong>`;
        return box;
      }
      if (d.selectedChar !== 'miller' && label === 'Slot 1') {
        box.innerHTML = `<div style="font-size:11px;opacity:.7">${label} (Signature)</div><strong>${charData.sigName}</strong>`;
        return box;
      }
      const p = VOID_POWERS.find((x) => x.id === currentId) || unlockedActives[0];
      box.innerHTML = `<div style="font-size:11px;opacity:.7">${label}</div><div style="font-weight:900;margin:4px 0">${p.icon} ${p.name}</div><select class="btn btn-sm" style="width:100%;background:#1a1034;color:#fff"></select>`;
      const sel = box.querySelector('select');
      unlockedActives.forEach((ap) => {
        const opt = document.createElement('option');
        opt.value = ap.id;
        opt.textContent = `${ap.icon} ${ap.name} (Lv ${(d.abilityTiers[ap.id] || 0) + 1})`;
        if (ap.id === p.id) opt.selected = true;
        sel.appendChild(opt);
      });
      sel.addEventListener('change', () => onChange(sel.value));
      return box;
    };

    pDiv.appendChild(makeSlotCard('Slot 1', d.equippedSlot1, false, '', (v) => { d.equippedSlot1 = v; saveManager.save(); }));
    pDiv.appendChild(makeSlotCard('Slot 2 (Double-Tap)', d.equippedSlot2, slots.activeSlots < 2, 'Codex Lv 25', (v) => { d.equippedSlot2 = v; saveManager.save(); }));

    const cDiv = $('loadout-consumables');
    cDiv.innerHTML = '';
    CONSUMABLES.forEach((item) => {
      const stock = d.consumableStock[item.id] || 0;
      const active = d.activeLoadoutConsumables.includes(item.id);
      const b = document.createElement('button');
      b.className = `btn btn-sm ${active ? 'btn-primary' : ''}`;
      b.style.flexDirection = 'column';
      b.innerHTML = `<span>${item.icon} ${item.name}</span><span style="font-size:10px;opacity:.88">${stock > 0 ? `Own: ${stock}` : `${item.costVS} VS`}</span>`;
      b.addEventListener('click', () => {
        if (stock <= 0) {
          if (saveManager.buyConsumable(item.id)) {
            d.activeLoadoutConsumables.push(item.id);
            saveManager.save();
            audioEngine.playShard();
            this.refreshStatusBars();
            this.renderLoadout();
          } else {
            this.showToast(`Earn ${item.costVS} VS to craft ${item.name}`);
          }
          return;
        }
        d.activeLoadoutConsumables = active
          ? d.activeLoadoutConsumables.filter((x) => x !== item.id)
          : [...d.activeLoadoutConsumables, item.id];
        saveManager.save();
        this.renderLoadout();
      });
      cDiv.appendChild(b);
    });
  }

  startStandardRun(opts = {}) {
    $('hud-boss-bar').classList.add('hidden');
    $('hud-qte-banner').classList.add('hidden');
    this.goTo('hud');
    this.engine.startRun(opts);
  }

  launchDailyChallenge() {
    if (saveManager.data.dailySeedPlayed) {
      this.showToast(`Today's Daily Seed is complete! Best: ${saveManager.data.dailySeedBest}m`);
      return;
    }
    this.startStandardRun({ isDaily: true, seed: getDailySeedNumber() });
  }

  // --- RUN HUD (Tactical Holographic Telemetry) ---
  updateHud(s) {
    $('hud-score').textContent = s.score.toLocaleString();
    $('hud-mult').textContent = `×${s.multiplier}`;
    $('hud-dist').textContent = `${s.distance.toLocaleString()} m`;
    $('hud-world').textContent = `WORLD 0${s.worldId}`;
    $('hud-world-prog').style.width = `${s.worldProg}%`;
    if ($('hud-gate-pct')) $('hud-gate-pct').textContent = `${s.worldProg}%`;
    if ($('hud-objective')) {
      $('hud-objective').textContent = s.bossActive
        ? `OBJECTIVE: ESCAPE BOSS · ${s.worldName.toUpperCase()}`
        : `OBJECTIVE: REACH THE GATE · ${s.worldName.toUpperCase()}`;
    }

    // Top-Left Run Timer (MM:SS) & Angled SHIELD Plasma Gauge
    if ($('hud-timer')) {
      const sec = Math.max(0, Math.floor(s.elapsedSec || 0));
      const mm = String(Math.floor(sec / 60)).padStart(2, '0');
      const ss = String(sec % 60).padStart(2, '0');
      $('hud-timer').textContent = `${mm}:${ss}`;
    }
    const sh = s.totalShields || 0;
    const shMax = s.maxShields || 2;
    if ($('hud-shield-val')) $('hud-shield-val').textContent = sh > 0 ? `×${sh}` : '0';
    if ($('hud-shield-fill')) $('hud-shield-fill').style.width = `${Math.min(100, Math.round((sh / shMax) * 100))}%`;

    $('hud-vs').textContent = `${s.vs} 🔮`;
    $('hud-ce').textContent = `${s.ce} ✦`;
    $('hud-kills').textContent = `${s.enemiesDefeated || 0} ⚔️`;
    $('hud-bc').textContent = `${s.bc} 🟡`;

    // Segmented charge cells reflect Void Energy charge
    const cells = $('hud-charge-cells')?.children;
    if (cells) {
      const lit = Math.round((s.ve / s.maxVE) * cells.length);
      for (let i = 0; i < cells.length; i++) cells[i].classList.toggle('on', i < lit);
    }

    // Gear Strike orb state
    const sb = $('btn-gear-strike');
    if (sb && s.weapon) {
      const cd = s.weaponCd || 0;
      sb.classList.toggle('cooldown', cd > 0);
      sb.innerHTML = cd > 0
        ? `<span>${cd.toFixed(1)}s</span><span class="p-name">STRIKE</span>`
        : `<span>${s.weapon.icon}</span><span class="p-name">STRIKE</span>`;
    }
    $('fx-enemy-slow')?.classList.toggle('on', !!s.enemySlowed);

    // Top-Right Angled COMBO Plate
    const comboEl = $('hud-combo');
    if (comboEl) {
      const cVal = Math.max(s.multiplier, s.combo || 1);
      comboEl.textContent = `×${cVal}`;
    }

    // Active Power-Up Countdown Pills
    const buffBox = $('hud-buffs');
    const buffSig = s.activeBuffs.map((b) => `${b.icon}${b.label}`).join('|');
    if (buffBox.dataset.sig !== buffSig) {
      buffBox.dataset.sig = buffSig;
      buffBox.innerHTML = s.activeBuffs
        .map((b) => `<span class="buff-chip" style="border-color:${b.color};color:${b.color}">${b.icon} ${b.label}</span>`)
        .join('');
    }

    // Left-Edge Vertical ENERGY Plasma Column
    const vePct = Math.max(0, Math.min(100, (s.ve / s.maxVE) * 100));
    $('hud-ve-fill').style.height = `${vePct}%`;
    $('hud-ve-label').textContent = s.infested ? '☠️' : `${Math.floor(s.ve)}`;

    const vb = $('btn-void-power');
    if (s.power) {
      const ready = s.powerCd <= 0 && s.ve >= s.power.ve;
      vb.classList.toggle('cooldown', !ready);
      vb.innerHTML = s.powerCd > 0
        ? `<span>${Math.ceil(s.powerCd)}s</span><span class="p-name">${s.power.name}</span>`
        : `<span>${s.power.icon}</span><span class="p-name">${s.power.name}${s.canSwap ? ' ⇄' : ''}</span>`;
    }
    $('btn-void-ult').classList.toggle('hidden', !s.hasUltimate);

    // Live 45° Diamond Tactical Threat Radar & Chaser Bar
    const threatPct = Math.max(5, Math.min(100, ((s.chaserMax - s.chaserDist) / s.chaserMax) * 100));
    const laneLeftPct = s.lane === 0 ? 32 : s.lane === 2 ? 68 : 50;
    if ($('radar-player-blip')) $('radar-player-blip').style.left = `${laneLeftPct}%`;
    if ($('radar-chaser-blip')) {
      const chTop = 90 - (threatPct / 100) * 30;
      $('radar-chaser-blip').style.top = `${chTop}%`;
      $('radar-chaser-blip').style.left = `${laneLeftPct}%`;
    }
    const eBlip = $('radar-enemy-blip');
    if (eBlip) {
      if (s.nearestEnemyZ !== null && s.nearestEnemyZ !== undefined) {
        eBlip.classList.remove('hidden');
        eBlip.style.left = `${s.nearestEnemyLane === 0 ? 32 : s.nearestEnemyLane === 2 ? 68 : 50}%`;
        const eTop = Math.max(14, Math.min(50, 50 + (s.nearestEnemyZ / 45) * 36));
        eBlip.style.top = `${eTop}%`;
      } else {
        eBlip.classList.add('hidden');
      }
    }

    const warnPrefix = s.chaserDist < 20 ? '⚠ DANGER · ' : '⚠ ';
    $('hud-chaser-text').textContent = `${warnPrefix}${s.chaserName.toUpperCase()} · ${Math.round(s.chaserDist)}M`;
    $('hud-chaser-fill').style.width = `${threatPct}%`;

    const rm = saveManager.data.settings.reducedMotion;
    $('fx-speed-lines').classList.toggle('on', !rm && !!s.highSpeed);
    $('fx-dark-veil').classList.toggle('on', !!s.darkVeil);
    $('fx-time-bleed').classList.toggle('on', !!s.timeBleed);
    $('fx-void-domain').classList.toggle('on', !!s.voidDomain);
  }

  updateBossHud(b) {
    const bar = $('hud-boss-bar');
    const qte = $('hud-qte-banner');
    if (!b.active) {
      bar.classList.add('hidden');
      qte.classList.add('hidden');
      return;
    }
    bar.classList.remove('hidden');
    $('boss-name').textContent = `⚔️ ${b.name} (${b.faction})`;
    $('boss-phase').textContent = b.phase;
    $('boss-progress').style.width = `${Math.round((b.progress || 0) * 100)}%`;
    if (b.qtePrompt) {
      qte.classList.remove('hidden');
      qte.textContent = `${b.qtePrompt} (${b.qteTimer.toFixed(1)}s)`;
    } else {
      qte.classList.add('hidden');
    }
  }

  showToast(msg) {
    const el = $('hud-toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
  }

  // --- UNIFIED CELEBRATORY RESULTS SCREEN ---
  handleGameOver(info) {
    const s = info.summary;
    this.lastRunSummary = s;
    const prevBestScore = saveManager.data.bestScore;
    const isNewBest = s.score > prevBestScore;
    this.lastRunRecord = saveManager.recordRunResults(s);

    this.goTo('results');
    $('res-reason').textContent = info.reason.toUpperCase();
    $('res-best-badge').classList.toggle('hidden', !isNewBest);

    // Animated Arcade Score count-up!
    const scoreEl = $('res-score');
    const target = s.score;
    const start = performance.now();
    const tickScore = (t) => {
      const p = Math.min(1, (t - start) / 650);
      scoreEl.textContent = Math.floor(target * (1 - Math.pow(1 - p, 3))).toLocaleString();
      if (p < 1) requestAnimationFrame(tickScore);
    };
    requestAnimationFrame(tickScore);

    $('res-dist').textContent = `${Math.floor(s.distance).toLocaleString()} m`;
    $('res-vs').textContent = `+${this.lastRunRecord.earnedVS} 🔮`;
    $('res-xp').textContent = `+${this.lastRunRecord.xpGain} XP`;
    $('res-pb-compare').textContent = isNewBest
      ? `${s.score.toLocaleString()} (Beat ${prevBestScore.toLocaleString()}!)`
      : `${saveManager.data.bestScore.toLocaleString()} (${Math.max(0, saveManager.data.bestScore - s.score).toLocaleString()} away)`;
    $('res-skill').textContent = `${s.enemiesDefeated || 0} Slain · ${s.nearMisses} Near-Miss · ${s.bonusRings || 0} Rings`;
    $('res-worlds').textContent = `World ${s.maxWorld} · ${s.bossesEscaped} Bosses`;

    // Smooth animated Hero Level XP bar!
    const hRes = this.lastRunRecord.heroLevelResult;
    const curHero = CHARACTERS.find((c) => c.id === saveManager.data.selectedChar) || CHARACTERS[0];
    if (hRes) {
      const bonus = getHeroLevelBonuses(hRes.newLevel);
      const req = heroXpForNextLevel(hRes.newLevel);
      const pct = Math.min(100, Math.round((hRes.newXp / req) * 100));
      $('res-hero-lv-label').textContent = `${curHero.name} · Hero Lv ${hRes.newLevel} (${bonus.rank})${hRes.leveledUp.length ? ' ✨ LEVEL UP!' : ''}`;
      $('res-hero-xp-gain').textContent = `+${hRes.gain} Hero XP`;
      $('res-hero-xp-bar').style.width = '0%';
      setTimeout(() => { $('res-hero-xp-bar').style.width = `${pct}%`; }, 120);
    }

    const lvBanner = $('res-levelup');
    if (this.lastRunRecord.leveledUp.length > 0) {
      lvBanner.classList.remove('hidden');
      lvBanner.textContent = `✨ UMBRAL CODEX LEVEL UP → LEVEL ${saveManager.data.codexLevel}!`;
      audioEngine.playAchievement();
    } else {
      lvBanner.classList.add('hidden');
    }

    // Celebrate any newly unlocked achievements!
    const achBox = $('res-ach-box');
    const newAchs = this.lastRunRecord.newlyUnlockedAchievements || [];
    if (newAchs.length > 0) {
      achBox.classList.remove('hidden');
      achBox.innerHTML =
        `<div class="card-title" style="color:#FFD84D">🏅 ACHIEVEMENTS UNLOCKED!</div>` +
        newAchs.map((a) => `<div class="list-item" style="margin-bottom:4px"><span>${a.icon} <strong>${a.title}</strong></span><span class="pill pill-gold">+${a.rewardVS} VS</span></div>`).join('');
      this.showAchievementToast(newAchs[0]);
    } else {
      achBox.classList.add('hidden');
    }

    const chBanner = $('res-challenge-result');
    if (s.challengeDist > 0) {
      const diff = Math.floor(s.distance) - s.challengeDist;
      chBanner.classList.remove('hidden');
      chBanner.textContent = diff > 0 ? `🏆 YOU BEAT ${s.challengerName} BY ${diff}m!` : `👻 ${s.challengerName} won by ${Math.abs(diff)}m — Great try!`;
    } else {
      chBanner.classList.add('hidden');
    }

    $('btn-second-wind').classList.toggle('hidden', !info.canSecondWind);
    this.checkStoryUnlockPopup();
  }

  openBestMomentModal() {
    const s = this.lastRunSummary;
    $('modal-clip').classList.remove('hidden');
    $('clip-title').textContent = `🎬 ${s.bestMomentLabel} (${s.bestMomentDist}m)`;
    $('clip-watermark').textContent = `MILLER: VOID RUN · SCORE ${s.score.toLocaleString()} · ${Math.floor(s.distance)}m`;
    const img = $('clip-frame-img');
    const frames = s.bestMomentFrames && s.bestMomentFrames.length ? s.bestMomentFrames : [];
    clearInterval(this.clipReplayIv);
    if (frames.length === 0) { img.src = 'assets/art/key_art_poster.jpg'; return; }
    let idx = 0;
    img.src = frames[0];
    this.clipReplayIv = setInterval(() => { idx = (idx + 1) % frames.length; img.src = frames[idx]; }, 300);
  }

  shareBeatDistance() {
    const s = this.lastRunSummary;
    const link = `voidrun://challenge?d=${Math.floor(s.distance)}&u=${encodeURIComponent(saveManager.data.playerName)}&seed=${s.seed}`;
    NativeBridge.shareText('MILLER: VOID RUN — Score Challenge', `🔥 Score: ${s.score.toLocaleString()} | Distance: ${Math.floor(s.distance)}m in MILLER: VOID RUN! Can you beat it?\n${link}`);
    this.showToast('📢 Challenge Link Ready!');
  }

  openChallengePrompt(ch) {
    this.pendingChallenge = null;
    if (confirm(`👻 FRIENDLY CHALLENGE!\n\n${ch.user} ran ${ch.dist}m (Seed #${ch.seed}).\nRace their ghost now?`)) {
      this.startStandardRun({ seed: ch.seed, challengeDist: ch.dist, challengerName: ch.user, ghostData: saveManager.data.bestGhost });
    }
  }

  // --- STYLE & CUSTOMISATION STUDIO (Runners, Colours, Trails, Aura FX) ---
  renderCustomiseStudio(tab = 'runners') {
    const d = saveManager.data;
    document.querySelectorAll('[data-cust-tab]').forEach((b) => b.classList.toggle('active', b.dataset.custTab === tab));
    const panel = $('customise-panel');
    panel.innerHTML = '';

    if (tab === 'runners') {
      const c = CHARACTERS[this.selectedCharIdx];
      const unlocked = d.unlockedChars.includes(c.id);
      const selected = d.selectedChar === c.id;
      this.engine.refreshMenuCharacter(c.id, d.selectedSkin);

      const rosterStrip = CHARACTERS.map((ch, idx) => {
        const isSel = idx === this.selectedCharIdx ? 'selected' : '';
        const inner = ch.portrait ? `<img src="${ch.portrait}" alt="${ch.name}" />` : ch.initials;
        return `<button class="roster-chip ${isSel}" data-pick-char="${idx}" title="${ch.name}">${inner}</button>`;
      }).join('');

      const artButtons = c.splash
        ? `<div class="grid-2" style="margin-bottom:8px">
             <button id="cust-view-splash" class="btn btn-sm">🖼️ Hero Splash</button>
             <button id="cust-view-ref" class="btn btn-sm">📐 3D Turnaround</button>
           </div>`
        : '';

      const portraitImg = c.portrait
        ? `<img class="hero-avatar-lg" src="${c.portrait}" alt="${c.name}" />`
        : `<div class="hero-avatar-lg" style="display:flex;align-items:center;justify-content:center;font-weight:900;font-size:18px;background:#221242">${c.initials}</div>`;

      const hSt = saveManager.getHeroState(c.id);
      const hReq = heroXpForNextLevel(hSt.level);
      const hPct = Math.min(100, Math.round((hSt.xp / hReq) * 100));
      const hBon = getHeroLevelBonuses(hSt.level);

      panel.innerHTML = `
        <div class="hero-roster-strip">${rosterStrip}</div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
          ${portraitImg}
          <div style="flex:1">
            <strong style="font-size:17px">${c.name}</strong> ${c.featured ? '<span class="pill pill-gold">★ HERO</span>' : ''}
            <div style="font-size:11px;color:#00E5FF">${c.title}</div>
            <div style="font-size:11px;color:#3DFF7A;font-weight:800">Hero Lv ${hSt.level} · ${hBon.rank} (${hSt.xp}/${hReq} XP)</div>
          </div>
          <div style="display:flex;gap:4px">
            <button id="cust-prev" class="icon-btn" style="min-width:36px;min-height:36px;font-size:14px">◀</button>
            <button id="cust-next" class="icon-btn" style="min-width:36px;min-height:36px;font-size:14px">▶</button>
          </div>
        </div>
        <div class="progress-track" style="margin-bottom:6px;height:6px"><div class="progress-fill" style="width:${hPct}%;background:linear-gradient(90deg,#167a3e,#3DFF7A,#00E5FF)"></div></div>
        <div style="font-size:11px;opacity:.9;margin-bottom:6px">Bonuses: <strong>+${Math.round((hBon.rangeMult - 1) * 100)}% Strike</strong> · <strong>+${Math.round(hBon.slowResist * 100)}% Slow Resist</strong> · <strong>+${hBon.bonusMaxVE} VE</strong></div>
        <div style="font-size:12px;margin-bottom:3px"><strong>Passive:</strong> ${c.passiveName} — ${c.passiveDesc}</div>
        <div style="font-size:12px;margin-bottom:8px"><strong>Signature:</strong> ${c.sigName} — ${c.sigDesc}</div>
        ${artButtons}
        <button id="cust-char-btn" class="btn ${selected ? '' : unlocked ? 'btn-primary' : 'btn-gold'}" style="width:100%">
          ${selected ? '✅ EQUIPPED RUNNER' : unlocked ? `▶ SELECT ${c.name.toUpperCase()}` : `🔓 UNLOCK: ${c.costVS.toLocaleString()} VS${c.costBC ? ` + ${c.costBC} BC` : ''} (Lv ${c.reqLv})`}
        </button>
      `;

      panel.querySelectorAll('[data-pick-char]').forEach((el) => {
        el.onclick = () => {
          audioEngine.playUiClick();
          this.selectedCharIdx = Number(el.dataset.pickChar);
          this.renderCustomiseStudio('runners');
        };
      });
      if ($('cust-view-splash')) {
        $('cust-view-splash').onclick = () => this.openArtModal(`${c.name} — Hero Splash`, c.splash);
      }
      if ($('cust-view-ref')) {
        $('cust-view-ref').onclick = () => this.openArtModal(`${c.name} — 3D Modelling Reference`, c.refSheet);
      }
      $('cust-prev').onclick = () => { this.selectedCharIdx = (this.selectedCharIdx + CHARACTERS.length - 1) % CHARACTERS.length; this.renderCustomiseStudio('runners'); };
      $('cust-next').onclick = () => { this.selectedCharIdx = (this.selectedCharIdx + 1) % CHARACTERS.length; this.renderCustomiseStudio('runners'); };
      $('cust-char-btn').onclick = () => {
        if (selected) return;
        if (unlocked) { d.selectedChar = c.id; saveManager.save(); audioEngine.playUiClick(); this.refreshStatusBars(); this.renderCustomiseStudio('runners'); }
        else if (saveManager.unlockCharacter(c.id)) { audioEngine.playAchievement(); this.refreshStatusBars(); this.renderCustomiseStudio('runners'); }
        else this.showToast(`Requires Codex Lv ${c.reqLv}, ${c.costVS} VS${c.costBC ? ` & ${c.costBC} BC` : ''}`);
      };
    } else if (tab === 'gear') {
      const maxLv = Math.max(d.codexLevel, saveManager.getHeroState().level);
      const renderGearGroup = (title, slot, items, unlockedList, equippedId) => {
        const hdr = document.createElement('div');
        hdr.className = 'card-title';
        hdr.style.marginTop = '6px';
        hdr.textContent = title;
        panel.appendChild(hdr);
        items.forEach((it) => {
          const owned = unlockedList.includes(it.id);
          const eq = equippedId === it.id;
          const lockedLv = !owned && maxLv < it.reqLv;
          const row = document.createElement('div');
          row.className = `list-item ${eq ? 'active-item' : ''}`;
          row.style.opacity = lockedLv ? '0.58' : '1';
          row.innerHTML = `<div style="flex:1"><div><strong>${it.icon} ${it.name}</strong> <span class="pill">${it.tier}</span></div><div style="font-size:11px;opacity:.85">${it.desc}</div></div>`;
          const b = document.createElement('button');
          b.className = `btn btn-sm ${eq ? '' : owned ? 'btn-primary' : 'btn-gold'}`;
          b.textContent = eq ? 'EQUIPPED' : owned ? 'EQUIP' : lockedLv ? `🔒 Lv ${it.reqLv}` : `${it.costVS.toLocaleString()} VS`;
          b.onclick = () => {
            if (saveManager.buyGear(slot, it.id)) {
              audioEngine.playEssence();
              this.refreshStatusBars();
              this.renderCustomiseStudio('gear');
            } else {
              this.showToast(`Requires Lv ${it.reqLv} & ${it.costVS} Void Shards`);
            }
          };
          row.appendChild(b);
          panel.appendChild(row);
        });
      };
      renderGearGroup('Weapons (Powers ⚔️ STRIKE Attack)', 'weapon', GEAR_WEAPONS, d.unlockedWeapons, d.equippedWeapon);
      renderGearGroup('Armor (Deflects & Slow Resistance)', 'armor', GEAR_ARMORS, d.unlockedArmors, d.equippedArmor);
      renderGearGroup('Relics (XP, Slow & Energy Perks)', 'relic', GEAR_RELICS, d.unlockedRelics, d.equippedRelic);
    } else if (tab === 'skins') {
      SKINS.forEach((sk) => {
        const owned = d.unlockedSkins.includes(sk.id);
        const eq = d.selectedSkin === sk.id;
        const row = document.createElement('div');
        row.className = `list-item ${eq ? 'active-item' : ''}`;
        row.innerHTML = `<div style="display:flex;align-items:center;gap:10px"><div class="color-swatch" style="background:${sk.hex};color:${sk.hex}"></div><div><strong>${sk.name}</strong><div style="font-size:11px;opacity:.8">${sk.tier} Appearance</div></div></div>`;
        const b = document.createElement('button');
        b.className = `btn btn-sm ${eq ? '' : owned ? 'btn-primary' : 'btn-gold'}`;
        b.textContent = eq ? 'EQUIPPED' : owned ? 'EQUIP' : `${sk.costVS.toLocaleString()} VS`;
        b.onclick = () => {
          if (saveManager.buySkin(sk.id)) {
            audioEngine.playEssence();
            this.engine.refreshMenuCharacter(d.selectedChar, d.selectedSkin);
            this.refreshStatusBars();
            this.renderCustomiseStudio('skins');
          } else this.showToast(`Earn ${sk.costVS} Void Shards to unlock!`);
        };
        row.appendChild(b);
        panel.appendChild(row);
      });
    } else if (tab === 'trails') {
      TRAILS.forEach((tr) => {
        const owned = d.unlockedTrails.includes(tr.id);
        const eq = d.selectedTrail === tr.id;
        const row = document.createElement('div');
        row.className = `list-item ${eq ? 'active-item' : ''}`;
        row.innerHTML = `<div style="display:flex;align-items:center;gap:10px"><div class="color-swatch" style="background:${tr.rainbow ? 'linear-gradient(135deg,#FF44C8,#FFD84D,#00E5FF)' : tr.hex};color:${tr.hex}"></div><div><strong>${tr.name}</strong><div style="font-size:11px;opacity:.8">${tr.desc}</div></div></div>`;
        const b = document.createElement('button');
        b.className = `btn btn-sm ${eq ? '' : owned ? 'btn-primary' : 'btn-gold'}`;
        b.textContent = eq ? 'ACTIVE' : owned ? 'EQUIP' : `${tr.costVS.toLocaleString()} VS`;
        b.onclick = () => {
          if (saveManager.buyTrail(tr.id)) { audioEngine.playEssence(); this.refreshStatusBars(); this.renderCustomiseStudio('trails'); }
          else this.showToast(`Earn ${tr.costVS} Void Shards to unlock!`);
        };
        row.appendChild(b);
        panel.appendChild(row);
      });
    } else if (tab === 'auras') {
      AURA_FX.forEach((au) => {
        const owned = d.unlockedAuras.includes(au.id);
        const eq = d.selectedAura === au.id;
        const row = document.createElement('div');
        row.className = `list-item ${eq ? 'active-item' : ''}`;
        row.innerHTML = `<div style="display:flex;align-items:center;gap:10px"><div class="color-swatch" style="background:${au.rainbow ? 'linear-gradient(135deg,#3DFF7A,#00E5FF,#B44FFF)' : au.hex};color:${au.hex}"></div><div><strong>${au.name}</strong><div style="font-size:11px;opacity:.8">${au.desc}</div></div></div>`;
        const b = document.createElement('button');
        b.className = `btn btn-sm ${eq ? '' : owned ? 'btn-primary' : 'btn-gold'}`;
        b.textContent = eq ? 'ACTIVE' : owned ? 'EQUIP' : `${au.costVS.toLocaleString()} VS`;
        b.onclick = () => {
          if (saveManager.buyAura(au.id)) { audioEngine.playEssence(); this.refreshStatusBars(); this.renderCustomiseStudio('auras'); }
          else this.showToast(`Earn ${au.costVS} Void Shards to unlock!`);
        };
        row.appendChild(b);
        panel.appendChild(row);
      });
    }
  }

  // --- ACHIEVEMENTS SCREEN (16 Skill Badges) ---
  renderAchievements() {
    const d = saveManager.data;
    const unlockedCount = d.unlockedAchievements.length;
    const pct = Math.round((unlockedCount / ACHIEVEMENTS.length) * 100);
    $('ach-header-pct').textContent = `${unlockedCount}/${ACHIEVEMENTS.length} (${pct}%)`;
    const body = $('achievements-body');
    body.innerHTML = `
      <div class="card">
        <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:800;margin-bottom:5px">
          <span>Arcade Mastery Progress</span><span style="color:#FFD84D">${pct}%</span>
        </div>
        <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
      </div>
    `;
    ACHIEVEMENTS.forEach((ach) => {
      const done = d.unlockedAchievements.includes(ach.id);
      const row = document.createElement('div');
      row.className = `list-item ${done ? 'active-item' : ''}`;
      row.style.opacity = done ? '1' : '0.68';
      row.innerHTML = `
        <div style="font-size:26px">${ach.icon}</div>
        <div style="flex:1">
          <div><strong>${ach.title}</strong> <span class="pill ${ach.tier === 'Gold' ? 'pill-gold' : ach.tier === 'Silver' ? 'pill-cyan' : ''}">${ach.tier}</span></div>
          <div style="font-size:11px;opacity:.85">${ach.desc}</div>
          <div style="font-size:11px;color:#3DFF7A">Reward: +${ach.rewardVS} VS · +${ach.rewardXP} XP</div>
        </div>
        <span class="pill ${done ? 'pill-green' : ''}">${done ? '✓ EARNED' : 'LOCKED'}</span>
      `;
      body.appendChild(row);
    });
  }

  // --- PLAYER STATISTICS SCREEN ---
  renderStats() {
    const d = saveManager.data;
    const mins = Math.floor(d.totalPlaySeconds / 60);
    const secs = d.totalPlaySeconds % 60;
    $('stats-body').innerHTML = `
      <div class="grid-2" style="margin-bottom:10px">
        <div class="stat-tile"><div class="val" style="color:#FFD84D">${d.bestScore.toLocaleString()}</div><div class="lbl">Personal Best Score</div></div>
        <div class="stat-tile"><div class="val">${d.bestDistance.toLocaleString()} m</div><div class="lbl">Longest Run</div></div>
        <div class="stat-tile"><div class="val" style="color:#3DFF7A">×${Math.max(1, d.bestCombo)}</div><div class="lbl">Best Near-Miss Combo</div></div>
        <div class="stat-tile"><div class="val" style="color:#FF44C8">${d.bestNoHit.toLocaleString()} m</div><div class="lbl">Longest Clean Streak</div></div>
      </div>
      <div class="card">
        <div class="card-title">Career Totals</div>
        <div class="list-item"><span>Total Runs Completed</span><strong>${d.totalRuns}</strong></div>
        <div class="list-item"><span>Lifetime Distance</span><strong>${d.totalDistance.toLocaleString()} m</strong></div>
        <div class="list-item"><span>Total Void Shards Collected</span><strong style="color:#00E5FF">${d.totalShards.toLocaleString()} 🔮</strong></div>
        <div class="list-item"><span>Total Near-Misses</span><strong>${d.totalNearMisses}</strong></div>
        <div class="list-item"><span>Portal Enemies Defeated</span><strong style="color:#3DFF7A">${d.totalEnemiesDefeated || 0} ⚔️</strong></div>
        <div class="list-item"><span>Golden Bonus Rings Cleared</span><strong style="color:#FFD84D">${d.totalBonusRings} 🎯</strong></div>
        <div class="list-item"><span>Void Powers Activated</span><strong>${d.totalPowersUsed}</strong></div>
        <div class="list-item"><span>Faction Bosses Escaped</span><strong>${d.totalBossesDefeated} ⚔️</strong></div>
        <div class="list-item"><span>Highest Portal World</span><strong style="color:#3DFF7A">World ${d.highestWorld} / 7</strong></div>
        <div class="list-item"><span>Achievements Earned</span><strong style="color:#FFD84D">${d.unlockedAchievements.length} / ${ACHIEVEMENTS.length}</strong></div>
        <div class="list-item" style="margin-bottom:0"><span>Total Run Time</span><strong>${mins}m ${secs}s</strong></div>
      </div>
    `;
  }

  // --- UMBRAL CODEX ---
  renderCodex(tab = 'abilities') {
    const d = saveManager.data;
    const req = xpForNextLevel(d.codexLevel);
    const stage = getCodexStageInfo(d.codexLevel);
    $('codex-header-lv').textContent = `Level ${d.codexLevel} — Stage ${stage.stage}: ${stage.name}`;
    $('codex-header-xp').textContent = `XP: ${d.codexXP} / ${req} · Skill Points: ${d.skillPoints} SP`;
    $('codex-xp-fill').style.width = `${Math.min(100, (d.codexXP / req) * 100)}%`;

    document.querySelectorAll('[data-codex-tab]').forEach((b) => b.classList.toggle('active', b.dataset.codexTab === tab));
    const body = $('codex-body');
    body.innerHTML = '';

    if (tab === 'abilities') {
      VOID_POWERS.forEach((p) => {
        const unlocked = d.codexLevel >= p.unlockLv;
        const tier = d.abilityTiers[p.id] ?? 0;
        const curStats = p.tiers[tier];
        const nextCost = tier < 3 ? ABILITY_UPGRADE_COSTS[tier] : null;
        const row = document.createElement('div');
        row.className = 'list-item';
        row.style.opacity = unlocked ? '1' : '0.52';
        row.innerHTML = `<div style="flex:1"><div><strong>${p.icon} ${p.name}</strong> <span class="pill">S${p.stage}</span> <span class="pill pill-cyan">${unlocked ? `Lv ${tier + 1}/4` : `🔒 Lv ${p.unlockLv}`}</span></div><div style="font-size:11px;opacity:.85;margin-top:3px">${p.desc}</div><div style="font-size:11px;color:#00E5FF;margin-top:2px">VE: ${curStats.ve} · CD: ${curStats.cd}s · ${curStats.note}</div></div>`;
        if (unlocked && nextCost) {
          const upBtn = document.createElement('button');
          upBtn.className = 'btn btn-sm btn-gold';
          upBtn.textContent = `⬆ ${nextCost.vs}VS${nextCost.sp ? `+${nextCost.sp}SP` : ''}`;
          upBtn.onclick = () => {
            if (saveManager.upgradeAbility(p.id)) { audioEngine.playEssence(); this.refreshStatusBars(); this.renderCodex('abilities'); }
            else this.showToast('Not enough VS or SP!');
          };
          row.appendChild(upBtn);
        } else if (unlocked) {
          row.innerHTML += `<span class="pill pill-green">MAX</span>`;
        }
        body.appendChild(row);
      });
    } else if (tab === 'tree') {
      const info = document.createElement('div');
      info.className = 'card';
      info.innerHTML = `<strong>Available Skill Points: ${d.skillPoints} SP</strong><div style="font-size:12px;opacity:.82">Earn +1 SP every 3 Codex levels across Void, Shadow & Codex paths.</div>`;
      body.appendChild(info);
      SKILL_TREE.forEach((node) => {
        const owned = saveManager.hasSPNode(node.id);
        const row = document.createElement('div');
        row.className = `list-item ${owned ? 'active-item' : ''}`;
        row.innerHTML = `<div><span class="pill">${node.path}</span><div style="font-weight:900;margin-top:3px">${node.name}</div><div style="font-size:11px;opacity:.82">${node.desc}</div></div>`;
        const b = document.createElement('button');
        b.className = `btn btn-sm ${owned ? '' : 'btn-primary'}`;
        b.textContent = owned ? '✅ ACTIVE' : `${node.costSP} SP`;
        b.disabled = owned;
        b.onclick = () => {
          if (saveManager.unlockSPNode(node.id)) { audioEngine.playEssence(); this.renderCodex('tree'); }
          else this.showToast(`Need ${node.costSP} SP`);
        };
        row.appendChild(b);
        body.appendChild(row);
      });
    } else {
      CODEX_MILESTONES.forEach((m) => {
        const done = d.codexLevel >= m.lv;
        const row = document.createElement('div');
        row.className = `list-item ${done ? 'active-item' : ''}`;
        row.innerHTML = `<div><strong>Lv ${m.lv} — ${m.title}</strong><div style="font-size:11px;opacity:.85">${m.reward}</div></div><span class="pill ${done ? 'pill-green' : ''}">${done ? '✓' : 'LOCKED'}</span>`;
        body.appendChild(row);
      });
    }
  }

  // --- SKILL GOALS / MISSIONS ---
  renderMissions() {
    const d = saveManager.data;
    const body = $('missions-body');
    body.innerHTML = '';

    const renderGroup = (title, list, claimable) => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `<div class="card-title">${title}</div>`;
      list.forEach((m) => {
        const done = m.progress >= m.target;
        const row = document.createElement('div');
        row.className = `list-item ${done ? 'active-item' : ''}`;
        row.innerHTML = `<div style="flex:1"><div style="font-weight:800;font-size:13px">${m.text}</div><div style="font-size:11px;opacity:.82">${Math.min(m.progress, m.target)} / ${m.target} · Reward: ${m.rewardVS} VS${m.rewardBC ? ` + ${m.rewardBC} BC` : ''}${m.rewardCE ? ` + ${m.rewardCE} CE` : ''}</div></div>`;
        if (claimable) {
          const btn = document.createElement('button');
          btn.className = `btn btn-sm ${done && !m.claimed ? 'btn-gold' : ''}`;
          btn.disabled = !done || m.claimed;
          btn.textContent = m.claimed ? '✓' : done ? 'CLAIM' : `${Math.round((Math.min(m.progress, m.target) / m.target) * 100)}%`;
          btn.onclick = () => {
            m.claimed = true;
            d.vs += m.rewardVS || 0;
            d.bc += m.rewardBC || 0;
            if (m.rewardCE) saveManager.addCodexXP(m.rewardCE * 10);
            saveManager.save();
            audioEngine.playAchievement();
            this.refreshStatusBars();
            this.renderMissions();
          };
          row.appendChild(btn);
        }
        card.appendChild(row);
      });
      body.appendChild(card);
    };

    renderGroup('Per-Run Skill Challenges (+60 VS bonus for all 3)', d.perRunMissions, false);
    renderGroup('Optional Daily Goals (No penalty for skipping!)', d.dailyMissions, true);
    renderGroup('Weekly Exploration Goals', d.weeklyMissions, true);
  }

  // --- LEADERBOARDS ---
  renderLeaderboard() {
    const d = saveManager.data;
    const rows = NativeBridge.getWeeklyLeaderboard(d.bestDistance, d.playerName, d.highestWorld);
    $('social-body').innerHTML = `
      <div class="card">
        <div class="card-title">👻 Race Your Personal Ghost</div>
        <div style="font-size:12px;opacity:.85;margin-bottom:8px">Best Score: <strong>${d.bestScore.toLocaleString()}</strong> · Best Distance: <strong>${d.bestDistance.toLocaleString()} m</strong></div>
        <button id="btn-race-self-ghost" class="btn btn-primary btn-sm" style="width:100%">👻 RACE MY PERSONAL BEST GHOST</button>
      </div>
      <div class="card">
        <div class="card-title">🏆 Friendly Leaderboard (${SERVICE_CONFIG.mode === 'live' ? 'Live' : 'Offline Mode'})</div>
        <div id="lb-rows"></div>
      </div>
    `;
    $('btn-race-self-ghost').onclick = () => {
      if (!d.bestGhost) { this.showToast('Complete 1 run to record your Ghost!'); return; }
      this.startStandardRun({ ghostData: d.bestGhost, challengeDist: d.bestDistance, challengerName: 'Your Ghost' });
    };
    const lb = $('lb-rows');
    rows.forEach((r) => {
      const div = document.createElement('div');
      div.className = `list-item ${r.isPlayer ? 'active-item' : ''}`;
      div.innerHTML = `<div><strong>#${r.rank} ${r.name}</strong> <span class="pill">W${r.world}</span></div><strong style="color:#00E5FF">${r.dist.toLocaleString()} m</strong>`;
      lb.appendChild(div);
    });
  }

  // --- 5-ACT STORY ---
  renderStoryJournal() {
    const d = saveManager.data;
    const body = $('story-body');
    body.innerHTML = `<div class="card"><strong>Hidden Codex Fragments: ${d.fragmentsCollected.length} / 35</strong><div style="font-size:11px;opacity:.82">Explore alternate lanes across all 7 worlds to uncover hidden pages.</div></div>`;
    STORY_ACTS.forEach((act) => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `<div class="card-title">${act.name} (${act.stage})</div>`;
      act.beats.forEach((beat) => {
        const unlocked = d.codexLevel >= beat.reqLv;
        const row = document.createElement('div');
        row.className = 'list-item';
        row.style.opacity = unlocked ? '1' : '0.45';
        row.innerHTML = `<div><strong>${beat.id} — ${beat.title}</strong><div style="font-size:11px;opacity:.8">Codex Lv ${beat.reqLv}</div></div>`;
        const b = document.createElement('button');
        b.className = 'btn btn-sm btn-primary';
        b.disabled = !unlocked;
        b.textContent = unlocked ? 'READ' : '🔒';
        b.onclick = () => this.openStoryComic(beat);
        row.appendChild(b);
        card.appendChild(row);
      });
      body.appendChild(card);
    });
  }

  openStoryComic(beat) {
    $('story-modal-title').textContent = `${beat.id} — ${beat.title}`;
    const container = $('story-modal-panels');
    container.innerHTML = beat.panels.map((p) => `<div class="comic-panel"><div class="comic-speaker">${p.speaker}</div><div>${p.text}</div></div>`).join('');
    if (!saveManager.data.seenStoryBeats.includes(beat.id)) {
      saveManager.data.seenStoryBeats.push(beat.id);
      saveManager.save();
    }
    $('modal-story').classList.remove('hidden');
  }

  checkStoryUnlockPopup() {
    const lv = saveManager.data.codexLevel;
    for (const act of STORY_ACTS) {
      for (const beat of act.beats) {
        if (lv >= beat.reqLv && !saveManager.data.seenStoryBeats.includes(beat.id)) {
          this.openStoryComic(beat);
          return;
        }
      }
    }
  }

  // --- SETTINGS & ACCESSIBILITY ---
  renderSettings() {
    const d = saveManager.data;
    const s = d.settings;
    $('settings-body').innerHTML = `
      <div class="card">
        <div class="card-title">Audio Controls (Saved Automatically)</div>
        <label style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;font-size:13px"><strong>Master Mute</strong> <input id="set-mute" type="checkbox" ${s.muted ? 'checked' : ''}></label>
        <label style="display:block;margin-bottom:8px;font-size:13px">Music Volume (${Math.round(s.musicVol * 100)}%): <input id="set-music" type="range" min="0" max="1" step="0.05" value="${s.musicVol}" style="width:100%"></label>
        <label style="display:block;margin-bottom:8px;font-size:13px">Sound Effects (${Math.round(s.sfxVol * 100)}%): <input id="set-sfx" type="range" min="0" max="1" step="0.05" value="${s.sfxVol}" style="width:100%"></label>
        <label style="display:flex;justify-content:space-between;align-items:center;font-size:13px">Voice Callouts <input id="set-voice" type="checkbox" ${s.voiceBarks ? 'checked' : ''}></label>
      </div>
      <div class="card">
        <div class="card-title">Controls, Visuals & Accessibility</div>
        <label style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-size:13px">On-Screen Tap Arrow Buttons <input id="set-pad" type="checkbox" ${s.touchButtons ? 'checked' : ''}></label>
        <label style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-size:13px">60 FPS High Graphics (uncheck for 30 FPS) <input id="set-gfx" type="checkbox" ${s.highGraphics ? 'checked' : ''}></label>
        <label style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-size:13px">Reduced Motion (No Shake / Speed Lines) <input id="set-rm" type="checkbox" ${s.reducedMotion ? 'checked' : ''}></label>
        <label style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-size:13px">Colourblind Symbol Badges <input id="set-cb" type="checkbox" ${s.colorblind ? 'checked' : ''}></label>
        <label style="display:flex;justify-content:space-between;align-items:center;font-size:13px">Healthy Break Reminder (25 min) <input id="set-break" type="checkbox" ${s.healthyReminder ? 'checked' : ''}></label>
      </div>
      <div class="card">
        <div class="card-title">Player Name</div>
        <div style="display:flex;gap:8px">
          <input id="set-name" type="text" maxlength="16" value="${d.playerName}" style="flex:1;background:#1a1034;color:#fff;border:1px solid #B44FFF;border-radius:10px;padding:8px 10px;font-weight:700" />
          <button id="btn-save-name" class="btn btn-sm btn-primary">Save</button>
        </div>
      </div>
      <div class="card">
        <div class="card-title">Playtester Tools</div>
        <div class="grid-2">
          <button id="btn-dev-boost" class="btn btn-sm btn-gold">+10 Codex Lv & 5K VS</button>
          <button id="btn-dev-reset" class="btn btn-sm btn-danger">Reset Save Data</button>
        </div>
      </div>
    `;

    $('set-mute').onchange = (e) => { s.muted = e.target.checked; saveManager.save(); this.applySettingsVisuals(); };
    $('set-music').oninput = (e) => { s.musicVol = Number(e.target.value); saveManager.save(); this.applySettingsVisuals(); };
    $('set-sfx').oninput = (e) => { s.sfxVol = Number(e.target.value); saveManager.save(); this.applySettingsVisuals(); };
    $('set-voice').onchange = (e) => { s.voiceBarks = e.target.checked; saveManager.save(); this.applySettingsVisuals(); };
    $('set-pad').onchange = (e) => { s.touchButtons = e.target.checked; saveManager.save(); this.applySettingsVisuals(); };
    $('set-gfx').onchange = (e) => { s.highGraphics = e.target.checked; saveManager.save(); };
    $('set-rm').onchange = (e) => { s.reducedMotion = e.target.checked; saveManager.save(); };
    $('set-cb').onchange = (e) => { s.colorblind = e.target.checked; saveManager.save(); this.applySettingsVisuals(); };
    $('set-break').onchange = (e) => { s.healthyReminder = e.target.checked; saveManager.save(); };
    $('btn-save-name').onclick = () => {
      const v = $('set-name').value.trim();
      if (v) { d.playerName = v; saveManager.save(); this.showToast(`✅ Name updated to ${v}`); }
    };
    $('btn-dev-boost').onclick = () => {
      d.codexLevel = Math.min(100, d.codexLevel + 10);
      d.skillPoints += 5;
      d.vs += 5000;
      d.bc += 10;
      d.highestWorld = 7;
      saveManager.syncUnlockedAbilities();
      saveManager.evaluateAchievements();
      saveManager.save();
      this.refreshStatusBars();
      this.showToast('⚡ Playtester Boost Applied! All 7 Worlds Unlocked.');
    };
    $('btn-dev-reset').onclick = () => {
      if (confirm('Reset all local save progress?')) { localStorage.clear(); location.reload(); }
    };
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.__voidRunUI = new UIController();
});
