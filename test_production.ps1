$ErrorActionPreference = "Stop"
$apiUrl = "https://helio-backend-s55x.onrender.com/api/v1"

Write-Host "1. Testing /health..."
$health = Invoke-RestMethod -Uri "https://helio-backend-s55x.onrender.com/health" -Method Get
Write-Host "Health: $($health.status)"

Write-Host "`n2. Testing /auth/login..."
$body = @{ email = "demo-admin@helio.com"; password = "admin1234" } | ConvertTo-Json
try {
    $loginResponse = Invoke-RestMethod -Uri "$apiUrl/auth/login" -Method Post -Body $body -ContentType "application/json"
    $token = $loginResponse.access_token
    Write-Host "Login successful. Token obtained."
} catch {
    Write-Host "Login failed: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        Write-Host "Response body: $($reader.ReadToEnd())"
    }
    exit 1
}

Write-Host "`n3. Testing /auth/me..."
try {
    $meResponse = Invoke-RestMethod -Uri "$apiUrl/auth/me" -Method Get -Headers @{ Authorization = "Bearer $token" }
    Write-Host "Me Response: $($meResponse | ConvertTo-Json -Depth 2)"
    Write-Host "Platform Role: $($meResponse.platform_role)"
} catch {
    Write-Host "/auth/me failed: $($_.Exception.Message)"
    exit 1
}

Write-Host "`n4. Testing /admin/users..."
try {
    $usersResponse = Invoke-RestMethod -Uri "$apiUrl/admin/users" -Method Get -Headers @{ Authorization = "Bearer $token" }
    Write-Host "Users retrieved: $($usersResponse.items.Count)"
} catch {
    Write-Host "/admin/users failed: $($_.Exception.Message)"
    exit 1
}

Write-Host "`nAll Production Tests Passed!"
