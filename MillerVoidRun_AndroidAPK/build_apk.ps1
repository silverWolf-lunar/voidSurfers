# MILLER: VOID RUN — Deterministic Offline Android APK Compiler & Signer
# Compiles MillerVoidRun_Playable/www + MainActivity.java into ..\MillerVoidRun.apk

$ErrorActionPreference = 'Stop'
$projRoot = $PSScriptRoot
$workspace = Split-Path $projRoot
$appDir = Join-Path $projRoot "app\src\main"
$buildDir = Join-Path $projRoot "build"
$webSrc = Join-Path $workspace "MillerVoidRun_Playable\www"
$assetsDst = Join-Path $appDir "assets\www"
$outApk = Join-Path $workspace "MillerVoidRun.apk"

# Sync latest web game assets
if (Test-Path $webSrc) {
  if (Test-Path $assetsDst) { Remove-Item $assetsDst -Recurse -Force }
  Copy-Item $webSrc $assetsDst -Recurse -Force
}

# Locate SDK & JDK (checks workspace _buildtools first, then %LOCALAPPDATA%\Android, then PATH)
$toolsRoot = Join-Path $workspace "_buildtools"
$sdkCandidates = @(
  (Join-Path $toolsRoot "sdk"),
  $env:ANDROID_HOME,
  "$env:LOCALAPPDATA\Android\Sdk"
) | Where-Object { $_ -and (Test-Path "$_\platforms\android-34\android.jar" -ErrorAction SilentlyContinue) }
$sdk = $sdkCandidates | Select-Object -First 1
if (-not $sdk) { throw "Android SDK 34 not found. Run .\download_tools.ps1 first." }

$javacFile = Get-ChildItem (Join-Path $toolsRoot "jdk17") -Recurse -Filter "javac.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $javacFile) {
  $javacFile = Get-ChildItem "$env:LOCALAPPDATA\Android\jdk17" -Recurse -Filter "javac.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
}
if ($javacFile) {
  $javaHome = Split-Path (Split-Path $javacFile.FullName)
  $env:JAVA_HOME = $javaHome
  $env:PATH = "$javaHome\bin;$env:PATH"
}
if (-not (Get-Command javac -ErrorAction SilentlyContinue)) {
  throw "JDK 17 (javac) not found. Run .\download_tools.ps1 first."
}

$bt = "$sdk\build-tools\34.0.0"
$androidJar = "$sdk\platforms\android-34\android.jar"
if (-not (Test-Path "$bt\aapt2.exe")) { throw "Missing $bt\aapt2.exe" }

if (Test-Path $buildDir) { Remove-Item $buildDir -Recurse -Force }
New-Item -ItemType Directory -Force -Path "$buildDir\res_compiled", "$buildDir\gen", "$buildDir\classes", "$buildDir\dex" | Out-Null

Write-Output "[1/6] Compiling Android resources with aapt2..."
& "$bt\aapt2.exe" compile --dir "$appDir\res" -o "$buildDir\res_compiled\resources.zip"
if ($LASTEXITCODE -ne 0) { throw "aapt2 compile failed" }

Write-Output "[2/6] Linking resources & manifest..."
& "$bt\aapt2.exe" link `
  -I $androidJar `
  --manifest "$appDir\AndroidManifest.xml" `
  --java "$buildDir\gen" `
  -o "$buildDir\unsigned.apk" `
  "$buildDir\res_compiled\resources.zip"
if ($LASTEXITCODE -ne 0) { throw "aapt2 link failed" }

Write-Output "[3/6] Compiling Java sources (MainActivity & R.java)..."
$javaFiles = @(
  (Get-ChildItem "$buildDir\gen" -Recurse -Filter "*.java").FullName
  (Get-ChildItem "$appDir\java" -Recurse -Filter "*.java").FullName
)
& javac --release 11 -classpath $androidJar -d "$buildDir\classes" $javaFiles
if ($LASTEXITCODE -ne 0) { throw "javac failed" }

Write-Output "[4/6] Converting bytecode to classes.dex via d8..."
$classFiles = (Get-ChildItem "$buildDir\classes" -Recurse -Filter "*.class").FullName
& "$bt\d8.bat" --min-api 24 --lib $androidJar --output "$buildDir\dex" $classFiles
if ($LASTEXITCODE -ne 0) { throw "d8 failed" }

Write-Output "[5/6] Packaging classes.dex & POSIX-path www assets into APK, then zipaligning..."
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::Open("$buildDir\unsigned.apk", [System.IO.Compression.ZipArchiveMode]::Update)
[System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, "$buildDir\dex\classes.dex", "classes.dex", [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
$assetsRoot = (Resolve-Path "$appDir\assets").Path
foreach ($f in (Get-ChildItem $assetsRoot -Recurse -File)) {
  $rel = $f.FullName.Substring($assetsRoot.Length + 1) -replace '\\', '/'
  $entryName = "assets/$rel"
  [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $f.FullName, $entryName, [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
}
$zip.Dispose()

& "$bt\zipalign.exe" -f -p 4 "$buildDir\unsigned.apk" "$buildDir\aligned.apk"
if ($LASTEXITCODE -ne 0) { throw "zipalign failed" }

Write-Output "[6/6] Signing APK with debug keystore via apksigner..."
$keystore = Join-Path $projRoot "voidrun-debug.jks"
if (-not (Test-Path $keystore)) {
  & keytool -genkeypair -v -keystore $keystore -storepass android -alias voidrun -keypass android -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=VoidRun,O=MillerVoidRun,C=US" | Out-Null
}
& "$bt\apksigner.bat" sign --ks $keystore --ks-pass pass:android --key-pass pass:android --out $outApk "$buildDir\aligned.apk"
if ($LASTEXITCODE -ne 0) { throw "apksigner sign failed" }

& "$bt\apksigner.bat" verify --verbose $outApk
if ($LASTEXITCODE -ne 0) { throw "apksigner verify failed" }

$sizeMB = [Math]::Round((Get-Item $outApk).Length / 1MB, 2)
Write-Output "SUCCESS: Built & verified $outApk ($sizeMB MB)"
