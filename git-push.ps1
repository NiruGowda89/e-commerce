$git = "C:\Program Files\Git\bin\git.exe"
$repo = "C:\D\e-commerce"

Write-Host "=== Staging ===" -ForegroundColor Cyan
& $git -C $repo add -A

Write-Host "`n=== Committing ===" -ForegroundColor Cyan
& $git -C $repo commit -m "Disable Place Order until payment done; move Change Password to App Settings"

Write-Host "`n=== Pushing ===" -ForegroundColor Cyan
& $git -C $repo push origin main

Write-Host "`n=== Done ===" -ForegroundColor Cyan
& $git -C $repo log --oneline -3
& $git -C $repo status
