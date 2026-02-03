param (
    [Parameter(Mandatory=$true)]
    [string]$ServiceName
)

$ErrorActionPreference = "Stop"

Write-Host "[WAIT] Starting optimized build for $ServiceName..." -ForegroundColor Cyan

# Use a local variable to ensure scoping
$LocalServiceName = $ServiceName

# 1. Build the JAR locally (uses host Maven cache)
Write-Host "[BUILD] Compiling JAR..." -ForegroundColor Yellow
$BackendRootDir = Resolve-Path "$PSScriptRoot/../Backend"
$ServiceDir = Join-Path $BackendRootDir $LocalServiceName
Set-Location -Path $ServiceDir

# Explicitly call mvn.cmd and wait for it
cmd /c "mvn clean package -DskipTests"
if ($LASTEXITCODE -ne 0) { throw "Maven build failed for $LocalServiceName" }

# 2. Configure PowerShell to use Minikube's Docker
Write-Host "[DOCKER] Connecting to Minikube Docker Environment..." -ForegroundColor Yellow
& minikube -p minikube docker-env --shell powershell | Out-String | Invoke-Expression

# 3. Build the Docker image using the fast Dockerfile
# We use the local JAR file we just built
$TargetDir = Join-Path $ServiceDir "target"
$JarFile = Get-ChildItem -Path $TargetDir -Filter "*.jar" | Select-Object -First 1
if (-not $JarFile) {
    Write-Error "No JAR file found in target directory!" -ErrorAction Stop
}

Write-Host "[DOCKER] Building Docker Image (Fast Mode)..." -ForegroundColor Yellow
$BackendDir = Resolve-Path (Join-Path $PSScriptRoot "../Backend")
Set-Location -Path $BackendDir

$ImageTag = "kchalouah/medinsight-${LocalServiceName}:latest"
$JarPath = "${LocalServiceName}/target/$($JarFile.Name)"

docker build -t "$ImageTag" -f Dockerfile.fast --build-arg "JAR_FILE=$JarPath" .

# 4. Restart the deployment in Kubernetes
Write-Host "[K8S] Restarting Kubernetes Deployment..." -ForegroundColor Yellow
kubectl rollout restart deployment $LocalServiceName -n medinsight

Write-Host "[SUCCESS] System updated successfully!" -ForegroundColor Green
