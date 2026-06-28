$mysql = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
$backendDir = "C:\D\e-commerce\backend"
$frontendDir = "C:\D\e-commerce\Frontend"
$nodePath = "C:\D\e-commerce\tools\node\node-v20.11.1-win-x64"

# Prepend node path
$env:Path = "$nodePath;" + $env:Path

Write-Host "=== Step 1: Creating MySQL database ===" -ForegroundColor Cyan
& $mysql -u root -pgowda --execute="CREATE DATABASE IF NOT EXISTS ecommerce_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Database ecommerce_db created/verified successfully." -ForegroundColor Green
} else {
    Write-Host "DB creation may have failed. Check your MySQL root credentials." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Step 2: Preparing and Building Frontend ===" -ForegroundColor Cyan
Set-Location $frontendDir
if (!(Test-Path "node_modules")) {
    Write-Host "Installing Frontend dependencies..." -ForegroundColor Gray
    & "$nodePath\npm.cmd" install
}
Write-Host "Compiling React production build..." -ForegroundColor Gray
& "$nodePath\npm.cmd" run build

Write-Host ""
Write-Host "=== Step 3: Starting Node/Express backend ===" -ForegroundColor Cyan
Set-Location $backendDir
if (!(Test-Path "node_modules")) {
    Write-Host "Installing Backend dependencies..." -ForegroundColor Gray
    & "$nodePath\npm.cmd" install
}

Write-Host "Server starting on http://localhost:8080" -ForegroundColor Green
& "$nodePath\node.exe" server.js
