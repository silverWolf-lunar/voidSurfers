# MILLER: VOID RUN — Complete Android Game Deliverables

Built directly from all 5 parts of the **MILLER: VOID RUN** GDD (`MILLER_VOID_RUN_GDD_Part1-5.md`) and `AAA_Mobile_Portrait_Art_Prompts.md`.

## What's Included

1. **`MillerVoidRun_Playable/`** — Full Playable 3D Portrait Mobile Game (Three.js WebGL + Web Audio)
   - Run `powershell -ExecutionPolicy Bypass -File .\MillerVoidRun_Playable\serve.ps1` and open `http://127.0.0.1:8765/` in Chrome (desktop or mobile view).
   - **Controls:** Swipe Left/Right/Up/Down (or Arrow Keys / WASD), Tap bottom-right **Void Power** button (or `Space` / `E`), Double-Tap (or `Q`) to swap Slot 1/2, `R` for Ultimate (`Singularity Soul`).
   - **Full GDD Scope:** All 7 Portal Worlds + unique mechanics, 7 Beast-Tier Chasers, 7 Multi-Phase Faction Bosses with QTE escapes, 15 Canon Void Powers across 5 Codex stages, 7 Playable Characters, 3-Path SP Tree, Shop, Daily/Weekly/Per-Run Missions, 5-Act Comic Story Beats, Daily Challenge Seed, Ghost Runner & Best Moment Slow-Mo Clip Replay.
   - **Playtester Tip:** Go to **Settings -> Developer Tools -> `+10 Codex Lv & 5K VS`** to unlock all 7 worlds & test high-stage powers instantly.

2. **`MillerVoidRun_AndroidAPK/`** — Native Android APK Shell (API 24–34, Portrait, Hardware WebGL + Haptics + Share Sheet + `voidrun://challenge` Deep Links)
   - Contains bundled offline `www/` assets and generated `mipmap-mdpi` → `xxxhdpi` launcher icons.
   - To compile & sign `MillerVoidRun.apk` in one step (auto-installs portable OpenJDK 17 + Android 34 build tools into `%LOCALAPPDATA%\Android`):
     ```powershell
     powershell -ExecutionPolicy Bypass -File .\MillerVoidRun_AndroidAPK\setup_and_build_apk.ps1
     ```

3. **`MillerVoidRun_Unity/`** — Complete Unity 2022.3 LTS (C# / URP) Project
   - Matches GDD Part 5 verbatim (`Packages/manifest.json`, 4 custom URP HLSL shaders, 13 C# runtime scripts, offline-ready Firebase/AdMob/Play Billing adapters).
   - Open in Unity Hub (2022.3 LTS), then run **`Void Run > 1. Generate All Data Assets & Scenes`** and **`Void Run > 2. Build Android APK`**.

4. **`SharedArt/`** — Custom generated 2D key art (`app_icon.png`, `key_art_poster.png`, `codex_banner.png`) shared across all builds.
