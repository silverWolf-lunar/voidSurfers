# One-Click Setup & Build Script for MillerVoidRun.apk
$ErrorActionPreference = 'Stop'
& (Join-Path $PSScriptRoot "download_tools.ps1")
& (Join-Path $PSScriptRoot "build_apk.ps1")
