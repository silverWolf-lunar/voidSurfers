using System;
using System.Collections.Generic;
using UnityEngine;
using VoidRun.Core;

namespace VoidRun.Gameplay
{
    public class PortalEnemyUnit : MonoBehaviour
    {
        public float chargeSpeed = 7.5f;
        public float slowFactor = 0.62f;
        public float slowDuration = 2.1f;
        public bool canWeave;
        private bool weaveDone;
        private float targetX;
        private bool defeated;

        public void Initialize(int lane, float speed, float slowPct, float dur, bool weave)
        {
            targetX = (lane - 1) * 1.2f;
            chargeSpeed = speed;
            slowFactor = 1f - slowPct;
            slowDuration = dur;
            canWeave = weave;
            weaveDone = false;
            defeated = false;
            gameObject.SetActive(true);
        }

        public void Tick(float dt, PlayerController player, ref int armorDeflects, Action<PortalEnemyUnit> onDefeated, Action<float, float> onSlowPlayer)
        {
            if (defeated || player == null) return;

            // Charge toward player along -Z
            transform.position += Vector3.back * chargeSpeed * dt;

            float dz = transform.position.z - player.transform.position.z;
            if (canWeave && !weaveDone && dz < 24f && dz > 14f)
            {
                weaveDone = true;
                targetX = ((int)player.GetCurrentLane() - 1) * 1.2f;
            }
            Vector3 p = transform.position;
            p.x = Mathf.MoveTowards(p.x, targetX, 7f * dt);
            transform.position = p;

            if (Mathf.Abs(dz) < 0.85f && Mathf.Abs(p.x - player.transform.position.x) < 0.62f)
            {
                if (player.transform.position.y > 0.95f)
                {
                    player.RegisterNearMiss();
                }
                else if (armorDeflects > 0 || player.ShieldHits > 0)
                {
                    if (armorDeflects > 0) armorDeflects--;
                    else player.ShieldHits--;
                    MarkDefeated(onDefeated);
                }
                else
                {
                    defeated = true;
                    gameObject.SetActive(false);
                    onSlowPlayer?.Invoke(slowFactor, slowDuration);
                }
            }
        }

        public void MarkDefeated(Action<PortalEnemyUnit> onDefeated)
        {
            if (defeated) return;
            defeated = true;
            gameObject.SetActive(false);
            onDefeated?.Invoke(this);
        }

        public bool IsDefeated => defeated;
    }

    /// <summary>
    /// Spawns world-themed Portal Enemies that charge toward the player to slow them down,
    /// and handles active Gear Weapon Strikes (Key F / LeftShift / HUD Button) & Armor Deflects.
    /// </summary>
    public class PortalEnemyController : MonoBehaviour
    {
        [SerializeField] private PlayerController player;
        [SerializeField] private float weaponRange = 9.5f;
        [SerializeField] private float weaponCooldown = 1.15f;
        [SerializeField] private int weaponLaneSpan = 1;
        [SerializeField] private int startingArmorDeflects = 1;

        private readonly List<PortalEnemyUnit> activeEnemies = new List<PortalEnemyUnit>();
        private float spawnTimer = 5f;
        private float currentWeaponCd;
        private int armorDeflects;
        private float enemySlowTimer;
        private float enemySlowFactor = 1f;

        public int EnemiesDefeated { get; private set; }
        public event Action<int> OnEnemyDefeated;
        public event Action<float> OnPlayerSlowed;

        private void Start()
        {
            armorDeflects = startingArmorDeflects;
        }

        private void Update()
        {
            if (player == null || GameManager.Instance == null || GameManager.Instance.CurrentState != GameState.Running) return;

            if (currentWeaponCd > 0f) currentWeaponCd -= Time.deltaTime;
            if (enemySlowTimer > 0f)
            {
                enemySlowTimer -= Time.deltaTime;
                player.SpeedMultiplier = enemySlowTimer > 0f ? enemySlowFactor : 1f;
            }

            if (Input.GetKeyDown(KeyCode.F) || Input.GetKeyDown(KeyCode.LeftShift))
            {
                TriggerGearStrike();
            }

            spawnTimer -= Time.deltaTime;
            if (spawnTimer <= 0f)
            {
                int worldIdx = GameManager.Instance.CurrentWorldIndex;
                spawnTimer = Mathf.Max(3.2f, 6.8f - worldIdx * 0.45f);
                SpawnPortalEnemy(worldIdx);
            }

            for (int i = activeEnemies.Count - 1; i >= 0; i--)
            {
                var unit = activeEnemies[i];
                unit.Tick(Time.deltaTime, player, ref armorDeflects, HandleEnemyDefeated, ApplySlowToPlayer);
                if (unit.IsDefeated || unit.transform.position.z < player.transform.position.z - 10f)
                {
                    Destroy(unit.gameObject);
                    activeEnemies.RemoveAt(i);
                }
            }
        }

        public void TriggerGearStrike()
        {
            if (currentWeaponCd > 0f || player == null) return;
            currentWeaponCd = weaponCooldown;
            enemySlowTimer = 0f;
            player.SpeedMultiplier = 1f;

            int heroLv = SaveSystem.GetHeroLevel(SaveSystem.Data.selectedRunner);
            float effectiveRange = weaponRange * (1f + (heroLv - 1) * 0.025f);
            float laneTol = weaponLaneSpan >= 3 ? 3.5f : weaponLaneSpan == 2 ? 1.85f : 0.85f;

            foreach (var e in activeEnemies)
            {
                if (e.IsDefeated) continue;
                float dz = e.transform.position.z - player.transform.position.z;
                if (dz >= -1f && dz <= effectiveRange && Mathf.Abs(e.transform.position.x - player.transform.position.x) <= laneTol)
                {
                    e.MarkDefeated(HandleEnemyDefeated);
                }
            }
        }

        private void SpawnPortalEnemy(int worldIdx)
        {
            int lane = UnityEngine.Random.value < 0.6f ? (int)player.GetCurrentLane() : UnityEngine.Random.Range(0, 3);
            var go = GameObject.CreatePrimitive(PrimitiveType.Capsule);
            go.name = $"PortalEnemy_W{worldIdx}";
            go.transform.position = new Vector3((lane - 1) * 1.2f, 0.9f, player.transform.position.z + 44f);
            var unit = go.AddComponent<PortalEnemyUnit>();
            unit.Initialize(lane, 6.5f + worldIdx * 0.55f, 0.35f, 2.1f, worldIdx >= 3);
            activeEnemies.Add(unit);
        }

        private void HandleEnemyDefeated(PortalEnemyUnit unit)
        {
            EnemiesDefeated++;
            GameManager.Instance?.AddShard(4);
            GameManager.Instance?.AddScore(220);
            SaveSystem.AddHeroXP(SaveSystem.Data.selectedRunner, 18);
            OnEnemyDefeated?.Invoke(EnemiesDefeated);
        }

        private void ApplySlowToPlayer(float factor, float duration)
        {
            int heroLv = SaveSystem.GetHeroLevel(SaveSystem.Data.selectedRunner);
            float resist = Mathf.Min(0.5f, (heroLv - 1) * 0.015f);
            enemySlowFactor = factor;
            enemySlowTimer = Mathf.Max(0.55f, duration * (1f - resist));
            player.SpeedMultiplier = enemySlowFactor;
            OnPlayerSlowed?.Invoke(enemySlowTimer);
        }
    }
}
