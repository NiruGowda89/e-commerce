$git = "C:\Program Files\Git\bin\git.exe"
$repo = "C:\D\e-commerce"

Write-Host "=== Staging ===" -ForegroundColor Cyan
& $git -C $repo add -A

Write-Host "`n=== Committing ===" -ForegroundColor Cyan
& $git -C $repo commit -m "Fix: tag orders with userId on place, admin sees all orders, users see own only"

Write-Host "`n=== Pushing ===" -ForegroundColor Cyan
& $git -C $repo push origin main

Write-Host "`n=== Done ===" -ForegroundColor Cyan
& $git -C $repo log --oneline -3
& $git -C $repo status
