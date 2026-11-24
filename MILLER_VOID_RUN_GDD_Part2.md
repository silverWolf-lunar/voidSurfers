# MILLER: VOID RUN — Game Design Document
## Part 2 (F–J): Void Powers & Codex Progression, Power-ups, Collectibles, Economy

---

## F. VOID POWERS — MAPPED TO THE UMBRAL CODEX

### Design Philosophy

The Umbral Codex in the story grants Miller dozens of abilities across five stages. For an endless runner, we select **2–3 abilities per stage** that translate into fast, one-button gameplay moments. Each ability is **directly sourced** from the canon ability list and adapted to runner mechanics.

> [!IMPORTANT]
> Players equip **one active Void Power** at a time. At Codex Level 25+, a second equip slot unlocks. Powers are activated via the Void Button (bottom-right). Double-tap swaps between equipped powers. [NEW]

### Void Energy Resource [ADAPTED]

Void Powers consume **Void Energy (VE)**, adapted from the canon's MP (MetaPoints) system.

| Attribute | Value |
|---|---|
| Max VE at start | 100 |
| VE per Codex level-up | +5 |
| VE regen (passive) | 3 VE/s |
| VE regen (near-miss) | +8 VE instant |
| VE regen (shard pickup) | +2 VE per shard |
| VE at max Codex (Lv 100) | 600 |

---

### Stage 1 — Awakening (Codex Level 1–10)

> *"The system materializes only to Miller's mind eye."*

#### F.1 · Flicker
**Canon Source:** Flicker (Stage 1 ability list)

| Property | Base (Lv 1) | Upgrade 1 (Lv 3) | Upgrade 2 (Lv 6) | Upgrade 3 (Lv 9) |
|---|---|---|---|---|
| **Description** | Short-range void blink — Miller teleports 15 m forward, phasing through any obstacle in the path | — | — | — |
| **VE Cost** | 25 | 22 | 20 | 18 |
| **Distance** | 15 m | 18 m | 22 m | 28 m |
| **Cooldown** | 8s | 7s | 6s | 5s |
| **Invincibility** | During blink only (~0.3s) | 0.3s | 0.4s | 0.5s |
| **Visual** | Purple afterimage trail, void particles at start/end points | Brighter trail | Trail lingers 1s | Screen-edge void flash |
| **Runner Use** | Panic escape — phase through an obstacle cluster you can't dodge | — | — | — |

#### F.2 · Void Sense
**Canon Source:** Void Sense + Void Sense Enhanced (Stage 1 ability list)

| Property | Base (Lv 1) | Upgrade 1 (Lv 4) | Upgrade 2 (Lv 7) | Upgrade 3 (Lv 10) |
|---|---|---|---|---|
| **Description** | Highlights the optimal path through upcoming obstacles — a glowing trail shows the safest lane sequence | — | — | — |
| **VE Cost** | 15 | 13 | 12 | 10 |
| **Duration** | 3s | 4s | 5s | 6s |
| **Cooldown** | 12s | 11s | 10s | 8s |
| **Extra at Upgrade** | — | Also reveals hidden shards | Reveals hidden shards + Codex Essence | Reveals all + chaser pushback 5 m |
| **Visual** | Luminous purple trail on ground ahead, faint glow on correct lane | Shards pulse gold | Essence sparkles visible | Full-screen void pulse on activation |
| **Runner Use** | Navigation aid — especially useful in hard chunks and new worlds | — | — | — |

#### F.3 · Stillstep
**Canon Source:** Stillstep (Stage 1 ability list)

| Property | Base (Lv 2) | Upgrade 1 (Lv 5) | Upgrade 2 (Lv 8) |
|---|---|---|---|
| **Description** | Miller's footsteps become silent and weightless — grants a brief hover that clears ground obstacles without jumping | — | — |
| **VE Cost** | 20 | 18 | 15 |
| **Duration** | 2s | 2.5s | 3.5s |
| **Cooldown** | 10s | 9s | 7s |
| **Hover Height** | 0.5 m (clears all ground obstacles) | 0.5 m | 0.8 m (clears some mid-height) |
| **Visual** | Feet leave void ripples, slight float above ground | Void mist trail | Full silhouette glow, ground cracks beneath |
| **Runner Use** | Sustained ground-obstacle immunity — better than jump for dense ground sections | — | — |

---

### Stage 2 — The Embrace (Codex Level 10–25)

> *"The Shop unlocks. Miller begins to weave the void itself."*

#### F.4 · Shadow Shield
**Canon Source:** Shadow Shield (Stage 2 ability list)

| Property | Base (Lv 10) | Upgrade 1 (Lv 14) | Upgrade 2 (Lv 18) | Upgrade 3 (Lv 22) |
|---|---|---|---|---|
| **Description** | Summons a shield of compressed shadow that absorbs the next hit — prevents stumble and pushes chaser back | — | — | — |
| **VE Cost** | 30 | 28 | 25 | 22 |
| **Duration** | 5s (or until hit) | 6s | 8s | 10s |
| **Hits Absorbed** | 1 | 1 | 2 | 2 |
| **Chaser Pushback** | 10 m on absorb | 12 m | 15 m | 15 m + shockwave destroys nearby obstacles |
| **Cooldown** | 15s | 14s | 12s | 10s |
| **Visual** | Dark purple hexagonal barrier around Miller | Barrier pulses | Barrier is larger, void runes orbit | Explosion of void shards on absorb |
| **Runner Use** | Insurance ability — activate preemptively for hard sections | — | — | — |

#### F.5 · Voidwalk
**Canon Source:** Voidwalk (Stage 2 ability list)

| Property | Base (Lv 12) | Upgrade 1 (Lv 16) | Upgrade 2 (Lv 20) | Upgrade 3 (Lv 25) |
|---|---|---|---|---|
| **Description** | Miller shifts into the void plane — phases through ALL obstacles, still collects shards | — | — | — |
| **VE Cost** | 40 | 38 | 35 | 30 |
| **Duration** | 2s | 2.5s | 3s | 4s |
| **Cooldown** | 18s | 16s | 14s | 12s |
| **Shard Bonus** | — | +20% shard value while phased | +30% shard value | +50% shard value |
| **Visual** | Miller becomes translucent purple silhouette, void plane overlay on screen | Deeper colour shift | Reality "splits" visually | Full void-plane environment swap |
| **Runner Use** | Offensive traversal — sprint through everything and farm shards | — | — | — |

#### F.6 · Grasping Dark
**Canon Source:** Grasping Dark (Stage 2 ability list)

| Property | Base (Lv 15) | Upgrade 1 (Lv 19) | Upgrade 2 (Lv 23) |
|---|---|---|---|
| **Description** | Void tendrils extend from Miller and magnetically pull all collectibles from adjacent lanes to Miller's current lane | — | — |
| **VE Cost** | 20 | 18 | 15 |
| **Duration** | 4s | 5s | 7s |
| **Pull Radius** | Adjacent lanes only (1.2 m) | All 3 lanes (2.4 m) | All lanes + 10 m ahead |
| **Cooldown** | 10s | 9s | 7s |
| **Visual** | Dark tendrils snake out from Miller, shards fly toward him with purple trails | Tendrils are thicker | Tendrils form a void vortex |
| **Runner Use** | Economy booster — maximise shard collection without changing lanes | — | — |

---

### Stage 3 — The Descent (Codex Level 25–40)

> *"Miller touches the deeper void. Time begins to bend."*

#### F.7 · Time Bleed
**Canon Source:** Time Bleed (Stage 3 ability list)

| Property | Base (Lv 25) | Upgrade 1 (Lv 30) | Upgrade 2 (Lv 35) | Upgrade 3 (Lv 40) |
|---|---|---|---|---|
| **Description** | Time bleeds around Miller — everything except Miller slows to 40% speed. Obstacles, chaser, hazards all decelerate. Miller moves at full speed. | — | — | — |
| **VE Cost** | 45 | 42 | 38 | 35 |
| **Duration** | 3s | 3.5s | 4s | 5s |
| **Time Scale** | 0.4× (world), 1.0× (Miller) | 0.35× | 0.3× | 0.25× |
| **Cooldown** | 20s | 18s | 16s | 14s |
| **Visual** | Chromatic aberration, motion blur on world, Miller glows sharp, clock-tick SFX | Colour desaturates more | Reality "cracks" appear | Full void-time aesthetic, purple time-streaks |
| **Runner Use** | Precision mode — navigate dense obstacle sections with ample reaction time | — | — | — |

> [!TIP]
> Time Bleed is the game's "bullet time." It's the most TikTok-shareable ability because near-misses during Time Bleed trigger automatic slow-mo capture.

#### F.8 · Eclipse Veil
**Canon Source:** Eclipse Veil (Stage 3 ability list)

| Property | Base (Lv 27) | Upgrade 1 (Lv 32) | Upgrade 2 (Lv 37) |
|---|---|---|---|
| **Description** | Miller vanishes from the chaser's perception — the chaser decelerates to its idle pace and loses tracking | — | — |
| **VE Cost** | 35 | 32 | 28 |
| **Duration** | 4s | 5s | 6s |
| **Chaser Effect** | Chaser slows to 50% speed | Chaser slows to 40% | Chaser slows to 30% + retreats 10 m |
| **Cooldown** | 22s | 20s | 16s |
| **Visual** | Miller's model darkens, shadow wisps trail, chaser's eyes dim | Veil pulses | Full invisibility shimmer, chaser visibly confused |
| **Runner Use** | Anti-chaser — use when chaser is at Close/Catching range | — | — |

#### F.9 · Chronal Haven
**Canon Source:** Chronal Haven (Stage 3 ability list)

| Property | Base (Lv 30) | Upgrade 1 (Lv 36) | Upgrade 2 (Lv 40) |
|---|---|---|---|
| **Description** | Creates a time-locked bubble — Miller is fully invulnerable and all obstacles in bubble range shatter, leaving collectibles behind | — | — |
| **VE Cost** | 50 | 45 | 40 |
| **Duration** | 2s | 2.5s | 3s |
| **Radius** | All 3 lanes, 10 m ahead | 15 m ahead | 20 m ahead |
| **Cooldown** | 25s | 22s | 18s |
| **Visual** | Golden-purple time sphere, obstacles freeze then shatter into void particles, shards scatter | Bigger sphere | Sphere leaves a glowing trail |
| **Runner Use** | Room-clearing nuke — use at the start of a dense section | — | — |

---

### Stage 4 — The Apex (Codex Level 45–70)

> *"The void becomes Miller's domain. Reality bends to his will."*

#### F.10 · Void Domain
**Canon Source:** Void Domain (Stage 4 ability list)

| Property | Base (Lv 45) | Upgrade 1 (Lv 52) | Upgrade 2 (Lv 60) | Upgrade 3 (Lv 68) |
|---|---|---|---|---|
| **Description** | Miller projects his void domain — the entire track transforms into a void plane. All obstacles become intangible, all collectibles double, and chaser is locked in place | — | — | — |
| **VE Cost** | 70 | 65 | 60 | 55 |
| **Duration** | 4s | 5s | 6s | 8s |
| **Effects** | Obstacles intangible, collectibles 2× | +chaser frozen | +speed boost 1.3× | +all shards become Codex Essence |
| **Cooldown** | 30s | 28s | 25s | 22s |
| **Visual** | Entire environment shifts to void-purple, obstacles become ghost wireframes, void stars in sky | Ground becomes void glass | Reality fractures visible | Full cosmic void environment |
| **Runner Use** | Ultimate traversal — total control of the battlefield | — | — | — |

#### F.11 · Erasure Wave
**Canon Source:** Erasure Wave (Stage 4 ability list)

| Property | Base (Lv 50) | Upgrade 1 (Lv 58) | Upgrade 2 (Lv 65) |
|---|---|---|---|
| **Description** | Miller sends a wave of void energy forward that erases all obstacles in a cone for 30 m ahead | — | — |
| **VE Cost** | 55 | 50 | 45 |
| **Range** | 30 m cone, all 3 lanes | 40 m | 50 m |
| **Cooldown** | 25s | 22s | 18s |
| **Extra** | — | Destroyed obstacles drop bonus shards | Destroyed obstacles drop shards + pushes chaser 20 m |
| **Visual** | Expanding purple-black wave, obstacles dissolve into void particles | Wave has lightning arcs | Massive screen-filling void detonation |
| **Runner Use** | Path-clearing burst — fire and sprint through the cleared corridor | — | — |

#### F.12 · Void Resonance
**Canon Source:** Void Resonance (Stage 4 ability list)

| Property | Base (Lv 55) | Upgrade 1 (Lv 62) | Upgrade 2 (Lv 70) |
|---|---|---|---|
| **Description** | Miller resonates with the void — passive aura that auto-deflects one obstacle every 5s without player input | — | — |
| **VE Cost** | 60 (activation), then 5 VE per auto-deflect | 55 / 4 per deflect | 50 / 3 per deflect |
| **Duration** | 10s | 12s | 15s |
| **Auto-Deflect Rate** | Every 5s | Every 4s | Every 3s |
| **Cooldown** | 30s | 26s | 22s |
| **Visual** | Orbiting void orbs around Miller, one shatters per deflect | More orbs | Orbs form a void constellation |
| **Runner Use** | Safety net for sustained difficult sections — passive protection | — | — |

---

### Stage 5 — Transcendence (Codex Level 75–100)

> *"Miller exists beyond all. The void is not a tool — it is Miller."*

#### F.13 · Voidlight Synthesis
**Canon Source:** Voidlight Synthesis (Stage 5 ability list)

| Property | Base (Lv 75) | Upgrade 1 (Lv 85) | Upgrade 2 (Lv 95) |
|---|---|---|---|
| **Description** | Miller synthesizes void and light — becomes a streak of pure energy, sprinting at 2× speed, fully invulnerable, auto-collecting everything in all lanes | — | — |
| **VE Cost** | 80 | 75 | 65 |
| **Duration** | 4s | 5s | 7s |
| **Speed** | 2.0× current | 2.2× | 2.5× |
| **Cooldown** | 35s | 30s | 25s |
| **Visual** | Miller transforms into a blinding void-light comet, screen fills with energy, shockwave behind | Light tendrils reach all lanes | Full-screen void supernova |
| **Runner Use** | Ultimate sprint — maximum distance gain and collection | — | — |

#### F.14 · Singularity Soul
**Canon Source:** Singularity Soul (Stage 5 ability list)

| Property | Base (Lv 85) | Upgrade 1 (Lv 100) |
|---|---|---|
| **Description** | Miller collapses reality into a singularity at his position — all obstacles in a 60 m radius are consumed, all collectibles are pulled in, chaser is pushed to max distance, and a portal rift opens granting a free portal skip [ADAPTED] | — |
| **VE Cost** | 100 (full bar at base) | 90 |
| **Duration** | 3s (singularity collapse) | 4s |
| **Cooldown** | 60s | 45s |
| **Effects** | Destroy all obstacles 60 m, pull all collectibles, chaser → Distant, skip 200 m of track | All effects + 2× shard value for 10s after |
| **Visual** | Screen goes black, single point of void-light expands, reality fractures and reforms — the most dramatic visual in the game | Golden void-light, reality rebuilds in slow-motion |
| **Runner Use** | Once-per-run ultimate — save for boss phases or desperation moments | — | — |

#### F.15 · Concept Reversal
**Canon Source:** Concept Reversal (Stage 5 ability list)

| Property | Base (Lv 90) | Upgrade 1 (Lv 98) |
|---|---|---|
| **Description** | Reverses the concept of obstacles — all obstacles become collectibles for the duration. Running INTO objects gives shards instead of stumble [ADAPTED] | — |
| **VE Cost** | 85 | 75 |
| **Duration** | 3s | 5s |
| **Cooldown** | 40s | 30s |
| **Visual** | Obstacles invert colour (purple-gold), "reality inverted" text flash, everything shimmers | Obstacles actively pull toward Miller |
| **Runner Use** | Skill inversion — deliberately run into dense obstacle sections for maximum shards | — | — |

---

### Void Power Equip Slots [NEW]

| Codex Level | Slots | Notes |
|---|---|---|
| 1–24 | 1 active slot | Player picks one power per run |
| 25–44 | 2 active slots | Double-tap Void Button to swap |
| 45–74 | 2 active + 1 passive | Passive auto-activates (e.g. Void Resonance) |
| 75–100 | 2 active + 1 passive + 1 ultimate | Ultimate charges once per run |

### Full Void Power Summary Table

| # | Ability | Codex Stage | Unlock Lv | Type | Canon Status |
|---|---|---|---|---|---|
| 1 | Flicker | Awakening | 1 | Active — Blink | Canon |
| 2 | Void Sense | Awakening | 1 | Active — Reveal | Canon |
| 3 | Stillstep | Awakening | 2 | Active — Hover | Canon |
| 4 | Shadow Shield | Embrace | 10 | Active — Defence | Canon |
| 5 | Voidwalk | Embrace | 12 | Active — Phase | Canon |
| 6 | Grasping Dark | Embrace | 15 | Active — Magnet | Canon |
| 7 | Time Bleed | Descent | 25 | Active — Slow-Mo | Canon |
| 8 | Eclipse Veil | Descent | 27 | Active — Stealth | Canon |
| 9 | Chronal Haven | Descent | 30 | Active — Nuke | Canon |
| 10 | Void Domain | Apex | 45 | Active — Domain | Canon |
| 11 | Erasure Wave | Apex | 50 | Active — Burst | Canon |
| 12 | Void Resonance | Apex | 55 | Passive — Auto-deflect | Canon |
| 13 | Voidlight Synthesis | Transcendence | 75 | Active — Sprint | Canon |
| 14 | Singularity Soul | Transcendence | 85 | Ultimate — Singularity | Canon |
| 15 | Concept Reversal | Transcendence | 90 | Active — Inversion | Canon |

> [!NOTE]
> All 15 abilities are drawn directly from the canon Umbral Codex ability lists. Their **runner-specific mechanics** (how they work in a 3-lane runner) are [ADAPTED]. No abilities are invented outside the canon list.

---

## G. CODEX PROGRESSION TREE

### XP Earn Rates [ADAPTED from canon "Earn XP through quests, defeating beasts"]

| Source | XP per unit | Notes |
|---|---|---|
| Distance run | 1 XP per 10 m | Base earn, always active |
| Void Shard collected | 0.5 XP per shard | Encourages collection |
| Obstacle near-miss | 3 XP | Rewards skill |
| Chaser pushback (via power) | 5 XP | Rewards power use |
| Boss chase survived | 50 XP | Major milestone |
| Portal world completed | 30 XP | Completion bonus |
| Daily mission completed | 20–40 XP | See Section I |
| Weekly mission completed | 80–150 XP | See Section I |

### XP Required per Level [NEW]

| Level Range | XP per Level | Cumulative (end of range) | Approx. Runs to Complete Range |
|---|---|---|---|
| 1–10 (Awakening) | 100 + (level × 20) | ~2,000 XP | 15–20 runs |
| 11–25 (Embrace) | 300 + (level × 25) | ~9,500 XP | 30–40 runs |
| 26–40 (Descent) | 500 + (level × 35) | ~22,000 XP | 50–60 runs |
| 41–70 (Apex) | 700 + (level × 50) | ~75,000 XP | 100–130 runs |
| 71–100 (Transcendence) | 1000 + (level × 80) | ~220,000 XP | 150–200 runs |

> Total runs to reach Level 100: approximately **350–450 runs** (5–7 months of daily play at 3–4 runs/day)

### Level-Up Rewards [ADAPTED from canon "Gains rewards on Level Up"]

| Level | Reward | Canon Source |
|---|---|---|
| Every level | +5 max VE, +2% base speed | Attribute improvement (Stamina, Agility) |
| Every 3 levels | 1 Skill Point (SP) | Canon SP system |
| Every 5 levels | 1 ability unlock OR upgrade | Canon ability progression |
| Level 3 | Inventory slot → equip skins [ADAPTED] | Canon: "Inventory unlocks at level 3" |
| Level 10 | Shop unlock → spend currencies | Canon: "Shop unlocks at Level 10" |
| Level 25 | 2nd equip slot [NEW] | Progression milestone |
| Level 45 | Passive slot [NEW] | Progression milestone |
| Level 75 | Ultimate slot [NEW] | Progression milestone |

### Skill Point (SP) System [ADAPTED]

Skill Points are earned every 3 Codex levels (33 SP total by Level 100). They are spent on a simple upgrade tree:

```
                    ┌──────────────────────────────────┐
                    │        SKILL POINT TREE          │
                    └──────────────┬───────────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              ▼                    ▼                    ▼
       ┌─────────────┐    ┌──────────────┐    ┌──────────────┐
       │  VOID PATH  │    │  SHADOW PATH │    │  CODEX PATH  │
       │  (Offence)  │    │  (Survival)  │    │  (Utility)   │
       └──────┬──────┘    └──────┬───────┘    └──────┬───────┘
              │                  │                    │
     ┌────────┴───────┐  ┌──────┴────────┐  ┌───────┴────────┐
     │Power Duration  │  │ Shield HP +1  │  │ VE Regen +1/s  │
     │ +0.5s (3 SP)   │  │   (3 SP)      │  │   (2 SP)       │
     ├────────────────┤  ├───────────────┤  ├────────────────┤
     │Power Damage    │  │ Stumble Time  │  │ Cooldown       │
     │ +15% (4 SP)    │  │ -100ms (3 SP) │  │ -10% (4 SP)    │
     ├────────────────┤  ├───────────────┤  ├────────────────┤
     │Chaser Pushback │  │ 2nd Chance    │  │ Shard Magnet   │
     │ +25% (5 SP)    │  │ (auto-revive  │  │ Range +50%     │
     │                │  │  once) (5 SP)  │  │  (4 SP)        │
     └────────────────┘  └───────────────┘  └────────────────┘
```

> [!NOTE]
> SP tree is [NEW] — the canon document mentions Skill Points as a system mechanic but doesn't define a tree structure. This tree is designed to remain small enough for a solo dev to implement.

---

## H. POWER-UPS

### Pickup Power-ups [NEW — standard runner items designed to complement the Void Power system]

Power-ups are **distinct from Void Powers**. They are temporary pickups found on the track, last a fixed duration, and do not consume VE.

| Power-Up | Icon Colour | Duration | Effect | Spawn Rate | Stacks with Powers? |
|---|---|---|---|---|---|
| **Void Magnet** | Cyan | 6s | Pulls all collectibles from all lanes to Miller | 1 per 350 m | Yes — stacks with Grasping Dark for 3-lane + ahead pull |
| **Shadow Barrier** | Deep purple | Single-use (until hit) | Absorbs one obstacle hit, no stumble | 1 per 500 m | Yes — separate from Shadow Shield; both can be active |
| **Double Shards** | Gold | 8s | All Void Shards worth 2× | 1 per 400 m | Yes — multiplicative with Voidwalk bonus |
| **Void Surge** | White-purple | 5s | Invincible sprint at 1.8× speed, auto-collects all, chaser pushed to max distance | 1 per 800 m (rare) | No — overrides active Void Power for duration |

### Power-Up Spawn Rules [NEW]

| Rule | Detail |
|---|---|
| Placement | Always in the centre lane (easy to grab deliberately) |
| Min spacing | 200 m between any two power-ups |
| Guarantee | At least 1 power-up per 500 m of track |
| Boss Chase | No random spawns; Void Surge guaranteed once at boss start |
| Visual telegraph | Glowing column of light + pulsing SFX from 30 m away |
| Pickup forgiveness | 1.0 m radius (3× visual size) |

### Power-Up Visual & Audio Cues [NEW]

| Power-Up | Pickup SFX | Active Visual | Expiry Warning |
|---|---|---|---|
| Void Magnet | Metallic whoosh + chime | Cyan tendrils arcing from Miller | Tendrils flicker at 1.5s remaining |
| Shadow Barrier | Deep gong + shield-up | Dark sphere orbiting Miller | Sphere cracks at 50% opacity |
| Double Shards | Coin cascade + sparkle | Gold aura + shard particles | Aura fades, particles slow |
| Void Surge | Explosion + bass drop | Full-screen void tunnel effect, speed lines | Tunnel contracts, speed lines thin |

---

## I. COLLECTIBLES

### I.1 · Void Shards (Soft Currency) [ADAPTED from canon currency system]

| Property | Detail |
|---|---|
| **Canon basis** | "Currency (silver coins, Gold coins, platinum coins, credits)" — Void Shards serve as the unified soft currency |
| **Appearance** | Small purple crystalline fragments, rotating, with void particle trail |
| **Track placement** | Lines of 5–15 along the optimal path through each chunk |
| **Value** | 1 Shard = 1 VS (Void Shard unit) |
| **Avg. per run** | 150–300 VS (depending on world reached and powers used) |
| **Uses** | Ability upgrades, skin purchases, Shop items (at Codex Lv 10+), continues |

### I.2 · Codex Essence (Progression Currency) [ADAPTED]

| Property | Detail |
|---|---|
| **Canon basis** | XP / Codex progression — Codex Essence is the in-run manifestation of XP |
| **Appearance** | Larger, rarer orbs with deep purple core and orbiting runes |
| **Track placement** | Hidden paths, reward chunks, behind hard obstacle combos |
| **Value** | 1 CE = 10 XP directly applied to Codex level |
| **Avg. per run** | 5–15 CE (50–150 bonus XP) |
| **Uses** | Direct XP (auto-applied), cannot be spent elsewhere |

### I.3 · Beast Cores (Rare Drops) [ADAPTED from canon Beast Core mechanic]

| Property | Detail |
|---|---|
| **Canon basis** | "Beast Core ability Harnessing" — Miller absorbs beast cores for new abilities |
| **Appearance** | Glowing spheres colour-coded by tier (green = Basic, orange = King, red = Demon, white = Abyssal) |
| **Drop source** | Boss chase completion, rare spawn after chaser pushback, weekly challenge reward |
| **Avg. per run** | 0–1 (guaranteed 1 on boss defeat) |
| **Uses** | Collection screen completion, character unlocks, ultimate ability upgrades |

### I.4 · Codex Fragments [NEW]

| Property | Detail |
|---|---|
| **Appearance** | Page-like torn fragments with glowing void text |
| **Track placement** | One per world, hidden in an alternate path |
| **Collection** | Collect all 7 to unlock a lore entry and bonus skin |
| **Sets** | 5 fragment sets (one per Codex stage) = 35 total fragments |

### I.5 · Collection Summary Table

| Collectible | Rarity | Per Run (avg) | Primary Use | Secondary Use |
|---|---|---|---|---|
| Void Shards | Common | 150–300 | Soft currency | VE regen (+2 VE each) |
| Codex Essence | Uncommon | 5–15 | Direct XP | — |
| Beast Cores | Rare | 0–1 | Character unlocks, upgrades | Collection screen |
| Codex Fragments | Very Rare | 0–1 | Lore + bonus skins | Completionist milestone |

---

## J. ECONOMY

### J.1 · Currency Overview

| Currency | Earn Method | Spend Method | Type |
|---|---|---|---|
| **Void Shards (VS)** | In-run collection, mission rewards, daily chest | Ability upgrades, skins, shop items, revives | Soft (free) |
| **Codex Essence (CE)** | In-run collection | Auto-applied as XP (not spendable) | Progression |
| **Beast Cores (BC)** | Boss defeats, rare drops, weekly challenges | Character unlocks, ultimate upgrades | Hard-gated (rare) |
| **Void Crystals (VC)** | IAP only, starter pack, rare mission reward [NEW] | Premium skins, remove-ads, instant upgrades | Premium (paid) |

### J.2 · Earn Rates (per session, avg 2.5 min run)

| Source | VS / Run | CE / Run | BC / Run | Notes |
|---|---|---|---|---|
| Track collection (shards) | 180 | — | — | Base, no power-ups |
| Track collection (essence) | — | 8 | — | Base |
| Boss completion | 50 bonus | 5 bonus | 1 | Only if boss escaped |
| Near-miss bonuses | 20 | — | — | ~10 near-misses × 2 VS |
| Void Power shard bonuses | 30 | — | — | Grasping Dark / Voidwalk |
| **Total (average run)** | **~280** | **~13** | **~0.5** | — |
| With Double Shards power-up | ~380 | ~13 | ~0.5 | +~35% VS |
| With rewarded ad (double) | ~560 | ~13 | ~0.5 | Post-run ad |

### J.3 · Spend Rates

#### Ability Upgrades (VS cost)

| Upgrade Tier | VS Cost | SP Cost | Available From |
|---|---|---|---|
| Base → Upgrade 1 | 200 VS | 0 SP | Unlock level |
| Upgrade 1 → 2 | 500 VS | 1 SP | +3 levels |
| Upgrade 2 → 3 | 1,200 VS | 2 SP | +6 levels |
| **Full upgrade (one ability)** | **1,900 VS** | **3 SP** | — |

#### Skins (VS or VC cost) [NEW]

| Skin Tier | VS Cost | VC Cost (alt) | Examples |
|---|---|---|---|
| Common | 500 VS | — | Colour variants |
| Rare | 2,000 VS | 50 VC | Themed outfits (faction disguises) |
| Epic | 5,000 VS | 120 VC | Void-infused armour sets |
| Legendary | — | 250 VC (IAP only) | Transcendence forms, Codex Stage skins |

#### Character Unlocks [NEW]

| Character | Cost | Requirement |
|---|---|---|
| Leonard Meleak | 1,500 VS + 3 BC | Reach Codex Lv 10 |
| Rumbidzai Mash | 3,000 VS + 5 BC | Reach Codex Lv 20 |
| Precious Trisky | 2,500 VS + 4 BC | Reach Codex Lv 15 |
| Harry Koera | 4,000 VS + 7 BC | Reach Codex Lv 30 |
| Garfield Thorn | 6,000 VS + 10 BC | Reach Codex Lv 45 |
| Ruth Swait | 8,000 VS + 15 BC | Reach Codex Lv 60 |

#### Shop Items [ADAPTED from canon "Shop (Equivalent Exchange) unlocks at Level 10"]

| Item | Cost | Effect | Restock |
|---|---|---|---|
| VE Potion | 100 VS | Start run with +50 VE | Unlimited |
| Chaser Repellent | 250 VS | Chaser starts at 80 m instead of 60 m | Unlimited |
| Lucky Charm | 300 VS | +15% rare drop chance for 1 run | Unlimited |
| Codex Booster | 500 VS | +25% XP for 1 run | 3 per day |
| Beast Lure | 400 VS | Guarantees Beast Core drop from boss | 1 per day |

### J.4 · Session Economy Projection [NEW]

> Average player: 3 runs/day, 2.5 min each

| Timeframe | VS Earned | VS Spent (est.) | Net VS | Codex Levels Gained |
|---|---|---|---|---|
| Day 1 (3 runs) | 840 | 0 (learning) | +840 | 2–3 |
| Week 1 (21 runs) | ~6,000 | ~1,500 (first upgrades) | +4,500 | 8–10 |
| Month 1 (90 runs) | ~25,000 | ~12,000 (upgrades + skins + shop) | +13,000 | 25–30 |
| Month 3 (270 runs) | ~75,000 | ~55,000 | +20,000 | 55–65 |
| Month 6 (540 runs) | ~150,000 | ~130,000 | +20,000 | 85–95 |

### J.5 · Economy Health Checks [NEW]

| Metric | Target | Alarm If |
|---|---|---|
| VS inflation rate | Net positive but slowing | > 10,000 unspent VS at Lv 50 |
| Time to first meaningful purchase | 3–5 runs | > 10 runs (too slow) |
| Time to first character unlock | ~20 runs (Leonard) | > 35 runs |
| Premium currency necessity | Never needed for progression | Any ability locked behind VC |
| Ad reward vs. free earn | Ad doubles ≈ 1 extra run of shards | Ad gives > 3× free earn |

### J.6 · Anti-Inflation Safeguards [NEW]

| Safeguard | Mechanism |
|---|---|
| **Scaling costs** | Each subsequent ability upgrade tier costs 2.5× more than the previous |
| **Daily caps** | Codex Booster (3/day), Beast Lure (1/day) limit accelerated progression |
| **Character unlock gates** | Require both VS + BC + minimum Codex level — prevents currency hoarding from trivializing unlocks |
| **Cosmetic sink** | Skins are purely cosmetic with high VS costs — absorbs excess currency from veteran players |
| **Fragment sets** | Long-term collection goal that keeps veteran players engaged after economy matures |

### J.7 · Rewarded Ad Economy Integration [NEW]

| Ad Opportunity | Reward | Frequency Cap | Player Choice |
|---|---|---|---|
| Post-run double shards | 2× VS from that run | 3 per day | Optional |
| Revive (continue run) | Respawn at current distance, chaser → Distant | 1 per run | Optional |
| Free daily chest | 100–500 VS + chance at BC | 1 per day | Optional |
| Bonus Codex XP | +50% XP for next run | 2 per day | Optional |

> [!IMPORTANT]
> **No forced interstitials during the first 3 runs.** After run 3, a skippable interstitial may appear after every 3rd run (not during gameplay). Rewarded ads are always opt-in.

---

## Canon Elements Referenced in Part 2

| Element | Source | Usage |
|---|---|---|
| All 15 abilities | Canon Codex Stage 1–5 ability lists | Void Powers (Section F) |
| MP (MetaPoints) | Canon Umbral Codex Interface | Adapted to Void Energy |
| Skill Points (SP) | Canon system mechanics | SP upgrade tree |
| Beast Core Harnessing | Canon Lv 30 ability | Beast Core collectible |
| Shop (Equivalent Exchange) | Canon system mechanic, unlocks Lv 10 | Shop items (Section J) |
| Inventory unlocks Lv 3 | Canon system mechanic | Skin equip unlock |
| Currency system | Canon: silver/gold/platinum/credits | Adapted to VS/CE/BC/VC |
| XP through quests and beasts | Canon system mechanic | XP earn rates |

| Element | Status |
|---|---|
| Void Energy (VE) as runner resource | [ADAPTED] from MP |
| Power-ups (Magnet, Barrier, Double, Surge) | [NEW] — standard runner items |
| Equip slot system (1→2→passive→ultimate) | [NEW] |
| SP tree with 3 paths | [NEW] — structure is new, SP concept is canon |
| Codex Fragments collectible | [NEW] |
| Void Crystals (premium currency) | [NEW] |
| All numerical balance values | [NEW] |
| All visual/audio effect descriptions | [NEW] |

---

> **End of Part 2 (F–J)**
> 
> Type **"continue"** to receive **Part 3 (K–O): Portal Worlds, Boss Runs, Characters, Story Beats, Missions**
