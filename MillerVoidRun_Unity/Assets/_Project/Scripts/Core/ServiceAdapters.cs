using System;
using System.Collections.Generic;
using UnityEngine;

namespace VoidRun.Core
{
    public interface IAdService
    {
        void ShowRewarded(string placement, Action onRewarded);
        void ShowInterstitialIfEligible(int totalRuns, bool adsRemoved);
    }

    public interface IIAPService
    {
        void PurchaseProduct(string sku, Action onSuccess);
    }

    public interface ILeaderboardService
    {
        void SubmitScore(string playerName, int distanceMeters, int worldReached);
        List<(string name, int dist, int world)> GetWeeklyTopEntries(string playerName, int playerBest, int playerWorld);
    }

    /// <summary>
    /// Drop-in service facade. Runs cleanly in Offline Mock Mode out-of-the-box.
    /// Define VOIDRUN_ADMOB / VOIDRUN_UNITY_IAP / VOIDRUN_FIREBASE in Scripting Define Symbols
    /// once you paste your AdMob App ID, Google Play Billing SKUs, or google-services.json.
    /// </summary>
    public class VoidRunServices : MonoBehaviour, IAdService, IIAPService, ILeaderboardService
    {
        public static VoidRunServices Instance { get; private set; }

        [Header("Live SDK Keys (Leave blank for Offline Sandbox Mode)")]
        public string adMobAndroidAppId = "";
        public string rewardedAdUnitId = "ca-app-pub-3940256099942544/5224354917";
        public string interstitialAdUnitId = "ca-app-pub-3940256099942544/1033173712";
        public string firebaseProjectId = "";

        private void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        public void ShowRewarded(string placement, Action onRewarded)
        {
            Debug.Log($"[VoidRunServices] Rewarded Ad ({placement}) — Offline Mock Granted.");
            onRewarded?.Invoke();
        }

        public void ShowInterstitialIfEligible(int totalRuns, bool adsRemoved)
        {
            // GDD Q.1: Zero interstitials in first 3 runs, max every 3rd run thereafter
            if (adsRemoved || totalRuns <= 3 || totalRuns % 3 != 0) return;
            Debug.Log("[VoidRunServices] Interstitial Ad slot triggered (Offline Mock).");
        }

        public void PurchaseProduct(string sku, Action onSuccess)
        {
            Debug.Log($"[VoidRunServices] IAP Sandbox Purchase Approved: {sku}");
            onSuccess?.Invoke();
        }

        public void SubmitScore(string playerName, int distanceMeters, int worldReached)
        {
            Debug.Log($"[VoidRunServices] Leaderboard submit: {playerName} -> {distanceMeters}m (W{worldReached})");
        }

        public List<(string name, int dist, int world)> GetWeeklyTopEntries(string playerName, int playerBest, int playerWorld)
        {
            var list = new List<(string, int, int)>
            {
                ("VoidKing_ZA", 11420, 7),
                ("ElytraPhantom", 9850, 6),
                ("CodexMaster99", 8340, 6),
                ("CrimsonHunter", 6720, 5),
                ("LeoMimic", 5190, 4),
                ("ArchiveRunner", 3840, 3),
                ($"{playerName} (You)", playerBest, playerWorld)
            };
            list.Sort((a, b) => b.Item2.CompareTo(a.Item2));
            return list;
        }
    }
}
