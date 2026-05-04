# Parents Day 배포 스크립트
# 사용: .\scripts\deploy.ps1
# 옵션:
#   -SkipFrontend  프론트 빌드/업로드 스킵 (백엔드만)
#   -SkipBackend   백엔드 빌드/업로드 스킵 (프론트만)

param(
  [switch]$SkipFrontend,
  [switch]$SkipBackend
)

$ErrorActionPreference = 'Stop'

# === 설정 ===
$SshHost   = '172.30.1.72'
$SshPort   = 64565
$SshUser   = 'rararete'
$RedeployHook = '/usr/local/bin/redeploy-parents-day.sh'

$RepoRoot     = (Resolve-Path "$PSScriptRoot\..").Path
$FrontendDir  = Join-Path $RepoRoot 'frontend'
$BackendDir   = Join-Path $RepoRoot 'backend'

$RemoteJar     = '/tmp/app.jar'
$RemoteDistDir = '/tmp/dist-parents-day'

function Step($msg) { Write-Host "==> $msg" -ForegroundColor Cyan }

# === 1. 프론트 빌드 ===
if (-not $SkipFrontend) {
  Step '프론트 빌드 (npm run build)'
  Push-Location $FrontendDir
  try {
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "npm run build 실패" }
  } finally { Pop-Location }
}

# === 2. 백엔드 빌드 ===
if (-not $SkipBackend) {
  Step '백엔드 빌드 (gradlew bootJar)'
  Push-Location $BackendDir
  try {
    & .\gradlew.bat bootJar --console=plain
    if ($LASTEXITCODE -ne 0) { throw "gradlew bootJar 실패" }
  } finally { Pop-Location }

  $jar = Get-ChildItem (Join-Path $BackendDir 'build\libs') -Filter '*.jar' |
         Where-Object { $_.Name -notlike '*-plain.jar' } |
         Select-Object -First 1
  if (-not $jar) { throw "빌드된 jar를 찾을 수 없음" }
  $LocalJar = $jar.FullName
}

# === 3. 업로드 ===
$sshTarget = "${SshUser}@${SshHost}"
$sshOpts   = "-p $SshPort"

# 원격에서 /tmp 정리 (이전 배포 잔재 제거)
Step '원격 /tmp 정리'
ssh -p $SshPort $sshTarget "rm -rf $RemoteDistDir && rm -f $RemoteJar"

if (-not $SkipBackend) {
  Step "백엔드 jar 업로드 → $RemoteJar"
  scp -P $SshPort $LocalJar "${sshTarget}:$RemoteJar"
  if ($LASTEXITCODE -ne 0) { throw "scp 백엔드 실패" }
}

if (-not $SkipFrontend) {
  Step "프론트 dist 업로드 → $RemoteDistDir"
  $distLocal = Join-Path $FrontendDir 'dist'
  ssh -p $SshPort $sshTarget "mkdir -p $RemoteDistDir"
  scp -P $SshPort -r "$distLocal/*" "${sshTarget}:$RemoteDistDir/"
  if ($LASTEXITCODE -ne 0) { throw "scp 프론트 실패" }
}

# === 4. 재배포 훅 호출 ===
Step '원격 재배포 훅 실행 (sudo)'
ssh -p $SshPort $sshTarget "sudo $RedeployHook"
if ($LASTEXITCODE -ne 0) { throw "재배포 훅 실패" }

Write-Host "`n배포 완료!" -ForegroundColor Green
Write-Host "확인: https://im-hansub.co.kr" -ForegroundColor Green
