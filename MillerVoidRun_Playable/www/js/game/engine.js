// MILLER: VOID RUN — Arcade-Upgraded 3D Endless Runner Engine
// Adds: Procedural neon tracks, sky domes, horizon portal vortex, Golden Bonus Rift Rings & Shard Highways,
// live Arcade Score + x1..x8 Multiplier, unlockable Void Trails & Aura FX, squash-and-stretch animations,
// dynamic speed FOV, obstacle warning pings, floating popups & celebratory milestone fireworks!

import {
  TRACK_CONFIG,
  WORLDS,
  CHASERS,
  BOSSES,
  VOID_POWERS,
  CHARACTERS,
  TRAILS,
  AURA_FX,
  PORTAL_ENEMIES,
  PALETTE,
  getHeroLevelBonuses,
} from '../config/gameData.js';
import { saveManager } from '../core/saveManager.js';
import { audioEngine } from '../core/audioEngine.js';
import { NativeBridge } from '../config/servicesConfig.js';
import {
  getWorldTrackTexture,
  createSkyDome,
  createEnvironmentBackdrop,
  createChunkScenery,
  createRunnerMesh,
  createChaserMesh,
  createBossMesh,
  createPortalGateMesh,
  createObstacleMesh,
  createCollectibleMesh,
  createPortalEnemyMesh,
  createStrikeWaveMesh,
} from './meshFactory.js';

function createPRNG(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const RAINBOW_HEX = [0xb44fff, 0x00e5ff, 0x3dff7a, 0xffd84d, 0xff44c8, 0xff7a28];

export class VoidRunEngine {
  constructor(canvas, callbacks) {
    this.canvas = canvas;
    this.cb = callbacks;
    this.THREE = window.THREE;
    if (!this.THREE) throw new Error('Three.js not loaded');

    this.mode = 'menu';
    this.rafId = null;
    this.lastTime = 0;
    this.frameCapAccumulator = 0;

    this.initScene();
    this.initInput();
    this.buildMenuPedestal();
    this.loop(performance.now());
  }

  initScene() {
    const THREE = this.THREE;
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.resize();
    window.addEventListener('resize', () => this.resize());

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(PALETTE.voidBlack);
    this.scene.fog = new THREE.FogExp2(0x102428, 0.0145);

    this.camera = new THREE.PerspectiveCamera(62, this.getAspect(), 0.1, 220);
    this.camera.position.set(0, 4.2, 6.2);
    this.camera.lookAt(0, 1.4, -10);

    // Rich 3-point arcade lighting
    this.hemiLight = new THREE.HemisphereLight(0xb8a8ff, 0x1a0e30, 0.85);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xffe099, 1.35);
    this.dirLight.position.set(6, 15, 8);
    this.scene.add(this.dirLight);

    this.rimLight = new THREE.PointLight(0xb44fff, 2.8, 45);
    this.rimLight.position.set(0, 4.5, 4);
    this.scene.add(this.rimLight);

    // Animated starfield
    const starGeo = new THREE.BufferGeometry();
    const starCount = 320;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 110;
      starPos[i * 3 + 1] = 3 + Math.random() * 52;
      starPos[i * 3 + 2] = -Math.random() * 150;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    this.stars = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({ color: 0xe8d5ff, size: 0.42, transparent: true, opacity: 0.82 })
    );
    this.scene.add(this.stars);

    this.skyDome = createSkyDome(THREE, WORLDS[0]);
    this.scene.add(this.skyDome);

    this.environBackdrop = createEnvironmentBackdrop(THREE, WORLDS[0]);
    this.scene.add(this.environBackdrop);

    this.menuGroup = new THREE.Group();
    this.scene.add(this.menuGroup);

    this.runGroup = new THREE.Group();
    this.runGroup.visible = false;
    this.scene.add(this.runGroup);

    this.vfxBursts = [];
    this.trailParticles = [];
    this.sharedBoxGeo = new THREE.BoxGeometry(0.16, 0.16, 0.16);
    this.sharedTrailGeo = new THREE.OctahedronGeometry(0.12, 0);
  }

  getAspect() {
    const rect = this.canvas.parentElement?.getBoundingClientRect();
    if (!rect || !rect.width || !rect.height) return 9 / 16;
    return rect.width / rect.height;
  }

  resize() {
    const parent = this.canvas.parentElement;
    const w = parent ? parent.clientWidth : window.innerWidth;
    const h = parent ? parent.clientHeight : window.innerHeight;
    if (w > 0 && h > 0) {
      this.renderer.setSize(w, h, false);
      if (this.camera) {
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
      }
    }
  }

  // --- MENU 3D SHOWCASE ---
  buildMenuPedestal() {
    const THREE = this.THREE;
    while (this.menuGroup.children.length) this.menuGroup.remove(this.menuGroup.children[0]);

    const ped = new THREE.Mesh(
      new THREE.CylinderGeometry(1.55, 1.95, 0.36, 28),
      new THREE.MeshStandardMaterial({
        color: 0x1b1033,
        emissive: 0x6b2fa0,
        emissiveIntensity: 0.45,
        roughness: 0.3,
      })
    );
    ped.position.y = -0.18;
    this.menuGroup.add(ped);

    this.menuRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.7, 0.055, 8, 36),
      new THREE.MeshBasicMaterial({ color: 0x00e5ff })
    );
    this.menuRing.rotation.x = Math.PI / 2;
    this.menuRing.position.y = 0.05;
    this.menuGroup.add(this.menuRing);

    this.menuOuterRing = new THREE.Mesh(
      new THREE.TorusGeometry(2.15, 0.03, 6, 36),
      new THREE.MeshBasicMaterial({ color: 0xb44fff, transparent: true, opacity: 0.65 })
    );
    this.menuOuterRing.rotation.x = Math.PI / 2;
    this.menuOuterRing.position.y = 0.08;
    this.menuGroup.add(this.menuOuterRing);

    // Floating crystalline accents in menu
    this.menuOrbs = [];
    const orbColors = [0x3dff7a, 0x00e5ff, 0xffd84d, 0xff44c8];
    for (let i = 0; i < 4; i++) {
      const m = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.2, 0),
        new THREE.MeshBasicMaterial({ color: orbColors[i] })
      );
      this.menuGroup.add(m);
      this.menuOrbs.push(m);
    }

    this.menuPortal = createPortalGateMesh(THREE, 0x3dff7a, 1.25);
    this.menuPortal.position.set(0, 0.1, -9.2);
    this.menuGroup.add(this.menuPortal);

    this.refreshMenuCharacter();
  }

  refreshMenuCharacter(charId = null, skinId = null) {
    if (this.menuCharMesh) this.menuGroup.remove(this.menuCharMesh);
    const cid = charId || saveManager.data.selectedChar;
    const sid = skinId || saveManager.data.selectedSkin;
    this.menuCharMesh = createRunnerMesh(this.THREE, cid, sid, false);
    this.menuTurnAngle = 0;
    if (this.menuCharMesh.userData.isSpriteRig) {
      // Face camera cleanly; menuTurnAngle drives Front -> Side -> Back -> Side turnaround!
      this.menuCharMesh.rotation.y = 0;
      this.updateMenuSpriteTurnaround(0);
    } else {
      this.menuCharMesh.rotation.y = Math.PI;
    }
    this.menuGroup.add(this.menuCharMesh);
  }

  updateMenuSpriteTurnaround(angleRad) {
    if (!this.menuCharMesh || !this.menuCharMesh.userData.isSpriteRig) return;
    const ud = this.menuCharMesh.userData;
    const a = ((angleRad % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    // 0: Front, PI/2: Side Right, PI: Back, 3*PI/2: Side Left
    ud.frontPlane.visible = false;
    ud.sidePlane.visible = false;
    ud.backRunGroup.visible = false;
    if (a < Math.PI * 0.25 || a >= Math.PI * 1.75) {
      ud.frontPlane.visible = true;
    } else if (a < Math.PI * 0.75) {
      ud.sidePlane.visible = true;
      ud.sidePlane.scale.x = -1;
    } else if (a < Math.PI * 1.25) {
      ud.backRunGroup.visible = true;
      if (ud.backFullPlane) ud.backFullPlane.visible = true;
      if (ud.skelGroup) ud.skelGroup.visible = false;
    } else {
      ud.sidePlane.visible = true;
      ud.sidePlane.scale.x = 1;
    }
  }

  showMenuMode() {
    this.mode = 'menu';
    this.menuGroup.visible = true;
    this.runGroup.visible = false;
    this.applyWorldVisuals(saveManager.data.selectedWorld || 1);
    this.camera.fov = 58;
    this.camera.updateProjectionMatrix();
    this.camera.position.set(0, 2.05, 4.9);
    this.camera.lookAt(0, 1.15, 0);
    this.refreshMenuCharacter();
  }

  // --- INPUT ---
  initInput() {
    this.touchStart = null;
    this.bufferAction = null;
    this.bufferExpiry = 0;

    this.canvas.addEventListener(
      'touchstart',
      (e) => {
        if (this.mode !== 'running' && this.mode !== 'menu') return;
        const t = e.changedTouches[0];
        this.touchStart = { x: t.clientX, y: t.clientY, time: performance.now() };
      },
      { passive: true }
    );

    this.canvas.addEventListener(
      'touchmove',
      (e) => {
        if (this.mode === 'menu' && this.touchStart && this.menuCharMesh) {
          const t = e.changedTouches[0];
          const dx = t.clientX - this.touchStart.x;
          if (this.menuCharMesh.userData.isSpriteRig) {
            this.menuTurnAngle = (this.menuTurnAngle || 0) + dx * 0.015;
            this.updateMenuSpriteTurnaround(this.menuTurnAngle);
          } else {
            this.menuCharMesh.rotation.y += dx * 0.015;
          }
          this.touchStart.x = t.clientX;
        }
      },
      { passive: true }
    );

    this.canvas.addEventListener(
      'touchend',
      (e) => {
        if (this.mode !== 'running' || !this.touchStart) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - this.touchStart.x;
        const dy = t.clientY - this.touchStart.y;
        const dt = performance.now() - this.touchStart.time;
        this.touchStart = null;
        if (Math.hypot(dx, dy) < 26 || dt > 380) return;
        if (Math.abs(dx) > Math.abs(dy)) this.handleInput(dx > 0 ? 'right' : 'left');
        else this.handleInput(dy < 0 ? 'up' : 'down');
      },
      { passive: true }
    );

    let mouseDown = null;
    this.canvas.addEventListener('mousedown', (e) => {
      mouseDown = { x: e.clientX, y: e.clientY, time: performance.now() };
    });
    window.addEventListener('mousemove', (e) => {
      if (this.mode === 'menu' && mouseDown && this.menuCharMesh) {
        const dx = e.clientX - mouseDown.x;
        if (this.menuCharMesh.userData.isSpriteRig) {
          this.menuTurnAngle = (this.menuTurnAngle || 0) + dx * 0.014;
          this.updateMenuSpriteTurnaround(this.menuTurnAngle);
        } else {
          this.menuCharMesh.rotation.y += dx * 0.012;
        }
        mouseDown.x = e.clientX;
      }
    });
    window.addEventListener('mouseup', (e) => {
      if (!mouseDown) return;
      if (this.mode === 'running') {
        const dx = e.clientX - mouseDown.x;
        const dy = e.clientY - mouseDown.y;
        const dt = performance.now() - mouseDown.time;
        if (Math.hypot(dx, dy) > 30 && dt < 420) {
          if (Math.abs(dx) > Math.abs(dy)) this.handleInput(dx > 0 ? 'right' : 'left');
          else this.handleInput(dy < 0 ? 'up' : 'down');
        }
      }
      mouseDown = null;
    });

    window.addEventListener('keydown', (e) => {
      if (this.mode !== 'running') return;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.handleInput('left');
      else if (e.code === 'ArrowRight' || e.code === 'KeyD') this.handleInput('right');
      else if (e.code === 'ArrowUp' || e.code === 'KeyW') this.handleInput('up');
      else if (e.code === 'ArrowDown' || e.code === 'KeyS') this.handleInput('down');
      else if (e.code === 'Space' || e.code === 'KeyE') {
        e.preventDefault();
        this.triggerVoidPower();
      } else if (e.code === 'KeyF' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        e.preventDefault();
        this.triggerGearStrike();
      } else if (e.code === 'KeyQ') this.swapVoidPower();
      else if (e.code === 'KeyR') this.triggerUltimate();
      else if (e.code === 'Escape' || e.code === 'KeyP') this.cb.onPauseRequest?.();
    });
  }

  handleInput(action) {
    if (this.mode !== 'running') return;
    let act = action;
    if (this.run.controlsInvertedTimer > 0) {
      if (act === 'left') act = 'right';
      else if (act === 'right') act = 'left';
    }
    if (this.run.qteActive) {
      if ((this.run.qteAction === 'jump' && act === 'up') || (this.run.qteAction === 'slide' && act === 'down')) {
        this.completeBossQTE(true);
        return;
      }
    }

    const delayMs = this.run.emotionSlugTimer > 0 ? 160 : 0;
    const exec = () => {
      if (this.mode !== 'running') return;
      if (this.run.stumbleTimer > 0) {
        this.queueBuffer(act);
        return;
      }
      if (act === 'left') this.changeLane(-1);
      else if (act === 'right') this.changeLane(1);
      else if (act === 'up') this.tryJump();
      else if (act === 'down') this.trySlide();
    };
    if (delayMs > 0) setTimeout(exec, delayMs);
    else exec();
  }

  queueBuffer(act) {
    this.bufferAction = act;
    this.bufferExpiry = performance.now() + TRACK_CONFIG.inputBufferMs;
  }

  changeLane(dir) {
    const next = this.run.lane + dir;
    if (next < 0 || next > 2) return;
    this.run.lane = next;
    this.run.targetX = TRACK_CONFIG.laneX[next];
    this.run.laneStayTimer = 0;
    this.run.squashX = 0.86;
    this.run.squashY = 1.12;
    audioEngine.playLaneSwitch(dir);
  }

  tryJump() {
    if (this.run.isJumping) {
      this.queueBuffer('up');
      return;
    }
    this.run.slideTimer = 0;
    this.run.isJumping = true;
    this.run.velY = Math.sqrt(2 * TRACK_CONFIG.jumpHeight * 32);
    this.run.squashX = 0.82;
    this.run.squashY = 1.24;
    this.spawnAuraBurst(this.playerMesh.position, 8);
    audioEngine.playJump();
  }

  trySlide() {
    if (this.run.isJumping) this.run.velY = -19;
    const world = this.getCurrentWorld();
    const iceMult = world.uniqueMechanic === 'ice_physics' ? 1.2 : 1.0;
    this.run.slideTimer = TRACK_CONFIG.slideDuration * iceMult;
    this.spawnAuraBurst(this.playerMesh.position, 6);
    audioEngine.playSlide();
  }

  // --- START RUN ---
  startRun(options = {}) {
    const THREE = this.THREE;
    audioEngine.init();

    const save = saveManager.data;
    const startWorldId = options.isDaily ? 1 : options.worldId || save.selectedWorld || 1;
    const seed = options.seed || Math.floor(Math.random() * 9999999);
    this.rng = createPRNG(seed);

    while (this.runGroup.children.length) this.runGroup.remove(this.runGroup.children[0]);
    this.vfxBursts = [];
    this.trailParticles = [];

    const charId = save.selectedChar;
    const charData = CHARACTERS.find((c) => c.id === charId) || CHARACTERS[0];
    const trailData = TRAILS.find((t) => t.id === save.selectedTrail) || TRAILS[0];
    const auraData = AURA_FX.find((a) => a.id === save.selectedAura) || AURA_FX[0];
    const gear = saveManager.getEquippedGear();
    const heroBonuses = getHeroLevelBonuses(saveManager.getHeroState(charId).level);
    const maxVE = saveManager.getMaxVE();

    const activeCons = options.isDaily ? [] : [...(save.activeLoadoutConsumables || [])];
    const used = {};
    for (const cid of activeCons) {
      if ((save.consumableStock[cid] || 0) > 0) {
        save.consumableStock[cid] -= 1;
        used[cid] = true;
      }
    }
    save.activeLoadoutConsumables = [];
    saveManager.save();

    const slot1Id = charId === 'miller' ? save.equippedSlot1 || 'flicker' : `sig_${charId}`;
    const slot2Id = save.codexLevel >= 25 ? save.equippedSlot2 || 'void_sense' : null;

    this.run = {
      seed,
      startTimeMs: performance.now(),
      isDaily: !!options.isDaily,
      ghostToPlay: options.ghostData || null,
      ghostTargetDist: options.challengeDist || 0,
      challengerName: options.challengerName || '',
      worldId: startWorldId,
      worldStartDist: 0,
      worldsCompleted: 0,
      maxWorld: startWorldId,
      charId,
      charData,
      trailData,
      auraData,
      gear,
      heroBonuses,

      // Portal Enemies & Gear Combat
      portalEnemies: [],
      strikeWaves: [],
      enemySpawnTimer: 5.2,
      enemiesDefeated: 0,
      weaponCd: 0,
      armorDeflects: gear.armor.deflects || 0,
      nextArmorRegenDist: gear.armor.regenEveryDist || 0,
      enemySlowTimer: 0,
      enemySlowFactor: 1.0,
      enemySlowBy: '',

      // Arcade Score & Multiplier System!
      score: 0,
      multiplier: 1,
      cleanMeterProgress: 0,
      nextMilestoneDist: 500,
      bonusRings: 0,
      bonusHighwayTimer: 0,

      distance: 0,
      speed: TRACK_CONFIG.baseSpeed * Math.pow(1.05, startWorldId - 1) * (1 + (save.codexLevel - 1) * 0.005),
      lane: 1,
      x: 0,
      targetX: 0,
      y: 0,
      velY: 0,
      isJumping: false,
      wasJumping: false,
      squashX: 1,
      squashY: 1,
      slideTimer: 0,
      stumbleTimer: 0,
      invulnTimer: 1.6,
      noHitStreak: 0,
      longestNoHit: 0,
      firstObstaclePhased: charId === 'rumbidzai' || charId === 'nyx',
      secondChanceUsed: false,
      reviveUsed: false,

      ve: Math.min(maxVE, maxVE * 0.8 + (used.ve_potion ? 50 : 0)),
      maxVE,
      slots: slot2Id ? [slot1Id, slot2Id] : [slot1Id],
      activeSlotIdx: 0,
      cooldowns: {},
      shieldHits: charId === 'brann' ? 1 : 0, // Brann Kest Aegis Guard passive!
      voidResonanceTimer: 0,
      ultimateUsed: false,
      powersUsed: 0,
      lastPowerUsed: null,

      magnetTimer: 0,
      barrierHits: 0,
      doubleTimer: 0,
      surgeTimer: 0,
      lastPowerupKind: null,

      vs: 0,
      ce: 0,
      bc: 0,
      fragmentsFound: [],
      usedLuckyCharm: !!used.lucky_charm,
      usedCodexBoost: !!used.codex_boost,
      usedBeastLure: !!used.beast_lure,

      chaserDist: used.chaser_repel ? 80 : 54,
      chaserMaxDist: used.chaser_repel ? 80 : 60,
      chaserPushbacks: 0,
      chaserAbilityTimer: 9,
      laneStayTimer: 0,

      lavaLane: -1,
      lavaTimer: 5,
      infestedTimer: 0,
      timeSlowZoneTimer: 0,
      gravityDriftDir: 0,
      gravityDriftTimer: 0,
      darkVeilTimer: 0,
      controlsInvertedTimer: 0,
      emotionSlugTimer: 0,
      realityShiftTimer: 10,
      realityShiftWorldId: startWorldId,

      bossActive: false,
      bossDefeatedInWorld: false,
      bossPhaseIdx: -1,
      bossAttackTimer: 2.5,
      bossesEscaped: 0,
      qteActive: false,
      qteTimer: 0,
      qteAction: null,
      qtePrompt: '',

      nearMisses: 0,
      nearMissCombo: 0,
      bestCombo: 0,
      nearMissComboTimer: 0,
      slowMoTimer: 0,
      slowMoScale: 1.0,
      hypeScore: 0,
      bestHypeScore: 0,
      bestMomentDist: 0,
      bestMomentLabel: 'Epic Void Sprint',
      bestMomentFrames: [],
      rollingFrames: [],
      frameCaptureTick: 0,
      trailTick: 0,
      cameraShake: 0,

      ghostRecord: [],
      ghostSampleTimer: 0,

      chunks: [],
      nextChunkZ: 15,
      obstacles: [],
      collectibles: [],
      ritualWardTimer: 0,
      ritualWardLane: 1,
      cryoPathTimer: 0,
      conceptReversalTimer: 0,
      voidDomainTimer: 0,
      voidSenseTimer: 0,
      stillstepTimer: 0,
      voidwalkTimer: 0,
      eclipseVeilTimer: 0,
      chronalHavenTimer: 0,
      voidlightTimer: 0,
      timeBleedTimer: 0,
    };

    if (charId === 'leonard') this.run.leonardEchoReady = true;

    // Player mesh
    this.playerMesh = createRunnerMesh(THREE, charId, save.selectedSkin, false);
    this.runGroup.add(this.playerMesh);

    // Distant animated Horizon Portal ahead of the track
    this.horizonPortal = createPortalGateMesh(THREE, this.getCurrentWorld().accent, 2.8);
    this.horizonPortal.position.set(0, 2.0, -115);
    this.runGroup.add(this.horizonPortal);

    // Ghost Runner
    if (this.run.ghostToPlay && this.run.ghostToPlay.length > 0) {
      this.ghostMesh = createRunnerMesh(THREE, 'miller', 'default', true);
      this.runGroup.add(this.ghostMesh);
    } else {
      this.ghostMesh = null;
    }

    // Optimal Path Void Sense Ribbon
    this.senseGuide = new THREE.Mesh(
      new THREE.PlaneGeometry(0.98, 24),
      new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.48, side: THREE.DoubleSide })
    );
    this.senseGuide.rotation.x = -Math.PI / 2;
    this.senseGuide.position.set(0, 0.08, -13);
    this.senseGuide.visible = false;
    this.runGroup.add(this.senseGuide);

    this.applyWorldVisuals(startWorldId);
    this.spawnChaserForWorld(startWorldId);

    for (let i = 0; i < TRACK_CONFIG.activeChunksAhead + 2; i++) {
      this.spawnChunk(i < 2);
    }

    this.menuGroup.visible = false;
    this.runGroup.visible = true;
    this.mode = 'running';

    audioEngine.startMusic(startWorldId);
    audioEngine.playWorldEnter();
    audioEngine.playBark(charId === 'leonard' ? 'Right behind you!' : "Let's move!");
    this.cb.onWorldShift?.(this.getCurrentWorld());
  }

  getCurrentWorld() {
    const id = this.run ? this.run.worldId : 1;
    return WORLDS.find((w) => w.id === id) || WORLDS[0];
  }

  applyWorldVisuals(worldId) {
    const world = WORLDS.find((w) => w.id === worldId) || WORLDS[0];
    this.scene.background.setHex(world.skyTop);
    this.scene.fog.color.setHex(world.fogColor);
    this.dirLight.color.setHex(world.lightColor);
    this.rimLight.color.setHex(world.rimColor);
    if (this.skyDome) {
      this.scene.remove(this.skyDome);
      this.skyDome = createSkyDome(this.THREE, world);
      this.scene.add(this.skyDome);
    }
    if (this.environBackdrop) {
      this.scene.remove(this.environBackdrop);
      this.environBackdrop = createEnvironmentBackdrop(this.THREE, world);
      this.scene.add(this.environBackdrop);
    }
    if (this.horizonPortal) {
      this.runGroup.remove(this.horizonPortal);
      this.horizonPortal = createPortalGateMesh(this.THREE, world.accent, 2.8);
      this.horizonPortal.position.set(0, 2.2, -104);
      this.runGroup.add(this.horizonPortal);
    }
  }

  spawnChaserForWorld(worldId) {
    if (this.chaserMesh) this.runGroup.remove(this.chaserMesh);
    const world = WORLDS.find((w) => w.id === worldId) || WORLDS[0];
    this.chaserMesh = createChaserMesh(this.THREE, world.chaserId);
    this.chaserMesh.position.set(0, 0, this.run.chaserDist * 0.25);
    this.runGroup.add(this.chaserMesh);
  }

  spawnBossForWorld(worldId) {
    if (this.bossMesh) this.runGroup.remove(this.bossMesh);
    const world = WORLDS.find((w) => w.id === worldId) || WORLDS[0];
    this.bossMesh = createBossMesh(this.THREE, world.bossId);
    this.bossMesh.position.set(0, 0, -24);
    this.runGroup.add(this.bossMesh);
  }

  // --- CHUNK SPAWNER WITH NEON TEXTURES & GOLDEN BONUS RINGS ---
  spawnChunk(safeStart = false) {
    const THREE = this.THREE;
    const world = this.getCurrentWorld();
    const len = TRACK_CONFIG.chunkLength;
    const zStart = this.run.nextChunkZ;

    const chunkGroup = new THREE.Group();
    chunkGroup.position.z = zStart;

    // Vibrant textured neon-grid track floor
    const floorMat = new THREE.MeshStandardMaterial({
      map: getWorldTrackTexture(THREE, world),
      roughness: world.id === 3 || world.id === 5 ? 0.35 : 0.6,
      metalness: world.id === 3 || world.id === 5 ? 0.45 : 0.18,
    });
    const floor = new THREE.Mesh(new THREE.BoxGeometry(3.85, 0.4, len), floorMat);
    floor.position.set(0, -0.2, -len / 2);
    chunkGroup.add(floor);

    // Side glowing neon rails
    const railMat = new THREE.MeshBasicMaterial({ color: world.trimColor });
    for (const xEdge of [-1.96, 1.96]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.14, len), railMat);
      rail.position.set(xEdge, 0.08, -len / 2);
      chunkGroup.add(rail);
    }

    // Reference-accurate 3D biome architecture & animated floating environment props!
    const chunkIdx = Math.abs(Math.round(zStart / len));
    const scenery = createChunkScenery(THREE, world, chunkIdx, this.rng);
    chunkGroup.add(scenery.group);

    this.runGroup.add(chunkGroup);
    this.run.chunks.push({ group: chunkGroup, zStart, zEnd: zStart - len, floaters: scenery.floaters });

    if (!safeStart && !this.run.bossActive) {
      const worldDist = this.run.distance - this.run.worldStartDist;
      const diff = Math.min(1, worldDist / 1300 + (world.id - 1) * 0.11);
      const isBonusHighway = this.run.bonusHighwayTimer > 0;
      const isReward = isBonusHighway || this.rng() < 0.16;
      const safeLane = Math.floor(this.rng() * 3);

      // Shimmering Shard Line along optimal path (or triple rainbow lines during Bonus Highway!)
      if (isBonusHighway) {
        for (let l = 0; l < 3; l++) {
          for (let i = 0; i < 8; i++) {
            this.spawnCollectible('shard', l, zStart - 3 - i * 3.2);
          }
        }
      } else {
        const shardCount = isReward ? 10 : 6;
        for (let i = 0; i < shardCount; i++) {
          this.spawnCollectible('shard', safeLane, zStart - 3 - i * (isReward ? 2.5 : 4.0));
        }
      }

      // Secret Golden Bonus Rift Ring (exciting risk-reward arcade moment!)
      if (!isBonusHighway && this.rng() < 0.24) {
        const ringLane = (safeLane + 1) % 3;
        this.spawnCollectible('bonus_ring', ringLane, zStart - 16);
      }

      if (this.rng() < 0.42) {
        const altLane = (safeLane + 2) % 3;
        this.spawnCollectible('essence', altLane, zStart - 14);
      }

      const fragKey = `W${world.id}_F${Math.min(5, Math.ceil(saveManager.data.codexLevel / 20))}`;
      const rareBoost = (this.run.charId === 'harry' ? 0.04 : 0) + (this.run.usedLuckyCharm ? 0.04 : 0);
      if (!saveManager.data.fragmentsCollected.includes(fragKey) && !this.run.fragmentsFound.includes(fragKey) && this.rng() < 0.06 + rareBoost) {
        this.spawnCollectible('fragment', safeLane, zStart - 22, fragKey);
      }

      if (this.rng() < 0.22) {
        const pKinds = ['magnet', 'barrier', 'double', 'surge'];
        const pick = pKinds[Math.floor(this.rng() * (this.rng() < 0.2 ? 4 : 3))];
        this.spawnCollectible(pick, 1, zStart - 12);
      }

      if (!isReward) {
        // Balanced beginner-friendly start -> thrilling mastery ramp
        const rows = worldDist < 220 && world.id === 1 ? 1 : diff > 0.65 ? 3 : 2;
        for (let r = 0; r < rows; r++) {
          const rowZ = zStart - 7 - r * (len / rows);
          const openLane = (safeLane + r) % 3;
          for (let lane = 0; lane < 3; lane++) {
            if (lane === openLane) {
              if (this.rng() < 0.26 + diff * 0.25) {
                this.spawnObstacle(this.rng() < 0.55 ? 'ground' : 'overhead', lane, rowZ, world);
              }
            } else if (this.rng() < 0.48 + diff * 0.35) {
              const roll = this.rng();
              let oType = 'ground';
              if (roll < 0.3) oType = 'tall';
              else if (roll < 0.58) oType = 'ground';
              else if (roll < 0.84) oType = 'overhead';
              else oType = world.id >= 2 ? 'moving' : 'ground';
              this.spawnObstacle(oType, lane, rowZ, world);
            }
          }
        }
      }
    }

    this.run.nextChunkZ -= len;
  }

  spawnObstacle(type, lane, worldZ, world, opts = {}) {
    const isIllusion =
      opts.isIllusion ??
      (world.uniqueMechanic === 'illusions' && type !== 'hazard_floor' && this.rng() < 0.25);
    const mesh = createObstacleMesh(this.THREE, type, world, isIllusion);
    const x = type === 'sonic_low' || type === 'sonic_high' ? 0 : TRACK_CONFIG.laneX[lane];
    mesh.position.set(x, 0, worldZ);
    this.runGroup.add(mesh);

    this.run.obstacles.push({
      mesh,
      type,
      lane,
      x,
      z: worldZ,
      isIllusion,
      moveDir: this.rng() < 0.5 ? -1 : 1,
      moveSpeed: type === 'moving' ? 1.75 : 0,
      velZ: opts.velZ || 0,
      hit: false,
      nearMissed: false,
      warned: false,
      hazardKind: opts.hazardKind || null,
    });
  }

  spawnCollectible(kind, lane, worldZ, meta = null) {
    const mesh = createCollectibleMesh(this.THREE, kind);
    mesh.position.set(TRACK_CONFIG.laneX[lane], mesh.position.y, worldZ);
    this.runGroup.add(mesh);
    this.run.collectibles.push({
      mesh,
      kind,
      lane,
      z: worldZ,
      baseY: mesh.position.y,
      meta,
      collected: false,
    });
  }

  spawnVfxBurst(pos, colorHex, count = 14) {
    const THREE = this.THREE;
    const isHigh = saveManager.data.settings.highGraphics;
    const n = isHigh ? count : Math.ceil(count * 0.45);
    const mat = new THREE.MeshBasicMaterial({ color: colorHex });
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(this.sharedBoxGeo, mat);
      m.position.copy(pos);
      this.runGroup.add(m);
      this.vfxBursts.push({
        mesh: m,
        vx: (Math.random() - 0.5) * 8,
        vy: 1.8 + Math.random() * 5.5,
        vz: (Math.random() - 0.5) * 8,
        life: 0.45 + Math.random() * 0.35,
      });
    }
  }

  spawnAuraBurst(pos, count = 10) {
    const aura = this.run.auraData || AURA_FX[0];
    const col = aura.rainbow ? RAINBOW_HEX[Math.floor(Math.random() * RAINBOW_HEX.length)] : aura.color;
    this.spawnVfxBurst(pos, col, count);
  }

  spawnFireworks(pos) {
    if (saveManager.data.settings.reducedMotion) return;
    RAINBOW_HEX.slice(0, 4).forEach((col) => {
      this.spawnVfxBurst(pos, col, 8);
    });
  }

  addScore(points, popupLabel = null, popupColor = '#00E5FF') {
    const r = this.run;
    const dbl = r.doubleTimer > 0 || r.voidDomainTimer > 0 ? 2 : 1;
    const heroMult = r.heroBonuses ? r.heroBonuses.scoreBonus : 1.0;
    const total = Math.round(points * r.multiplier * dbl * heroMult);
    r.score += total;
    if (popupLabel) {
      this.cb.onFloatingPopup?.(`${popupLabel} +${total}`, popupColor);
    }
  }

  // === PORTAL ENEMY SPAWNER, GEAR STRIKE & DEFEAT LOGIC ===
  spawnPortalEnemy() {
    const r = this.run;
    const world = this.getCurrentWorld();
    const spec = PORTAL_ENEMIES[world.id] || PORTAL_ENEMIES[1];
    // Pick player's lane 60% of the time so player actively reacts with Gear Strike or Void Power!
    const lane = this.rng() < 0.6 ? r.lane : Math.floor(this.rng() * 3);
    const mesh = createPortalEnemyMesh(this.THREE, world.id);
    mesh.position.set(TRACK_CONFIG.laneX[lane], 0, -46);
    this.runGroup.add(mesh);

    r.portalEnemies.push({
      mesh,
      spec,
      lane,
      targetX: TRACK_CONFIG.laneX[lane],
      x: TRACK_CONFIG.laneX[lane],
      z: -46,
      weaveDone: false,
      portalAge: 0,
      defeated: false,
      warned: false,
    });
  }

  defeatPortalEnemy(enemy, viaLabel = '⚔️ DEFEATED!', bonusMult = 1.0) {
    if (enemy.defeated) return;
    enemy.defeated = true;
    enemy.mesh.visible = false;
    const r = this.run;
    r.enemiesDefeated += 1;
    const w = r.gear.weapon;
    const rel = r.gear.relic;
    const vsDrop = r.charId === 'garfield' ? 6 : 4;
    r.vs += vsDrop;
    r.ve = Math.min(r.maxVE, r.ve + (w.veGain || 5) + (rel.veOnKill || 0));
    r.enemySlowTimer = 0; // Defeating an enemy immediately breaks any slow snare!
    this.pushChaser(Math.max(2, w.pushback || 2));
    this.addScore(Math.round(220 * (w.scoreBonus || 1) * bonusMult), `${viaLabel} +${vsDrop}🔮`, w.hex || '#3DFF7A');
    this.spawnVfxBurst(enemy.mesh.position, enemy.spec.eyeColor, 16);
    audioEngine.playEnemyDefeat();
    NativeBridge.vibrate(32);
    this.addHype(35, `${enemy.spec.name} Defeated!`);
  }

  triggerGearStrike() {
    if (this.mode !== 'running' || !this.run) return;
    const r = this.run;
    if (r.weaponCd > 0) return;

    const w = r.gear.weapon;
    const range = w.range * (r.heroBonuses ? r.heroBonuses.rangeMult : 1.0);
    r.weaponCd = w.cd;
    r.enemySlowTimer = 0; // Weapon slash cleaves off snares!
    audioEngine.playWeaponStrike();
    NativeBridge.vibrate(25);

    // Launch glowing weapon crescent wave VFX
    const waveMesh = createStrikeWaveMesh(this.THREE, w.color, w.lanes);
    waveMesh.position.set(r.x, r.y, -0.8);
    this.runGroup.add(waveMesh);
    r.strikeWaves.push({ mesh: waveMesh, z: -0.8, maxZ: -range, life: 0.36 });

    // Hit all portal enemies in weapon range & lane spread!
    let hits = 0;
    const laneTol = w.lanes >= 3 ? 3.5 : w.lanes === 2 ? 1.85 : 0.85;
    for (const e of r.portalEnemies) {
      if (e.defeated) continue;
      if (e.z <= 1.5 && e.z >= -range && Math.abs(e.x - r.x) <= laneTol) {
        this.defeatPortalEnemy(e, `${w.icon} ${w.name.split(' ')[0].toUpperCase()}`, 1.0);
        hits++;
      }
    }

    // Heavy mastery weapons (Ember Warhammer & Voidheart Blade) also shatter 1 obstacle right in front!
    if (w.id === 'voidheart_blade' || w.id === 'ember_hammer') {
      for (const o of r.obstacles) {
        if (!o.hit && o.z <= 0.5 && o.z >= -Math.min(10, range * 0.6) && Math.abs(o.mesh.position.x - r.x) <= laneTol) {
          o.hit = true;
          o.mesh.visible = false;
          this.spawnVfxBurst(o.mesh.position, w.color, 10);
          r.vs += 2;
          break;
        }
      }
    }

    if (hits >= 2) {
      this.addScore(hits * 140, `🔥 MULTI-SLAY ×${hits}!`, '#FFD84D');
    }
  }

  updatePortalEnemies(rawDt, worldDt, now) {
    const r = this.run;
    const world = this.getCurrentWorld();

    // Spawn cadence scales smoothly per world
    if (!r.bossActive && r.bonusHighwayTimer <= 0) {
      r.enemySpawnTimer -= worldDt;
      if (r.enemySpawnTimer <= 0) {
        const baseInterval = Math.max(3.1, 6.8 - world.id * 0.48);
        r.enemySpawnTimer = baseInterval * (0.8 + this.rng() * 0.4);
        this.spawnPortalEnemy();
      }
    }

    // Update weapon crescent waves
    for (let i = r.strikeWaves.length - 1; i >= 0; i--) {
      const sw = r.strikeWaves[i];
      sw.life -= rawDt;
      sw.z -= 48 * rawDt;
      sw.mesh.position.z = Math.max(sw.maxZ, sw.z);
      sw.mesh.scale.multiplyScalar(1 + rawDt * 1.4);
      if (sw.life <= 0) {
        this.runGroup.remove(sw.mesh);
        r.strikeWaves.splice(i, 1);
      }
    }

    // Armor shield regeneration (Dominion Aegis Plate)
    if (r.gear.armor.regenEveryDist > 0 && r.distance >= r.nextArmorRegenDist) {
      r.nextArmorRegenDist += r.gear.armor.regenEveryDist;
      r.armorDeflects = Math.min(3, r.armorDeflects + 1);
      this.cb.onPowerToast?.('👑 AEGIS SHIELD REGENERATED!');
    }

    const relicSlow = r.gear.relic.enemySlow || 1.0;

    for (let i = r.portalEnemies.length - 1; i >= 0; i--) {
      const e = r.portalEnemies[i];
      if (!e.defeated) {
        e.portalAge += rawDt;
        // Charge forward toward player!
        const approachSpeed = (r.speed + e.spec.speed * relicSlow) * worldDt;
        e.z += approachSpeed;

        // Higher-world weaving enemies shift 1 lane toward player once at mid-range
        if (e.spec.weave && !e.weaveDone && e.z > -26 && e.z < -16) {
          e.weaveDone = true;
          e.lane = r.lane;
          e.targetX = TRACK_CONFIG.laneX[e.lane];
        }
        e.x += (e.targetX - e.x) * Math.min(1, rawDt * 7);
        e.mesh.position.set(e.x, 0, e.z);

        // Animate charging limbs & fading spawn rift
        const ud = e.mesh.userData;
        const cyc = now * 0.02;
        ud.legL.rotation.x = Math.sin(cyc) * 0.9;
        ud.legR.rotation.x = -Math.sin(cyc) * 0.9;
        ud.armL.rotation.x = -0.6 + Math.sin(cyc) * 0.5;
        ud.armR.rotation.x = -0.6 - Math.sin(cyc) * 0.5;
        if (ud.riftRing) {
          ud.riftRing.rotation.z += rawDt * 4;
          const fade = Math.max(0, 1 - e.portalAge * 1.4);
          ud.riftRing.visible = fade > 0.05;
          ud.riftRing.scale.set(fade, fade, fade);
        }

        // Subtle warning ping as enemy closes into strike range!
        if (!e.warned && e.z > -22 && e.z < -14) {
          e.warned = true;
          audioEngine.playObstacleWarning();
        }

        // Active offensive powers auto-defeat oncoming portal enemies!
        const powerAutoKill =
          r.chronalHavenTimer > 0 || r.voidlightTimer > 0 || r.surgeTimer > 0 ||
          r.conceptReversalTimer > 0 || r.cryoPathTimer > 0 ||
          (r.ritualWardTimer > 0 && Math.abs(e.x - TRACK_CONFIG.laneX[r.ritualWardLane]) < 0.8);
        if (powerAutoKill && e.z > -11 && e.z < 1.2) {
          this.defeatPortalEnemy(e, '⚡ VOID OBLITERATE', 1.25);
          continue;
        }

        // Contact check with player
        if (Math.abs(e.z) < 0.85 && Math.abs(e.x - r.x) < 0.62) {
          // Clean jump over charging ground enemy = stylish dodge + near-miss!
          if (r.y > 0.95 || r.stillstepTimer > 0) {
            if (!e.warnedJump) {
              e.warnedJump = true;
              this.registerNearMiss();
            }
          } else if (r.voidwalkTimer > 0 || r.voidDomainTimer > 0 || r.invulnTimer > 0) {
            // Safely phased / invulnerable
            this.defeatPortalEnemy(e, '👻 PHASE SHATTER', 1.1);
          } else if (r.armorDeflects > 0 || r.shieldHits > 0 || r.barrierHits > 0) {
            // Protected by Unlocked Armor or Shield!
            if (r.armorDeflects > 0) r.armorDeflects -= 1;
            else if (r.shieldHits > 0) r.shieldHits -= 1;
            else r.barrierHits -= 1;
            this.defeatPortalEnemy(e, '🛡️ ARMOR DEFLECT', 1.15);
            if (r.gear.armor.id === 'shadow_shroud') {
              this.pushChaser(10);
            }
          } else {
            // Enemy clashes & SLOWS player down!
            e.defeated = true;
            e.mesh.visible = false;
            const totalResist = Math.min(0.85, (r.gear.armor.slowResist || 0) + (r.heroBonuses?.slowResist || 0));
            const dur = Math.max(0.55, e.spec.slowDur * (1 - totalResist));
            if (r.enemySlowTimer > 0) {
              // Hit while ALREADY slowed -> stumble surge!
              this.takeObstacleHit();
            } else {
              r.enemySlowTimer = dur;
              r.enemySlowFactor = 1 - e.spec.slowPct;
              r.enemySlowBy = e.spec.name;
              r.chaserDist = Math.max(2, r.chaserDist - 8.5);
              if (!saveManager.data.settings.reducedMotion) r.cameraShake = 0.28;
              audioEngine.playEnemySlow();
              NativeBridge.vibrate(55);
              this.spawnVfxBurst(this.playerMesh.position, e.spec.eyeColor, 12);
              this.cb.onFloatingPopup?.(`🕸️ SLOWED BY ${e.spec.name.toUpperCase()}!`, '#FF44C8');
            }
          }
        }
      }

      if (e.z > 14 || e.defeated) {
        this.runGroup.remove(e.mesh);
        r.portalEnemies.splice(i, 1);
      }
    }
  }

  // --- VOID POWERS & CHARACTER SIGNATURES ---
  getEquippedPowerInfo(slotIdx = null) {
    const idx = slotIdx ?? this.run.activeSlotIdx;
    const id = this.run.slots[idx];
    if (!id) return null;
    if (id.startsWith('sig_')) {
      const cid = id.slice(4);
      const c = CHARACTERS.find((x) => x.id === cid);
      const sigMap = {
        brann: { id, name: 'Hammer Shockwave', icon: '🔨', ve: 28, cd: 14, duration: 0.7, color: '#FFB020' },
        elara: { id, name: 'Runic Ward', icon: '🪄', ve: 26, cd: 14, duration: 6.0, color: '#3DFFCC' },
        nyx: { id, name: 'Twin-Fang Blitz', icon: '🗡️', ve: 28, cd: 12, duration: 2.5, color: '#A052FF' },
        leonard: { id, name: 'Mimicry Surge', icon: '⚡', ve: 25, cd: 20, duration: 3.5, color: '#00E5FF' },
        precious: { id, name: 'Thread Mend', icon: '🧵', ve: 20, cd: 15, duration: 2.5, color: '#44FF88' },
        rumbidzai: { id, name: 'Blade Phase', icon: '🗡️', ve: 30, cd: 12, duration: 1.2, color: '#FF38A8' },
        harry: { id, name: 'Ritual Ward', icon: '⭕', ve: 35, cd: 22, duration: 8.0, color: '#FFB020' },
        garfield: { id, name: 'Duplicate Burst', icon: '✨', ve: 30, cd: 25, duration: 4.0, color: '#FFEE44' },
        ruth: { id, name: 'Cryo Path', icon: '❄️', ve: 40, cd: 20, duration: 4.0, color: '#5CE8E4' },
      };
      return sigMap[cid] || { id, name: c?.sigName || 'Power', icon: '⚡', ve: 25, cd: 15, duration: 3, color: '#B44FFF' };
    }
    const p = VOID_POWERS.find((x) => x.id === id);
    if (!p) return null;
    const tierIdx = saveManager.data.abilityTiers[id] || 0;
    const t = p.tiers[Math.min(tierIdx, p.tiers.length - 1)];
    return {
      id: p.id,
      name: p.name,
      icon: p.icon,
      color: p.color,
      ve: t.ve,
      cd: t.cd * (saveManager.hasSPNode('codex_cd') ? 0.9 : 1.0),
      duration: t.duration + (saveManager.hasSPNode('void_dur') ? 0.5 : 0),
      power: t.power,
      pushback: t.pushback || 15,
      tierIdx,
    };
  }

  swapVoidPower() {
    if (!this.run || this.run.slots.length < 2) return;
    this.run.activeSlotIdx = (this.run.activeSlotIdx + 1) % this.run.slots.length;
    const info = this.getEquippedPowerInfo();
    audioEngine.playLaneSwitch(0);
    this.cb.onPowerToast?.(`Swapped → ${info.icon} ${info.name}`);
  }

  triggerVoidPower() {
    if (this.mode !== 'running' || !this.run) return;
    if (this.run.qteActive && (this.run.qteAction === 'power' || this.run.qteAction === 'eruption')) {
      this.completeBossQTE(true);
      return;
    }

    const info = this.getEquippedPowerInfo();
    if (!info || (this.run.cooldowns[info.id] || 0) > 0 || this.run.ve < info.ve) return;

    this.run.ve -= info.ve;
    let cd = info.cd;
    if (this.run.leonardEchoReady) {
      cd *= 0.5;
      this.run.leonardEchoReady = false;
    }
    this.run.cooldowns[info.id] = cd;
    this.run.powersUsed += 1;
    this.run.lastPowerUsed = info.id;
    this.run.infestedTimer = 0;
    this.run.enemySlowTimer = 0; // Casting a Void Power shatters enemy slow snares!
    if (this.run.gear.relic.cdReduction) {
      this.run.cooldowns[info.id] *= 1 - this.run.gear.relic.cdReduction;
    }
    this.addScore(150, `${info.icon} ${info.name.toUpperCase()}`, info.color);
    this.addHype(25, `${info.name} Unleashed!`);

    const pushMult = saveManager.hasSPNode('void_push') ? 1.25 : 1.0;
    const yieldMult = saveManager.hasSPNode('void_dmg') ? 1.15 : 1.0;

    audioEngine.playPower(info.id);
    audioEngine.playBark(info.name + '!');
    NativeBridge.vibrate(45);
    this.spawnAuraBurst(this.playerMesh.position, 22);
    this.cb.onPowerToast?.(`${info.icon} ${info.name.toUpperCase()}!`);

    switch (info.id) {
      case 'flicker':
        this.run.invulnTimer = Math.max(this.run.invulnTimer, info.duration + 0.25);
        this.advanceWorldZ(info.power * yieldMult);
        this.pushChaser(15 * pushMult);
        break;
      case 'void_sense':
        this.run.voidSenseTimer = info.duration;
        if (info.power >= 5) this.pushChaser(5 * pushMult);
        break;
      case 'stillstep':
        this.run.stillstepTimer = info.duration;
        break;
      case 'shadow_shield':
        this.run.shieldHits = info.power + (saveManager.hasSPNode('shadow_hp') ? 1 : 0);
        break;
      case 'voidwalk':
        this.run.voidwalkTimer = info.duration;
        this.run.invulnTimer = Math.max(this.run.invulnTimer, info.duration);
        this.pushChaser(10 * pushMult);
        break;
      case 'grasping_dark':
        this.run.magnetTimer = Math.max(this.run.magnetTimer, info.duration);
        break;
      case 'time_bleed': {
        const w5Bonus = this.run.worldId === 5 ? 1.3 : 1.0;
        this.run.timeBleedTimer = info.duration * w5Bonus;
        this.run.slowMoScale = info.power;
        break;
      }
      case 'eclipse_veil':
        this.run.eclipseVeilTimer = info.duration;
        this.pushChaser(12 * pushMult);
        break;
      case 'chronal_haven':
        this.run.chronalHavenTimer = info.duration;
        this.run.invulnTimer = Math.max(this.run.invulnTimer, info.duration);
        this.destroyObstaclesAhead(info.power * yieldMult, true);
        this.pushChaser(15 * pushMult);
        break;
      case 'void_domain':
        this.run.voidDomainTimer = info.duration;
        this.run.invulnTimer = Math.max(this.run.invulnTimer, info.duration);
        this.pushChaser(18 * pushMult);
        break;
      case 'erasure_wave':
        this.destroyObstaclesAhead(info.power * yieldMult, true);
        this.pushChaser(20 * pushMult);
        this.run.cameraShake = 0.42;
        break;
      case 'voidlight_synthesis':
        this.run.voidlightTimer = info.duration;
        this.run.invulnTimer = Math.max(this.run.invulnTimer, info.duration);
        this.pushChaser(25 * pushMult);
        break;
      case 'concept_reversal':
        this.run.conceptReversalTimer = info.duration;
        break;
      case 'sig_brann':
        this.destroyObstaclesAhead(24 * yieldMult, true);
        this.pushChaser(18 * pushMult);
        if (!saveManager.data.settings.reducedMotion) this.run.cameraShake = 0.48;
        this.spawnVfxBurst(this.playerMesh.position, 0xffb020, 26);
        break;
      case 'sig_elara':
        this.run.ritualWardTimer = 6.0;
        this.run.ritualWardLane = this.run.lane;
        this.run.magnetTimer = Math.max(this.run.magnetTimer, 5.0);
        this.spawnVfxBurst(this.playerMesh.position, 0x3dffcc, 22);
        break;
      case 'sig_nyx':
        this.run.voidwalkTimer = Math.max(this.run.voidwalkTimer, 2.5);
        this.run.invulnTimer = Math.max(this.run.invulnTimer, 2.5);
        this.destroyObstaclesAhead(18 * yieldMult, true, 5);
        this.pushChaser(14 * pushMult);
        this.spawnVfxBurst(this.playerMesh.position, 0xa052ff, 22);
        break;
      case 'sig_leonard': {
        const kind = this.run.lastPowerupKind || ['magnet', 'double', 'barrier'][Math.floor(Math.random() * 3)];
        this.applyPowerup(kind, 3.5);
        break;
      }
      case 'sig_precious':
        this.run.stumbleTimer = 0;
        this.run.invulnTimer = Math.max(this.run.invulnTimer, 2.2);
        this.run.ve = Math.min(this.run.maxVE, this.run.ve + 25);
        break;
      case 'sig_rumbidzai':
        this.run.invulnTimer = Math.max(this.run.invulnTimer, 1.2);
        this.destroyObstaclesAhead(18, true, 3);
        this.pushChaser(12 * pushMult);
        break;
      case 'sig_harry':
        this.run.ritualWardTimer = 8.0;
        this.run.ritualWardLane = this.run.lane;
        break;
      case 'sig_garfield':
        if (this.run.lastPowerupKind) this.applyPowerup(this.run.lastPowerupKind, 5.0);
        else this.run.doubleTimer = Math.max(this.run.doubleTimer, 6.0);
        break;
      case 'sig_ruth':
        this.run.cryoPathTimer = 4.0;
        break;
    }
  }

  triggerUltimate() {
    if (this.mode !== 'running' || !this.run) return;
    if (saveManager.data.codexLevel < 75 || this.run.ultimateUsed || this.run.ve < 90) return;

    this.run.ve -= 90;
    this.run.ultimateUsed = true;
    this.run.invulnTimer = 4.0;
    this.destroyObstaclesAhead(65, true);
    this.pushChaser(60);
    this.advanceWorldZ(200);
    this.run.doubleTimer = Math.max(this.run.doubleTimer, 10);
    this.run.cameraShake = 0.65;
    this.addScore(1500, '🕳️ SINGULARITY SOUL!', '#FFD84D');
    this.spawnFireworks(this.playerMesh.position);
    this.addHype(95, 'SINGULARITY SOUL!');
    audioEngine.playPower('singularity_soul');
    NativeBridge.vibrate(110);
    this.cb.onPowerToast?.('🕳️ SINGULARITY SOUL — +200m RIFT WARP!');
  }

  destroyObstaclesAhead(rangeMeters, dropShards = true, maxCount = 99) {
    let count = 0;
    for (const o of this.run.obstacles) {
      if (o.hit || count >= maxCount) continue;
      if (o.z < 2 && o.z > -rangeMeters) {
        o.hit = true;
        o.mesh.visible = false;
        this.spawnAuraBurst(o.mesh.position, 8);
        count++;
        if (dropShards) {
          this.run.vs += this.run.charId === 'garfield' ? 3 : 2;
          this.addScore(60);
        }
      }
    }
    // Powers that clear ahead also obliterate oncoming portal enemies!
    for (const e of this.run.portalEnemies) {
      if (!e.defeated && e.z < 2 && e.z > -rangeMeters) {
        this.defeatPortalEnemy(e, '💥 VOID BLAST', 1.2);
      }
    }
    if (count >= 3) {
      this.addScore(count * 80, `💥 SHATTER ×${count}!`, '#FF44C8');
      this.addHype(55, `Obliterated ${count} Obstacles!`);
    }
  }

  pushChaser(meters) {
    this.run.chaserDist = Math.min(this.run.chaserMaxDist, this.run.chaserDist + meters);
    this.run.chaserPushbacks += 1;
  }

  applyPowerup(kind, customDur = null) {
    this.run.lastPowerupKind = kind;
    this.addScore(200);
    if (kind === 'magnet') {
      this.run.magnetTimer = Math.max(this.run.magnetTimer, customDur || 6.5);
      this.cb.onPowerToast?.('🧲 VOID MAGNET!');
    } else if (kind === 'barrier') {
      this.run.barrierHits = 1 + (saveManager.hasSPNode('shadow_hp') ? 1 : 0);
      this.cb.onPowerToast?.('🛡️ SHADOW BARRIER!');
    } else if (kind === 'double') {
      this.run.doubleTimer = Math.max(this.run.doubleTimer, customDur || 9);
      this.cb.onPowerToast?.('💎 2× SCORE & SHARDS!');
    } else if (kind === 'surge') {
      this.run.surgeTimer = Math.max(this.run.surgeTimer, customDur || 5);
      this.run.invulnTimer = Math.max(this.run.invulnTimer, customDur || 5);
      this.pushChaser(60);
      this.addHype(65, 'VOID SURGE!');
      this.cb.onPowerToast?.('☄️ VOID SURGE!');
    }
    this.spawnAuraBurst(this.playerMesh.position, 16);
    audioEngine.playEssence();
    NativeBridge.vibrate(35);
  }

  // --- BOSS ENCOUNTERS ---
  updateBoss(dt) {
    const world = this.getCurrentWorld();
    const boss = BOSSES[world.bossId];
    const worldDist = this.run.distance - this.run.worldStartDist;
    const bossEnd = world.id === 7 ? TRACK_CONFIG.finalBossEndDist : TRACK_CONFIG.bossEndDist;

    if (!this.run.bossActive && !this.run.bossDefeatedInWorld && worldDist >= TRACK_CONFIG.bossTriggerDist) {
      this.run.bossActive = true;
      this.run.bossPhaseIdx = 0;
      this.spawnBossForWorld(world.id);
      this.spawnCollectible('surge', 1, -24);
      audioEngine.playBark(boss.bark);
      this.cb.onBossAlert?.({ active: true, name: boss.name, faction: boss.faction, phase: boss.phases[0].name, progress: 0 });
    }

    if (!this.run.bossActive) return;

    if (this.bossMesh) {
      this.bossMesh.position.z = -17 + Math.sin(performance.now() * 0.004) * 1.5;
      this.bossMesh.position.x = Math.sin(performance.now() * 0.0022) * 1.6;
      this.bossMesh.userData.crown.rotation.z += dt * 2.5;
    }

    let phaseIdx = 0;
    for (let i = 0; i < boss.phases.length; i++) {
      if (worldDist >= boss.phases[i].start) phaseIdx = i;
    }
    if (phaseIdx !== this.run.bossPhaseIdx) {
      this.run.bossPhaseIdx = phaseIdx;
      this.addHype(45, `${boss.name}: ${boss.phases[phaseIdx].name}`);
      if (phaseIdx === boss.phases.length - 1 && !this.run.qteActive) {
        this.run.qteActive = true;
        this.run.qteTimer = boss.qteWindow;
        this.run.qteAction = boss.qteAction;
        this.run.qtePrompt = boss.qtePrompt;
        if (world.id === 3) {
          this.run.timeBleedTimer = 2.5;
          this.run.slowMoScale = 0.4;
        }
      }
    }

    const phase = boss.phases[phaseIdx];
    const prog = Math.min(1, (worldDist - TRACK_CONFIG.bossTriggerDist) / (bossEnd - TRACK_CONFIG.bossTriggerDist));
    this.cb.onBossAlert?.({
      active: true,
      name: boss.name,
      faction: boss.faction,
      phase: phase.name,
      progress: prog,
      qtePrompt: this.run.qteActive ? this.run.qtePrompt : '',
      qteTimer: this.run.qteActive ? this.run.qteTimer : 0,
    });

    if (this.run.qteActive) {
      this.run.qteTimer -= dt;
      if (this.run.qteTimer <= 0) this.completeBossQTE(false);
      return;
    }

    this.run.bossAttackTimer -= dt;
    if (this.run.bossAttackTimer <= 0) {
      this.run.bossAttackTimer = Math.max(0.9, 1.55 - world.id * 0.07);
      const openLane = Math.floor(this.rng() * 3);
      if (phase.mechanic === 'boulders' || phase.mechanic === 'earth_spikes' || phase.mechanic === 'undead_horde') {
        for (let l = 0; l < 3; l++) if (l !== openLane) this.spawnObstacle('ground', l, -36, world, { velZ: 4 });
      } else if (phase.mechanic === 'density_wall' || phase.mechanic === 'tunnel' || phase.mechanic === 'elites') {
        for (let l = 0; l < 3; l++) if (l !== openLane) this.spawnObstacle('tall', l, -38, world);
      } else if (phase.mechanic === 'evo_wave') {
        this.spawnObstacle('sonic_low', 1, -36, world, { velZ: 6 });
      } else if (phase.mechanic === 'homing_darts' || phase.mechanic === 'dual_tether' || phase.mechanic === 'combined_assault') {
        this.spawnObstacle('moving', this.run.lane, -36, world, { velZ: 7 });
        this.spawnObstacle('overhead', (this.run.lane + 1) % 3, -36, world);
      } else if (phase.mechanic === 'emotion_pulse') {
        this.run.emotionSlugTimer = 1.6;
        this.spawnObstacle('ground', this.run.lane, -36, world);
      } else {
        this.spawnObstacle(this.rng() < 0.5 ? 'ground' : 'overhead', this.run.lane, -36, world);
      }
    }

    if (worldDist >= bossEnd) this.completeBossQTE(true);
  }

  completeBossQTE(success) {
    this.run.qteActive = false;
    this.run.qtePrompt = '';
    const world = this.getCurrentWorld();
    const boss = BOSSES[world.bossId];

    if (success) {
      this.run.bossActive = false;
      this.run.bossDefeatedInWorld = true;
      this.run.bossesEscaped += 1;
      this.run.worldsCompleted += 1;
      this.run.vs += 60;
      this.run.ce += 5;
      this.run.bc += this.run.usedBeastLure ? 2 : 1;
      this.run.multiplier = Math.min(8, this.run.multiplier + 1);
      this.addScore(1200, `⚔️ ESCAPED ${boss.name.toUpperCase()}!`, '#FFD84D');
      this.run.cameraShake = 0.55;
      this.run.slowMoTimer = 0.8;
      this.run.slowMoScale = 0.38;
      this.addHype(100, `ESCAPED ${boss.name.toUpperCase()}!`);
      this.spawnFireworks(this.playerMesh.position);
      audioEngine.playAchievement();
      audioEngine.playBark('Not today!');
      NativeBridge.vibrate(95);

      if (this.bossMesh) {
        this.spawnVfxBurst(this.bossMesh.position, boss.accent, 30);
        this.runGroup.remove(this.bossMesh);
        this.bossMesh = null;
      }
      this.cb.onBossAlert?.({ active: false });
      this.transitionToNextWorld();
    } else {
      this.takeObstacleHit(true);
      this.run.bossActive = false;
      this.run.bossDefeatedInWorld = true;
      if (this.bossMesh) {
        this.runGroup.remove(this.bossMesh);
        this.bossMesh = null;
      }
      this.cb.onBossAlert?.({ active: false });
      this.transitionToNextWorld();
    }
  }

  transitionToNextWorld() {
    const nextId = this.run.worldId < 7 ? this.run.worldId + 1 : 1;
    this.run.worldId = nextId;
    this.run.maxWorld = Math.max(this.run.maxWorld, nextId);
    this.run.worldStartDist = this.run.distance;
    this.run.bossDefeatedInWorld = false;
    this.run.chaserDist = this.run.chaserMaxDist;
    this.run.invulnTimer = 2.6;

    this.applyWorldVisuals(nextId);
    this.spawnChaserForWorld(nextId);
    audioEngine.startMusic(nextId);
    audioEngine.playWorldEnter();
    this.cb.onWorldShift?.(this.getCurrentWorld());
    this.cb.onPowerToast?.(`🌀 PORTAL SHIFT → ${this.getCurrentWorld().name.toUpperCase()}!`);
  }

  // --- WORLD & CHASER SPECIALS ---
  updateWorldAndChaserSpecials(dt) {
    const r = this.run;
    const world = this.getCurrentWorld();
    const chaser = CHASERS[world.chaserId];

    let activeMech = world.uniqueMechanic;
    if (world.uniqueMechanic === 'reality_shift') {
      r.realityShiftTimer -= dt;
      if (r.realityShiftTimer <= 0) {
        r.realityShiftTimer = 10;
        const pick = 1 + Math.floor(this.rng() * 6);
        r.realityShiftWorldId = pick;
        this.applyWorldVisuals(pick);
        this.cb.onPowerToast?.(`⚡ REALITY SHIFT: ${WORLDS[pick - 1].name}!`);
      }
      activeMech = WORLDS[(r.realityShiftWorldId || 1) - 1].uniqueMechanic;
    }

    if (activeMech === 'lava_lanes') {
      r.lavaTimer -= dt;
      if (r.lavaTimer <= 0) {
        r.lavaTimer = 5.2;
        r.lavaLane = Math.floor(this.rng() * 3);
        this.spawnObstacle('hazard_floor', r.lavaLane, -36, world, { hazardKind: 'lava' });
      }
    }
    if (activeMech === 'fire_trail') {
      r.chaserAbilityTimer -= dt;
      if (r.chaserAbilityTimer <= 0) {
        r.chaserAbilityTimer = 6.5;
        this.spawnObstacle('hazard_floor', r.lane, -34, world, { hazardKind: 'fire' });
        if (r.chaserDist < 20) this.spawnObstacle('moving', (r.lane + 1) % 3, -38, world, { velZ: 5.5 });
      }
    }
    if (activeMech === 'ice_physics') {
      r.chaserAbilityTimer -= dt;
      if (r.chaserAbilityTimer <= 0) {
        r.chaserAbilityTimer = 9.0;
        if (this.rng() < 0.5) {
          this.spawnObstacle('hazard_floor', r.lane, -35, world, { hazardKind: 'timeslow' });
        } else {
          r.gravityDriftDir = this.rng() < 0.5 ? -1 : 1;
          r.gravityDriftTimer = 2.8;
          this.cb.onPowerToast?.(`🌀 AURORA DRIFT ${r.gravityDriftDir > 0 ? '→' : '←'}`);
        }
      }
    }
    if (activeMech === 'void_infestation') {
      r.chaserAbilityTimer -= dt;
      if (r.chaserAbilityTimer <= 0) {
        r.chaserAbilityTimer = 8.2;
        this.spawnObstacle('hazard_floor', Math.floor(this.rng() * 3), -35, world, { hazardKind: 'infest' });
        this.spawnObstacle('moving', Math.floor(this.rng() * 3), -38, world, { velZ: 3 });
      }
    }
    if (world.id === 7 && !r.bossActive) {
      r.chaserAbilityTimer -= dt;
      if (r.chaserAbilityTimer <= 0) {
        r.chaserAbilityTimer = 11.0;
        if (this.rng() < 0.6) {
          const low = this.rng() < 0.5;
          this.spawnObstacle(low ? 'sonic_low' : 'sonic_high', 1, -38, world, { velZ: 6.5 });
          this.cb.onPowerToast?.(low ? '〰️ SONIC WAVE — JUMP!' : '〰️ SONIC WAVE — SLIDE!');
        } else {
          r.darkVeilTimer = 1.5;
          this.cb.onPowerToast?.('🌑 DARK VEIL!');
        }
      }
    }
    if (world.id === 2) {
      r.laneStayTimer += dt;
      if (r.laneStayTimer > 5) r.chaserDist = Math.max(2, r.chaserDist - dt * 1.2);
    }
    if (world.id === 3 && r.chaserDist < 15 && r.controlsInvertedTimer <= 0 && Math.random() < dt * 0.12) {
      r.controlsInvertedTimer = 0.55;
      this.cb.onPowerToast?.('👁️ MIRAGE PULSE!');
    }

    if (!r.bossActive && r.voidDomainTimer <= 0) {
      let closeRate = chaser.baseCloseRate;
      if (r.eclipseVeilTimer > 0) closeRate *= -0.8;
      if (r.stumbleTimer > 0) closeRate += 2.4;
      r.chaserDist = Math.max(0, Math.min(r.chaserMaxDist, r.chaserDist - closeRate * dt));
      if (r.chaserDist <= 0.4) this.triggerGameOver('Caught by ' + chaser.name);
    }

    if (this.chaserMesh) {
      this.chaserMesh.visible = !r.bossActive;
      const visualZ = 1.8 + r.chaserDist * 0.24;
      this.chaserMesh.position.z += (visualZ - this.chaserMesh.position.z) * Math.min(1, dt * 8);
      this.chaserMesh.position.x += (r.x * 0.85 - this.chaserMesh.position.x) * Math.min(1, dt * 5);
      this.chaserMesh.position.y = Math.abs(Math.sin(performance.now() * 0.01)) * 0.3;
    }
  }

  // --- COLLISIONS, NEAR-MISSES & MILESTONES ---
  takeObstacleHit(fromQte = false) {
    const r = this.run;
    if (r.invulnTimer > 0 && !fromQte) return;

    if (r.firstObstaclePhased && !fromQte) {
      r.firstObstaclePhased = false;
      this.cb.onPowerToast?.('🗡️ PHANTOM STEP — AUTO PHASED!');
      this.spawnAuraBurst(this.playerMesh.position, 14);
      return;
    }
    if (r.shieldHits > 0) {
      r.shieldHits -= 1;
      r.invulnTimer = 0.9;
      this.pushChaser(15);
      this.spawnAuraBurst(this.playerMesh.position, 22);
      audioEngine.playPower('shadow_shield');
      this.cb.onPowerToast?.('🛡️ SHADOW SHIELD ABSORBED!');
      return;
    }
    if (r.barrierHits > 0) {
      r.barrierHits -= 1;
      r.invulnTimer = 0.9;
      this.spawnAuraBurst(this.playerMesh.position, 18);
      this.cb.onPowerToast?.('🛡️ BARRIER ABSORBED!');
      return;
    }
    if (saveManager.data.codexLevel >= 55 && r.voidResonanceTimer <= 0 && r.ve >= 5) {
      r.ve -= 5;
      r.voidResonanceTimer = 5.0;
      this.spawnAuraBurst(this.playerMesh.position, 16);
      audioEngine.playPower('void_resonance');
      this.cb.onPowerToast?.('🪐 VOID RESONANCE DEFLECT!');
      return;
    }

    if (r.stumbleTimer > 0) {
      if (saveManager.hasSPNode('shadow_2nd') && !r.secondChanceUsed) {
        r.secondChanceUsed = true;
        r.stumbleTimer = 0;
        r.invulnTimer = 2.4;
        this.pushChaser(22);
        this.cb.onPowerToast?.('✨ SECOND CHANCE ACTIVATED!');
        return;
      }
      this.triggerGameOver('Void Collapsed');
      return;
    }

    let stDur = TRACK_CONFIG.stumbleDuration;
    if (r.charId === 'precious') stDur *= 0.7;
    if (saveManager.hasSPNode('shadow_rec')) stDur = Math.max(0.2, stDur - 0.1);
    r.stumbleTimer = stDur;
    r.noHitStreak = 0;
    r.multiplier = Math.max(1, r.multiplier - 2);
    r.chaserDist = Math.max(1.5, r.chaserDist - 11);
    if (!saveManager.data.settings.reducedMotion) r.cameraShake = 0.42;
    audioEngine.playStumble();
    NativeBridge.vibrate(75);
    this.spawnVfxBurst(this.playerMesh.position, 0xff2244, 16);
  }

  registerNearMiss() {
    const r = this.run;
    r.nearMisses += 1;
    r.nearMissCombo = r.nearMissComboTimer > 0 ? r.nearMissCombo + 1 : 1;
    if (r.nearMissCombo > r.bestCombo) r.bestCombo = r.nearMissCombo;
    r.nearMissComboTimer = r.charId === 'nyx' ? 3.2 : 2.4;
    r.ve = Math.min(r.maxVE, r.ve + 8);
    r.multiplier = Math.min(8, r.multiplier + (r.nearMissCombo >= 2 ? 1 : 0));
    this.pushChaser(3.5);

    if (r.nearMissCombo === 2) r.vs += 5;
    else if (r.nearMissCombo === 3) r.vs += 10;
    else if (r.nearMissCombo >= 4) {
      r.vs += 20;
      this.pushChaser(5);
    }

    this.addScore(120 * r.nearMissCombo, r.nearMissCombo > 1 ? `⚡ NEAR ×${r.nearMissCombo}` : '💨 NEAR MISS', '#00E5FF');

    if (r.timeBleedTimer <= 0 && !saveManager.data.settings.reducedMotion) {
      r.slowMoTimer = 0.28;
      r.slowMoScale = 0.74;
    }
    const pts = r.timeBleedTimer > 0 ? 80 : r.nearMissCombo >= 3 ? 100 : r.nearMissCombo === 2 ? 60 : 30;
    this.addHype(pts, r.nearMissCombo > 1 ? `NEAR-MISS ×${r.nearMissCombo}!` : 'NEAR-MISS!');
    audioEngine.playNearMiss(r.nearMissCombo);
    NativeBridge.vibrate(20);
  }

  addHype(points, label) {
    const r = this.run;
    r.hypeScore += points;
    if (r.hypeScore >= 50 && r.hypeScore > r.bestHypeScore) {
      r.bestHypeScore = r.hypeScore;
      r.bestMomentDist = Math.floor(r.distance);
      r.bestMomentLabel = label;
      r.bestMomentFrames = [...r.rollingFrames];
    }
  }

  manualBookmarkClip() {
    if (!this.run) return;
    this.run.bestHypeScore = Math.max(this.run.bestHypeScore, 65);
    this.run.bestMomentDist = Math.floor(this.run.distance);
    this.run.bestMomentLabel = 'Manual Clip Bookmark';
    this.run.bestMomentFrames = [...this.run.rollingFrames];
    this.cb.onPowerToast?.('📷 MOMENT BOOKMARKED!');
  }

  advanceWorldZ(dz) {
    const r = this.run;
    r.distance += dz;
    r.noHitStreak += dz;
    r.cleanMeterProgress += dz;
    r.score += dz * 2.5 * r.multiplier * (r.doubleTimer > 0 ? 2 : 1);

    // Every 160m clean running raises Arcade Score Multiplier up to x8!
    if (r.cleanMeterProgress >= 160) {
      r.cleanMeterProgress = 0;
      if (r.multiplier < 8) {
        r.multiplier += 1;
        this.cb.onFloatingPopup?.(`🔥 MULTIPLIER ×${r.multiplier}!`, '#FFD84D');
      }
    }

    // Exciting distance milestone celebrations (500m, 1000m, 1500m...)
    if (r.distance >= r.nextMilestoneDist) {
      const m = r.nextMilestoneDist;
      r.nextMilestoneDist += 500;
      this.addScore(500, `🌟 ${m}m MILESTONE!`, '#3DFF7A');
      this.spawnFireworks(this.playerMesh.position);
      audioEngine.playBonusRing();
    }

    if (r.noHitStreak > r.longestNoHit) r.longestNoHit = r.noHitStreak;

    for (const c of r.chunks) {
      c.group.position.z += dz;
      c.zStart += dz;
      c.zEnd += dz;
    }
    r.nextChunkZ += dz;

    while (r.chunks.length > 0 && r.chunks[0].zEnd > 22) {
      const old = r.chunks.shift();
      this.runGroup.remove(old.group);
    }
    while (r.chunks.length < TRACK_CONFIG.activeChunksAhead + 2) {
      this.spawnChunk(false);
    }

    for (const o of r.obstacles) {
      o.z += dz;
      o.mesh.position.z = o.z;
    }
    for (const col of r.collectibles) {
      col.z += dz;
      col.mesh.position.z = col.z;
    }
  }

  triggerGameOver(reason) {
    if (this.mode !== 'running') return;
    this.mode = 'gameover';
    audioEngine.playGameOver();
    audioEngine.setAdaptiveLayers({ tension: 0, power: 0, boss: 0, hype: 0 });
    NativeBridge.vibrate(120);
    this.cb.onGameOver?.({
      reason,
      canSecondWind: !this.run.reviveUsed && !this.run.isDaily && saveManager.data.vs >= 100,
      summary: this.getRunSummary(),
    });
  }

  reviveWithSecondWind() {
    if (!this.run || this.run.reviveUsed) return false;
    if (saveManager.data.vs < 100) return false;
    saveManager.data.vs -= 100;
    saveManager.save();
    this.run.reviveUsed = true;
    this.run.stumbleTimer = 0;
    this.run.invulnTimer = 2.8;
    this.run.chaserDist = this.run.chaserMaxDist;
    this.destroyObstaclesAhead(30, false);
    this.mode = 'running';
    audioEngine.playWorldEnter();
    this.cb.onPowerToast?.('⚡ VOID SECOND WIND!');
    return true;
  }

  getRunSummary() {
    const r = this.run;
    return {
      score: Math.floor(r.score),
      distance: r.distance,
      durationSec: (performance.now() - r.startTimeMs) / 1000,
      vs: r.vs,
      ce: r.ce,
      bc: r.bc,
      nearMisses: r.nearMisses,
      bestCombo: r.bestCombo,
      bonusRings: r.bonusRings,
      enemiesDefeated: r.enemiesDefeated,
      powersUsed: r.powersUsed,
      pushbacks: r.chaserPushbacks,
      bossesEscaped: r.bossesEscaped,
      worldsCompleted: r.worldsCompleted,
      maxWorld: r.maxWorld,
      longestNoHit: r.longestNoHit,
      fragmentsFound: r.fragmentsFound,
      lastPowerUsed: r.lastPowerUsed,
      usedCodexBoost: r.usedCodexBoost,
      isDaily: r.isDaily,
      seed: r.seed,
      ghostData: r.ghostRecord,
      bestMomentLabel: r.bestMomentLabel,
      bestMomentDist: r.bestMomentDist,
      bestHypeScore: r.bestHypeScore,
      bestMomentFrames: r.bestMomentFrames,
      challengeDist: r.ghostTargetDist,
      challengerName: r.challengerName,
    };
  }

  togglePause() {
    if (this.mode === 'running') {
      this.mode = 'paused';
      return true;
    } else if (this.mode === 'paused') {
      this.mode = 'running';
      this.lastTime = performance.now();
      return false;
    }
    return false;
  }

  // --- MAIN FRAME LOOP ---
  loop(now) {
    this.rafId = requestAnimationFrame((t) => this.loop(t));
    const rawDt = Math.min(0.05, (now - (this.lastTime || now)) / 1000);
    this.lastTime = now;

    if (!saveManager.data.settings.highGraphics) {
      this.frameCapAccumulator += rawDt;
      if (this.frameCapAccumulator < 1 / 32) return;
      this.frameCapAccumulator = 0;
    }

    // Subtle atmospheric star rotation
    if (this.stars) this.stars.rotation.z += rawDt * 0.025;

    if (this.mode === 'menu') {
      if (this.menuCharMesh) {
        if (this.menuCharMesh.userData.isSpriteRig) {
          this.menuTurnAngle = (this.menuTurnAngle || 0) + rawDt * 0.42;
          this.updateMenuSpriteTurnaround(this.menuTurnAngle);
          this.menuCharMesh.position.y = Math.sin(now * 0.0032) * 0.06;
          this.menuCharMesh.userData.bodyPivot.scale.set(
            1 + Math.sin(now * 0.0028) * 0.015,
            1 + Math.cos(now * 0.0028) * 0.018,
            1
          );
        } else {
          this.menuCharMesh.rotation.y += rawDt * 0.45;
          this.menuCharMesh.position.y = Math.sin(now * 0.003) * 0.06;
          if (this.menuCharMesh.userData.scarf) {
            this.menuCharMesh.userData.scarf.rotation.x = 0.35 + Math.sin(now * 0.005) * 0.14;
          }
        }
      }
      if (this.menuRing) this.menuRing.rotation.z += rawDt * 0.85;
      if (this.menuOuterRing) this.menuOuterRing.rotation.z -= rawDt * 0.5;
      if (this.menuPortal) {
        this.menuPortal.userData.ring.rotation.z -= rawDt * 0.7;
        this.menuPortal.userData.innerRing.rotation.z += rawDt * 1.1;
      }
      if (this.menuOrbs) {
        this.menuOrbs.forEach((m, i) => {
          const a = now * 0.0011 + (i * Math.PI) / 2;
          m.position.set(Math.cos(a) * 2.1, 0.9 + Math.sin(now * 0.002 + i) * 0.4, Math.sin(a) * 2.1 - 0.5);
          m.rotation.y += rawDt * 2.2;
        });
      }
      this.renderer.render(this.scene, this.camera);
      return;
    }

    if (this.mode === 'running') {
      this.stepRun(rawDt, now);
    }

    this.renderer.render(this.scene, this.camera);
  }

  stepRun(rawDt, now) {
    const r = this.run;
    const world = this.getCurrentWorld();

    let timeScale = 1.0;
    if (r.timeBleedTimer > 0) {
      r.timeBleedTimer -= rawDt;
      timeScale = r.slowMoScale || 0.35;
    } else if (r.slowMoTimer > 0) {
      r.slowMoTimer -= rawDt;
      timeScale = r.slowMoScale || 0.74;
    }
    const worldDt = rawDt * timeScale;

    if (this.bufferAction && now <= this.bufferExpiry && r.stumbleTimer <= 0 && !r.isJumping) {
      const act = this.bufferAction;
      this.bufferAction = null;
      this.handleInput(act);
    } else if (this.bufferAction && now > this.bufferExpiry) {
      this.bufferAction = null;
    }

    // Tick timers
    const dec = (k) => { if (r[k] > 0) r[k] = Math.max(0, r[k] - rawDt); };
    [
      'slideTimer', 'stumbleTimer', 'invulnTimer', 'magnetTimer', 'doubleTimer', 'surgeTimer',
      'voidSenseTimer', 'stillstepTimer', 'voidwalkTimer', 'eclipseVeilTimer', 'chronalHavenTimer',
      'voidDomainTimer', 'voidlightTimer', 'conceptReversalTimer', 'ritualWardTimer', 'cryoPathTimer',
      'voidResonanceTimer', 'infestedTimer', 'timeSlowZoneTimer', 'gravityDriftTimer', 'darkVeilTimer',
      'controlsInvertedTimer', 'emotionSlugTimer', 'bonusHighwayTimer', 'weaponCd', 'enemySlowTimer',
    ].forEach(dec);

    if (r.nearMissComboTimer > 0) {
      r.nearMissComboTimer -= rawDt;
      if (r.nearMissComboTimer <= 0) r.nearMissCombo = 0;
    }
    r.hypeScore = Math.max(0, r.hypeScore - rawDt * 4);

    for (const k of Object.keys(r.cooldowns)) r.cooldowns[k] = Math.max(0, r.cooldowns[k] - rawDt);

    if (r.infestedTimer <= 0) {
      let regen = 3.2 + (saveManager.hasSPNode('codex_ve') ? 1 : 0);
      if (r.charId === 'precious') regen *= 1.25;
      if (r.charId === 'elara') regen *= 1.3;
      if (r.gear.armor.veRegenBonus) regen *= 1 + r.gear.armor.veRegenBonus;
      r.ve = Math.min(r.maxVE, r.ve + regen * rawDt);
    }

    const worldDist = r.distance - r.worldStartDist;
    const baseW = TRACK_CONFIG.baseSpeed * Math.pow(1.05, r.worldId - 1);
    let targetSpeed =
      worldDist < 300 ? baseW : worldDist < 800 ? baseW * 1.17 : worldDist < 1400 ? baseW * 1.38 : baseW * 1.5;
    if (r.stumbleTimer > 0) targetSpeed *= 0.78;
    if (r.enemySlowTimer > 0) targetSpeed *= r.enemySlowFactor;
    if (r.timeSlowZoneTimer > 0) targetSpeed *= 0.72;
    if (r.surgeTimer > 0) targetSpeed *= 1.8;
    if (r.voidlightTimer > 0) targetSpeed *= 2.2;
    if (r.voidDomainTimer > 0) targetSpeed *= 1.3;
    if (r.bonusHighwayTimer > 0) targetSpeed *= 1.25;
    r.speed += (targetSpeed - r.speed) * Math.min(1, rawDt * 6);

    this.advanceWorldZ(r.speed * worldDt);

    // Player horizontal movement + responsive lean
    let laneLerp = r.charId === 'nyx' ? 21 : r.charId === 'rumbidzai' ? 20 : 15;
    if (world.uniqueMechanic === 'ice_physics') laneLerp *= 0.68;
    if (r.gravityDriftTimer > 0) {
      r.targetX = Math.max(-1.2, Math.min(1.2, r.targetX + r.gravityDriftDir * rawDt * 0.42));
    }
    r.x += (r.targetX - r.x) * Math.min(1, laneLerp * rawDt);

    // Vertical physics + landing squash & SFX
    r.wasJumping = r.isJumping;
    if (r.stillstepTimer > 0 && !r.isJumping) {
      r.y += (0.85 - r.y) * Math.min(1, rawDt * 12);
    } else if (r.isJumping) {
      r.y += r.velY * rawDt;
      r.velY -= 32 * rawDt;
      if (r.y <= 0) {
        r.y = 0;
        r.velY = 0;
        r.isJumping = false;
        r.squashX = 1.2;
        r.squashY = 0.8;
        audioEngine.playLand();
        this.spawnAuraBurst(this.playerMesh.position, 5);
      }
    } else {
      r.y += (0 - r.y) * Math.min(1, rawDt * 14);
    }

    // Smooth squash-and-stretch recovery
    r.squashX += (1 - r.squashX) * Math.min(1, rawDt * 14);
    r.squashY += (1 - r.squashY) * Math.min(1, rawDt * 14);

    // Animate Player Mesh (Supports both 2.5D Articulated Source-Image Rig & Procedural 3D Allies!)
    const pm = this.playerMesh;
    const ud = pm.userData;
    pm.position.set(r.x, r.y, 0);
    const runCycle = now * 0.017 * (r.speed / 12);
    const phased = r.voidwalkTimer > 0 || r.voidDomainTimer > 0 || r.eclipseVeilTimer > 0;

    if (ud.isSpriteRig) {
      const bankDiff = r.targetX - r.x;
      const isBanking = Math.abs(bankDiff) > 0.22;
      const isStriking = r.weaponCd > r.gear.weapon.cd - 0.26;
      const useSkel = !!ud.skeletalReady;

      // Always keep our live 10-part articulated skeletal back rig active during gameplay!
      ud.frontPlane.visible = false;
      ud.sidePlane.visible = false;
      ud.backRunGroup.visible = true;
      ud.skelGroup.visible = useSkel;
      ud.backFullPlane.visible = !useSkel;

      // Kinetic holographic afterimages during lane dashes, strikes & speed bursts!
      if ((isBanking || isStriking || r.surgeTimer > 0 || r.voidlightTimer > 0) && !saveManager.data.settings.reducedMotion) {
        r.afterimageTick = (r.afterimageTick || 0) + rawDt;
        if (r.afterimageTick >= 0.065) {
          r.afterimageTick = 0;
          const tex = isBanking ? ud.sidePlane.material.map : ud.backFullPlane.material.map;
          const ghostMat = new THREE.MeshBasicMaterial({
            map: tex,
            color: isStriking ? 0x3dff7a : (r.trailData?.color || 0x00e5ff),
            transparent: true,
            opacity: 0.42,
            alphaTest: 0.08,
            side: THREE.DoubleSide,
            depthWrite: false,
          });
          const ghostPlane = new THREE.Mesh(new THREE.PlaneGeometry(2.05, 2.05), ghostMat);
          ghostPlane.position.set(r.x, r.y + 1.02, 0.14);
          if (isBanking) ghostPlane.scale.x = bankDiff > 0.05 ? -1 : 1;
          this.runGroup.add(ghostPlane);
          this.trailParticles.push({ mesh: ghostPlane, life: 0.2, maxLife: 0.2, isAfterimage: true });
        }
      }

      if (useSkel) {
        // === TRUE MULTI-JOINT RUNNING MOTION: TORSO, HEAD, ARMS/HANDS & 2-SEGMENT LEGS ===
        const s = Math.sin(runCycle);
        const c = Math.cos(runCycle);
        const speedNorm = Math.max(0, Math.min(1, (r.speed - 11) / 14));

        // Reset shared body scale & subtle 3D bank twist into lane changes
        ud.bodyPivot.position.y = 0;
        ud.bodyPivot.rotation.set(0, -bankDiff * 0.34, -bankDiff * 0.26);
        ud.bodyPivot.scale.set(r.squashX, r.squashY, 1);

        if (r.slideTimer > 0) {
          // Low athletic power-slide: hips drop, torso leans back, arms flare out for balance, legs extend!
          ud.hipsPivot.position.y = ud.hipBaseY * 0.46;
          ud.hipsPivot.rotation.set(0, 0, -bankDiff * 0.16);
          ud.torsoPivot.rotation.set(0.58, 0, 0);
          ud.headPivot.rotation.set(-0.35, 0, 0);

          ud.lShoulderPivot.rotation.set(-0.35, 0, 0.12);
          ud.lElbowPivot.rotation.set(-0.45, 0, -0.15);
          ud.rShoulderPivot.rotation.set(-0.35, 0, -0.12);
          ud.rElbowPivot.rotation.set(-0.45, 0, 0.15);

          ud.lHipPivot.position.y = 0;
          ud.rHipPivot.position.y = 0;
          ud.lHipPivot.rotation.set(-1.1, 0, 0.08);
          ud.lKneePivot.rotation.set(0.25, 0, 0);
          ud.lHipPivot.scale.y = 0.85;
          ud.lKneePivot.scale.y = 0.85;
          ud.rHipPivot.rotation.set(-0.55, 0, -0.12);
          ud.rKneePivot.rotation.set(1.1, 0, 0);
          ud.rHipPivot.scale.y = 0.85;
          ud.rKneePivot.scale.y = 0.72;
        } else if (r.isJumping) {
          // Dynamic airborne vault: arms throw up/forward, front knee drives high, trailing leg kicks back!
          ud.hipsPivot.position.y = ud.hipBaseY + 0.06;
          ud.hipsPivot.rotation.set(0, 0.12, -bankDiff * 0.18);
          ud.torsoPivot.rotation.set(-0.22, -0.14, 0);
          ud.headPivot.rotation.set(0.14, 0.08, 0);

          // Both arms drive up & forward cleanly
          ud.lShoulderPivot.rotation.set(-1.05, 0, 0.34);
          ud.lElbowPivot.rotation.set(-0.75, 0, -0.22);
          ud.rShoulderPivot.rotation.set(-0.75, 0, -0.34);
          ud.rElbowPivot.rotation.set(-0.85, 0, 0.22);

          // Left knee tucked high, right leg trailing bent
          ud.lHipPivot.position.y = 0.16;
          ud.lHipPivot.rotation.set(-0.95, 0, 0.06);
          ud.lHipPivot.scale.y = 0.88;
          ud.lKneePivot.rotation.set(1.15, 0, 0);
          ud.lKneePivot.scale.y = 0.82;

          ud.rHipPivot.position.y = 0.05;
          ud.rHipPivot.rotation.set(0.42, 0, -0.06);
          ud.rHipPivot.scale.y = 0.92;
          ud.rKneePivot.rotation.set(0.75, 0, 0);
          ud.rKneePivot.scale.y = 0.84;
        } else {
          // === FULL-SPEED ATHLETIC SPRINT CYCLE ===
          // 1. Hips: rhythmic stride bounce, pelvic sway & hip counter-rotation
          ud.hipsPivot.position.y = ud.hipBaseY + Math.abs(c) * (0.12 + speedNorm * 0.05);
          ud.hipsPivot.rotation.set(0, -s * 0.15, s * 0.065);

          // 2. Torso: forward sprint lean + unmistakable shoulder counter-twist opposite to hips!
          const leanX = r.stumbleTimer > 0 ? 0.24 : (-0.18 - speedNorm * 0.12);
          const strikeTwist = isStriking ? -0.58 : 0;
          ud.torsoPivot.rotation.set(leanX, s * 0.28 + strikeTwist, -s * 0.075);

          // 3. Head: counter-stabilizes gaze forward with gentle stride nod
          ud.headPivot.rotation.set(0.11 + Math.abs(c) * 0.045, -s * 0.14 - strikeTwist * 0.4, s * 0.03);

          // 4. Arms & Hands: pull A-pose arms INWARD to athletic sides, bend elbows & pump opposite to legs!
          // Left Arm drives forward when Right Leg drives forward (s < 0 => forward, s > 0 => back)
          const lArmDrive = -s;
          ud.lShoulderPivot.rotation.set(lArmDrive * 0.88, 0, 0.56 + Math.max(0, -lArmDrive) * 0.14);
          ud.lShoulderPivot.position.z = -0.02 + lArmDrive * 0.10;
          ud.lElbowPivot.rotation.set(-0.92 - Math.max(0, lArmDrive) * 0.52 + Math.max(0, -lArmDrive) * 0.28, 0, -0.18 - lArmDrive * 0.18);

          // Right Arm pumps opposite to Left Arm — or whips forward during Gear Strike!
          if (isStriking) {
            ud.rShoulderPivot.rotation.set(-1.38, 0, -0.22);
            ud.rShoulderPivot.position.z = -0.14;
            ud.rElbowPivot.rotation.set(-0.32, 0, 0.32);
          } else {
            const rArmDrive = s;
            ud.rShoulderPivot.rotation.set(rArmDrive * 0.88, 0, -0.56 - Math.max(0, -rArmDrive) * 0.14);
            ud.rShoulderPivot.position.z = -0.02 + rArmDrive * 0.10;
            ud.rElbowPivot.rotation.set(-0.92 - Math.max(0, rArmDrive) * 0.52 + Math.max(0, -rArmDrive) * 0.28, 0, 0.18 + rArmDrive * 0.18);
          }

          // 5. Left & Right 2-Joint Legs (Hip/Thigh + Knee/Shin/Boot stride & kick-back!)
          const lFwd = Math.max(0, s);
          const lBack = Math.max(0, -s);
          ud.lHipPivot.position.y = lFwd * 0.15 + lBack * 0.07;
          ud.lHipPivot.rotation.set(-s * 0.92, 0, 0.03);
          ud.lHipPivot.scale.y = 1.0 - lBack * 0.15 - lFwd * 0.06;
          ud.lKneePivot.rotation.set(0.18 + lBack * 1.18 + Math.max(0, c) * 0.35, 0, 0);
          ud.lKneePivot.scale.y = 1.0 - lBack * 0.28;

          const rFwd = Math.max(0, -s);
          const rBack = Math.max(0, s);
          ud.rHipPivot.position.y = rFwd * 0.15 + rBack * 0.07;
          ud.rHipPivot.rotation.set(s * 0.92, 0, -0.03);
          ud.rHipPivot.scale.y = 1.0 - rBack * 0.15 - rFwd * 0.06;
          ud.rKneePivot.rotation.set(0.18 + rBack * 1.18 + Math.max(0, -c) * 0.35, 0, 0);
          ud.rKneePivot.scale.y = 1.0 - rBack * 0.28;
        }
      } else {
        // Brief fallback animation while sprite image loads (<2ms)
        ud.bodyPivot.position.y = Math.abs(Math.cos(runCycle)) * 0.1;
        ud.bodyPivot.scale.set(r.squashX, r.squashY, 1);
      }

      // Apply phased / slowed / strike visual tint across all skeletal sprite materials
      for (const m of ud.spriteMats) {
        m.opacity = phased ? 0.45 : 1.0;
        if (r.stumbleTimer > 0) m.color.setHex(0xff7788);
        else if (r.enemySlowTimer > 0) m.color.setHex(0xff99ee);
        else if (isStriking) m.color.setHex(0xbefeff);
        else m.color.set(ud.baseTint);
      }
    } else {
      if (r.slideTimer > 0) {
        ud.bodyPivot.scale.set(1.12, 0.48, 1.08);
        ud.bodyPivot.rotation.x = -0.38;
      } else {
        ud.bodyPivot.scale.set(r.squashX, r.squashY, 1);
        ud.bodyPivot.rotation.x = r.stumbleTimer > 0 ? 0.3 : 0.12;
        ud.legL.rotation.x = r.isJumping ? 0.55 : Math.sin(runCycle) * 0.9;
        ud.legR.rotation.x = r.isJumping ? -0.45 : -Math.sin(runCycle) * 0.9;
        ud.armL.rotation.x = -Math.sin(runCycle) * 0.8;
        ud.armR.rotation.x = Math.sin(runCycle) * 0.8;
      }
      ud.bodyPivot.rotation.z = (r.x - r.targetX) * 0.32;
      if (ud.scarf) ud.scarf.rotation.x = 0.45 + Math.sin(runCycle * 1.4) * 0.25;
      ud.matBody.transparent = phased;
      ud.matBody.opacity = phased ? 0.42 : 1.0;
    }

    if (ud.footRing) {
      ud.footRing.position.y = -r.y + 0.04;
      const fScale = Math.max(0.55, 1 - r.y * 0.22);
      ud.footRing.scale.set(fScale, fScale, 1);
    }

    ud.shieldMesh.visible = r.shieldHits > 0 || r.barrierHits > 0 || r.armorDeflects > 0 || r.chronalHavenTimer > 0 || r.voidlightTimer > 0;
    ud.shieldMesh.rotation.y += rawDt * 2.8;
    ud.orbGroup.visible = saveManager.data.codexLevel >= 55 && r.voidResonanceTimer <= 0;
    ud.orbGroup.rotation.y += rawDt * 3.4;

    // Emit custom Void Trail particles behind the runner!
    r.trailTick += rawDt;
    const trailRate = saveManager.data.settings.highGraphics ? 0.032 : 0.07;
    if (r.trailTick >= trailRate && !saveManager.data.settings.reducedMotion) {
      r.trailTick = 0;
      const tr = r.trailData || TRAILS[0];
      const tCol = tr.rainbow ? RAINBOW_HEX[Math.floor(now * 0.008) % RAINBOW_HEX.length] : tr.color;
      const m = new THREE.Mesh(
        this.sharedTrailGeo,
        new THREE.MeshBasicMaterial({ color: tCol, transparent: true, opacity: 0.85 })
      );
      m.position.set(r.x + (Math.random() - 0.5) * 0.34, r.y + 0.28 + Math.random() * 0.45, 0.35);
      this.runGroup.add(m);
      this.trailParticles.push({ mesh: m, life: 0.32, maxLife: 0.32 });
    }
    for (let i = this.trailParticles.length - 1; i >= 0; i--) {
      const tp = this.trailParticles[i];
      tp.life -= rawDt;
      tp.mesh.position.z += r.speed * worldDt * 0.85;
      const s = Math.max(0.05, tp.life / tp.maxLife);
      if (tp.isAfterimage) {
        tp.mesh.material.opacity = s * 0.42;
      } else {
        tp.mesh.scale.set(s, s, s);
        tp.mesh.material.opacity = s * 0.85;
      }
      if (tp.life <= 0) {
        this.runGroup.remove(tp.mesh);
        if (tp.isAfterimage) tp.mesh.geometry.dispose();
        tp.mesh.material.dispose();
        this.trailParticles.splice(i, 1);
      }
    }

    // Horizon portal swirl + subtle parallax sway on illustrated environment backdrop & floating rocks!
    if (this.horizonPortal) {
      this.horizonPortal.userData.ring.rotation.z -= rawDt * 0.8;
      this.horizonPortal.userData.innerRing.rotation.z += rawDt * 1.4;
    }
    if (this.environBackdrop) {
      const targetRotY = -r.x * 0.032;
      this.environBackdrop.rotation.y += (targetRotY - this.environBackdrop.rotation.y) * Math.min(1, rawDt * 4);
    }
    for (const ch of r.chunks) {
      if (!ch.floaters) continue;
      for (const fl of ch.floaters) {
        fl.mesh.position.y = fl.baseY + Math.sin(now * 0.0022 + fl.phase) * fl.amp;
        fl.mesh.rotation.y += rawDt * 0.45;
      }
    }

    // Void Sense path ribbon
    this.senseGuide.visible = r.voidSenseTimer > 0 || r.charId === 'harry';
    if (this.senseGuide.visible) {
      const blocked = [0, 0, 0];
      for (const o of r.obstacles) {
        if (!o.hit && !o.isIllusion && o.z < 0 && o.z > -20) blocked[o.lane] += 1;
      }
      this.senseGuide.position.x = TRACK_CONFIG.laneX[blocked.indexOf(Math.min(...blocked))];
    }

    // Obstacles & approaching danger warnings
    for (let i = r.obstacles.length - 1; i >= 0; i--) {
      const o = r.obstacles[i];
      if (o.velZ) {
        o.z += o.velZ * worldDt;
        o.mesh.position.z = o.z;
      }
      if (o.type === 'moving') {
        o.x += o.moveDir * o.moveSpeed * worldDt;
        if (Math.abs(o.x) > 1.25) o.moveDir *= -1;
        o.mesh.position.x = o.x;
        o.mesh.rotation.y += worldDt * 3.2;
      }

      // Approaching fast/moving hazard subtle audio warning!
      if (!o.warned && (o.type === 'moving' || o.type === 'sonic_low' || o.type === 'sonic_high') && o.z > -24 && o.z < -16) {
        o.warned = true;
        audioEngine.playObstacleWarning();
      }

      if (!o.hit && r.ritualWardTimer > 0 && o.lane === r.ritualWardLane && o.z > -8 && o.z < 1) {
        o.hit = true;
        o.mesh.visible = false;
        this.spawnAuraBurst(o.mesh.position, 8);
      }
      if (!o.hit && r.chronalHavenTimer > 0 && o.z > -10 && o.z < 1) {
        o.hit = true;
        o.mesh.visible = false;
        r.vs += 2;
        this.addScore(80);
        this.spawnAuraBurst(o.mesh.position, 8);
      }

      if (!o.hit && Math.abs(o.z) < 0.78) {
        const dx = Math.abs(r.x - o.mesh.position.x);
        const laneHit = o.type === 'sonic_low' || o.type === 'sonic_high' ? true : dx < 0.52;
        if (laneHit) {
          let verticalHit = true;
          if ((o.type === 'ground' || o.type === 'sonic_low') && (r.y > 0.7 || r.stillstepTimer > 0)) verticalHit = false;
          if ((o.type === 'overhead' || o.type === 'sonic_high') && r.slideTimer > 0) verticalHit = false;
          if (o.type === 'hazard_floor' && r.y > 0.35) verticalHit = false;

          if (verticalHit) {
            o.hit = true;
            if (o.isIllusion) {
              o.mesh.visible = false;
              r.ve = Math.min(r.maxVE, r.ve + 5);
              this.addScore(150, '👁️ MIRAGE +5 VE', '#00E5FF');
              this.spawnVfxBurst(o.mesh.position, 0x00e5ff, 10);
            } else if (r.conceptReversalTimer > 0 || r.cryoPathTimer > 0 || r.voidlightTimer > 0 || r.surgeTimer > 0) {
              o.mesh.visible = false;
              r.vs += r.conceptReversalTimer > 0 ? 6 : 2;
              this.addScore(120, '💥 SMASH!', '#FFD84D');
              this.spawnAuraBurst(o.mesh.position, 10);
              audioEngine.playShard();
            } else if (r.charId === 'ruth' && o.type === 'overhead') {
              o.mesh.visible = false;
              this.addScore(100, '❄️ FROST SHATTER', '#5CF2FF');
              this.spawnVfxBurst(o.mesh.position, 0x5cf2ff, 10);
              audioEngine.playShard();
            } else if (r.voidwalkTimer > 0 || r.voidDomainTimer > 0) {
              // Phased safely!
            } else if (o.type === 'hazard_floor') {
              if (o.hazardKind === 'timeslow') r.timeSlowZoneTimer = 2.0;
              else if (o.hazardKind === 'infest') {
                r.infestedTimer = 4.5;
                this.cb.onPowerToast?.('☠️ VOID INFESTED — CAST POWER TO CLEANSE');
              } else {
                this.takeObstacleHit();
              }
            } else {
              this.takeObstacleHit();
            }
          } else if (!o.nearMissed && !o.isIllusion && o.type !== 'hazard_floor') {
            o.nearMissed = true;
            this.registerNearMiss();
          }
        } else if (!o.nearMissed && !o.isIllusion && o.type !== 'hazard_floor' && dx < 1.15 && Math.abs(o.z) < 0.65) {
          o.nearMissed = true;
          this.registerNearMiss();
        }
      }

      if (o.z > 14) {
        this.runGroup.remove(o.mesh);
        r.obstacles.splice(i, 1);
      }
    }

    // Collectibles & Golden Bonus Rift Rings
    const magActive = r.magnetTimer > 0 || r.surgeTimer > 0 || r.voidlightTimer > 0 || r.voidDomainTimer > 0;
    const pickupRadius = (saveManager.hasSPNode('codex_mag') ? 1.18 : 0.84) + (r.gear.relic.shardMagnetBonus || 0);
    for (let i = r.collectibles.length - 1; i >= 0; i--) {
      const col = r.collectibles[i];
      col.mesh.rotation.y += rawDt * 3.4;
      col.mesh.position.y = col.baseY + Math.sin(now * 0.005 + i) * 0.14;

      if (!col.collected && col.kind !== 'bonus_ring' && magActive && col.z < 2 && col.z > -13) {
        col.mesh.position.x += (r.x - col.mesh.position.x) * Math.min(1, rawDt * 13);
        col.mesh.position.y += (r.y + 0.85 - col.mesh.position.y) * Math.min(1, rawDt * 13);
        col.mesh.position.z += (0 - col.mesh.position.z) * Math.min(1, rawDt * 13);
        col.z = col.mesh.position.z;
      }

      const hitRad = col.kind === 'bonus_ring' ? 1.0 : pickupRadius;
      if (!col.collected && Math.abs(col.z) < 1.0 && Math.abs(col.mesh.position.x - r.x) < hitRad) {
        col.collected = true;
        col.mesh.visible = false;
        if (col.kind === 'shard') {
          let val = 1;
          if (r.doubleTimer > 0 || r.voidDomainTimer > 0) val *= 2;
          if (r.voidwalkTimer > 0) val = Math.ceil(val * 1.3);
          r.vs += val;
          r.ve = Math.min(r.maxVE, r.ve + 2);
          this.addScore(25);
          this.spawnVfxBurst(col.mesh.position, 0x00e5ff, 4);
          audioEngine.playShard();
        } else if (col.kind === 'bonus_ring') {
          r.bonusRings += 1;
          r.vs += 15;
          r.ve = Math.min(r.maxVE, r.ve + 22);
          r.bonusHighwayTimer = 4.5;
          r.multiplier = Math.min(8, r.multiplier + 1);
          this.addScore(r.charId === 'elara' ? 700 : 500, '🎯 GOLDEN RIFT BONUS!', '#FFD84D');
          this.spawnFireworks(col.mesh.position);
          audioEngine.playBonusRing();
          NativeBridge.vibrate(45);
          this.cb.onPowerToast?.('🌈 BONUS SHARD HIGHWAY ACTIVATED!');
        } else if (col.kind === 'essence') {
          r.ce += 1;
          this.addScore(r.charId === 'elara' ? 250 : 180, '✦ CODEX ESSENCE', '#B44FFF');
          this.spawnVfxBurst(col.mesh.position, 0x9b30ff, 10);
          audioEngine.playEssence();
        } else if (col.kind === 'core') {
          r.bc += 1;
          this.addScore(400, '🟡 BEAST CORE!', '#FFB020');
          this.spawnFireworks(col.mesh.position);
          audioEngine.playBeastCore();
        } else if (col.kind === 'fragment') {
          r.fragmentsFound.push(col.meta);
          this.addScore(600, '📜 CODEX FRAGMENT!', '#FFF0AA');
          this.spawnFireworks(col.mesh.position);
          audioEngine.playAchievement();
          this.cb.onPowerToast?.('📜 HIDDEN CODEX FRAGMENT FOUND!');
        } else {
          this.applyPowerup(col.kind);
        }
      }

      if (col.z > 12 || col.collected) {
        this.runGroup.remove(col.mesh);
        r.collectibles.splice(i, 1);
      }
    }

    this.updateBoss(worldDt);
    this.updateWorldAndChaserSpecials(worldDt);
    this.updatePortalEnemies(rawDt, worldDt, now);

    // Ghost recording & playback
    r.ghostSampleTimer += rawDt;
    if (r.ghostSampleTimer >= 0.2) {
      r.ghostSampleTimer = 0;
      r.ghostRecord.push([Math.round(r.distance), r.lane, r.isJumping ? 1 : r.slideTimer > 0 ? 2 : 0]);
    }
    if (this.ghostMesh && r.ghostToPlay) {
      const idx = Math.min(r.ghostToPlay.length - 1, Math.floor(r.ghostRecord.length));
      const sample = r.ghostToPlay[idx];
      if (sample) {
        const dz = sample[0] - r.distance;
        this.ghostMesh.position.set(TRACK_CONFIG.laneX[sample[1]], sample[2] === 1 ? 1.1 : 0, -dz);
        this.ghostMesh.visible = Math.abs(dz) < 40;
      }
    }

    // Update burst particles
    for (let i = this.vfxBursts.length - 1; i >= 0; i--) {
      const p = this.vfxBursts[i];
      p.life -= rawDt;
      p.mesh.position.x += p.vx * rawDt;
      p.mesh.position.y += p.vy * rawDt;
      p.mesh.position.z += p.vz * rawDt;
      p.vy -= 12 * rawDt;
      if (p.life <= 0) {
        this.runGroup.remove(p.mesh);
        this.vfxBursts.splice(i, 1);
      }
    }

    // Best Moment frame buffer
    r.frameCaptureTick += rawDt;
    if (r.frameCaptureTick >= 0.25 && saveManager.data.settings.highGraphics) {
      r.frameCaptureTick = 0;
      try {
        const snap = this.canvas.toDataURL('image/jpeg', 0.45);
        r.rollingFrames.push(snap);
        if (r.rollingFrames.length > 16) r.rollingFrames.shift();
      } catch (_) {}
    }

    // Adaptive Music Layers
    audioEngine.setAdaptiveLayers({
      tension: r.chaserDist < 38 ? Math.min(1, (40 - r.chaserDist) / 30) : 0,
      power: r.voidwalkTimer > 0 || r.timeBleedTimer > 0 || r.voidDomainTimer > 0 || r.voidlightTimer > 0 ? 1 : 0,
      boss: r.bossActive ? 1 : 0,
      hype: r.bonusHighwayTimer > 0 || r.surgeTimer > 0 || r.multiplier >= 4 ? 0.8 : 0,
    });

    // Dynamic Arcade Camera + Speed FOV Surge
    const reduced = saveManager.data.settings.reducedMotion;
    const targetFov = reduced ? 62 : Math.min(76, 61 + Math.max(0, r.speed - 12) * 0.9 + (r.surgeTimer > 0 || r.voidlightTimer > 0 ? 6 : 0));
    this.camera.fov += (targetFov - this.camera.fov) * Math.min(1, rawDt * 6);
    this.camera.updateProjectionMatrix();

    let shakeX = 0;
    let shakeY = 0;
    if (r.cameraShake > 0 && !reduced) {
      r.cameraShake = Math.max(0, r.cameraShake - rawDt * 1.9);
      shakeX = (Math.random() - 0.5) * r.cameraShake;
      shakeY = (Math.random() - 0.5) * r.cameraShake;
    }
    this.camera.position.set(r.x * 0.44 + shakeX, 4.1 + r.y * 0.24 + shakeY, 6.15);
    this.camera.lookAt(r.x * 0.24, 1.35 + r.y * 0.15, -12.5);

    // Active Power-Up Countdown Pills for HUD
    const activeBuffs = [];
    if (r.magnetTimer > 0) activeBuffs.push({ icon: '🧲', label: `${Math.ceil(r.magnetTimer)}s`, color: '#00E5FF' });
    if (r.doubleTimer > 0) activeBuffs.push({ icon: '💎2×', label: `${Math.ceil(r.doubleTimer)}s`, color: '#FFD84D' });
    if (r.surgeTimer > 0) activeBuffs.push({ icon: '☄️', label: `${Math.ceil(r.surgeTimer)}s`, color: '#FFFFFF' });
    if (r.barrierHits > 0 || r.shieldHits > 0 || r.armorDeflects > 0) {
      activeBuffs.push({ icon: '🛡️', label: `×${r.barrierHits + r.shieldHits + r.armorDeflects}`, color: '#B44FFF' });
    }
    if (r.enemySlowTimer > 0) activeBuffs.push({ icon: '🕸️', label: `SLOW ${r.enemySlowTimer.toFixed(1)}s`, color: '#FF44C8' });
    if (r.bonusHighwayTimer > 0) activeBuffs.push({ icon: '🌈', label: `${Math.ceil(r.bonusHighwayTimer)}s`, color: '#3DFF7A' });
    if (r.timeBleedTimer > 0) activeBuffs.push({ icon: '⏳', label: `${Math.ceil(r.timeBleedTimer)}s`, color: '#5CF2FF' });

    const activeInfo = this.getEquippedPowerInfo();
    const worldProg = Math.min(100, Math.round((worldDist / TRACK_CONFIG.bossTriggerDist) * 100));
    const totalShields = r.shieldHits + r.barrierHits + r.armorDeflects;
    const maxShields = Math.max(2, (r.charId === 'brann' ? 1 : 0) + (r.gear.armor.deflectCharges || 0) + 1);
    let nearestEnemy = null;
    for (const pe of r.portalEnemies) {
      if (!pe.defeated && pe.z < 2 && (!nearestEnemy || pe.z > nearestEnemy.z)) nearestEnemy = pe;
    }

    this.cb.onHudUpdate?.({
      score: Math.floor(r.score),
      multiplier: r.multiplier,
      distance: Math.floor(r.distance),
      elapsedSec: r.elapsed,
      lane: r.lane,
      totalShields,
      maxShields,
      nearestEnemyZ: nearestEnemy ? nearestEnemy.z : null,
      nearestEnemyLane: nearestEnemy ? nearestEnemy.lane : 1,
      bossActive: r.bossActive,
      worldProg,
      vs: r.vs,
      ce: r.ce,
      bc: r.bc,
      ve: r.ve,
      maxVE: r.maxVE,
      combo: r.nearMissCombo,
      enemiesDefeated: r.enemiesDefeated,
      weapon: r.gear.weapon,
      weaponCd: r.weaponCd,
      armorDeflects: r.armorDeflects,
      enemySlowed: r.enemySlowTimer > 0,
      activeBuffs,
      chaserDist: r.chaserDist,
      chaserMax: r.chaserMaxDist,
      chaserName: CHASERS[world.chaserId].name,
      worldName: world.name,
      worldId: world.id,
      power: activeInfo,
      powerCd: activeInfo ? r.cooldowns[activeInfo.id] || 0 : 0,
      canSwap: r.slots.length > 1,
      hasUltimate: saveManager.data.codexLevel >= 75 && !r.ultimateUsed,
      highSpeed: r.speed > 17 || r.surgeTimer > 0 || r.voidlightTimer > 0 || r.bonusHighwayTimer > 0,
      darkVeil: r.darkVeilTimer > 0,
      timeBleed: r.timeBleedTimer > 0,
      voidDomain: r.voidDomainTimer > 0,
      infested: r.infestedTimer > 0,
    });
  }
}
