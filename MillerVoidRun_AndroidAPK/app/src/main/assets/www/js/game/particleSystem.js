// MILLER: VOID RUN — Reusable Object-Pooled 3D Particle System
// Zero mid-run mesh/material allocations, hard mobile particle caps (220 High / 90 Low),
// smooth lifetime size/colour/alpha curves, and 6 tunable Void-Run emitter presets.

export const PARTICLE_PRESETS = {
  // 1. Shard / Essence / Relic Pickup Burst
  pickup: {
    shape: 'crystal',
    count: 8,
    lifeMin: 0.28,
    lifeMax: 0.48,
    sizeStart: 0.35,
    sizePeak: 1.25,
    sizeEnd: 0.05,
    colorStart: 0x4cf3ff,
    colorEnd: 0xb466ff,
    alphaStart: 0.95,
    alphaEnd: 0.0,
    speedMin: 2.0,
    speedMax: 5.2,
    upBias: 2.8,
    gravity: 9.5,
    drag: 2.0,
    inheritForwardZ: 0.35,
    spin: 7.0,
  },
  // 2. Collision / Creature Defeat / Obstacle Shatter Debris
  collision: {
    shape: 'spark',
    count: 16,
    lifeMin: 0.35,
    lifeMax: 0.68,
    sizeStart: 1.15,
    sizePeak: 1.3,
    sizeEnd: 0.08,
    colorStart: 0xffd84d,
    colorEnd: 0xff2e55,
    alphaStart: 1.0,
    alphaEnd: 0.0,
    speedMin: 3.5,
    speedMax: 8.8,
    upBias: 3.6,
    gravity: 16.0,
    drag: 1.4,
    inheritForwardZ: 0.45,
    spin: 11.0,
  },
  // 3. Footstep Dust & Fast-Fall Landing Puff
  dust: {
    shape: 'mote',
    count: 4,
    lifeMin: 0.22,
    lifeMax: 0.4,
    sizeStart: 0.55,
    sizePeak: 1.15,
    sizeEnd: 0.1,
    colorStart: 0xc8f6ff,
    colorEnd: 0x4cf3ff,
    alphaStart: 0.72,
    alphaEnd: 0.0,
    speedMin: 0.8,
    speedMax: 2.2,
    upBias: 1.2,
    gravity: 2.5,
    drag: 2.6,
    inheritForwardZ: 0.85,
    spin: 3.0,
  },
  // 4. High-Speed / Void Surge / Voidlight Speed Streaks
  boost: {
    shape: 'streak',
    count: 2,
    lifeMin: 0.22,
    lifeMax: 0.38,
    sizeStart: 0.8,
    sizePeak: 1.15,
    sizeEnd: 0.25,
    colorStart: 0x4cf3ff,
    colorEnd: 0xb466ff,
    alphaStart: 0.82,
    alphaEnd: 0.0,
    speedMin: 0.4,
    speedMax: 1.2,
    upBias: 0.0,
    gravity: 0.0,
    drag: 0.0,
    inheritForwardZ: 2.4,
    spin: 0.0,
  },
  // 5. Runner's Equipped Void Trail
  trail: {
    shape: 'crystal',
    count: 1,
    lifeMin: 0.24,
    lifeMax: 0.34,
    sizeStart: 0.95,
    sizePeak: 1.05,
    sizeEnd: 0.05,
    colorStart: 0xb44fff,
    colorEnd: 0x4cf3ff,
    alphaStart: 0.85,
    alphaEnd: 0.0,
    speedMin: 0.2,
    speedMax: 0.7,
    upBias: 0.4,
    gravity: 0.5,
    drag: 1.5,
    inheritForwardZ: 0.9,
    spin: 5.0,
  },
  // 6. Ambient Per-World Biome Motes (Spores, Embers, Frost, Void Ash)
  ambient: {
    shape: 'mote',
    count: 1,
    lifeMin: 1.4,
    lifeMax: 2.4,
    sizeStart: 0.2,
    sizePeak: 1.0,
    sizeEnd: 0.1,
    colorStart: 0x3dff7a,
    colorEnd: 0xb466ff,
    alphaStart: 0.65,
    alphaEnd: 0.0,
    speedMin: 0.2,
    speedMax: 0.8,
    upBias: 0.55,
    gravity: -0.2,
    drag: 0.3,
    inheritForwardZ: 0.72,
    spin: 2.0,
  },
};

// Biome-specific ambient colour & drift tuning per Portal World (1–7)
const WORLD_AMBIENT_PROFILES = {
  1: { colorStart: 0x3dff7a, colorEnd: 0x88ffd0, upBias: 0.65, gravity: -0.25 }, // Emerald Cavern Spores
  2: { colorStart: 0xffaa3b, colorEnd: 0xff4411, upBias: 1.4, gravity: -0.45 },  // Industrial Furnace Embers
  3: { colorStart: 0x4cf3ff, colorEnd: 0x8c55ff, upBias: 0.25, gravity: 0.05 },  // Obsidian Rift Shards
  4: { colorStart: 0xff3b5c, colorEnd: 0xffaa22, upBias: 1.5, gravity: -0.5 },   // Crimson Magma Ash
  5: { colorStart: 0xd8fbff, colorEnd: 0x5cf2ff, upBias: -0.9, gravity: 0.9 },   // Frozen Archive Snowfall
  6: { colorStart: 0xff44c8, colorEnd: 0x7c3aed, upBias: 0.45, gravity: -0.15 }, // Abyssal Maw Wisps
  7: { colorStart: 0xffffff, colorEnd: 0xffd84d, upBias: 0.35, gravity: 0.0 },   // Terminus Celestial Stardust
};

export class ParticleSystem {
  constructor(THREE, maxPoolSize = 220) {
    this.THREE = THREE;
    this.maxPoolSize = maxPoolSize;
    this.group = new THREE.Group();
    this.ambientTick = 0;
    this.boostTick = 0;

    // Shared geometries (allocated once for the entire app session!)
    this.geometries = {
      crystal: new THREE.OctahedronGeometry(0.11, 0),
      spark: new THREE.BoxGeometry(0.13, 0.13, 0.13),
      mote: new THREE.IcosahedronGeometry(0.085, 0),
      streak: new THREE.BoxGeometry(0.045, 0.045, 1.35),
    };

    // Pre-allocate pooled particle slots (zero runtime GC churn!)
    this.pool = [];
    for (let i = 0; i < maxPoolSize; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(this.geometries.crystal, mat);
      mesh.visible = false;
      this.group.add(mesh);
      this.pool.push({
        active: false,
        mesh,
        mat,
        age: 0,
        maxLife: 0.5,
        vx: 0,
        vy: 0,
        vz: 0,
        gravity: 0,
        drag: 0,
        inheritForwardZ: 0,
        spin: 0,
        sizeStart: 1,
        sizePeak: 1,
        sizeEnd: 0,
        alphaStart: 1,
        alphaEnd: 0,
        colStart: new THREE.Color(0xffffff),
        colEnd: new THREE.Color(0xffffff),
      });
    }
    this.cursor = 0;
    this.activeCount = 0;
  }

  attachTo(parentGroup) {
    if (this.group.parent !== parentGroup) {
      parentGroup.add(this.group);
    }
    this.clear();
  }

  clear() {
    for (let i = 0; i < this.pool.length; i++) {
      const p = this.pool[i];
      p.active = false;
      p.mesh.visible = false;
    }
    this.activeCount = 0;
    this.ambientTick = 0;
    this.boostTick = 0;
  }

  acquireSlot(budgetCap) {
    if (this.activeCount >= budgetCap) return null;
    for (let tries = 0; tries < this.maxPoolSize; tries++) {
      const idx = (this.cursor + tries) % this.maxPoolSize;
      if (!this.pool[idx].active) {
        this.cursor = (idx + 1) % this.maxPoolSize;
        return this.pool[idx];
      }
    }
    return null;
  }

  emit(presetName, pos, overrides = {}) {
    const base = PARTICLE_PRESETS[presetName] || PARTICLE_PRESETS.pickup;
    const isHigh = overrides.highGraphics !== false;
    const budgetCap = isHigh ? this.maxPoolSize : Math.min(90, this.maxPoolSize);
    const rawCount = overrides.count ?? base.count;
    const count = isHigh ? rawCount : Math.max(1, Math.ceil(rawCount * 0.45));
    const shape = overrides.shape || base.shape;
    const geo = this.geometries[shape] || this.geometries.crystal;

    const cStart = overrides.colorStart ?? base.colorStart;
    const cEnd = overrides.colorEnd ?? overrides.colorStart ?? base.colorEnd;
    const jitter = overrides.jitter ?? 0.16;

    for (let i = 0; i < count; i++) {
      const p = this.acquireSlot(budgetCap);
      if (!p) break;

      p.active = true;
      this.activeCount++;
      p.age = 0;
      p.maxLife = base.lifeMin + Math.random() * (base.lifeMax - base.lifeMin);

      if (p.mesh.geometry !== geo) p.mesh.geometry = geo;
      p.mesh.visible = true;
      p.mesh.position.set(
        pos.x + (Math.random() - 0.5) * jitter,
        pos.y + (Math.random() - 0.5) * jitter,
        pos.z + (Math.random() - 0.5) * jitter
      );
      p.mesh.rotation.set(
        shape === 'streak' ? 0 : Math.random() * 6.28,
        shape === 'streak' ? 0 : Math.random() * 6.28,
        0
      );

      // Spherical velocity spread + vertical bias
      const theta = Math.random() * Math.PI * 2;
      const elev = (Math.random() - 0.35) * Math.PI;
      const spd = base.speedMin + Math.random() * (base.speedMax - base.speedMin);
      p.vx = Math.cos(theta) * Math.cos(elev) * spd;
      p.vy = Math.sin(elev) * spd + (overrides.upBias ?? base.upBias);
      p.vz = Math.sin(theta) * Math.cos(elev) * spd;

      p.gravity = overrides.gravity ?? base.gravity;
      p.drag = base.drag;
      p.inheritForwardZ = base.inheritForwardZ;
      p.spin = base.spin;

      const sMul = overrides.sizeMult ?? 1.0;
      p.sizeStart = base.sizeStart * sMul;
      p.sizePeak = base.sizePeak * sMul;
      p.sizeEnd = base.sizeEnd * sMul;
      p.alphaStart = base.alphaStart;
      p.alphaEnd = base.alphaEnd;

      p.colStart.setHex(cStart);
      p.colEnd.setHex(cEnd);
      p.mat.color.copy(p.colStart);
      p.mat.opacity = p.alphaStart;
      p.mesh.scale.setScalar(Math.max(0.05, p.sizeStart));
    }
  }

  emitFireworks(pos, colors, highGraphics = true) {
    for (const col of colors) {
      this.emit('collision', pos, {
        count: 7,
        colorStart: col,
        colorEnd: 0xffffff,
        sizeMult: 1.05,
        highGraphics,
      });
    }
  }

  update(rawDt, worldDt, runSpeed, worldId, opts = {}) {
    const highGraphics = opts.highGraphics !== false;
    const reducedMotion = !!opts.reducedMotion;
    const isBoosted = !!opts.isBoosted;

    // Continuous per-world ambient atmospheric emitter (spores / embers / frost / stardust)
    if (!reducedMotion) {
      this.ambientTick += rawDt;
      const ambInterval = highGraphics ? 0.085 : 0.18;
      if (this.ambientTick >= ambInterval) {
        this.ambientTick = 0;
        const prof = WORLD_AMBIENT_PROFILES[worldId] || WORLD_AMBIENT_PROFILES[1];
        this.emit('ambient', {
          x: (Math.random() - 0.5) * 9.5,
          y: 0.4 + Math.random() * 4.5,
          z: -6 - Math.random() * 28,
        }, {
          colorStart: prof.colorStart,
          colorEnd: prof.colorEnd,
          upBias: prof.upBias,
          gravity: prof.gravity,
          jitter: 0.5,
          highGraphics,
        });
      }

      // High-speed directional speed-streaks during Surge, Voidlight, or fast sprints!
      if (isBoosted) {
        this.boostTick += rawDt;
        const boostInterval = highGraphics ? 0.045 : 0.1;
        if (this.boostTick >= boostInterval) {
          this.boostTick = 0;
          const side = Math.random() < 0.5 ? -1 : 1;
          this.emit('boost', {
            x: side * (1.8 + Math.random() * 2.8),
            y: 0.6 + Math.random() * 3.4,
            z: -16 - Math.random() * 16,
          }, {
            colorStart: opts.boostColor || 0x4cf3ff,
            colorEnd: 0xb466ff,
            jitter: 0.2,
            highGraphics,
          });
        }
      }
    }

    // Step all active pooled particles with smooth size/colour/alpha lifetime curves
    let active = 0;
    for (let i = 0; i < this.pool.length; i++) {
      const p = this.pool[i];
      if (!p.active) continue;

      p.age += rawDt;
      if (p.age >= p.maxLife) {
        p.active = false;
        p.mesh.visible = false;
        continue;
      }
      active++;

      const t = p.age / p.maxLife;
      const dragFactor = Math.max(0, 1 - p.drag * rawDt);
      p.vx *= dragFactor;
      p.vy = (p.vy - p.gravity * rawDt) * dragFactor;
      p.vz *= dragFactor;

      p.mesh.position.x += p.vx * rawDt;
      p.mesh.position.y += p.vy * rawDt;
      p.mesh.position.z += p.vz * rawDt + runSpeed * worldDt * p.inheritForwardZ;

      if (p.spin > 0) {
        p.mesh.rotation.x += p.spin * rawDt;
        p.mesh.rotation.y += p.spin * 0.8 * rawDt;
      }

      // 3-point smooth size curve (quick pop-in 0..0.22 -> smooth shrink 0.22..1.0)
      const scale = t < 0.22
        ? p.sizeStart + (p.sizePeak - p.sizeStart) * (t / 0.22)
        : p.sizePeak + (p.sizeEnd - p.sizePeak) * ((t - 0.22) / 0.78);
      p.mesh.scale.setScalar(Math.max(0.03, scale));

      // Smooth colour & alpha fade curve
      p.mat.color.lerpColors(p.colStart, p.colEnd, t);
      p.mat.opacity = p.alphaStart + (p.alphaEnd - p.alphaStart) * (t * t);
    }
    this.activeCount = active;
  }
}
