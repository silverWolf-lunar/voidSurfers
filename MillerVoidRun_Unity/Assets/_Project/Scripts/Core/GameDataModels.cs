using System;
using System.Collections.Generic;
using UnityEngine;

namespace VoidRun.Core
{
    public enum VoidPowerType
    {
        Flicker, VoidSense, Stillstep,
        ShadowShield, Voidwalk, GraspingDark,
        TimeBleed, EclipseVeil, ChronalHaven,
        VoidDomain, ErasureWave, VoidResonance,
        VoidlightSynthesis, SingularitySoul, ConceptReversal,
        // Featured Custom Heroes & Ally Signatures
        HammerShockwave, RunicWardCircle, TwinFangBlitz,
        MimicrySurge, ThreadMend, BladePhase, RitualWard, DuplicateBurst, CryoPath
    }

    public enum AbilitySlotCategory { Active, Passive, Ultimate }

    public enum WorldMechanicType
    {
        None, LavaLanes, IllusionObstacles, FireTrail, IcePhysics, VoidInfestation, RealityShift
    }

    public enum BeastTier { Advanced, King, Emperor, Legendary, Demigod, Demon, Yigyang }

    public enum RunnerId { Miller, Brann, Elara, Nyx, Leonard, Precious, Rumbidzai, Harry, Garfield, Ruth }

    [Serializable]
    public struct AbilityTierSpec
    {
        public float voidEnergyCost;
        public float cooldown;
        public float duration;
        public float magnitude;
        public float pushbackMeters;
    }

    [CreateAssetMenu(fileName = "NewAbilityData", menuName = "VoidRun/Ability Data")]
    public class AbilityData : ScriptableObject
    {
        public VoidPowerType powerType;
        public string abilityName;
        [Range(1, 5)] public int codexStage = 1;
        public int unlockLevel = 1;
        public AbilitySlotCategory slotCategory = AbilitySlotCategory.Active;
        [TextArea] public string description;
        public Color accentColor = new Color(0.71f, 0.31f, 1f);
        public AbilityTierSpec[] tiers = new AbilityTierSpec[4];
        public Sprite icon;
        public GameObject vfxPrefab;
        public AudioClip activationSfx;
    }

    [CreateAssetMenu(fileName = "NewCharacterData", menuName = "VoidRun/Character Data")]
    public class CharacterData : ScriptableObject
    {
        public RunnerId runnerId;
        public string displayName;
        public string title;
        public string passiveName;
        [TextArea] public string passiveDescription;
        public VoidPowerType signaturePower;
        public string signatureName;
        public int unlockVS;
        public int unlockBeastCores;
        public int requiredCodexLevel = 1;
        public Color primaryColor = new Color(0.11f, 0.09f, 0.18f);
        public Color accentColor = new Color(0.71f, 0.31f, 1f);
        public GameObject customModelPrefab; // Drop-in override
    }

    [CreateAssetMenu(fileName = "NewWorldData", menuName = "VoidRun/World Data")]
    public class WorldData : ScriptableObject
    {
        public int worldIndex = 1;
        public string worldName;
        public string portalType;
        public Color groundColor = new Color(0.11f, 0.17f, 0.13f);
        public Color accentColor = new Color(0.24f, 0.73f, 0.31f);
        public Color fogColor = new Color(0.07f, 0.13f, 0.12f);
        public WorldMechanicType uniqueMechanic = WorldMechanicType.None;
        public string chaserName;
        public BeastTier chaserTier;
        public float chaserBaseClosingRate = 0.3f;
        public string bossName;
        public string bossFaction;
        public float bossQteWindow = 1.5f;
        public float baseBpm = 120f;
        public int unlockCodexLevel = 1;
        public AudioClip[] musicStems; // 0: Base, 1: Tension, 2: Power, 3: Boss
    }

    [Serializable]
    public class MissionProgress
    {
        public string id;
        public string title;
        public int target;
        public int current;
        public int rewardVS;
        public int rewardCE;
        public int rewardBC;
        public bool claimed;
    }

    [Serializable]
    public class GhostSample
    {
        public int distance;
        public int lane;
        public int state; // 0=run, 1=jump, 2=slide
    }

    [Serializable]
    public class HeroProgressEntry
    {
        public RunnerId runnerId;
        public int level = 1;
        public int xp = 0;
    }

    [Serializable]
    public class VoidRunSaveData
    {
        public string playerName = "MillerRunner";
        public int codexLevel = 1;
        public int codexXP = 0;
        public int skillPoints = 0;
        public List<string> unlockedSPNodes = new List<string>();
        public int voidShards = 350;
        public int beastCores = 0;
        public int voidCrystals = 0;
        public int bestDistance = 0;
        public int bestScore = 0;
        public int bestCombo = 0;
        public int highestWorld = 1;
        public int totalRuns = 0;
        public int totalShards = 0;
        public int totalNearMisses = 0;
        public int totalBonusRings = 0;
        public int totalEnemiesDefeated = 0;
        public int totalBossesDefeated = 0;
        public RunnerId selectedRunner = RunnerId.Miller;
        public List<RunnerId> unlockedRunners = new List<RunnerId> { RunnerId.Miller };
        public List<HeroProgressEntry> heroProgress = new List<HeroProgressEntry>();
        public string equippedWeapon = "steel_blade";
        public string equippedArmor = "hunter_coat";
        public string equippedRelic = "guild_tag";
        public List<string> unlockedWeapons = new List<string> { "steel_blade" };
        public List<string> unlockedArmors = new List<string> { "hunter_coat" };
        public List<string> unlockedRelics = new List<string> { "guild_tag" };
        public string selectedSkin = "default";
        public string selectedTrail = "violet_spark";
        public string selectedAura = "standard";
        public List<string> unlockedSkins = new List<string> { "default" };
        public List<string> unlockedTrails = new List<string> { "violet_spark" };
        public List<string> unlockedAuras = new List<string> { "standard" };
        public List<string> unlockedAchievements = new List<string>();
        public VoidPowerType equippedSlot1 = VoidPowerType.Flicker;
        public VoidPowerType equippedSlot2 = VoidPowerType.VoidSense;
        public List<string> unlockedAbilityTiers = new List<string>(); // "Flicker:0"
        public List<string> collectedFragments = new List<string>();
        public string lastDailyUtc = "";
        public bool dailySeedPlayed = false;
        public int dailySeedBest = 0;
        public bool dailyChestClaimed = false;
        public bool removeAds = false;
        public bool audioMuted = false;
        public bool highGraphics60Fps = true;
        public bool reducedMotion = false;
        public bool colorblindMode = false;
        public bool onScreenControls = false;
        public float musicVolume = 0.65f;
        public float sfxVolume = 0.85f;
        public List<GhostSample> bestGhost = new List<GhostSample>();
    }
}
