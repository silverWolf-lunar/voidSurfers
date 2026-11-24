# Downloads portable Android Build-Tools 34, Android Platform 34 & OpenJDK 17 into ..\_buildtools
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem

$workspace = Split-Path $PSScriptRoot
$toolsRoot = Join-Path $workspace "_buildtools"
$sdk = Join-Path $toolsRoot "sdk"
$jdkRoot = Join-Path $toolsRoot "jdk17"
$dlDir = Join-Path $toolsRoot "downloads"
New-Item -ItemType Directory -Force -Path "$sdk\build-tools", "$sdk\platforms", $jdkRoot, $dlDir | Out-Null

function Fetch-File($url, $dest, $label) {
  Write-Output "Downloading $label..."
  $ok = $false
  try {
    & curl.exe --http1.1 --ssl-no-revoke --retry 10 --retry-delay 2 --retry-all-errors -fSL -C - $url -o $dest
    if ($LASTEXITCODE -eq 0 -and (Test-Path $dest) -and (Get-Item $dest).Length -gt 1MB) { $ok = $true }
  } catch {}
  if (-not $ok) {
    Write-Output "Trying Windows BITS transfer for $label..."
    try {
      Import-Module BitsTransfer -ErrorAction SilentlyContinue
      Start-BitsTransfer -Source $url -Destination $dest -DisplayName $label
      if ((Test-Path $dest) -and (Get-Item $dest).Length -gt 1MB) { $ok = $true }
    } catch {}
  }
  if (-not $ok) {
    Write-Output "Trying .NET WebClient for $label..."
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12
    (New-Object System.Net.WebClient).DownloadFile($url, $dest)
  }
  $mb = [Math]::Round((Get-Item $dest).Length / 1MB, 1)
  Write-Output "$label ready ($mb MB)."
}

function Unzip-Clean($zipPath, $destDir) {
  if (Test-Path $destDir) { Remove-Item $destDir -Recurse -Force }
  New-Item -ItemType Directory -Force -Path $destDir | Out-Null
  [System.IO.Compression.ZipFile]::ExtractToDirectory($zipPath, $destDir)
}

# 1. Android Build-Tools 34.0.0 (~58 MB)
if (-not (Test-Path "$sdk\build-tools\34.0.0\aapt2.exe")) {
  $zip = Join-Path $dlDir "build-tools-34.zip"
  Fetch-File "https://dl.google.com/android/repository/build-tools_r34-windows.zip" $zip "Android Build-Tools 34"
  $tmp = Join-Path $dlDir "bt34_ext"
  Unzip-Clean $zip $tmp
  $inner = Get-ChildItem $tmp -Directory | Select-Object -First 1
  if (Test-Path "$sdk\build-tools\34.0.0") { Remove-Item "$sdk\build-tools\34.0.0" -Recurse -Force }
  Move-Item $inner.FullName "$sdk\build-tools\34.0.0"
  Remove-Item $zip, $tmp -Recurse -Force -ErrorAction SilentlyContinue
} else {
  Write-Output "Android Build-Tools 34 already installed."
}

# 2. Android Platform 34 (~62 MB)
if (-not (Test-Path "$sdk\platforms\android-34\android.jar")) {
  $zip = Join-Path $dlDir "platform-34.zip"
  Fetch-File "https://dl.google.com/android/repository/platform-34-ext7_r03.zip" $zip "Android Platform 34"
  $tmp = Join-Path $dlDir "pl34_ext"
  Unzip-Clean $zip $tmp
  $inner = Get-ChildItem $tmp -Directory | Select-Object -First 1
  if (Test-Path "$sdk\platforms\android-34") { Remove-Item "$sdk\platforms\android-34" -Recurse -Force }
  Move-Item $inner.FullName "$sdk\platforms\android-34"
  Remove-Item $zip, $tmp -Recurse -Force -ErrorAction SilentlyContinue
} else {
  Write-Output "Android Platform 34 already installed."
}

# 3. Portable OpenJDK 17 (~180 MB)
$existingJavac = Get-ChildItem $jdkRoot -Recurse -Filter "javac.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $existingJavac) {
  $zip = Join-Path $dlDir "msjdk17.zip"
  Fetch-File "https://aka.ms/download-jdk/microsoft-jdk-17-windows-x64.zip" $zip "Microsoft OpenJDK 17"
  Unzip-Clean $zip $jdkRoot
  Remove-Item $zip -Force -ErrorAction SilentlyContinue
  $existingJavac = Get-ChildItem $jdkRoot -Recurse -Filter "javac.exe" | Select-Object -First 1
} else {
  Write-Output "OpenJDK 17 already installed."
}

Write-Output "TOOLS_READY: javac=$($existingJavac.FullName) aapt2=$(Test-Path "$sdk\build-tools\34.0.0\aapt2.exe") androidJar=$(Test-Path "$sdk\platforms\android-34\android.jar")"
