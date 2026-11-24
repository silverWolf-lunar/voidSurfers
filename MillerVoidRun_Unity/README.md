# MILLER: VOID RUN — Unity 2022.3 LTS (C# / URP) Project

Matches **MILLER: VOID RUN GDD Parts 1–5** verbatim.

## Quick Start in Unity Editor
1. Open **Unity Hub** → **Add project from disk** → select `MillerVoidRun_Unity/`.
2. Open with **Unity 2022.3 LTS** (with Android Build Support + URP).
3. In the top menu bar, click **`Void Run > 1. Generate All Data Assets & Scenes`**.
   - Automatically generates all **7 Portal World** ScriptableObjects, **7 Character** ScriptableObjects, **15 Canon Void Power** ScriptableObjects, configures Portrait/Linear/IL2CPP/API 24–34 Android settings, and builds `Assets/_Project/Scenes/CoreRun.unity`.
4. Press **Play** to test immediately (WASD/Arrows + Space for Void Power + Q to swap), or click **`Void Run > 2. Build Android APK`** to compile `Builds/MillerVoidRun_Unity.apk`.

## Drop-In Custom Assets & Live SDKs
- **Custom 3D Models / Audio:** Drop `.fbx`/`.glb` models into `Assets/_Project/CustomOverrides/Models/` and `.ogg`/`.wav` stems into `Assets/_Project/CustomOverrides/Audio/`, then assign them on the generated `CharacterData` / `WorldData` ScriptableObjects.
- **Firebase / AdMob / Google Play Billing:** Paste your live keys into `VoidRunServices` (`Assets/_Project/Scripts/Core/ServiceAdapters.cs`). Runs cleanly in offline sandbox mode out-of-the-box.
