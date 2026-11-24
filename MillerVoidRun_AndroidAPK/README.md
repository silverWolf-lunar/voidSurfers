# MILLER: VOID RUN — Native Android APK Shell

This folder compiles `MillerVoidRun_Playable/www/` into a signed, installable Android APK (`../MillerVoidRun.apk`) with:
- Portrait lock (`android:screenOrientation="portrait"`) + Sticky Immersive Fullscreen
- Hardware-accelerated WebGL 2.0 `WebView` with local virtual origin (`https://voidrun.local/`) for zero-CORS ES modules & offline play
- Native `AndroidBridge` for haptic vibration & native Android Share Sheets
- Deep-link intent filter for `voidrun://challenge?d=...&u=...&seed=...`
- Multi-density custom app icons (`mipmap-mdpi` through `mipmap-xxxhdpi`)

## Rebuild APK Anytime
```powershell
powershell -ExecutionPolicy Bypass -File .\build_apk.ps1
```
