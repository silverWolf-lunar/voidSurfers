// MILLER: VOID RUN — Commercial-Grade Layered Arcade Audio Synthesizer
// Features: DynamicsCompressor limiter (zero harsh peaks), independent Music/SFX volume + Master Mute,
// energetic 4-stem adaptive soundtrack per world, pentatonic crystal chimes, obstacle warning pings,
// landing thuds, bonus ring shimmers, achievement fanfares, level-up arpeggios & voice barks.

import { WORLDS } from '../config/gameData.js';

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.compressor = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.muted = false;
    this.musicVol = 0.65;
    this.sfxVol = 0.85;
    this.voiceEnabled = true;

    this.isPlayingMusic = false;
    this.musicMode = 'idle'; // 'menu' | 'run'
    this.currentWorldId = 1;
    this.layerState = { tension: 0, power: 0, boss: 0, hype: 0 };
    this.stepIndex = 0;
    this.musicTimer = null;
    this.lastBarkTime = 0;
    this.lastWarningTime = 0;
    this.shardComboPitch = 0;
    this.lastShardTime = 0;
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();

    // Master limiter prevents clipping or sudden excessively loud spikes (Section 4)
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -14;
    this.compressor.knee.value = 18;
    this.compressor.ratio.value = 8;
    this.compressor.attack.value = 0.005;
    this.compressor.release.value = 0.12;
    this.compressor.connect(this.ctx.destination);

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.muted ? 0 : 0.82;
    this.masterGain.connect(this.compressor);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = this.musicVol * 0.42;
    this.musicGain.connect(this.masterGain);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = this.sfxVol * 0.78;
    this.sfxGain.connect(this.masterGain);
  }

  applySettings(settings) {
    this.muted = !!settings.muted;
    this.musicVol = settings.musicVol ?? 0.65;
    this.sfxVol = settings.sfxVol ?? 0.85;
    this.voiceEnabled = settings.voiceBarks ?? true;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.muted ? 0 : 0.82, this.ctx.currentTime, 0.03);
    }
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(this.musicVol * 0.42, this.ctx.currentTime, 0.03);
    }
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(this.sfxVol * 0.78, this.ctx.currentTime, 0.03);
    }
  }

  setAdaptiveLayers({ tension = 0, power = 0, boss = 0, hype = 0 }) {
    this.layerState = { tension, power, boss, hype };
  }

  startMenuAmbience() {
    this.init();
    if (!this.ctx) return;
    if (this.musicMode === 'menu' && this.isPlayingMusic) return;
    if (this.musicTimer) clearInterval(this.musicTimer);
    this.musicMode = 'menu';
    this.isPlayingMusic = true;
    this.stepIndex = 0;
    const notes = [293.66, 349.23, 440.0, 523.25, 659.25];
    this.musicTimer = setInterval(() => {
      if (!this.isPlayingMusic || !this.ctx || this.ctx.state !== 'running' || this.muted) return;
      const n = notes[this.stepIndex % notes.length];
      if (this.stepIndex % 2 === 0) {
        this.tone(n * 0.5, 0.75, 'sine', 0.14, this.musicGain, 0, 900);
      }
      if (this.stepIndex % 4 === 0) {
        this.tone(n, 0.55, 'triangle', 0.08, this.musicGain, (this.stepIndex % 8 === 0 ? -0.35 : 0.35), 1400);
      }
      this.stepIndex = (this.stepIndex + 1) % 32;
    }, 420);
  }

  startMusic(worldId = 1) {
    this.init();
    if (!this.ctx) return;
    this.currentWorldId = worldId;
    this.musicMode = 'run';
    if (this.musicTimer) clearInterval(this.musicTimer);
    this.isPlayingMusic = true;
    this.stepIndex = 0;
    const world = WORLDS.find((w) => w.id === worldId) || WORLDS[0];
    const stepMs = (60 / world.bpm / 2) * 1000;

    this.musicTimer = setInterval(() => {
      if (!this.isPlayingMusic || !this.ctx || this.ctx.state !== 'running' || this.muted) return;
      this.playMusicStep(world);
      this.stepIndex = (this.stepIndex + 1) % 32;
    }, stepMs);
  }

  stopMusic() {
    this.isPlayingMusic = false;
    this.musicMode = 'idle';
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  playMusicStep(world) {
    const now = this.ctx.currentTime;
    const step = this.stepIndex;
    const scale = world.scale;
    const { tension, power, boss, hype } = this.layerState;

    // STEM 1: Energetic arcade bassline + sparkling melody
    const bassPattern = [0, 0, 2, 0, 3, 2, 4, 2];
    if (step % 2 === 0) {
      const bNote = scale[bassPattern[(step / 2) % bassPattern.length] % scale.length] * 0.5;
      this.tone(bNote, 0.18, 'triangle', 0.24, this.musicGain, 0, 620);
    }
    if (step % 4 === 0) this.kick(now, 0.22 + Math.max(tension, boss) * 0.14);
    if (step % 4 === 2) this.hihat(now, 0.06 + Math.max(tension, hype) * 0.06);

    // Melodic arcade lead motif
    const leadIdx = [0, 2, 4, 5, 4, 2, 3, 1][step % 8];
    if (step % 2 === 0 || hype > 0.35) {
      const note = scale[leadIdx % scale.length] * (step >= 16 ? 2 : 1);
      this.tone(note, 0.13, world.id === 5 ? 'sine' : 'triangle', 0.085, this.musicGain, (step % 4 === 0 ? -0.25 : 0.25), 1600);
    }

    // STEM 2: Tension snare/pulse when chaser closes in
    if ((tension > 0.2 || boss > 0.5) && step % 8 === 4) {
      this.snare(now, 0.14 * Math.max(tension, boss));
    }

    // STEM 3: Euphoric shimmer chord pad during Void Power or Bonus Highway
    if ((power > 0.2 || hype > 0.5) && step % 4 === 0) {
      const root = scale[(step / 4) % scale.length] * 2;
      this.tone(root, 0.42, 'sine', 0.11, this.musicGain, -0.3);
      this.tone(root * 1.25, 0.42, 'sine', 0.09, this.musicGain, 0.3);
    }

    // STEM 4: Boss urgent arpeggio
    if (boss > 0.5) {
      const bNote = scale[(step * 3) % scale.length] * 2;
      this.tone(bNote, 0.09, 'sawtooth', 0.075, this.musicGain, 0, 1500);
    }
  }

  tone(freq, dur, type = 'sine', vol = 0.18, dest = null, pan = 0, filterFreq = null) {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(40, freq), now);

    let node = osc;
    if (filterFreq) {
      const flt = this.ctx.createBiquadFilter();
      flt.type = 'lowpass';
      flt.frequency.value = filterFreq;
      node.connect(flt);
      node = flt;
    }

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.002, vol), now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    node.connect(gain);

    if (this.ctx.createStereoPanner && pan !== 0) {
      const panner = this.ctx.createStereoPanner();
      panner.pan.value = Math.max(-1, Math.min(1, pan));
      gain.connect(panner);
      panner.connect(dest || this.sfxGain);
    } else {
      gain.connect(dest || this.sfxGain);
    }

    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  kick(now, vol = 0.28) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.frequency.setValueAtTime(145, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.13);
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  snare(now, vol = 0.14) {
    const bufSize = Math.floor(this.ctx.sampleRate * 0.08);
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const flt = this.ctx.createBiquadFilter();
    flt.type = 'bandpass';
    flt.frequency.value = 1800;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    src.connect(flt);
    flt.connect(gain);
    gain.connect(this.musicGain);
    src.start(now);
  }

  hihat(now, vol = 0.08) {
    const bufSize = Math.floor(this.ctx.sampleRate * 0.035);
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const flt = this.ctx.createBiquadFilter();
    flt.type = 'highpass';
    flt.frequency.value = 6500;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
    src.connect(flt);
    flt.connect(gain);
    gain.connect(this.musicGain);
    src.start(now);
  }

  // --- LAYERED GAMEPLAY SFX ---
  playUiClick() {
    this.init();
    this.tone(520, 0.06, 'sine', 0.12);
    this.tone(780, 0.05, 'triangle', 0.07);
  }

  playLaneSwitch(dir) {
    this.init();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(290, now);
    osc.frequency.exponentialRampToValueAtTime(560, now + 0.08);
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.connect(gain);
    if (this.ctx.createStereoPanner) {
      const p = this.ctx.createStereoPanner();
      p.pan.value = dir * 0.55;
      gain.connect(p);
      p.connect(this.sfxGain);
    } else {
      gain.connect(this.sfxGain);
    }
    osc.start(now);
    osc.stop(now + 0.1);
  }

  playJump() {
    this.init();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(680, now + 0.15);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  playLand() {
    this.init();
    this.tone(110, 0.07, 'sine', 0.12);
  }

  playSlide() {
    this.init();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(360, now);
    osc.frequency.exponentialRampToValueAtTime(95, now + 0.18);
    const flt = this.ctx.createBiquadFilter();
    flt.type = 'lowpass';
    flt.frequency.value = 900;
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(flt);
    flt.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.21);
  }

  playShard() {
    this.init();
    if (!this.ctx || this.muted) return;
    const nowMs = performance.now();
    if (nowMs - this.lastShardTime < 550) {
      this.shardComboPitch = Math.min(10, this.shardComboPitch + 1);
    } else {
      this.shardComboPitch = 0;
    }
    this.lastShardTime = nowMs;
    // Sparkling pentatonic scale climb for super satisfying arcade feedback!
    const pent = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.5, 1567.98, 1760.0, 2093.0];
    const freq = pent[this.shardComboPitch];
    this.tone(freq, 0.11, 'sine', 0.15);
    this.tone(freq * 1.5, 0.08, 'triangle', 0.07);
  }

  playBonusRing() {
    this.init();
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      setTimeout(() => this.tone(f, 0.24, 'triangle', 0.16), i * 55);
    });
  }

  playObstacleWarning() {
    const now = performance.now();
    if (now - this.lastWarningTime < 1400) return;
    this.lastWarningTime = now;
    this.init();
    this.tone(680, 0.07, 'sine', 0.08);
    setTimeout(() => this.tone(860, 0.07, 'sine', 0.07), 85);
  }

  playWorldEnter() {
    this.init();
    [293.66, 440.0, 587.33, 880.0].forEach((f, i) => {
      setTimeout(() => this.tone(f, 0.42, 'sine', 0.16), i * 80);
    });
  }

  playAchievement() {
    this.init();
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => {
      setTimeout(() => {
        this.tone(f, 0.34, 'triangle', 0.18);
        this.tone(f * 0.5, 0.34, 'sine', 0.1);
      }, i * 75);
    });
  }

  playEssence() {
    this.init();
    this.tone(523.25, 0.24, 'sine', 0.18);
    setTimeout(() => this.tone(783.99, 0.28, 'triangle', 0.16), 55);
    setTimeout(() => this.tone(1046.5, 0.3, 'sine', 0.14), 110);
  }

  playBeastCore() {
    this.init();
    this.tone(146.83, 0.55, 'sawtooth', 0.2, this.sfxGain, 0, 520);
    this.tone(587.33, 0.48, 'triangle', 0.2);
    setTimeout(() => this.tone(880, 0.48, 'sine', 0.18), 85);
  }

  playNearMiss(combo = 1) {
    this.init();
    const base = 440 + Math.min(8, combo) * 85;
    this.tone(base, 0.14, 'sine', 0.18);
    this.tone(base * 1.5, 0.2, 'triangle', 0.15);
  }

  playWeaponStrike() {
    this.init();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(640, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.13);
    const flt = this.ctx.createBiquadFilter();
    flt.type = 'bandpass';
    flt.frequency.value = 1400;
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(flt);
    flt.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  playEnemyDefeat() {
    this.init();
    this.tone(330, 0.11, 'triangle', 0.2);
    setTimeout(() => this.tone(660, 0.16, 'sine', 0.18), 45);
    setTimeout(() => this.tone(990, 0.18, 'triangle', 0.14), 90);
  }

  playEnemySlow() {
    this.init();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.34);
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.38);
  }

  playStumble() {
    this.init();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(165, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.28);
    const flt = this.ctx.createBiquadFilter();
    flt.type = 'lowpass';
    flt.frequency.value = 600;
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(flt);
    flt.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.32);
  }

  playGameOver() {
    this.init();
    this.tone(329.63, 0.32, 'triangle', 0.18);
    setTimeout(() => this.tone(261.63, 0.36, 'triangle', 0.18), 140);
    setTimeout(() => this.tone(196.0, 0.65, 'sine', 0.22), 300);
  }

  playPower(powerId) {
    this.init();
    if (!this.ctx || this.muted) return;
    const profiles = {
      flicker: [880, 1760, 'sawtooth', 0.16],
      void_sense: [520, 1040, 'sine', 0.32],
      stillstep: [330, 660, 'sine', 0.28],
      shadow_shield: [180, 360, 'triangle', 0.32],
      voidwalk: [240, 720, 'sine', 0.36],
      grasping_dark: [290, 580, 'sawtooth', 0.26],
      time_bleed: [480, 130, 'triangle', 0.48],
      eclipse_veil: [220, 140, 'sine', 0.4],
      chronal_haven: [620, 1240, 'triangle', 0.42],
      void_domain: [130, 440, 'sawtooth', 0.55],
      erasure_wave: [200, 75, 'sawtooth', 0.45],
      void_resonance: [740, 1110, 'sine', 0.2],
      voidlight_synthesis: [440, 1760, 'triangle', 0.55],
      singularity_soul: [100, 880, 'sawtooth', 0.75],
      concept_reversal: [900, 320, 'square', 0.4],
    };
    const [f1, f2, type, dur] = profiles[powerId] || [360, 720, 'triangle', 0.28];
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f1, now);
    osc.frequency.exponentialRampToValueAtTime(f2, now + dur);
    const flt = this.ctx.createBiquadFilter();
    flt.type = 'lowpass';
    flt.frequency.value = 2400;
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(flt);
    flt.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + dur + 0.03);
  }

  playBark(text) {
    if (!this.voiceEnabled || this.muted) return;
    const now = performance.now();
    if (now - this.lastBarkTime < 8000) return;
    this.lastBarkTime = now;
    const el = document.getElementById('hud-bark');
    if (el) {
      el.textContent = `"${text}"`;
      el.classList.add('show');
      setTimeout(() => el.classList.remove('show'), 2100);
    }
    if ('speechSynthesis' in window && this.sfxVol > 0.1) {
      try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 1.16;
        u.pitch = 0.96;
        u.volume = Math.min(0.55, this.sfxVol * 0.6);
        window.speechSynthesis.speak(u);
      } catch (_) {}
    }
  }
}

export const audioEngine = new AudioEngine();
