$git = "C:\Program Files\Git\bin\git.exe"
$repo = "C:\D\e-commerce"

Write-Host "=== Staging updated render.yaml (no secret) ===" -ForegroundColor Cyan
& $git -C $repo add render.yaml

Write-Host "`n=== Amending last commit ===" -ForegroundColor Cyan
& $git -C $repo commit --amend --no-edit

Write-Host "`n=== Force pushing amended commit ===" -ForegroundColor Cyan
& $git -C $repo push origin main --force-with-lease

Write-Host "`n=== Verification ===" -ForegroundColor Cyan
& $git -C $repo log --oneline -3
& $git -C $repo status
