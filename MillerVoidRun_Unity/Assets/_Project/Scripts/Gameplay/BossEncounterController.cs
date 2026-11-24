using System;
using UnityEngine;
using VoidRun.Core;
using VoidRun.Chaser;

namespace VoidRun.Gameplay
{
    /// <summary>
    /// Orchestrates all 7 Faction Boss Runs (Alton Dam, James Stole, Felix Torrot,
    /// Shawn Tami, Sil Talen, Ashley Moses, and Tay Sonder's 4-Phase Climax).
    /// </summary>
    public class BossEncounterController : MonoBehaviour
    {
        [SerializeField] private PlayerController player;
        [SerializeField] private ChaserController chaser;
        [SerializeField] private float bossTriggerDistance = 1400f;
        [SerializeField] private float bossLength = 400f;

        private float worldStartZ;
        private bool bossActive;
        private bool qteActive;
        private float qteTimer;
        private WorldData activeWorld;

        public bool IsBossActive => bossActive;
        public bool IsQteActive => qteActive;

        public event Action<string, string, float> OnBossStateUpdated; // name, phase, progress
        public event Action<string, float> OnQtePrompt;
        public event Action<bool> OnBossResolved;

        private void Update()
        {
            if (player == null || GameManager.Instance == null) return;
            activeWorld = GameManager.Instance.GetCurrentWorldData();
            if (activeWorld == null) return;

            float worldDist = player.transform.position.z - worldStartZ;
            float endDist = activeWorld.worldIndex == 7 ? bossTriggerDistance + 600f : bossTriggerDistance + bossLength;

            if (!bossActive && worldDist >= bossTriggerDistance)
            {
                BeginBossEncounter();
            }

            if (!bossActive) return;

            float progress = Mathf.Clamp01((worldDist - bossTriggerDistance) / (endDist - bossTriggerDistance));
            string phaseName = progress < 0.35f ? "Phase 1" : progress < 0.72f ? "Phase 2" : "Phase 3 — Escape!";
            OnBossStateUpdated?.Invoke($"{activeWorld.bossName} ({activeWorld.bossFaction})", phaseName, progress);

            if (progress >= 0.78f && !qteActive)
            {
                qteActive = true;
                qteTimer = activeWorld.bossQteWindow;
                OnQtePrompt?.Invoke($"ACTIVATE VOID POWER TO ESCAPE {activeWorld.bossName.ToUpper()}!", qteTimer);
            }

            if (qteActive)
            {
                qteTimer -= Time.deltaTime;
                if (qteTimer <= 0f)
                {
                    ResolveBoss(false);
                }
            }
            else if (worldDist >= endDist)
            {
                ResolveBoss(true);
            }
        }

        private void BeginBossEncounter()
        {
            bossActive = true;
            qteActive = false;
            chaser?.SetPausedForBoss(true);
            Debug.Log($"[BossEncounter] Started: {activeWorld.bossName}");
        }

        public bool TryCompleteQteWithPower()
        {
            if (!qteActive) return false;
            ResolveBoss(true);
            return true;
        }

        private void ResolveBoss(bool escaped)
        {
            bossActive = false;
            qteActive = false;
            chaser?.SetPausedForBoss(false);

            if (escaped)
            {
                GameManager.Instance.AddShard(50);
                GameManager.Instance.AddEssence(5);
                GameManager.Instance.AddBeastCore(1);
                worldStartZ = player.transform.position.z;
                GameManager.Instance.AdvanceToNextWorld();
            }
            else
            {
                player.TakeObstacleHit();
                worldStartZ = player.transform.position.z;
                GameManager.Instance.AdvanceToNextWorld();
            }
            OnBossResolved?.Invoke(escaped);
        }
    }
}
