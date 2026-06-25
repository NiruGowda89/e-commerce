$git = "C:\Program Files\Git\bin\git.exe"
$repo = "C:\D\e-commerce"

Write-Host "=== Staging all files ===" -ForegroundColor Cyan
& $git -C $repo add -A

Write-Host "`n=== Committing ===" -ForegroundColor Cyan
& $git -C $repo commit -m "Connect Aiven MySQL for Render deployment"

Write-Host "`n=== Pushing to origin/main ===" -ForegroundColor Cyan
& $git -C $repo push origin main

Write-Host "`n=== Verification ===" -ForegroundColor Cyan
& $git -C $repo log --oneline -3
& $git -C $repo status
