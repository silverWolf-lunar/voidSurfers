// MILLER: VOID RUN — Unique Character-to-Player-Slot Manager
// Enforces the strict 1-to-1 invariant:
//   - No two slots can EVER hold the same character.
//   - No character can EVER appear in more than one slot.
//   - Locked / unknown characters cannot be assigned.
// Handles edge cases: more characters than slots (bench), fewer characters than slots (empty slots),
// swapping slots, clearing slots (guarding against 0 active slots), and corrupted save deduplication.

import {
  CHARACTER_DEFINITIONS,
  PLAYER_SLOT_DEFINITIONS,
  getCharacterById,
} from '../config/charactersConfig.js';
import { saveManager } from './saveManager.js';

const VALID_CHAR_IDS = new Set(CHARACTER_DEFINITIONS.map((c) => c.id));

/**
 * Pure sanitization helper: deduplicates, strips unknown or locked characters,
 * pads/truncates to configured slot count, and guarantees >= 1 valid occupied slot.
 */
export function sanitizeSlotAssignments(rawSlots, unlockedChars = []) {
  const unlockedSet = new Set(unlockedChars);
  const slotCount = PLAYER_SLOT_DEFINITIONS.length;
  const result = new Array(slotCount).fill(null);
  const used = new Set();

  // 1. Preserve valid, unlocked, non-duplicate entries from saved slots
  if (Array.isArray(rawSlots)) {
    for (let i = 0; i < slotCount; i++) {
      const cid = rawSlots[i];
      if (cid && VALID_CHAR_IDS.has(cid) && unlockedSet.has(cid) && !used.has(cid)) {
        result[i] = cid;
        used.add(cid);
      }
    }
  }

  // 2. If save predates slots (or all empty), seed from PLAYER_SLOT_DEFINITIONS defaults
  const occupiedCount = result.filter(Boolean).length;
  if (occupiedCount === 0) {
    for (let i = 0; i < slotCount; i++) {
      const defCid = PLAYER_SLOT_DEFINITIONS[i].defaultCharId;
      if (defCid && VALID_CHAR_IDS.has(defCid) && unlockedSet.has(defCid) && !used.has(defCid)) {
        result[i] = defCid;
        used.add(defCid);
      }
    }
  }

  // 3. Final fallback: if still empty, put first unlocked character into Slot 1
  if (result.every((x) => !x)) {
    const firstUnlocked = CHARACTER_DEFINITIONS.find((c) => unlockedSet.has(c.id)) || CHARACTER_DEFINITIONS[0];
    result[0] = firstUnlocked.id;
  }

  return result;
}

class SlotManager {
  getSlotDefinitions() {
    return PLAYER_SLOT_DEFINITIONS;
  }

  getSlotCount() {
    return PLAYER_SLOT_DEFINITIONS.length;
  }

  /**
   * Ensures stored slots & activeSlotIndex strictly obey the uniqueness invariant.
   */
  ensureValid(persist = false) {
    const d = saveManager.data;
    const clean = sanitizeSlotAssignments(d.playerSlots, d.unlockedChars);
    const changed = JSON.stringify(clean) !== JSON.stringify(d.playerSlots);
    d.playerSlots = clean;

    let activeIdx = Number.isInteger(d.activeSlotIndex) ? d.activeSlotIndex : 0;
    if (activeIdx < 0 || activeIdx >= clean.length || !clean[activeIdx]) {
      // Match currently selectedChar if slotted, otherwise first occupied slot
      const bySelected = clean.indexOf(d.selectedChar);
      activeIdx = bySelected >= 0 ? bySelected : clean.findIndex(Boolean);
    }
    if (activeIdx < 0) activeIdx = 0;

    if (d.activeSlotIndex !== activeIdx || d.selectedChar !== clean[activeIdx]) {
      d.activeSlotIndex = activeIdx;
      d.selectedChar = clean[activeIdx] || 'miller';
      if (persist) saveManager.save();
    } else if (changed && persist) {
      saveManager.save();
    }
    return d.playerSlots;
  }

  /**
   * Returns rich slot views: { index, slotNumber, id, label, charId, character, isActive, isEmpty }
   */
  getSlots() {
    const slots = this.ensureValid(false);
    const activeIdx = saveManager.data.activeSlotIndex;
    return PLAYER_SLOT_DEFINITIONS.map((def, idx) => {
      const charId = slots[idx] || null;
      return {
        index: idx,
        slotNumber: def.slotNumber,
        id: def.id,
        label: def.label,
        charId,
        character: charId ? getCharacterById(charId) : null,
        isActive: idx === activeIdx,
        isEmpty: !charId,
      };
    });
  }

  getActiveSlotIndex() {
    this.ensureValid(false);
    return saveManager.data.activeSlotIndex;
  }

  getActiveSlot() {
    const slots = this.getSlots();
    return slots[this.getActiveSlotIndex()] || slots[0];
  }

  getSlotIndexForCharacter(charId) {
    const slots = this.ensureValid(false);
    return slots.indexOf(charId);
  }

  getSlotNumberForCharacter(charId) {
    const idx = this.getSlotIndexForCharacter(charId);
    return idx >= 0 ? idx + 1 : null;
  }

  getUnassignedCharacters() {
    const slots = this.ensureValid(false);
    const slotted = new Set(slots.filter(Boolean));
    return CHARACTER_DEFINITIONS.filter((c) => !slotted.has(c.id));
  }

  getEmptySlotIndices() {
    const slots = this.ensureValid(false);
    const out = [];
    for (let i = 0; i < slots.length; i++) {
      if (!slots[i]) out.push(i);
    }
    return out;
  }

  /**
   * Activates a slot as the live playable runner slot (syncs selectedChar).
   */
  setActiveSlot(slotIndex) {
    const slots = this.ensureValid(false);
    if (slotIndex < 0 || slotIndex >= slots.length) {
      return { ok: false, reason: 'INVALID_SLOT', message: 'Invalid slot index.' };
    }
    const charId = slots[slotIndex];
    if (!charId) {
      return { ok: false, reason: 'EMPTY_SLOT', message: `Slot ${slotIndex + 1} is empty. Assign a character first.` };
    }
    if (!saveManager.data.unlockedChars.includes(charId)) {
      return { ok: false, reason: 'LOCKED', message: 'Character in this slot is locked.' };
    }
    saveManager.data.activeSlotIndex = slotIndex;
    saveManager.data.selectedChar = charId;
    saveManager.save();
    return { ok: true, slotIndex, charId, character: getCharacterById(charId) };
  }

  /**
   * Assigns a character uniquely to `slotIndex`.
   * - `mode = 'swap'` (default): if charId is already in another slot, swaps the two slots cleanly.
   * - `mode = 'reject'`: refuses assignment if charId is already assigned elsewhere.
   * Guarantees zero duplicate characters across all slots.
   */
  assignCharacter(slotIndex, charId, { mode = 'swap', activate = false } = {}) {
    const d = saveManager.data;
    const slots = this.ensureValid(false);

    if (slotIndex < 0 || slotIndex >= slots.length) {
      return { ok: false, reason: 'INVALID_SLOT', message: 'Invalid slot index.' };
    }
    if (!VALID_CHAR_IDS.has(charId)) {
      return { ok: false, reason: 'UNKNOWN_CHARACTER', message: `Unknown character: ${charId}` };
    }
    if (!d.unlockedChars.includes(charId)) {
      const ch = getCharacterById(charId);
      return { ok: false, reason: 'LOCKED', message: `${ch.name} is locked and cannot be assigned.` };
    }

    const existingIdx = slots.indexOf(charId);
    const previousInTarget = slots[slotIndex];

    if (existingIdx === slotIndex) {
      if (activate) this.setActiveSlot(slotIndex);
      return { ok: true, action: 'unchanged', slotIndex, charId };
    }

    let action = 'assigned';
    let swappedWithSlot = null;

    if (existingIdx !== -1) {
      if (mode === 'reject') {
        const ch = getCharacterById(charId);
        return {
          ok: false,
          reason: 'ALREADY_ASSIGNED',
          existingSlotIndex: existingIdx,
          message: `${ch.name} is already assigned to Slot ${existingIdx + 1}.`,
        };
      }
      // Atomic 1-to-1 swap: previous occupant of target slot moves to existingIdx (or null if target was empty)
      slots[existingIdx] = previousInTarget;
      slots[slotIndex] = charId;
      action = 'swapped';
      swappedWithSlot = existingIdx;
    } else {
      // Bench character placed into slotIndex (previous occupant returns to bench)
      slots[slotIndex] = charId;
      action = previousInTarget ? 'replaced' : 'assigned';
    }

    // Re-verify activeSlotIndex points to an occupied slot
    if (activate) {
      d.activeSlotIndex = slotIndex;
      d.selectedChar = charId;
    } else if (!slots[d.activeSlotIndex]) {
      d.activeSlotIndex = slotIndex;
      d.selectedChar = charId;
    } else {
      d.selectedChar = slots[d.activeSlotIndex];
    }

    d.playerSlots = sanitizeSlotAssignments(slots, d.unlockedChars);
    saveManager.save();
    return {
      ok: true,
      action,
      slotIndex,
      swappedWithSlot,
      displacedCharId: existingIdx === -1 ? previousInTarget : null,
      charId,
    };
  }

  /**
   * Swaps two slots directly (supports swapping with empty slots too).
   */
  swapSlots(slotA, slotB) {
    const d = saveManager.data;
    const slots = this.ensureValid(false);
    if (slotA < 0 || slotA >= slots.length || slotB < 0 || slotB >= slots.length) {
      return { ok: false, reason: 'INVALID_SLOT', message: 'Invalid slot index.' };
    }
    if (slotA === slotB) return { ok: true, action: 'unchanged' };

    const tmp = slots[slotA];
    slots[slotA] = slots[slotB];
    slots[slotB] = tmp;

    // Keep active character followed if active slot was swapped
    if (d.activeSlotIndex === slotA && slots[slotB]) d.activeSlotIndex = slotB;
    else if (d.activeSlotIndex === slotB && slots[slotA]) d.activeSlotIndex = slotA;
    else if (!slots[d.activeSlotIndex]) d.activeSlotIndex = slots.findIndex(Boolean);

    d.selectedChar = slots[d.activeSlotIndex] || 'miller';
    saveManager.save();
    return { ok: true, action: 'swapped', slotA, slotB };
  }

  /**
   * Clears a slot (leaves it empty). Prevents clearing the last occupied slot.
   */
  clearSlot(slotIndex) {
    const d = saveManager.data;
    const slots = this.ensureValid(false);
    if (slotIndex < 0 || slotIndex >= slots.length) {
      return { ok: false, reason: 'INVALID_SLOT', message: 'Invalid slot index.' };
    }
    if (!slots[slotIndex]) {
      return { ok: true, action: 'already_empty', slotIndex };
    }
    const occupied = slots.filter(Boolean).length;
    if (occupied <= 1) {
      return { ok: false, reason: 'LAST_SLOT', message: 'At least 1 player slot must remain assigned.' };
    }
    const removedCharId = slots[slotIndex];
    slots[slotIndex] = null;
    if (d.activeSlotIndex === slotIndex) {
      d.activeSlotIndex = slots.findIndex(Boolean);
      d.selectedChar = slots[d.activeSlotIndex];
    }
    saveManager.save();
    return { ok: true, action: 'cleared', slotIndex, removedCharId };
  }

  /**
   * Restores every slot to its unique default mapping from charactersConfig.js.
   */
  resetDefaultSlots() {
    const d = saveManager.data;
    d.playerSlots = sanitizeSlotAssignments(
      PLAYER_SLOT_DEFINITIONS.map((s) => s.defaultCharId),
      d.unlockedChars
    );
    d.activeSlotIndex = 0;
    d.selectedChar = d.playerSlots[0] || 'miller';
    saveManager.save();
    return { ok: true, slots: d.playerSlots };
  }

  /**
   * Invariant validator (useful for automated tests & QA).
   */
  validateInvariant() {
    const d = saveManager.data;
    const slots = d.playerSlots || [];
    const seen = new Set();
    const duplicates = [];
    const invalidChars = [];
    const lockedInSlots = [];

    for (let i = 0; i < slots.length; i++) {
      const cid = slots[i];
      if (!cid) continue;
      if (!VALID_CHAR_IDS.has(cid)) invalidChars.push({ slot: i + 1, cid });
      if (!d.unlockedChars.includes(cid)) lockedInSlots.push({ slot: i + 1, cid });
      if (seen.has(cid)) duplicates.push({ slot: i + 1, cid });
      seen.add(cid);
    }
    return {
      valid: duplicates.length === 0 && invalidChars.length === 0 && lockedInSlots.length === 0 && seen.size >= 1,
      slotCount: slots.length,
      occupiedCount: seen.size,
      duplicates,
      invalidChars,
      lockedInSlots,
    };
  }
}

export const slotManager = new SlotManager();
