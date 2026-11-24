using System;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace VoidRun.Core
{
    public enum GameState { Boot, Menu, Running, Paused, BossChase, GameOver }

    public class GameManager : MonoBehaviour
    {
        public static GameManager Instance { get; private set; }

        [Header("Configured Data Assets (Populated by VoidRunProjectBuilder)")]
        public WorldData[] allWorlds;
        public CharacterData[] allCharacters;
        public AbilityData[] allAbilities;

        public GameState CurrentState { get; private set; } = GameState.Boot;
        public int CurrentWorldIndex { get; private set; } = 1;
        public float RunDistance { get; private set; }
        public int RunScore { get; private set; }
        public int ScoreMultiplier { get; private set; } = 1;
        public int RunVoidShards { get; private set; }
        public int RunCodexEssence { get; private set; }
        public int RunBeastCores { get; private set; }
        public int RunNearMisses { get; private set; }
        public int RunBonusRings { get; private set; }
        public int RunPowersUsed { get; private set; }
        public int RunBossesEscaped { get; private set; }
        public bool IsDailyRun { get; private set; }
        public int ActiveSeed { get; private set; }

        public event Action<WorldData> OnWorldChanged;
        public event Action<int> OnShardsChanged;
        public event Action<int, int> OnScoreChanged; // score, multiplier
        public event Action<string> OnAchievementUnlocked;
        public event Action OnRunGameOver;

        private void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
            DontDestroyOnLoad(gameObject);
            SaveSystem.Load();
            ApplyPerformanceBudget();
        }

        public void ApplyPerformanceBudget()
        {
            // GDD Section W: 60 FPS target / 30 FPS budget fallback
            QualitySettings.vSyncCount = 0;
            Application.targetFrameRate = SaveSystem.Data.highGraphics60Fps ? 60 : 30;
            Screen.orientation = ScreenOrientation.Portrait;
        }

        public WorldData GetCurrentWorldData()
        {
            if (allWorlds == null || allWorlds.Length == 0) return null;
            int idx = Mathf.Clamp(CurrentWorldIndex - 1, 0, allWorlds.Length - 1);
            return allWorlds[idx];
        }

        public void StartNewRun(int startingWorld = 1, bool isDaily = false, int customSeed = 0)
        {
            CurrentWorldIndex = Mathf.Clamp(startingWorld, 1, 7);
            IsDailyRun = isDaily;
            ActiveSeed = isDaily ? SaveSystem.GetDailySeed() : (customSeed > 0 ? customSeed : UnityEngine.Random.Range(1, 9999999));
            UnityEngine.Random.InitState(ActiveSeed);

            RunDistance = 0f;
            RunScore = 0;
            ScoreMultiplier = 1;
            RunVoidShards = 0;
            RunCodexEssence = 0;
            RunBeastCores = 0;
            RunNearMisses = 0;
            RunBonusRings = 0;
            RunPowersUsed = 0;
            RunBossesEscaped = 0;
            CurrentState = GameState.Running;

            if (SceneManager.GetActiveScene().name != "CoreRun")
            {
                SceneManager.LoadScene("CoreRun");
            }
            OnWorldChanged?.Invoke(GetCurrentWorldData());
        }

        public void UpdateDistance(float dist)
        {
            float delta = Mathf.Max(0f, dist - RunDistance);
            RunDistance = dist;
            if (delta > 0f)
            {
                AddScore(Mathf.RoundToInt(delta * 2.5f));
            }
        }

        public void AddScore(int basePoints)
        {
            RunScore += basePoints * ScoreMultiplier;
            OnScoreChanged?.Invoke(RunScore, ScoreMultiplier);
        }

        public void IncrementMultiplier()
        {
            ScoreMultiplier = Mathf.Min(8, ScoreMultiplier + 1);
            OnScoreChanged?.Invoke(RunScore, ScoreMultiplier);
        }

        public void RecordBonusRing()
        {
            RunBonusRings++;
            IncrementMultiplier();
            AddScore(500);
            AddShard(15);
        }

        public void AddShard(int amount = 1)
        {
            RunVoidShards += amount;
            AddScore(25 * amount);
            OnShardsChanged?.Invoke(RunVoidShards);
        }

        public void AddEssence(int amount = 1) { RunCodexEssence += amount; AddScore(180 * amount); }
        public void AddBeastCore(int amount = 1) { RunBeastCores += amount; AddScore(400 * amount); }
        public void RecordNearMiss() { RunNearMisses++; AddScore(120); }
        public void RecordPowerUsed() { RunPowersUsed++; AddScore(150); }

        public void AdvanceToNextWorld()
        {
            RunBossesEscaped++;
            CurrentWorldIndex = CurrentWorldIndex < 7 ? CurrentWorldIndex + 1 : 1;
            if (CurrentWorldIndex > SaveSystem.Data.highestWorld)
                SaveSystem.Data.highestWorld = CurrentWorldIndex;
            OnWorldChanged?.Invoke(GetCurrentWorldData());
        }

        public void TriggerGameOver()
        {
            if (CurrentState == GameState.GameOver) return;
            CurrentState = GameState.GameOver;

            var d = SaveSystem.Data;
            d.totalRuns++;
            d.voidShards += RunVoidShards;
            d.totalShards += RunVoidShards;
            d.totalNearMisses += RunNearMisses;
            d.totalBonusRings += RunBonusRings;
            d.totalBossesDefeated += RunBossesEscaped;
            d.beastCores += RunBeastCores;
            if (RunDistance > d.bestDistance) d.bestDistance = Mathf.FloorToInt(RunDistance);
            if (RunScore > d.bestScore) d.bestScore = RunScore;
            if (IsDailyRun)
            {
                d.dailySeedPlayed = true;
                d.dailySeedBest = Mathf.Max(d.dailySeedBest, Mathf.FloorToInt(RunDistance));
            }

            EvaluateSkillAchievements(d);

            int totalXP = Mathf.FloorToInt(RunDistance / 10f)
                + Mathf.FloorToInt(RunScore / 250f)
                + Mathf.FloorToInt(RunVoidShards * 0.5f)
                + RunNearMisses * 4
                + RunBonusRings * 12
                + RunBossesEscaped * 55
                + RunCodexEssence * 10;
            SaveSystem.AddCodexXP(totalXP);

            VoidRunServices.Instance?.SubmitScore(d.playerName, Mathf.FloorToInt(RunDistance), CurrentWorldIndex);
            OnRunGameOver?.Invoke();
        }

        private void EvaluateSkillAchievements(VoidRunSaveData d)
        {
            void TryUnlock(string id, bool cond, int bonusVS)
            {
                if (!cond || d.unlockedAchievements.Contains(id)) return;
                d.unlockedAchievements.Add(id);
                d.voidShards += bonusVS;
                OnAchievementUnlocked?.Invoke(id);
            }
            TryUnlock("ach_first_run", d.totalRuns >= 1, 100);
            TryUnlock("ach_100_shards", d.totalShards >= 100, 120);
            TryUnlock("ach_1000_shards", d.totalShards >= 1000, 350);
            TryUnlock("ach_dist_1000", d.bestDistance >= 1000, 150);
            TryUnlock("ach_score_10k", d.bestScore >= 10000, 180);
            TryUnlock("ach_boss_1", d.totalBossesDefeated >= 1, 300);
            TryUnlock("ach_world_3", d.highestWorld >= 3, 400);
            TryUnlock("ach_bonus_ring", d.totalBonusRings >= 1, 180);
        }
    }
}
