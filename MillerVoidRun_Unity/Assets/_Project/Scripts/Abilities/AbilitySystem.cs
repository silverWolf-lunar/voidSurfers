using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using VoidRun.Core;
using VoidRun.Gameplay;
using VoidRun.Chaser;

namespace VoidRun.Abilities
{
    /// <summary>
    /// Runtime system for all 15 Canon Umbral Codex Void Powers + 6 Ally Signatures.
    /// Manages Void Energy (VE), cooldowns, slot swapping, passive Void Resonance & Ultimate Singularity Soul.
    /// </summary>
    public class AbilitySystem : MonoBehaviour
    {
        [Header("References")]
        [SerializeField] private PlayerController player;
        [SerializeField] private ChaserController chaser;
        [SerializeField] private BossEncounterController bossController;

        [Header("Equipped Abilities")]
        [SerializeField] private AbilityData primaryAbility;
        [SerializeField] private AbilityData secondaryAbility;
        private AbilityData activeSlot;

        [Header("Void Energy (VE)")]
        [SerializeField] private float passiveRegenPerSecond = 3f;
        private float maxVE = 100f;
        private float currentVE;

        private readonly Dictionary<AbilityData, float> cooldowns = new Dictionary<AbilityData, float>();
        private readonly List<AbilityData> cdKeysBuffer = new List<AbilityData>(); // Pre-allocated: zero GC!

        public event Action<float, float> OnEnergyChanged;
        public event Action<AbilityData> OnAbilityTriggered;

        private void Start()
        {
            maxVE = SaveSystem.GetMaxVoidEnergy();
            currentVE = maxVE * 0.8f;
            activeSlot = primaryAbility;
            if (player != null)
            {
                player.OnNearMiss += _ => AddEnergy(8f);
            }
            OnEnergyChanged?.Invoke(currentVE, maxVE);
        }

        private void Update()
        {
            if (GameManager.Instance != null && GameManager.Instance.CurrentState != GameState.Running
                && GameManager.Instance.CurrentState != GameState.BossChase) return;

            float regen = passiveRegenPerSecond + (SaveSystem.HasSkillNode("codex_ve") ? 1f : 0f);
            if (SaveSystem.Data != null && SaveSystem.Data.selectedRunner == RunnerId.Precious) regen *= 1.25f;

            if (currentVE < maxVE)
            {
                currentVE = Mathf.Min(maxVE, currentVE + regen * Time.deltaTime);
                OnEnergyChanged?.Invoke(currentVE, maxVE);
            }

            // Update cooldowns without GC allocations
            cdKeysBuffer.Clear();
            foreach (var k in cooldowns.Keys) cdKeysBuffer.Add(k);
            for (int i = 0; i < cdKeysBuffer.Count; i++)
            {
                var key = cdKeysBuffer[i];
                cooldowns[key] -= Time.deltaTime;
                if (cooldowns[key] <= 0f) cooldowns.Remove(key);
            }

            // Keyboard shortcut for desktop testing
            if (Input.GetKeyDown(KeyCode.Space) || Input.GetKeyDown(KeyCode.E)) TriggerEquippedAbility();
            if (Input.GetKeyDown(KeyCode.Q)) SwapAbilitySlot();
        }

        public void AddEnergy(float amount)
        {
            currentVE = Mathf.Clamp(currentVE + amount, 0f, maxVE);
            OnEnergyChanged?.Invoke(currentVE, maxVE);
        }

        public void SwapAbilitySlot()
        {
            if (secondaryAbility == null || SaveSystem.Data.codexLevel < 25) return;
            activeSlot = activeSlot == primaryAbility ? secondaryAbility : primaryAbility;
        }

        public void TriggerEquippedAbility()
        {
            // Priority: resolve active Boss QTE escape!
            if (bossController != null && bossController.TryCompleteQteWithPower())
            {
                return;
            }

            if (activeSlot == null || activeSlot.tiers == null || activeSlot.tiers.Length == 0) return;
            if (cooldowns.ContainsKey(activeSlot)) return;

            var spec = activeSlot.tiers[0];
            if (currentVE < spec.voidEnergyCost) return;

            currentVE -= spec.voidEnergyCost;
            float cd = spec.cooldown * (SaveSystem.HasSkillNode("codex_cd") ? 0.9f : 1.0f);
            cooldowns[activeSlot] = cd;
            OnEnergyChanged?.Invoke(currentVE, maxVE);
            GameManager.Instance?.RecordPowerUsed();

            StartCoroutine(ExecuteAbility(activeSlot, spec));
            OnAbilityTriggered?.Invoke(activeSlot);
        }

        private IEnumerator ExecuteAbility(AbilityData ability, AbilityTierSpec spec)
        {
            float dur = spec.duration + (SaveSystem.HasSkillNode("void_dur") ? 0.5f : 0f);

            switch (ability.powerType)
            {
                case VoidPowerType.Flicker:
                    player.SetInvulnerability(true);
                    player.transform.position += Vector3.forward * spec.magnitude;
                    chaser?.PushBack(spec.pushbackMeters);
                    yield return new WaitForSeconds(dur);
                    player.SetInvulnerability(false);
                    break;

                case VoidPowerType.Stillstep:
                    player.SetHovering(true);
                    yield return new WaitForSeconds(dur);
                    player.SetHovering(false);
                    break;

                case VoidPowerType.ShadowShield:
                    player.ShieldHits += Mathf.Max(1, Mathf.RoundToInt(spec.magnitude)) + (SaveSystem.HasSkillNode("shadow_hp") ? 1 : 0);
                    chaser?.PushBack(spec.pushbackMeters);
                    yield return new WaitForSeconds(dur);
                    break;

                case VoidPowerType.Voidwalk:
                case VoidPowerType.VoidDomain:
                    player.SetInvulnerability(true);
                    if (ability.powerType == VoidPowerType.VoidDomain) chaser?.SetFrozen(true);
                    chaser?.PushBack(spec.pushbackMeters);
                    yield return new WaitForSeconds(dur);
                    player.SetInvulnerability(false);
                    if (ability.powerType == VoidPowerType.VoidDomain) chaser?.SetFrozen(false);
                    break;

                case VoidPowerType.TimeBleed:
                    Time.timeScale = Mathf.Clamp(spec.magnitude, 0.25f, 0.5f);
                    yield return new WaitForSecondsRealtime(dur);
                    Time.timeScale = 1f;
                    break;

                case VoidPowerType.EclipseVeil:
                    chaser?.ApplyEclipseVeil(dur);
                    chaser?.PushBack(spec.pushbackMeters);
                    yield return new WaitForSeconds(dur);
                    break;

                case VoidPowerType.VoidlightSynthesis:
                    player.SetInvulnerability(true);
                    player.SpeedMultiplier = 2.2f;
                    chaser?.PushBack(25f);
                    yield return new WaitForSeconds(dur);
                    player.SpeedMultiplier = 1f;
                    player.SetInvulnerability(false);
                    break;

                case VoidPowerType.SingularitySoul:
                    player.SetInvulnerability(true);
                    player.transform.position += Vector3.forward * 200f;
                    chaser?.ResetToDistant();
                    yield return new WaitForSeconds(dur);
                    player.SetInvulnerability(false);
                    break;

                case VoidPowerType.ConceptReversal:
                case VoidPowerType.CryoPath:
                    player.ConceptReversalActive = true;
                    yield return new WaitForSeconds(dur);
                    player.ConceptReversalActive = false;
                    break;

                default:
                    player.SetInvulnerability(true);
                    chaser?.PushBack(12f);
                    yield return new WaitForSeconds(dur);
                    player.SetInvulnerability(false);
                    break;
            }
        }
    }
}
