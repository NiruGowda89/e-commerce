# Sync script to copy Frontend files to Backend resources
$source = Join-Path $PSScriptRoot "Frontend"
$dest = Join-Path $PSScriptRoot "backend\src\main\resources\static"

if (Test-Path $source) {
    if (-not (Test-Path $dest)) {
        New-Item -ItemType Directory -Force -Path $dest
    }
    Write-Host "Syncing $source -> $dest ..."
    Copy-Item -Path "$source\*" -Destination $dest -Recurse -Force -Exclude "serve.ps1"
    Write-Host "Sync completed successfully."
} else {
    Write-Warning "Source directory not found: $source"
}
