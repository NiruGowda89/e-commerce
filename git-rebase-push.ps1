$git = "C:\Program Files\Git\bin\git.exe"
$repo = "C:\D\e-commerce"

# Reset back to origin/main, keeping all changes in working tree
Write-Host "=== Resetting to origin/main (keeping working tree) ===" -ForegroundColor Cyan
& $git -C $repo reset --soft origin/main

Write-Host "`n=== Staging all changes ===" -ForegroundColor Cyan
& $git -C $repo add -A

Write-Host "`n=== Creating single clean commit ===" -ForegroundColor Cyan
& $git -C $repo commit -m "Connect Aiven MySQL, fix Flyway migrations, update backend config"

Write-Host "`n=== Pushing ===" -ForegroundColor Cyan
& $git -C $repo push origin main

Write-Host "`n=== Done ===" -ForegroundColor Cyan
& $git -C $repo log --oneline -3
& $git -C $repo status
