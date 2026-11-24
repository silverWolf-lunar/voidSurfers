using System;
using UnityEngine;
using VoidRun.Core;
using VoidRun.Gameplay;

namespace VoidRun.Chaser
{
    public enum ChaserProximityState { Distant, Approaching, Close, Catching }

    public class ChaserController : MonoBehaviour
    {
        [Header("Targets")]
        [SerializeField] private PlayerController player;

        [Header("Distance Tuning (GDD Section D)")]
        [SerializeField] private float maxFollowDistance = 60f;
        [SerializeField] private float closeThreshold = 20f;
        [SerializeField] private float catchingThreshold = 8f;
        [SerializeField] private float naturalClosingRate = 0.3f;

        private float currentDistanceBehind;
        private bool isPausedForBoss;
        private bool isFrozen;
        private float stealthSlowTimer;

        public float CurrentDistance => currentDistanceBehind;
        public event Action<ChaserProximityState> OnProximityChanged;
        private ChaserProximityState lastState = ChaserProximityState.Distant;

        private void Start()
        {
            currentDistanceBehind = maxFollowDistance;
            if (player != null)
            {
                player.OnStumble += HandlePlayerStumbled;
                player.OnNearMiss += _ => PushBack(3f);
            }
            if (GameManager.Instance != null)
            {
                GameManager.Instance.OnWorldChanged += ConfigureForWorld;
            }
        }

        private void OnDestroy()
        {
            if (player != null) player.OnStumble -= HandlePlayerStumbled;
            if (GameManager.Instance != null) GameManager.Instance.OnWorldChanged -= ConfigureForWorld;
        }

        public void ConfigureForWorld(WorldData world)
        {
            if (world == null) return;
            naturalClosingRate = world.chaserBaseClosingRate;
            ResetToDistant();
        }

        public void SetPausedForBoss(bool paused) => isPausedForBoss = paused;
        public void SetFrozen(bool frozen) => isFrozen = frozen;
        public void ApplyEclipseVeil(float duration) => stealthSlowTimer = Mathf.Max(stealthSlowTimer, duration);

        public void ResetToDistant() => currentDistanceBehind = maxFollowDistance;

        private void Update()
        {
            if (player == null || isPausedForBoss || isFrozen) return;
            if (GameManager.Instance != null && GameManager.Instance.CurrentState != GameState.Running) return;

            float rate = naturalClosingRate;
            if (stealthSlowTimer > 0f)
            {
                stealthSlowTimer -= Time.deltaTime;
                rate = -0.8f; // Retreats while player is veiled
            }

            currentDistanceBehind = Mathf.Clamp(currentDistanceBehind - rate * Time.deltaTime, 0f, maxFollowDistance);

            Vector3 targetPos = player.transform.position - new Vector3(0f, 0f, currentDistanceBehind * 0.25f);
            targetPos.y = Mathf.Abs(Mathf.Sin(Time.time * 8f)) * 0.25f;
            transform.position = Vector3.Lerp(transform.position, targetPos, 8f * Time.deltaTime);

            var curState = GetProximityState();
            if (curState != lastState)
            {
                lastState = curState;
                OnProximityChanged?.Invoke(curState);
            }

            if (currentDistanceBehind <= 0.4f)
            {
                GameManager.Instance?.TriggerGameOver();
            }
        }

        public void PushBack(float meters)
        {
            float mult = SaveSystem.HasSkillNode("void_push") ? 1.25f : 1.0f;
            currentDistanceBehind = Mathf.Min(maxFollowDistance, currentDistanceBehind + meters * mult);
        }

        private void HandlePlayerStumbled()
        {
            currentDistanceBehind = Mathf.Max(1.5f, currentDistanceBehind - 12f);
        }

        public ChaserProximityState GetProximityState()
        {
            if (currentDistanceBehind > 40f) return ChaserProximityState.Distant;
            if (currentDistanceBehind > closeThreshold) return ChaserProximityState.Approaching;
            if (currentDistanceBehind > catchingThreshold) return ChaserProximityState.Close;
            return ChaserProximityState.Catching;
        }
    }
}
