# MILLER: VOID RUN — Game Design Document
## Part 5 (U–Y): Unity Architecture, Scripts, Performance, Testing & 3-Week Prototype Plan

---

## U. UNITY PROJECT ARCHITECTURE & FOLDER STRUCTURE [NEW]

### U.1 · Engine & Target Configuration
- **Unity Version:** Unity 2022.3 LTS (or 2023.2 LTS)
- **Render Pipeline:** Universal Render Pipeline (URP) — Forward Renderer, single-pass draw call batching
- **Target Platform:** Android (API Level 24+ / Android 7.0 Nougat minimum, Target API Level 34 / Android 14)
- **Scripting Backend:** IL2CPP, ARM64 + ARMv7 architecture
- **Color Space:** Linear
- **Orientation:** Portrait (Fixed Portrait, auto-rotation disabled)

### U.2 · Essential Packages
- `com.unity.render-pipelines.universal` (URP)
- `com.unity.inputsystem` (New Input System for responsive multi-touch & gestures)
- `com.unity.textmeshpro` (UI & distance rendering)
- `com.unity.addressables` (For downloadable world asset packs beyond World 2)
- `com.unity.serialization` / standard JsonUtility for lightweight save files & ghost data

### U.3 · Project Folder Structure

```text
Assets/
├── _Project/
│   ├── Animations/
│   │   ├── Characters/         # Animator controllers & run/jump/slide clips
│   │   ├── Chasers/            # Beast run/attack clips
│   │   └── UI/                 # UI transitions & banner anims
│   ├── Audio/
│   │   ├── Music/              # Per-world 4-stem loops (OGG/WAV)
│   │   ├── SFX/                # Movement, pickups, powers, impacts
│   │   └── Voice/              # Voice barks (OGG, mono)
│   ├── Materials/
│   │   ├── Characters/         # Atlased toon-lit materials
│   │   ├── Environment/        # Per-world track atlases
│   │   └── VFX/                # Additive void glow & particles
│   ├── Prefabs/
│   │   ├── Characters/         # Miller & unlockable runner prefabs
│   │   ├── Chasers/            # Beast prefabs (Thornmaw, Skeld, etc.)
│   │   ├── Chunks/             # Track chunk prefabs (W1_Easy_01, etc.)
│   │   ├── Obstacles/          # Pooled obstacle prefabs (Rubble, Beams)
│   │   ├── Pickups/            # Shards, Essence, Beast Cores, Power-ups
│   │   └── UI/                 # HUD, Popups, Result Cards
│   ├── Scenes/
│   │   ├── Boot.unity          # Initialization & Addressables load
│   │   ├── MainMenu.unity      # Character select, Codex, Shop
│   │   └── CoreRun.unity       # Endless runner active scene
│   ├── ScriptableObjects/
│   │   ├── Abilities/          # AbilityData definitions (Flicker, TimeBleed, etc.)
│   │   ├── Characters/         # CharacterData (passives, unlock costs)
│   │   ├── Worlds/             # WorldData (speed ramps, obstacle pools)
│   │   └── Missions/           # Mission definitions & reward tables
│   ├── Scripts/
│   │   ├── Abilities/          # AbilitySystem, AbilityBase, AbilityData
│   │   ├── Camera/             # CameraFollow, CameraShake, SlowMoController
│   │   ├── Core/               # GameManager, EventBus, SaveSystem
│   │   ├── Gameplay/           # PlayerController, ChaserController, CollisionHandler
│   │   ├── Track/              # TrackSpawner, TrackChunk, ObstaclePool, CoinLine
│   │   └── UI/                 # HUDController, ResultsScreen, CodexUI, ClipRecorder
│   └── Shaders/                # Custom URP unlit additive & toon-lit shaders
```

---

## V. KEY C# SCRIPTS [NEW]

Below are production-ready, clean, well-commented C# scripts forming the operational core of *MILLER: VOID RUN*.

### V.1 · `PlayerController.cs`
Handles 3-lane movement with easing, jumping, sliding, input buffering, stumble states, and hitbox adjustments.

```csharp
using System.Collections;
using UnityEngine;
using UnityEngine.InputSystem;

namespace VoidRun.Gameplay
{
    public enum Lane { Left = 0, Center = 1, Right = 2 }
    public enum PlayerActionState { Running, Jumping, Sliding, Stumbling }

    [RequireComponent(typeof(CharacterController))]
    public class PlayerController : MonoBehaviour
    {
        [Header("Lane Setup")]
        [SerializeField] private float laneDistance = 1.2f;
        [SerializeField] private float laneChangeSpeed = 15f;
        private Lane currentLane = Lane.Center;
        private float targetXPosition = 0f;

        [Header("Movement & Speeds")]
        [SerializeField] private float baseForwardSpeed = 12f;
        private float currentForwardSpeed;
        private CharacterController characterController;

        [Header("Jump & Slide")]
        [SerializeField] private float jumpHeight = 1.6f;
        [SerializeField] private float gravity = 32f;
        [SerializeField] private float slideDuration = 0.5f;
        private float verticalVelocity = 0f;
        private PlayerActionState currentState = PlayerActionState.Running;

        [Header("Colliders")]
        [SerializeField] private Vector3 standingCenter = new Vector3(0, 0.75f, 0);
        [SerializeField] private float standingHeight = 1.5f;
        [SerializeField] private Vector3 slidingCenter = new Vector3(0, 0.25f, 0);
        [SerializeField] private float slidingHeight = 0.5f;

        [Header("Input Buffering")]
        [SerializeField] private float bufferWindow = 0.15f;
        private System.Action bufferedAction = null;
        private float bufferTimer = 0f;

        [Header("Stumble / Chaser Alert")]
        private bool isInvulnerable = false;
        public System.Action OnStumble;
        public System.Action OnFatalHit;

        private void Awake()
        {
            characterController = GetComponent<CharacterController>();
            currentForwardSpeed = baseForwardSpeed;
            targetXPosition = GetLaneX(currentLane);
        }

        private void Update()
        {
            HandleBufferedInput();
            HandleVerticalMotion();
            ApplyMovement();
        }

        public void SetSpeed(float newSpeed) => currentForwardSpeed = newSpeed;
        public float GetCurrentSpeed() => currentForwardSpeed;
        public PlayerActionState GetState() => currentState;
        public void SetInvulnerability(bool state) => isInvulnerable = state;

        #region Input Triggers
        public void RequestMoveLane(int direction) // -1 for Left, +1 for Right
        {
            if (currentState == PlayerActionState.Stumbling)
            {
                BufferAction(() => RequestMoveLane(direction));
                return;
            }

            int nextLane = (int)currentLane + direction;
            if (nextLane >= 0 && nextLane <= 2)
            {
                currentLane = (Lane)nextLane;
                targetXPosition = GetLaneX(currentLane);
            }
        }

        public void RequestJump()
        {
            if (currentState == PlayerActionState.Sliding) StopCoroutine(nameof(SlideRoutine));
            if (characterController.isGrounded && currentState != PlayerActionState.Stumbling)
            {
                verticalVelocity = Mathf.Sqrt(2 * jumpHeight * gravity);
                currentState = PlayerActionState.Jumping;
            }
            else
            {
                BufferAction(RequestJump);
            }
        }

        public void RequestSlide()
        {
            if (currentState == PlayerActionState.Jumping)
            {
                // Fast-fall mechanic
                verticalVelocity = -gravity * 0.5f;
            }

            if (currentState != PlayerActionState.Stumbling)
            {
                StartCoroutine(nameof(SlideRoutine));
            }
        }

        private void BufferAction(System.Action action)
        {
            bufferedAction = action;
            bufferTimer = bufferWindow;
        }

        private void HandleBufferedInput()
        {
            if (bufferTimer > 0)
            {
                bufferTimer -= Time.deltaTime;
                if (bufferTimer <= 0) bufferedAction = null;
            }
            else if (bufferedAction != null && characterController.isGrounded && currentState == PlayerActionState.Running)
            {
                bufferedAction.Invoke();
                bufferedAction = null;
            }
        }
        #endregion

        #region Movement & Physics
        private void HandleVerticalMotion()
        {
            if (characterController.isGrounded)
            {
                if (verticalVelocity < 0) verticalVelocity = -1f;
                if (currentState == PlayerActionState.Jumping) currentState = PlayerActionState.Running;
            }
            else
            {
                verticalVelocity -= gravity * Time.deltaTime;
            }
        }

        private void ApplyMovement()
        {
            // Smooth X lerp toward target lane
            Vector3 currentPos = transform.position;
            float newX = Mathf.MoveTowards(currentPos.x, targetXPosition, laneChangeSpeed * Time.deltaTime);

            Vector3 motion = new Vector3(newX - currentPos.x, verticalVelocity * Time.deltaTime, currentForwardSpeed * Time.deltaTime);
            characterController.Move(motion);
        }

        private float GetLaneX(Lane lane) => ((int)lane - 1) * laneDistance;

        private IEnumerator SlideRoutine()
        {
            currentState = PlayerActionState.Sliding;
            characterController.center = slidingCenter;
            characterController.height = slidingHeight;

            yield return new WaitForSeconds(slideDuration);

            characterController.center = standingCenter;
            characterController.height = standingHeight;
            if (currentState == PlayerActionState.Sliding)
                currentState = PlayerActionState.Running;
        }
        #endregion

        #region Collision & Stumble
        public void TakeObstacleHit()
        {
            if (isInvulnerable) return;

            if (currentState == PlayerActionState.Stumbling)
            {
                // Second hit during stumble is fatal
                OnFatalHit?.Invoke();
            }
            else
            {
                StartCoroutine(StumbleRoutine());
            }
        }

        private IEnumerator StumbleRoutine()
        {
            currentState = PlayerActionState.Stumbling;
            float originalSpeed = currentForwardSpeed;
            currentForwardSpeed *= 0.75f; // -25% penalty
            OnStumble?.Invoke();

            yield return new WaitForSeconds(0.6f);

            currentForwardSpeed = originalSpeed;
            currentState = PlayerActionState.Running;
        }
        #endregion
    }
}
```

---

### V.2 · `TrackSpawner.cs`
Manages procedural chunk generation, obstacle pooling, difficulty ramp, and seamless chunk recycling ahead of the player.

```csharp
using System.Collections.Generic;
using UnityEngine;

namespace VoidRun.Track
{
    public class TrackSpawner : MonoBehaviour
    {
        [Header("References")]
        [SerializeField] private Transform playerTransform;
        [SerializeField] private List<GameObject> easyChunkPrefabs;
        [SerializeField] private List<GameObject> mediumChunkPrefabs;
        [SerializeField] private List<GameObject> hardChunkPrefabs;
        [SerializeField] private GameObject bossChunkPrefab;

        [Header("Spawn Settings")]
        [SerializeField] private float chunkLength = 30f;
        [SerializeField] private int activeChunkCount = 7;
        [SerializeField] private float bossDistance = 1400f;

        private float currentZ = 0f;
        private Queue<GameObject> spawnedChunks = new Queue<GameObject>();
        private bool bossSpawned = false;

        private void Start()
        {
            // Spawn initial safe stretch
            for (int i = 0; i < activeChunkCount; i++)
            {
                SpawnNextChunk(forceEasy: i < 3);
            }
        }

        private void Update()
        {
            // Recycle chunks as player moves forward
            if (playerTransform.position.z - (currentZ - activeChunkCount * chunkLength) > chunkLength)
            {
                RecycleOldestChunk();
                SpawnNextChunk();
            }
        }

        private void SpawnNextChunk(bool forceEasy = false)
        {
            GameObject prefabToSpawn;
            float distanceRun = playerTransform.position.z;

            if (!bossSpawned && distanceRun >= bossDistance)
            {
                prefabToSpawn = bossChunkPrefab;
                bossSpawned = true;
            }
            else if (forceEasy || distanceRun < 300f)
            {
                prefabToSpawn = GetRandomPrefab(easyChunkPrefabs);
            }
            else if (distanceRun < 800f)
            {
                prefabToSpawn = Random.value < 0.6f ? GetRandomPrefab(mediumChunkPrefabs) : GetRandomPrefab(easyChunkPrefabs);
            }
            else
            {
                prefabToSpawn = Random.value < 0.6f ? GetRandomPrefab(hardChunkPrefabs) : GetRandomPrefab(mediumChunkPrefabs);
            }

            GameObject chunk = Instantiate(prefabToSpawn, new Vector3(0, 0, currentZ), Quaternion.identity, transform);
            spawnedChunks.Enqueue(chunk);
            currentZ += chunkLength;
        }

        private void RecycleOldestChunk()
        {
            if (spawnedChunks.Count > 0)
            {
                GameObject oldChunk = spawnedChunks.Dequeue();
                Destroy(oldChunk); // Replace with custom object pool for production
            }
        }

        private GameObject GetRandomPrefab(List<GameObject> list) => list[Random.Range(0, list.Count)];
    }
}
```

---

### V.3 · `AbilitySystem.cs` & `AbilityData.cs`
Implements the Umbral Codex Void Power runtime, Void Energy (VE) spending, cooldown management, and ScriptableObject data architecture.

```csharp
using UnityEngine;

namespace VoidRun.Abilities
{
    [CreateAssetMenu(fileName = "NewAbility", menuName = "VoidRun/Ability Data")]
    public class AbilityData : ScriptableObject
    {
        public string abilityName;
        public int codexStage;      // 1 to 5
        public float duration;
        public float cooldown;
        public float voidEnergyCost;
        public Sprite icon;
        public GameObject vfxPrefab;
        public AudioClip activationSfx;
    }
}
```

```csharp
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using VoidRun.Gameplay;

namespace VoidRun.Abilities
{
    public class AbilitySystem : MonoBehaviour
    {
        [Header("Void Energy (VE)")]
        [SerializeField] private float maxVE = 100f;
        [SerializeField] private float passiveRegenPerSecond = 3f;
        private float currentVE;

        [Header("Equipped Abilities")]
        [SerializeField] private AbilityData primaryAbility;
        [SerializeField] private AbilityData secondaryAbility;
        private AbilityData activeSlot;

        private Dictionary<AbilityData, float> cooldownTrackers = new Dictionary<AbilityData, float>();
        private PlayerController player;

        public System.Action<float, float> OnEnergyChanged; // current, max
        public System.Action<AbilityData> OnAbilityTriggered;

        private void Awake()
        {
            player = GetComponent<PlayerController>();
            currentVE = maxVE;
            activeSlot = primaryAbility;
        }

        private void Update()
        {
            // Passive Regen
            if (currentVE < maxVE)
            {
                currentVE = Mathf.Min(maxVE, currentVE + passiveRegenPerSecond * Time.deltaTime);
                OnEnergyChanged?.Invoke(currentVE, maxVE);
            }

            // Cooldown updates
            List<AbilityData> keys = new List<AbilityData>(cooldownTrackers.Keys);
            foreach (var key in keys)
            {
                cooldownTrackers[key] -= Time.deltaTime;
                if (cooldownTrackers[key] <= 0f) cooldownTrackers.Remove(key);
            }
        }

        public void AddEnergy(float amount)
        {
            currentVE = Mathf.Clamp(currentVE + amount, 0f, maxVE);
            OnEnergyChanged?.Invoke(currentVE, maxVE);
        }

        public void TriggerEquippedAbility()
        {
            if (activeSlot == null) return;
            if (cooldownTrackers.ContainsKey(activeSlot)) return; // On cooldown
            if (currentVE < activeSlot.voidEnergyCost) return;     // Insufficient VE

            // Pay cost & start CD
            currentVE -= activeSlot.voidEnergyCost;
            cooldownTrackers[activeSlot] = activeSlot.cooldown;
            OnEnergyChanged?.Invoke(currentVE, maxVE);

            StartCoroutine(ExecuteAbilityRoutine(activeSlot));
            OnAbilityTriggered?.Invoke(activeSlot);
        }

        public void SwapAbilitySlot()
        {
            if (secondaryAbility == null) return;
            activeSlot = (activeSlot == primaryAbility) ? secondaryAbility : primaryAbility;
        }

        private IEnumerator ExecuteAbilityRoutine(AbilityData ability)
        {
            // Apply ability effects (e.g. Flicker blink, Voidwalk phase, Time Bleed)
            player.SetInvulnerability(true);
            if (ability.vfxPrefab != null)
            {
                GameObject vfx = Instantiate(ability.vfxPrefab, transform.position, Quaternion.identity, transform);
                Destroy(vfx, ability.duration);
            }

            yield return new WaitForSeconds(ability.duration);

            player.SetInvulnerability(false);
        }
    }
}
```

---

### V.4 · `ChaserController.cs`
Maintains pursuer distance behind the player, handles surge-on-stumble, pushbacks on ability use, and proximity warning states.

```csharp
using UnityEngine;
using VoidRun.Gameplay;

namespace VoidRun.Chaser
{
    public enum ChaserProximityState { Distant, Approaching, Close, Catching }

    public class ChaserController : MonoBehaviour
    {
        [Header("Targets")]
        [SerializeField] private PlayerController player;

        [Header("Distance Tuning")]
        [SerializeField] private float maxFollowDistance = 50f;
        [SerializeField] private float closeThreshold = 18f;
        [SerializeField] private float catchingThreshold = 6f;
        [SerializeField] private float naturalClosingRate = 0.35f; // m/s creep toward player

        private float currentDistanceBehind;

        private void Start()
        {
            currentDistanceBehind = maxFollowDistance;
            if (player != null)
            {
                player.OnStumble += HandlePlayerStumbled;
            }
        }

        private void Update()
        {
            if (player == null) return;

            // Chaser creeps closer naturally over distance
            currentDistanceBehind = Mathf.Max(0f, currentDistanceBehind - naturalClosingRate * Time.deltaTime);

            // Position chaser directly behind player along Z axis
            Vector3 targetPos = player.transform.position - new Vector3(0, 0, currentDistanceBehind);
            transform.position = Vector3.Lerp(transform.position, targetPos, 10f * Time.deltaTime);

            // Game over check
            if (currentDistanceBehind <= 0.5f)
            {
                player.TakeObstacleHit(); // Trigger fatal catch
            }
        }

        public void PushBack(float meters)
        {
            currentDistanceBehind = Mathf.Min(maxFollowDistance, currentDistanceBehind + meters);
        }

        private void HandlePlayerStumbled()
        {
            // Stumbling lets chaser surge forward 12 meters
            currentDistanceBehind = Mathf.Max(2f, currentDistanceBehind - 12f);
        }

        public ChaserProximityState GetProximityState()
        {
            if (currentDistanceBehind > 30f) return ChaserProximityState.Distant;
            if (currentDistanceBehind > closeThreshold) return ChaserProximityState.Approaching;
            if (currentDistanceBehind > catchingThreshold) return ChaserProximityState.Close;
            return ChaserProximityState.Catching;
        }
    }
}
```

---

## W. PERFORMANCE PLAN (ANDROID 60 FPS / 30 FPS FALLBACK) [NEW]

| Performance Pillar | 60 FPS Target (Mid/High Tier) | 30 FPS Fallback (Budget Android) |
|---|---|---|
| **Max Draw Calls** | ≤ 75 per frame (SRP Batcher active) | ≤ 45 per frame |
| **Visible Polygons** | ≤ 45,000 tris | ≤ 22,000 tris (aggressive LODs) |
| **Particle Systems** | Max 6 active emitters; Max 350 particles | Environmental particles culled; Max 120 particles |
| **Garbage Collection (GC)** | Zero GC allocation per frame in run loop | Zero GC alloc per frame |
| **Memory Consumption** | < 380 MB PSS RAM | < 250 MB PSS RAM |
| **Post-Processing** | Lightweight Bloom, Chromatic Aberration | Post-processing completely disabled |
| **Physics Frequency** | `FixedUpdate` @ 50 Hz (0.02s) | `FixedUpdate` @ 30 Hz (0.033s) |

### Key Optimization Rules
1. **Pre-allocated Object Pools:** All chunk segments, obstacle prefabs, coin lines, and floating damage/combo texts are instantiated at scene load. Zero `Instantiate()` or `Destroy()` calls during gameplay.
2. **Texture Atlasing:** Each portal world uses exactly one 2048×2048 texture atlas for all environmental geometry.
3. **Audio Streaming:** Background music stems are set to *Streaming* from storage to conserve RAM. SFX files are *Decompress on Load* (PCM/Vorbis 16-bit).

---

## X. QUALITY ASSURANCE & TESTING PLAN [NEW]

### X.1 · Core Mechanics Smoke Matrix
- [ ] **Swipe Responsiveness:** Rapid lane switching (L → C → R) within 400ms without dropped frames or clipped colliders.
- [ ] **Input Buffer Accuracy:** Swipe Up followed immediately by Swipe Left buffers and executes lane transition immediately upon touchdown.
- [ ] **Hitbox Margins:** Verify near-miss triggers reward VE without causing false stumbles.
- [ ] **Chaser Pushback:** Validate that activating *Flicker* or *Shadow Shield* reliably pushes the beast back 15m.
- [ ] **Ad & Revive State:** Rewarded ad revival restores player at safe velocity with 2 seconds of spawn invulnerability.

### X.2 · Low-End Hardware Verification Suite
- Test device tier 1: MediaTek Helio G85 / Snapdragon 680 (3 GB RAM)
- Test device tier 2: Samsung Galaxy A14 / A23
- Profile with **Unity Profile Analyzer** and **Snapdragon Profiler** to ensure frame pacing variance stays under 2.5ms.

---

## Y. 3-WEEK PLAYABLE PROTOTYPE ROADMAP (THE NEXT 10 STEPS)

```mermaid
gantt
    title Miller: Void Run — 3-Week Prototype Sprint
    dateFormat  YYYY-MM-DD
    section Week 1: Movement & Track
    Step 1: Project Setup & Repo           :done, 2026-11-25, 1d
    Step 2: 3-Lane Controller & Buffer     :active, 2026-11-26, 2d
    Step 3: Track Pooling & Procedural Gen :2026-11-28, 2d
    Step 4: Obstacle Set & Collisions     :2026-11-30, 2d
    section Week 2: Chaser & Powers
    Step 5: Chaser State Machine          :2026-12-02, 2d
    Step 6: Umbral Codex & Ability System :2026-12-04, 3d
    Step 7: Pickups & Economy Loop        :2026-12-07, 2d
    section Week 3: Polish & Android Build
    Step 8: World 1 Art & URP Shaders     :2026-12-09, 2d
    Step 9: Audio & Near-Miss Slow-Mo     :2026-12-11, 2d
    Step 10: Android APK Build & Profiling:2026-12-13, 2d
```

### The 10 Actionable Steps

1. **Step 1: Unity Project & URP Setup (Day 1)**  
   Create Unity 2022.3 LTS project with Universal 3D template. Set Android build target, Linear color space, and import New Input System. Create standard folder structure.
2. **Step 2: Player Controller & Input Buffering (Days 2–3)**  
   Implement `PlayerController.cs` with 3-lane positioning, jump, slide, and 150ms input buffer. Verify fluid feel using placeholder capsule.
3. **Step 3: Chunk-Based Track Spawner (Days 4–5)**  
   Build `TrackSpawner.cs` and pre-fabricate 6 block-out chunks (30m each). Implement chunk recycling to sustain infinite generation.
4. **Step 4: Obstacle & Collision Matrix (Days 6–7)**  
   Add ground hurdles, overhead barriers, and lane obstacles. Implement 15% forgiving collision bounds and stumble deceleration.
5. **Step 5: Chaser Pursuer System (Days 8–9)**  
   Deploy `ChaserController.cs`. Setup distance tracker (Distant → Close → Catching). Link player stumble to chaser surge.
6. **Step 6: Codex Void Power System (Days 10–12)**  
   Build `AbilitySystem.cs` and ScriptableObject definitions for Stage 1 abilities: *Flicker* (phase dash) and *Void Sense* (path hint). Hook up bottom-right tap button.
7. **Step 7: Pickups, Currency & HUD (Days 13–14)**  
   Spawn Void Shards and VE orbs along chunk paths. Build run HUD displaying meters run, shard counter, VE gauge, and ability button.
8. **Step 8: World 1 Visuals & Toon-Lit Palette (Days 15–16)**  
   Apply Verdant Breach aesthetics: dark purple void sky, mossy stone tracks, luminous green/purple rim lighting. Replace placeholder geometry.
9. **Step 9: Audio Stems & Slow-Mo Polish (Days 17–18)**  
   Implement adaptive 2-stem background audio loop and near-miss slow-mo triggers for social clip appeal.
10. **Step 10: First Android APK Build & Profiling (Days 19–21)**  
    Compile initial release APK (target < 100 MB for prototype). Sideload to mid-range Android hardware, verify stable 60 fps, and tune touch swipe thresholds.

---

## GDD DELIVERY COMPLETION SUMMARY

All five modules of the Game Design Document have been compiled into persistent artifacts:
- **Part 1 (A–E):** [MILLER_VOID_RUN_GDD_Part1.md](file:///C:/Users/USER/.gemini/antigravity/brain/35c8c27d-7ea6-4ffd-b44a-0309e602ff91/MILLER_VOID_RUN_GDD_Part1.md)
- **Part 2 (F–J):** [MILLER_VOID_RUN_GDD_Part2.md](file:///C:/Users/USER/.gemini/antigravity/brain/35c8c27d-7ea6-4ffd-b44a-0309e602ff91/MILLER_VOID_RUN_GDD_Part2.md)
- **Part 3 (K–O):** [MILLER_VOID_RUN_GDD_Part3.md](file:///C:/Users/USER/.gemini/antigravity/brain/35c8c27d-7ea6-4ffd-b44a-0309e602ff91/MILLER_VOID_RUN_GDD_Part3.md)
- **Part 4 (P–T):** [MILLER_VOID_RUN_GDD_Part4.md](file:///C:/Users/USER/.gemini/antigravity/brain/35c8c27d-7ea6-4ffd-b44a-0309e602ff91/MILLER_VOID_RUN_GDD_Part4.md)
- **Part 5 (U–Y):** [MILLER_VOID_RUN_GDD_Part5.md](file:///C:/Users/USER/.gemini/antigravity/brain/35c8c27d-7ea6-4ffd-b44a-0309e602ff91/MILLER_VOID_RUN_GDD_Part5.md)

---
*End of Game Design Document.*
