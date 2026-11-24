#if UNITY_EDITOR
using System.IO;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using VoidRun.Core;
using VoidRun.Gameplay;
using VoidRun.Chaser;
using VoidRun.Track;
using VoidRun.Abilities;
using VoidRun.CameraSystem;
using VoidRun.Audio;
using VoidRun.Virality;

namespace VoidRun.EditorTools
{
    /// <summary>
    /// One-click Unity 2022.3 LTS Project Generator & Android APK Builder for MILLER: VOID RUN.
    /// Open this project in Unity, click:
    ///   Void Run > 1. Generate All Data Assets & Scenes
    ///   Void Run > 2. Build Android APK
    /// </summary>
    public static class VoidRunProjectBuilder
    {
        private const string SoRoot = "Assets/_Project/ScriptableObjects";

        [MenuItem("Void Run/1. Generate All Data Assets & Scenes")]
        public static void GenerateEntireProject()
        {
            EnsureDirs();
            ConfigureAndroidPlayerSettings();
            var worlds = CreateAll7Worlds();
            var chars = CreateAll7Characters();
            var abilities = CreateAll15Abilities();
            BuildCoreRunScene(worlds, chars, abilities);
            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
            Debug.Log("[MILLER: VOID RUN] Generated all 7 Worlds, 7 Characters, 15 Void Powers, Prefabs & CoreRun.unity!");
        }

        [MenuItem("Void Run/2. Build Android APK")]
        public static void BuildAndroidApk()
        {
            ConfigureAndroidPlayerSettings();
            string outPath = "Builds/MillerVoidRun_Unity.apk";
            Directory.CreateDirectory("Builds");
            var opts = new BuildPlayerOptions
            {
                scenes = new[] { "Assets/_Project/Scenes/CoreRun.unity" },
                locationPathName = outPath,
                target = BuildTarget.Android,
                options = BuildOptions.None
            };
            var report = BuildPipeline.BuildPlayer(opts);
            Debug.Log($"[MILLER: VOID RUN] Android Build Result: {report.summary.result} -> {outPath}");
        }

        private static void EnsureDirs()
        {
            string[] dirs =
            {
                "Assets/_Project/Scenes",
                "Assets/_Project/Prefabs/Chunks",
                "Assets/_Project/Materials/Environment",
                $"{SoRoot}/Worlds",
                $"{SoRoot}/Characters",
                $"{SoRoot}/Abilities"
            };
            foreach (var d in dirs) Directory.CreateDirectory(d);
        }

        private static void ConfigureAndroidPlayerSettings()
        {
            PlayerSettings.companyName = "VoidRunStudios";
            PlayerSettings.productName = "MILLER: VOID RUN";
            PlayerSettings.SetApplicationIdentifier(BuildTargetGroup.Android, "com.voidrun.miller");
            PlayerSettings.defaultInterfaceOrientation = UIOrientation.Portrait;
            PlayerSettings.colorSpace = ColorSpace.Linear;
            PlayerSettings.Android.minSdkVersion = AndroidSdkVersions.AndroidApiLevel24;
            PlayerSettings.Android.targetSdkVersion = (AndroidSdkVersions)34;
            PlayerSettings.SetScriptingBackend(BuildTargetGroup.Android, ScriptingImplementation.IL2CPP);
            PlayerSettings.Android.targetArchitectures = AndroidArchitecture.ARM64 | AndroidArchitecture.ARMv7;
        }

        private static WorldData[] CreateAll7Worlds()
        {
            var specs = new (int idx, string name, string portal, string chaser, BeastTier tier, string boss, string faction, WorldMechanicType mech, Color accent, int lv)[]
            {
                (1, "Verdant Breach", "Green", "Thornmaw", BeastTier.Advanced, "Alton Dam", "Obscura Guild", WorldMechanicType.None, new Color(0.24f, 0.73f, 0.31f), 1),
                (2, "Ember Corridor", "Green/Orange", "Skeld", BeastTier.King, "James Stole", "Obscura Tracker", WorldMechanicType.LavaLanes, new Color(1f, 0.42f, 0.16f), 5),
                (3, "Obsidian Rift", "Orange", "Dreadwhisper", BeastTier.Emperor, "Felix Torrot", "Obscura Guild", WorldMechanicType.IllusionObstacles, new Color(0.18f, 0.36f, 1f), 12),
                (4, "Crimson Depths", "Orange/Red", "Pyreclad", BeastTier.Legendary, "Shawn Tami", "Crimson Hand", WorldMechanicType.FireTrail, new Color(0.8f, 0.12f, 0.18f), 20),
                (5, "Frozen Archive", "Red", "Chronal Wyrm", BeastTier.Demigod, "Sil Talen", "Veridian Accord", WorldMechanicType.IcePhysics, new Color(0.36f, 0.91f, 0.89f), 30),
                (6, "Abyssal Maw", "Red/White", "Voidstalker", BeastTier.Demon, "Ashley Moses", "Crimson Hand", WorldMechanicType.VoidInfestation, new Color(1f, 0.22f, 0.66f), 45),
                (7, "The Terminus", "White", "Null Sovereign", BeastTier.Yigyang, "Tay Sonder", "Dominion Authority", WorldMechanicType.RealityShift, new Color(1f, 0.83f, 0.28f), 65)
            };

            var list = new WorldData[specs.Length];
            for (int i = 0; i < specs.Length; i++)
            {
                var s = specs[i];
                var asset = ScriptableObject.CreateInstance<WorldData>();
                asset.worldIndex = s.idx;
                asset.worldName = s.name;
                asset.portalType = s.portal;
                asset.chaserName = s.chaser;
                asset.chaserTier = s.tier;
                asset.chaserBaseClosingRate = 0.28f + i * 0.03f;
                asset.bossName = s.boss;
                asset.bossFaction = s.faction;
                asset.uniqueMechanic = s.mech;
                asset.accentColor = s.accent;
                asset.unlockCodexLevel = s.lv;
                AssetDatabase.CreateAsset(asset, $"{SoRoot}/Worlds/W{s.idx}_{s.name.Replace(" ", "")}.asset");
                list[i] = asset;
            }
            return list;
        }

        private static CharacterData[] CreateAll7Characters()
        {
            var specs = new (RunnerId id, string name, string title, string passive, VoidPowerType sig, int vs, int bc, int lv)[]
            {
                (RunnerId.Miller, "Miller Redwolf", "Codex Bearer", "+10% Codex XP", VoidPowerType.Flicker, 0, 0, 1),
                (RunnerId.Brann, "Brann Kest", "Iron Vanguard", "+1 Free Starting Shield Charge", VoidPowerType.HammerShockwave, 350, 0, 1),
                (RunnerId.Elara, "Elara Vey", "Arcane Runeweaver", "+30% VE Regen & +40% Ring Score", VoidPowerType.RunicWardCircle, 500, 0, 2),
                (RunnerId.Nyx, "Nyx Aderyn", "Shadow Rogue", "+35% Lane Speed & Auto-Phase 1st Hit", VoidPowerType.TwinFangBlitz, 650, 0, 3),
                (RunnerId.Leonard, "Leonard Meleak", "C-Rank Mimic", "50% First CD Echo", VoidPowerType.MimicrySurge, 1500, 3, 10),
                (RunnerId.Precious, "Precious Trisky", "Clinic Healer", "30% Faster Recovery + 25% VE", VoidPowerType.ThreadMend, 2500, 4, 15),
                (RunnerId.Rumbidzai, "Rumbidzai Mash", "The Phantom Blade", "30% Faster Lanes + First Phase", VoidPowerType.BladePhase, 3000, 5, 20),
                (RunnerId.Harry, "Harry Koera", "Military Detective", "+25% Rare Drops + Path Reveal", VoidPowerType.RitualWard, 4000, 7, 30),
                (RunnerId.Garfield, "Garfield Thorn", "Young Sentinel", "Destroyed Obstacles -> +3 VS", VoidPowerType.DuplicateBurst, 6000, 10, 45),
                (RunnerId.Ruth, "Ruth Swait", "Guild Architect", "Auto-Shatter Overheads", VoidPowerType.CryoPath, 8000, 15, 60)
            };

            var list = new CharacterData[specs.Length];
            for (int i = 0; i < specs.Length; i++)
            {
                var s = specs[i];
                var asset = ScriptableObject.CreateInstance<CharacterData>();
                asset.runnerId = s.id;
                asset.displayName = s.name;
                asset.title = s.title;
                asset.passiveName = s.passive;
                asset.signaturePower = s.sig;
                asset.unlockVS = s.vs;
                asset.unlockBeastCores = s.bc;
                asset.requiredCodexLevel = s.lv;
                AssetDatabase.CreateAsset(asset, $"{SoRoot}/Characters/{s.id}.asset");
                list[i] = asset;
            }
            return list;
        }

        private static AbilityData[] CreateAll15Abilities()
        {
            var specs = new (VoidPowerType type, string name, int stage, int lv, float ve, float cd, float dur, float mag)[]
            {
                (VoidPowerType.Flicker, "Flicker", 1, 1, 25, 8, 0.35f, 15),
                (VoidPowerType.VoidSense, "Void Sense", 1, 1, 15, 12, 3f, 0),
                (VoidPowerType.Stillstep, "Stillstep", 1, 2, 20, 10, 2f, 0.6f),
                (VoidPowerType.ShadowShield, "Shadow Shield", 2, 10, 30, 15, 5f, 1),
                (VoidPowerType.Voidwalk, "Voidwalk", 2, 12, 40, 18, 2f, 1.2f),
                (VoidPowerType.GraspingDark, "Grasping Dark", 2, 15, 20, 10, 4f, 3.6f),
                (VoidPowerType.TimeBleed, "Time Bleed", 3, 25, 45, 20, 3f, 0.4f),
                (VoidPowerType.EclipseVeil, "Eclipse Veil", 3, 27, 35, 22, 4f, 0.5f),
                (VoidPowerType.ChronalHaven, "Chronal Haven", 3, 30, 50, 25, 2f, 10),
                (VoidPowerType.VoidDomain, "Void Domain", 4, 45, 70, 30, 4f, 1.3f),
                (VoidPowerType.ErasureWave, "Erasure Wave", 4, 50, 55, 25, 0.6f, 30),
                (VoidPowerType.VoidResonance, "Void Resonance", 4, 55, 5, 5, 10f, 1),
                (VoidPowerType.VoidlightSynthesis, "Voidlight Synthesis", 5, 75, 80, 35, 4f, 2.0f),
                (VoidPowerType.SingularitySoul, "Singularity Soul", 5, 85, 100, 60, 3f, 200),
                (VoidPowerType.ConceptReversal, "Concept Reversal", 5, 90, 85, 40, 3f, 5)
            };

            var list = new AbilityData[specs.Length];
            for (int i = 0; i < specs.Length; i++)
            {
                var s = specs[i];
                var asset = ScriptableObject.CreateInstance<AbilityData>();
                asset.powerType = s.type;
                asset.abilityName = s.name;
                asset.codexStage = s.stage;
                asset.unlockLevel = s.lv;
                asset.tiers = new[]
                {
                    new AbilityTierSpec { voidEnergyCost = s.ve, cooldown = s.cd, duration = s.dur, magnitude = s.mag, pushbackMeters = 15f },
                    new AbilityTierSpec { voidEnergyCost = s.ve * 0.9f, cooldown = s.cd * 0.9f, duration = s.dur * 1.2f, magnitude = s.mag * 1.2f, pushbackMeters = 18f },
                    new AbilityTierSpec { voidEnergyCost = s.ve * 0.8f, cooldown = s.cd * 0.8f, duration = s.dur * 1.4f, magnitude = s.mag * 1.4f, pushbackMeters = 20f },
                    new AbilityTierSpec { voidEnergyCost = s.ve * 0.72f, cooldown = s.cd * 0.7f, duration = s.dur * 1.6f, magnitude = s.mag * 1.6f, pushbackMeters = 25f }
                };
                AssetDatabase.CreateAsset(asset, $"{SoRoot}/Abilities/{s.type}.asset");
                list[i] = asset;
            }
            return list;
        }

        private static void BuildCoreRunScene(WorldData[] worlds, CharacterData[] chars, AbilityData[] abilities)
        {
            var scene = EditorSceneManager.NewScene(NewSceneSetup.DefaultGameObjects, NewSceneMode.Single);

            // Core Managers
            var gmObj = new GameObject("GameManager");
            var gm = gmObj.AddComponent<GameManager>();
            gm.allWorlds = worlds;
            gm.allCharacters = chars;
            gm.allAbilities = abilities;
            gmObj.AddComponent<VoidRunServices>();
            gmObj.AddComponent<AdaptiveAudioManager>();

            // Player (Miller)
            var playerObj = GameObject.CreatePrimitive(PrimitiveType.Capsule);
            playerObj.name = "MillerPlayer";
            playerObj.transform.position = new Vector3(0f, 1f, 0f);
            Object.DestroyImmediate(playerObj.GetComponent<Collider>());
            playerObj.AddComponent<CharacterController>();
            playerObj.AddComponent<PlayerController>();
            playerObj.AddComponent<AbilitySystem>();
            playerObj.AddComponent<GhostAndClipRecorder>();

            // Chaser (Thornmaw)
            var chaserObj = GameObject.CreatePrimitive(PrimitiveType.Cube);
            chaserObj.name = "BeastChaser";
            chaserObj.transform.localScale = new Vector3(2f, 1.6f, 2.4f);
            chaserObj.transform.position = new Vector3(0f, 0.8f, -15f);
            chaserObj.AddComponent<ChaserController>();

            // Track Spawner & Boss Controller
            var trackObj = new GameObject("TrackSpawner");
            trackObj.AddComponent<TrackSpawner>();
            trackObj.AddComponent<BossEncounterController>();

            // Camera Follow
            var cam = Camera.main;
            if (cam != null) cam.gameObject.AddComponent<CameraFollow>();

            EditorSceneManager.SaveScene(scene, "Assets/_Project/Scenes/CoreRun.unity");
        }
    }
}
#endif
