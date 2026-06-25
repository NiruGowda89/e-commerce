$mysql = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
$mvn = "C:\Program Files\Apache\Maven\apache-maven-3.9.15\bin\mvn.cmd"
$javaHome = "C:\Program Files\Java\jdk-26.0.1"
$backendDir = "C:\D\e-commerce\backend"

# Set JAVA_HOME
$env:JAVA_HOME = $javaHome
$env:Path = "$javaHome\bin;" + $env:Path

Write-Host "=== Step 1: Creating MySQL database ===" -ForegroundColor Cyan

$sqlScript = "CREATE DATABASE IF NOT EXISTS ecommerce_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; SHOW DATABASES;"
$sqlScript | Out-File -FilePath "$env:TEMP\init_db.sql" -Encoding ASCII

& $mysql -u root -pgowda --execute="CREATE DATABASE IF NOT EXISTS ecommerce_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Database ecommerce_db created/verified successfully." -ForegroundColor Green
} else {
    Write-Host "DB creation may have failed. Check your MySQL root password in application.properties." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Step 2: Building and running Spring Boot backend ===" -ForegroundColor Cyan

Set-Location $backendDir

& $mvn spring-boot:run "-Dspring-boot.run.jvmArguments=-Djava.net.preferIPv4Stack=true"
