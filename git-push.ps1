$git = "C:\Program Files\Git\bin\git.exe"
$repo = "C:\D\e-commerce"
& $git -C $repo add -A
& $git -C $repo commit -m "Add product: replace image URL input with multi-image file picker (base64 localStorage)"
& $git -C $repo push origin main
& $git -C $repo log --oneline -3
& $git -C $repo status
