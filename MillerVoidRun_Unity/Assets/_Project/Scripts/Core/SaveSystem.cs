using System;
using System.IO;
using UnityEngine;

namespace VoidRun.Core
{
    public static class SaveSystem
    {
        private static string SavePath => Path.Combine(Application.persistentDataPath, "miller_void_run_save.json");
        public static VoidRunSaveData Data { get; private set; }

        public static void Load()
        {
            if (File.Exists(SavePath))
            {
                try
                {
                    string json = File.ReadAllText(SavePath);
                    Data = JsonUtility.FromJson<VoidRunSaveData>(json) ?? new VoidRunSaveData();
                }
                catch (Exception e)
                {
                    Debug.LogWarning($"[VoidRun] Failed to load save, creating fresh profile: {e.Message}");
                    Data = new VoidRunSaveData();
                }
            }
            else
            {
                Data = new VoidRunSaveData();
            }

            CheckDailyReset();
        }

        public static void Save()
        {
            if (Data == null) Data = new VoidRunSaveData();
            try
            {
                string json = JsonUtility.ToJson(Data, true);
                File.WriteAllText(SavePath, json);
            }
            catch (Exception e)
            {
                Debug.LogError($"[VoidRun] Save failed: {e.Message}");
            }
        }

        public static void CheckDailyReset()
        {
            string today = DateTime.UtcNow.ToString("yyyy-MM-dd");
            if (Data.lastDailyUtc != today)
            {
                Data.lastDailyUtc = today;
                Data.dailySeedPlayed = false;
                Data.dailySeedBest = 0;
                Data.dailyChestClaimed = false;
                Save();
            }
        }

        public static int GetDailySeed()
        {
            string today = DateTime.UtcNow.ToString("yyyy-MM-dd");
            unchecked
            {
                int hash = 23;
                foreach (char c in today) hash = hash * 31 + c;
                return Mathf.Abs(hash) % 999999 + 1;
            }
        }

        public static int GetXPForNextLevel(int level)
        {
            if (level <= 10) return 100 + level * 20;
            if (level <= 25) return 300 + level * 25;
            if (level <= 40) return 500 + level * 35;
            if (level <= 70) return 700 + level * 50;
            return 1000 + level * 80;
        }

        public static int GetHeroXpForNextLevel(int level) => 80 + (level - 1) * 45 + (level - 1) * (level - 1) * 3;

        public static int GetHeroLevel(RunnerId runner)
        {
            if (Data == null) return 1;
            var entry = Data.heroProgress.Find(h => h.runnerId == runner);
            return entry != null ? entry.level : 1;
        }

        public static void AddHeroXP(RunnerId runner, int amount)
        {
            if (Data == null) return;
            var entry = Data.heroProgress.Find(h => h.runnerId == runner);
            if (entry == null)
            {
                entry = new HeroProgressEntry { runnerId = runner, level = 1, xp = 0 };
                Data.heroProgress.Add(entry);
            }
            entry.xp += Mathf.Max(10, amount);
            while (entry.level < 50)
            {
                int req = GetHeroXpForNextLevel(entry.level);
                if (entry.xp >= req)
                {
                    entry.xp -= req;
                    entry.level++;
                    Data.voidShards += 45 + entry.level * 10;
                }
                else break;
            }
            Save();
        }

        public static float GetMaxVoidEnergy() => 100f + (Data.codexLevel - 1) * 5f + (GetHeroLevel(Data.selectedRunner) - 1) * 3f;

        public static bool HasSkillNode(string nodeId) => Data.unlockedSPNodes.Contains(nodeId);

        public static int AddCodexXP(int rawXp)
        {
            float mult = Data.selectedRunner == RunnerId.Miller ? 1.1f : 1.0f;
            int gain = Mathf.RoundToInt(rawXp * mult);
            Data.codexXP += gain;
            while (Data.codexLevel < 100)
            {
                int req = GetXPForNextLevel(Data.codexLevel);
                if (Data.codexXP >= req)
                {
                    Data.codexXP -= req;
                    Data.codexLevel++;
                    if (Data.codexLevel % 3 == 0) Data.skillPoints++;
                    if (Data.codexLevel == 5) Data.voidShards += 500;
                }
                else break;
            }
            Save();
            return gain;
        }
    }
}
