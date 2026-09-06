$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$nodeDir = Join-Path $root ".tools\nodejs"
if (Test-Path (Join-Path $nodeDir "npm.cmd")) {
  $env:Path = "$nodeDir;$env:Path"
}
Set-Location (Join-Path $root "web")
Write-Host "AppO → http://localhost:3000"
npm run dev
