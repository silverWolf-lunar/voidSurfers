// MILLER: VOID RUN — Runtime Character Motion Controller
// Drives the 10-part volumetric skeletal rig (and 3D procedural fallback rig) across all 8 motion families
// inspected in SharedArt/motions, ensuring every video's motion phases match live in-game play.

export class MotionController {
  /**
   * Applies active gameplay motion states (Locomotion, Roll/Dodge-Roll, Flips/Tricks, Wall-Run,
   * Climbing/Mantle, Paraglider Soar, Mage Dual-Orb Cast, and 3-Hit Sword & Shield Bash)
   * onto `playerMesh.userData` (`ud`).
   */
  static applyRigMotion(ud, r, now, rawDt) {
    if (!ud) return;
    const bankDiff = r.targetX - r.x;
    const runCycle = now * 0.0175 * (r.speed / 12);
    const s = Math.sin(runCycle);
    const c = Math.cos(runCycle);
    const speedNorm = Math.max(0, Math.min(1, (r.speed - 11) / 14));

    // Toggle auxiliary 3D motion props (Paraglider canopy, Aegis Forearm Shield, Dual Mage Hand Orbs)
    const isGliding = (r.paragliderTimer || 0) > 0 || r.surgeTimer > 0 || r.voidlightTimer > 0;
    const isShieldBashing = (r.shieldBashTimer || 0) > 0;
    const isMageCasting =
      (r.attackAnimTimer > 0 && (r.attackType === 'cast' || r.attackType === 'mage_cast')) ||
      (r.mageChannelTimer || 0) > 0;

    if (ud.gliderMesh) {
      ud.gliderMesh.visible = isGliding;
      if (isGliding) {
        const deployScale = Math.min(1, (r.gliderDeployProg || 1));
        ud.gliderMesh.scale.set(deployScale, deployScale, deployScale);
        ud.gliderMesh.rotation.z = -bankDiff * 0.42;
        ud.gliderMesh.rotation.x = 0.08 + Math.sin(now * 0.006) * 0.05;
      }
    }
    if (ud.aegisShieldMesh) {
      ud.aegisShieldMesh.visible = isShieldBashing || r.shieldHits > 0 || r.charId === 'brann' || r.charId === 'alton';
      ud.aegisShieldMesh.scale.setScalar(isShieldBashing ? 1.28 : 0.92);
    }
    if (ud.lCastOrb && ud.rCastOrb) {
      const showOrbs = isMageCasting || r.charId === 'elara' || r.charId === 'harry' || r.charId === 'felix';
      ud.lCastOrb.visible = showOrbs;
      ud.rCastOrb.visible = showOrbs;
      if (showOrbs) {
        const pulse = (isMageCasting ? 1.35 : 0.85) + Math.sin(now * 0.018) * 0.22;
        ud.lCastOrb.scale.setScalar(pulse);
        ud.rCastOrb.scale.setScalar(pulse);
      }
    }

    if (!ud.isSpriteRig || !ud.skeletalReady) {
      // Procedural 3D fallback rig support for all 8 motions
      MotionController.applyProceduralFallback(ud, r, s, c, bankDiff, isGliding, isShieldBashing);
      return;
    }

    // Reset full-body spin offsets before applying active state
    ud.bodyPivot.position.set(0, 0, 0);
    ud.bodyPivot.rotation.set(0, -bankDiff * 0.34, -bankDiff * 0.26);
    ud.bodyPivot.scale.set(r.squashX, r.squashY, 1);

    // =========================================================================
    // STATE 1: CLIMBING & LEDGE MANTLE (Climbing-Animation-Set.mp4)
    // Back-view alternating high hand-over-hand reaches + opposing knee drive + top pull-up mantle!
    // =========================================================================
    if ((r.climbTimer || 0) > 0) {
      const dur = r.climbDuration || 0.82;
      const p = Math.max(0, Math.min(1, 1 - r.climbTimer / dur));
      if (p < 0.76) {
        // Phase A: Hand-over-hand vertical wall ascent
        const cp = (p / 0.76) * Math.PI * 4; // 2 full alternating hand-over-hand cycles
        const cs = Math.sin(cp);
        const cc = Math.cos(cp);
        ud.hipsPivot.position.set(cs * 0.05, ud.hipBaseY + Math.abs(cc) * 0.08, -0.08);
        ud.hipsPivot.rotation.set(0.12, 0, cs * 0.09);
        ud.torsoPivot.rotation.set(0.18, cs * 0.18, -cs * 0.08);
        ud.headPivot.rotation.set(-0.28, 0, 0); // Looking up toward the ledge!

        // Left & Right arms reach high overhead alternately (Z near ±2.5 rad lifts arms above head!)
        ud.lShoulderPivot.position.z = -0.06;
        ud.rShoulderPivot.position.z = -0.06;
        ud.lShoulderPivot.rotation.set(-0.45, 0, 2.35 + cs * 0.55);
        ud.lElbowPivot.rotation.set(-0.35, 0, -0.35 + cs * 0.25);
        ud.rShoulderPivot.rotation.set(-0.45, 0, -2.35 + cs * 0.55);
        ud.rElbowPivot.rotation.set(-0.35, 0, 0.35 + cs * 0.25);

        // Opposing high knee pull-ups against the cliff wall
        const lUp = Math.max(0, -cs);
        const rUp = Math.max(0, cs);
        ud.lHipPivot.position.y = lUp * 0.24;
        ud.lHipPivot.rotation.set(-0.35 - lUp * 0.45, 0, -0.12);
        ud.lKneePivot.rotation.set(0.45 + lUp * 0.65, 0, 0);
        ud.rHipPivot.position.y = rUp * 0.24;
        ud.rHipPivot.rotation.set(-0.35 - rUp * 0.45, 0, 0.12);
        ud.rKneePivot.rotation.set(0.45 + rUp * 0.65, 0, 0);
      } else {
        // Phase B: Ledge Mantle Vault (press both hands down, tuck chest forward & vault over!)
        const mp = (p - 0.76) / 0.24;
        const arch = Math.sin(mp * Math.PI);
        ud.hipsPivot.position.set(0, ud.hipBaseY + arch * 0.22, -arch * 0.12);
        ud.torsoPivot.rotation.set(-0.48 * arch, 0, 0);
        ud.headPivot.rotation.set(0.22 * arch, 0, 0);
        ud.lShoulderPivot.rotation.set(0.35, 0, 0.55 - mp * 0.35);
        ud.rShoulderPivot.rotation.set(0.35, 0, -0.55 + mp * 0.35);
        ud.lHipPivot.position.y = arch * 0.22;
        ud.rHipPivot.position.y = arch * 0.16;
        ud.lKneePivot.rotation.set(0.75 * (1 - mp), 0, 0);
        ud.rKneePivot.rotation.set(0.65 * (1 - mp), 0, 0);
      }
      return;
    }

    // =========================================================================
    // STATE 2: PARAGLIDER & UPDRAFT SOAR (Paraglider-Blueprints.mp4)
    // Both arms raised holding the overhead control bar, legs trailing & banking smoothly!
    // =========================================================================
    if (isGliding) {
      const sway = Math.sin(now * 0.0055);
      ud.bodyPivot.rotation.set(0.14, -bankDiff * 0.38, -bankDiff * 0.42 + sway * 0.05);
      ud.hipsPivot.position.set(0, ud.hipBaseY + 0.06, 0);
      ud.hipsPivot.rotation.set(0.12, 0, -bankDiff * 0.15);
      ud.torsoPivot.rotation.set(-0.1, -bankDiff * 0.2, 0);
      ud.headPivot.rotation.set(-0.18, -bankDiff * 0.15, 0);

      // Both arms raised overhead gripping the Paraglider control bar!
      ud.lShoulderPivot.position.z = -0.06;
      ud.rShoulderPivot.position.z = -0.06;
      ud.lShoulderPivot.rotation.set(-0.35, 0, 2.42);
      ud.lElbowPivot.rotation.set(-0.25, 0, -0.28);
      ud.rShoulderPivot.rotation.set(-0.35, 0, -2.42);
      ud.rElbowPivot.rotation.set(-0.25, 0, 0.28);

      // Trailing suspended legs with gentle wind pendulum bend
      ud.lHipPivot.position.y = 0.04;
      ud.rHipPivot.position.y = 0.02;
      ud.lHipPivot.rotation.set(0.28 + sway * 0.08, 0, 0.05);
      ud.lKneePivot.rotation.set(0.48 - sway * 0.12, 0, 0);
      ud.rHipPivot.rotation.set(0.34 - sway * 0.08, 0, -0.05);
      ud.rKneePivot.rotation.set(0.62 + sway * 0.12, 0, 0);
      return;
    }

    // =========================================================================
    // STATE 3: DYNAMIC WALL-RUN (Dynamic-Wall-Run-Blueprints.mp4)
    // Tilted 28° away from wall, wall-side hand brushing the wall, high-tempo stride along wall!
    // =========================================================================
    if ((r.wallRunTimer || 0) > 0 && r.wallRunSide !== 0) {
      const side = r.wallRunSide; // -1 = Left Wall (Lane 0), +1 = Right Wall (Lane 2)
      const wc = runCycle * 1.22;
      const ws = Math.sin(wc);
      const wcCos = Math.cos(wc);

      // Tilt body away from wall (~28 deg = 0.48 rad)
      ud.bodyPivot.rotation.set(-0.14, -side * 0.18, -side * 0.46);
      ud.hipsPivot.position.set(side * 0.08, ud.hipBaseY + Math.abs(wcCos) * 0.12, 0);
      ud.torsoPivot.rotation.set(-0.26, ws * 0.28, -side * 0.12);
      ud.headPivot.rotation.set(0.12, -side * 0.14, side * 0.22);

      if (side < 0) {
        // Left Wall: Left arm extended out touching wall; Right arm pumping for balance
        ud.lShoulderPivot.rotation.set(-0.25, 0, 1.35);
        ud.lElbowPivot.rotation.set(-0.2, 0, -0.25);
        ud.rShoulderPivot.rotation.set(ws * 0.62, 0, -0.55);
        ud.rElbowPivot.rotation.set(-0.5, 0, 0.25);
      } else {
        // Right Wall: Right arm extended out touching wall; Left arm pumping for balance
        ud.rShoulderPivot.rotation.set(-0.25, 0, -1.35);
        ud.rElbowPivot.rotation.set(-0.2, 0, 0.25);
        ud.lShoulderPivot.rotation.set(-ws * 0.62, 0, 0.55);
        ud.lElbowPivot.rotation.set(-0.5, 0, -0.25);
      }

      // High-driving wall-stride legs
      const lFwd = Math.max(0, ws);
      const rFwd = Math.max(0, -ws);
      ud.lHipPivot.position.y = lFwd * 0.22;
      ud.lHipPivot.rotation.set(-ws * 0.62, 0, 0.06);
      ud.lKneePivot.rotation.set(0.24 + Math.max(0, -ws) * 0.95, 0, 0);
      ud.rHipPivot.position.y = rFwd * 0.22;
      ud.rHipPivot.rotation.set(ws * 0.62, 0, -0.06);
      ud.rKneePivot.rotation.set(0.24 + Math.max(0, ws) * 0.95, 0, 0);
      return;
    }

    // =========================================================================
    // STATE 4: TACTICAL ROLL & DODGE-ROLL (Rolls-and-Dodges-Animation-set.mp4)
    // Tucked crouch -> full 360° forward/diagonal somersault -> agile runner recovery!
    // =========================================================================
    if (r.slideTimer > 0) {
      const dur = r.slideDurationTotal || 0.52;
      const p = Math.max(0, Math.min(1, 1 - r.slideTimer / dur));
      const isDodgeRoll = r.rollVariant === 'dodge_roll';
      const rollDir = r.rollDir || 1;

      // Smooth 360° forward tuck rotation (or diagonal barrel-tuck on dodge_roll)
      const spinPhase = p < 0.14 ? 0 : p > 0.86 ? 1 : (p - 0.14) / 0.72;
      const spinAngle = spinPhase * Math.PI * 2;

      ud.hipsPivot.position.set(0, ud.hipBaseY * 0.42 + Math.sin(spinPhase * Math.PI) * 0.18, 0);
      if (isDodgeRoll) {
        ud.hipsPivot.rotation.set(Math.sin(spinPhase * Math.PI) * 0.55, 0, -rollDir * spinAngle);
      } else {
        ud.hipsPivot.rotation.set(spinAngle, 0, -bankDiff * 0.22);
      }
      ud.torsoPivot.rotation.set(0.68, 0, 0);
      ud.headPivot.rotation.set(0.42, 0, 0);

      // Compact tucked arms & knees during roll
      ud.lShoulderPivot.rotation.set(-0.55, 0, 0.32);
      ud.lElbowPivot.rotation.set(-0.75, 0, -0.42);
      ud.rShoulderPivot.rotation.set(-0.55, 0, -0.32);
      ud.rElbowPivot.rotation.set(-0.75, 0, 0.42);

      ud.lHipPivot.position.y = 0.22;
      ud.lHipPivot.rotation.set(-0.75, 0, 0.08);
      ud.lHipPivot.scale.y = 0.78;
      ud.lKneePivot.rotation.set(0.95, 0, 0);
      ud.lKneePivot.scale.y = 0.78;

      ud.rHipPivot.position.y = 0.22;
      ud.rHipPivot.rotation.set(-0.75, 0, -0.08);
      ud.rHipPivot.scale.y = 0.78;
      ud.rKneePivot.rotation.set(0.95, 0, 0);
      ud.rKneePivot.scale.y = 0.78;
      return;
    }

    // =========================================================================
    // STATE 5: ACROBATIC FLIPS & AERIAL TRICKS (Flips-and-Tricks-Animation-Set.mp4)
    // Front Flip, Backflip, Side Aerial Cartwheel, or Athletic Vault Jump!
    // =========================================================================
    if (r.isJumping) {
      const flipType = r.flipType || 'standard_jump';
      const flipP = Math.max(0, Math.min(1, r.flipProgress || 0));

      if (flipType === 'front_flip' || flipType === 'back_flip' || flipType === 'side_aerial') {
        const dir = flipType === 'back_flip' ? -1 : 1;
        const spin = Math.sin(flipP * Math.PI * 0.5) * Math.PI * 2 * dir;
        const tuck = Math.sin(flipP * Math.PI);

        ud.hipsPivot.position.set(0, ud.hipBaseY + 0.12, 0);
        if (flipType === 'side_aerial') {
          ud.hipsPivot.rotation.set(-0.25 * tuck, 0, -(r.laneHopDir || 1) * Math.abs(spin));
        } else {
          ud.hipsPivot.rotation.set(spin, 0, -bankDiff * 0.18);
        }
        ud.torsoPivot.rotation.set(0.45 * tuck * dir, 0, 0);
        ud.headPivot.rotation.set(0.25 * tuck * dir, 0, 0);

        // Arms sweep wide on side_aerial, or tuck to shins on front/back flip
        const armSpread = flipType === 'side_aerial' ? 1.65 : 0.45 + (1 - tuck) * 1.1;
        ud.lShoulderPivot.rotation.set(-0.55, 0, armSpread);
        ud.lElbowPivot.rotation.set(-0.45 * tuck, 0, -0.25);
        ud.rShoulderPivot.rotation.set(-0.55, 0, -armSpread);
        ud.rElbowPivot.rotation.set(-0.45 * tuck, 0, 0.25);

        ud.lHipPivot.position.y = 0.24 * tuck;
        ud.lHipPivot.rotation.set(-0.65 * tuck, 0, flipType === 'side_aerial' ? 0.35 : 0.06);
        ud.lHipPivot.scale.y = 1 - 0.22 * tuck;
        ud.lKneePivot.rotation.set(0.95 * tuck, 0, 0);
        ud.lKneePivot.scale.y = 1 - 0.18 * tuck;

        ud.rHipPivot.position.y = 0.22 * tuck;
        ud.rHipPivot.rotation.set(-0.58 * tuck, 0, flipType === 'side_aerial' ? -0.35 : -0.06);
        ud.rHipPivot.scale.y = 1 - 0.22 * tuck;
        ud.rKneePivot.rotation.set(0.92 * tuck, 0, 0);
        ud.rKneePivot.scale.y = 1 - 0.18 * tuck;
      } else {
        // Standard athletic hurdle vault jump
        ud.hipsPivot.position.set(0, ud.hipBaseY + 0.08, 0);
        ud.hipsPivot.rotation.set(0, 0.14, -bankDiff * 0.18);
        ud.torsoPivot.rotation.set(-0.24, -0.14, 0);
        ud.headPivot.rotation.set(0.14, 0.08, 0);

        ud.lShoulderPivot.position.z = -0.08;
        ud.rShoulderPivot.position.z = -0.08;
        ud.lShoulderPivot.rotation.set(-0.55, 0, -0.35);
        ud.lElbowPivot.rotation.set(-0.48, 0, -0.25);
        ud.rShoulderPivot.rotation.set(-0.45, 0, 0.35);
        ud.rElbowPivot.rotation.set(-0.52, 0, 0.25);

        ud.lHipPivot.position.y = 0.22;
        ud.lHipPivot.rotation.set(-0.52, 0, 0.06);
        ud.lHipPivot.scale.y = 0.84;
        ud.lKneePivot.rotation.set(0.72, 0, 0);
        ud.lKneePivot.scale.y = 0.86;

        ud.rHipPivot.position.y = 0.06;
        ud.rHipPivot.rotation.set(0.46, 0, -0.06);
        ud.rHipPivot.scale.y = 0.92;
        ud.rKneePivot.rotation.set(0.85, 0, 0);
        ud.rKneePivot.scale.y = 0.84;
      }
    } else {
      // =========================================================================
      // STATE 6: DYNAMIC LOCOMOTION (Dynamic-Locomotion-animations.mp4)
      // Acceleration pitch lean, sharp lane-pivot pelvis counter-twist, and deceleration braking!
      // =========================================================================
      const accelDelta = (r.targetSpeed || r.speed) - r.speed;
      const accelLean = Math.max(-0.14, Math.min(0.16, -accelDelta * 0.045));
      const hitRecoil = r.stumbleTimer > 0 ? Math.sin((r.stumbleTimer / 0.45) * Math.PI) : 0;

      ud.hipsPivot.position.set(s * 0.058, ud.hipBaseY + Math.abs(c) * (0.145 + speedNorm * 0.055), 0);
      ud.hipsPivot.rotation.set(0, -s * 0.2 - bankDiff * 0.24, s * 0.085);

      const leanX = r.stumbleTimer > 0 ? 0.36 * hitRecoil : (-0.23 - speedNorm * 0.13 + accelLean);
      ud.torsoPivot.rotation.set(leanX, s * 0.36 - bankDiff * 0.28 + hitRecoil * 0.25, -s * 0.09 - bankDiff * 0.14 - hitRecoil * 0.22);
      ud.headPivot.rotation.set(0.15 + Math.abs(c) * 0.05 - hitRecoil * 0.35, -s * 0.18 + bankDiff * 0.22, s * 0.04 + hitRecoil * 0.18);

      const lArmDrive = -s;
      ud.lShoulderPivot.rotation.set(lArmDrive * 0.58, 0, 0.46 - lArmDrive * 0.18);
      ud.lShoulderPivot.position.z = -0.02 + lArmDrive * 0.16;
      ud.lElbowPivot.rotation.set(-0.48 - Math.max(0, lArmDrive) * 0.28, 0, -0.22 - lArmDrive * 0.32);

      const rArmDrive = s;
      ud.rShoulderPivot.rotation.set(rArmDrive * 0.58, 0, -0.46 + rArmDrive * 0.18);
      ud.rShoulderPivot.position.z = -0.02 + rArmDrive * 0.16;
      ud.rElbowPivot.rotation.set(-0.48 - Math.max(0, rArmDrive) * 0.28, 0, 0.22 + rArmDrive * 0.32);

      const lFwd = Math.max(0, s);
      const lBack = Math.max(0, -s);
      ud.lHipPivot.position.y = lFwd * 0.21 + lBack * 0.11;
      ud.lHipPivot.rotation.set(-s * 0.58, 0, 0.04);
      ud.lHipPivot.scale.y = 1.0 - lBack * 0.12 - lFwd * 0.08;
      ud.lKneePivot.rotation.set(0.18 + lBack * 0.94 + Math.max(0, c) * 0.36, 0, 0);
      ud.lKneePivot.scale.y = 1.0 - lBack * 0.18;

      const rFwd = Math.max(0, -s);
      const rBack = Math.max(0, s);
      ud.rHipPivot.position.y = rFwd * 0.21 + rBack * 0.11;
      ud.rHipPivot.rotation.set(s * 0.58, 0, -0.04);
      ud.rHipPivot.scale.y = 1.0 - rBack * 0.12 - rFwd * 0.08;
      ud.rKneePivot.rotation.set(0.18 + rBack * 0.94 + Math.max(0, -c) * 0.36, 0, 0);
      ud.rKneePivot.scale.y = 1.0 - rBack * 0.18;
    }

    // =========================================================================
    // STATE 7 & 8: UPPER-BODY MAGE SPELLCAST & 3-HIT SWORD/SHIELD BASH OVERRIDES
    // (Mage-Animation-Set.mp4 & First-Person-Sword-and-Shield-animations.mp4)
    // =========================================================================
    const isAttacking = r.attackAnimTimer > 0;
    const atkDur = r.attackAnimDuration || 0.52;
    const atkP = isAttacking ? Math.max(0, Math.min(1, 1 - r.attackAnimTimer / atkDur)) : 0;

    if (ud.rWeaponMesh) {
      ud.rWeaponMesh.scale.setScalar(isAttacking ? 1.26 : 0.88);
      ud.rWeaponMesh.rotation.set(-0.85, 0, -0.35);
    }
    if (ud.lWeaponMesh) {
      ud.lWeaponMesh.scale.setScalar(isAttacking ? 1.26 : 0.88);
    }

    // Off-hand Shield Block / Bash overrides left arm even when not mid-slash!
    if (isShieldBashing && !isAttacking) {
      const bp = Math.sin((r.shieldBashTimer / 0.45) * Math.PI);
      ud.lShoulderPivot.rotation.set(-0.75 * bp, 0, 0.25 - 0.55 * bp);
      ud.lElbowPivot.rotation.set(-0.45, 0, -0.45 * bp);
      ud.torsoPivot.rotation.y = -0.38 * bp;
    }

    if (isAttacking) {
      const dir = r.attackComboSide || 1;
      const comboStep = r.swordComboStep || 1; // 1 = Forehand, 2 = Backhand Cleave, 3 = Lunge Thrust / Bash
      let swing = 0;
      let slashVis = false;
      let slashProg = 0;
      if (atkP < 0.22) {
        swing = -(atkP / 0.22);
      } else if (atkP < 0.68) {
        slashProg = (atkP - 0.22) / 0.46;
        swing = -1 + 2 * (1 - Math.pow(1 - slashProg, 3));
        slashVis = true;
      } else {
        const rec = (atkP - 0.68) / 0.32;
        swing = 1 - rec;
      }

      if (r.attackType === 'cast' || r.attackType === 'mage_cast') {
        // MAGE ANIMATION SET: Dual glowing palm gather -> twin spell projection + expanding arcane sigils!
        ud.torsoPivot.rotation.x = -0.32;
        ud.torsoPivot.rotation.y = -0.36 * swing;
        ud.rShoulderPivot.rotation.set(-0.72, 0, -1.15 * Math.max(0, swing) + 0.35 * Math.min(0, swing));
        ud.rElbowPivot.rotation.set(-0.22, 0, 0.25 * swing);
        ud.lShoulderPivot.rotation.set(-0.68, 0, 1.15 * Math.max(0, swing) - 0.35 * Math.min(0, swing));
        ud.lElbowPivot.rotation.set(-0.22, 0, -0.25 * swing);
        if (ud.castRingMesh) {
          ud.castRingMesh.visible = true;
          const cs = 0.55 + atkP * 1.45;
          ud.castRingMesh.scale.set(cs, cs, 1);
          ud.castRingMesh.rotation.z = atkP * 5.8;
          ud.castRingMesh.material.opacity = Math.max(0, 1 - atkP * 0.88);
        }
      } else if (r.attackType === 'shield_bash') {
        // SWORD & SHIELD SET: Heavy Aegis Shield Bash + Counter-Stab!
        ud.torsoPivot.rotation.x = -0.34;
        ud.torsoPivot.rotation.y = -0.58 * swing;
        ud.lShoulderPivot.rotation.set(-0.78, 0, 0.65 - swing * 1.25);
        ud.lElbowPivot.rotation.set(-0.42, 0, -0.35 * swing);
        ud.rShoulderPivot.rotation.set(-0.45, 0, -0.65 + swing * 0.45);
      } else if (r.attackType === 'slam') {
        // Two-handed Overhead Warhammer Power Slam
        ud.torsoPivot.rotation.x = -0.18 + swing * 0.46;
        ud.torsoPivot.rotation.y = -0.22 * swing;
        ud.rShoulderPivot.rotation.set(-0.55 + swing * 0.85, 0, 1.05 - swing * 1.35);
        ud.rElbowPivot.rotation.set(-0.35, 0, 0.25 - swing * 0.3);
        ud.lShoulderPivot.rotation.set(-0.45 + swing * 0.75, 0, -0.85 + swing * 1.15);
        ud.lElbowPivot.rotation.set(-0.35, 0, -0.25);
        if (ud.rWeaponMesh) ud.rWeaponMesh.rotation.set(-0.3 + swing * 1.15, 0, 0);
      } else if (r.attackType === 'twin') {
        // Blistering X-Cross Twin-Fang Double-Hand Slash
        ud.torsoPivot.rotation.x = -0.34;
        ud.torsoPivot.rotation.y = swing * 0.45 * dir;
        ud.rShoulderPivot.rotation.set(-0.45 - swing * 0.35, 0, -0.85 + swing * 1.45);
        ud.rElbowPivot.rotation.set(-0.35, 0, -0.45 + swing * 0.95);
        ud.lShoulderPivot.rotation.set(-0.45 - swing * 0.35, 0, 0.85 - swing * 1.45);
        ud.lElbowPivot.rotation.set(-0.35, 0, 0.45 - swing * 0.95);
      } else if (r.attackType === 'thrust' || comboStep === 3) {
        // Step 3 Sword Lunge Thrust / Arcane Staff Thrust + Off-hand Shield Guard!
        ud.torsoPivot.rotation.x = -0.34;
        ud.torsoPivot.rotation.y = -0.64 * swing;
        ud.rShoulderPivot.rotation.set(-0.72, 0, 0.22 - swing * 1.05);
        ud.rElbowPivot.rotation.set(-0.18, 0, 0.35 - swing * 0.75);
        ud.lShoulderPivot.rotation.set(-0.52, 0, 0.45); // Off-hand shield held in guard!
        if (ud.castRingMesh && slashVis) {
          ud.castRingMesh.visible = true;
          const cs = 0.6 + slashProg * 1.15;
          ud.castRingMesh.scale.set(cs, cs, 1);
          ud.castRingMesh.rotation.z = slashProg * 4.5;
        }
      } else {
        // Step 1 & 2 Sword & Shield Cadence: Forehand Diagonal Slash / Backhand Cross Cleave!
        ud.torsoPivot.rotation.x = -0.28;
        ud.torsoPivot.rotation.y = -swing * 0.84 * dir;
        ud.torsoPivot.rotation.z = -swing * 0.16 * dir;
        ud.rShoulderPivot.rotation.set(-0.55, 0, dir > 0 ? 0.68 - swing * 1.48 : -0.78 + swing * 1.38);
        ud.rElbowPivot.rotation.set(-0.28, 0, -swing * 0.65 * dir);
        // Left arm holds Aegis shield in raised counter-guard during sword swings!
        ud.lShoulderPivot.rotation.set(-0.42, 0, 0.58 + swing * 0.22);
        ud.lElbowPivot.rotation.set(-0.55, 0, -0.32);
        if (ud.rWeaponMesh) ud.rWeaponMesh.rotation.set(-0.5, 0, -0.9 * swing * dir);
      }

      if (ud.slashArcMesh && slashVis && r.attackType !== 'cast' && r.attackType !== 'mage_cast') {
        ud.slashArcMesh.visible = true;
        ud.slashArcMat.color.setHex(r.gear.weapon?.color || 0x4cf3ff);
        ud.slashArcMat.opacity = Math.sin(slashProg * Math.PI) * 0.92;
        const sc = 0.85 + slashProg * 0.48;
        ud.slashArcMesh.scale.set(sc * dir, sc, 1);
        ud.slashArcMesh.rotation.z = (-0.9 + slashProg * 2.4) * dir;
        ud.slashArcMesh.rotation.x = r.attackType === 'slam' ? 0.15 : comboStep === 3 ? 0.25 : Math.PI * 0.44;
      }
    }
  }

  static applyProceduralFallback(ud, r, s, c, bankDiff, isGliding, isShieldBashing) {
    if (!ud.bodyPivot) return;
    const isAttacking = r.attackAnimTimer > 0;
    const atkDur = r.attackAnimDuration || 0.52;
    const atkP = isAttacking ? Math.max(0, Math.min(1, 1 - r.attackAnimTimer / atkDur)) : 0;

    if ((r.climbTimer || 0) > 0) {
      const cp = (1 - r.climbTimer / (r.climbDuration || 0.82)) * Math.PI * 4;
      ud.bodyPivot.position.y = 0;
      ud.bodyPivot.rotation.set(-0.15, 0, Math.sin(cp) * 0.08);
      if (ud.armL) ud.armL.rotation.x = -2.4 + Math.sin(cp) * 0.6;
      if (ud.armR) ud.armR.rotation.x = -2.4 - Math.sin(cp) * 0.6;
      if (ud.legL) ud.legL.rotation.x = Math.sin(cp) * 0.7;
      if (ud.legR) ud.legR.rotation.x = -Math.sin(cp) * 0.7;
    } else if (isGliding) {
      ud.bodyPivot.position.y = 0;
      ud.bodyPivot.rotation.set(0.18, -bankDiff * 0.3, -bankDiff * 0.42);
      if (ud.armL) ud.armL.rotation.x = -2.6;
      if (ud.armR) ud.armR.rotation.x = -2.6;
      if (ud.legL) ud.legL.rotation.x = 0.35;
      if (ud.legR) ud.legR.rotation.x = 0.42;
    } else if ((r.wallRunTimer || 0) > 0 && r.wallRunSide !== 0) {
      ud.bodyPivot.rotation.set(0.22, -r.wallRunSide * 0.2, -r.wallRunSide * 0.46);
      if (ud.legL) ud.legL.rotation.x = s * 1.15;
      if (ud.legR) ud.legR.rotation.x = -s * 1.15;
    } else if (r.slideTimer > 0) {
      const p = 1 - r.slideTimer / (r.slideDurationTotal || 0.52);
      ud.bodyPivot.position.y = 0.35;
      ud.bodyPivot.scale.set(0.95, 0.65, 0.95);
      ud.bodyPivot.rotation.set(p * Math.PI * 2, 0, -bankDiff * 0.25);
    } else if (r.isJumping && r.flipType && r.flipType !== 'standard_jump') {
      const spin = (r.flipProgress || 0) * Math.PI * 2 * (r.flipType === 'back_flip' ? -1 : 1);
      ud.bodyPivot.position.y = 0.6;
      ud.bodyPivot.rotation.set(r.flipType === 'side_aerial' ? 0 : spin, 0, r.flipType === 'side_aerial' ? spin : -bankDiff * 0.3);
    } else {
      ud.bodyPivot.position.y = r.isJumping ? 0 : Math.abs(c) * 0.13;
      ud.bodyPivot.scale.set(r.squashX, r.squashY, 1);
      const atkTwist = isAttacking ? Math.sin(atkP * Math.PI) * 0.95 * (r.attackComboSide || 1) : 0;
      ud.bodyPivot.rotation.set(r.stumbleTimer > 0 ? 0.3 : 0.18, s * 0.22 - atkTwist, -bankDiff * 0.32);
      if (ud.legL) ud.legL.rotation.x = r.isJumping ? 0.65 : s * 1.05;
      if (ud.legR) ud.legR.rotation.x = r.isJumping ? -0.55 : -s * 1.05;
      if (ud.armL) ud.armL.rotation.x = isShieldBashing ? -1.2 : isAttacking ? 0.5 : -s * 0.95;
      if (ud.armR) ud.armR.rotation.x = isAttacking ? -1.45 + atkP * 2.2 : s * 0.95;
      if (ud.armR) ud.armR.rotation.z = isAttacking ? -0.65 * Math.sin(atkP * Math.PI) : 0;
    }
  }
}
