$mysql = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"

Write-Host "Resetting ecommerce_db for clean Flyway migration..." -ForegroundColor Cyan

$sql = @"
USE ecommerce_db;
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS flyway_schema_history;
DROP TABLE IF EXISTS cart;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS coupons;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;
"@

$sql | Out-File -FilePath "$env:TEMP\reset_db.sql" -Encoding ASCII
& $mysql -u root -pgowda ecommerce_db --execute="SET FOREIGN_KEY_CHECKS=0; DROP TABLE IF EXISTS flyway_schema_history,cart,reviews,orders,coupons,products,users; SET FOREIGN_KEY_CHECKS=1;"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Database reset successfully." -ForegroundColor Green
} else {
    Write-Host "Reset may have had issues, continuing anyway..." -ForegroundColor Yellow
}
