# Parents Day deploy script
# Usage: .\scripts\deploy.ps1
# Options:
#   -SkipFrontend  skip frontend build/upload
#   -SkipBackend   skip backend build/upload

param(
  [switch]$SkipFrontend,
  [switch]$SkipBackend
)

$ErrorActionPreference = 'Stop'

# === Config ===
$SshHost   = '172.30.1.72'
$SshPort   = 64565
$SshUser   = 'rararete'
$RedeployHook = '/usr/local/bin/redeploy-parents-day.sh'

$RepoRoot     = (Resolve-Path "$PSScriptRoot\..").Path
$FrontendDir  = Join-Path $RepoRoot 'frontend'
$BackendDir   = Join-Path $RepoRoot 'backend'

$RemoteJar     = '/tmp/parents-day.jar'
$RemoteDistDir = '/tmp/dist-parents-day'

function Step($msg) { Write-Host "==> $msg" -ForegroundColor Cyan }

# === 1. Frontend build ===
if (-not $SkipFrontend) {
  Step 'Frontend build (npm run build)'
  Push-Location $FrontendDir
  try {
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "npm run build failed" }
  } finally { Pop-Location }
}

# === 2. Backend build ===
if (-not $SkipBackend) {
  Step 'Backend build (gradlew bootJar)'
  Push-Location $BackendDir
  try {
    & .\gradlew.bat bootJar --console=plain
    if ($LASTEXITCODE -ne 0) { throw "gradlew bootJar failed" }
  } finally { Pop-Location }

  $jar = Get-ChildItem (Join-Path $BackendDir 'build\libs') -Filter '*.jar' |
         Where-Object { $_.Name -notlike '*-plain.jar' } |
         Select-Object -First 1
  if (-not $jar) { throw "Built jar not found" }
  $LocalJar = $jar.FullName
}

# === 3. Upload ===
$sshTarget = "${SshUser}@${SshHost}"

Step 'Clean remote /tmp'
ssh -p $SshPort $sshTarget "rm -rf $RemoteDistDir && rm -f $RemoteJar"

if (-not $SkipBackend) {
  Step "Upload backend jar to $RemoteJar"
  scp -P $SshPort $LocalJar "${sshTarget}:$RemoteJar"
  if ($LASTEXITCODE -ne 0) { throw "scp backend failed" }
}

if (-not $SkipFrontend) {
  Step "Upload frontend dist to $RemoteDistDir"
  $distLocal = Join-Path $FrontendDir 'dist'
  ssh -p $SshPort $sshTarget "mkdir -p $RemoteDistDir"
  scp -P $SshPort -r "$distLocal/*" "${sshTarget}:$RemoteDistDir/"
  if ($LASTEXITCODE -ne 0) { throw "scp frontend failed" }
}

# === 4. Trigger redeploy hook (with -t for TTY) ===
Step 'Trigger redeploy hook (sudo)'
ssh -t -p $SshPort $sshTarget "sudo -n $RedeployHook"
if ($LASTEXITCODE -ne 0) { throw "redeploy hook failed" }

Write-Host "`nDeploy done!" -ForegroundColor Green
Write-Host "Check: https://im-hansub.co.kr" -ForegroundColor Green
