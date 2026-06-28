$git = "C:\Program Files\Git\bin\git.exe"
$repo = "C:\D\e-commerce"
& $git -C $repo add -A
& $git -C $repo commit -m "Remove QR from UPI section, show clean payment confirmation button"
& $git -C $repo push origin main
& $git -C $repo log --oneline -3
& $git -C $repo status
