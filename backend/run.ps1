$javaHome = 'C:\Program Files\Java\jdk-26.0.1'
[System.Environment]::SetEnvironmentVariable('JAVA_HOME', $javaHome, 'Process')
$env:PATH = "$javaHome\bin;" + [System.Environment]::GetEnvironmentVariable('PATH', 'Machine')
Write-Host "Using Java: $(java -version 2>&1 | Select-Object -First 1)"
Write-Host "Using Maven: $(mvn -version 2>&1 | Select-Object -First 1)"
mvn spring-boot:run
