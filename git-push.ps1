$git = "C:\Program Files\Git\bin\git.exe"
$repo = "C:\D\e-commerce"

Write-Host "=== Git Status ===" -ForegroundColor Cyan
& $git -C $repo status

Write-Host "`n=== Staging all files ===" -ForegroundColor Cyan
& $git -C $repo add -A

Write-Host "`n=== Committing ===" -ForegroundColor Cyan
& $git -C $repo commit -m "Fix: MySQL migration, Flyway version, backend config and run scripts"

Write-Host "`n=== Pushing to origin/main ===" -ForegroundColor Cyan
& $git -C $repo push origin main

Write-Host "`n=== Remote verification ===" -ForegroundColor Cyan
& $git -C $repo log --oneline -5
& $git -C $repo remote -v
& $git -C $repo status
