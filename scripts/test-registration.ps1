# test-registration.ps1
$url = "http://localhost:8080/api/auth/register/patient"
$body = @{
    email = "test-$(Get-Random)@medinsight.tn"
    password = "Patient123!"
    firstName = "Test"
    lastName = "User"
    phoneNumber = "12345678"
    addressLine = "Test Street"
    city = "Tunis"
    country = "Tunisia"
    dateOfBirth = "1990-01-01"
    gender = "OTHER"
    bloodType = "O_POS"
} | ConvertTo-Json

Write-Host "Testing Registration at $url ..." -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType "application/json" -Verbose
    Write-Host "Success! Response:" -ForegroundColor Green
    $response | ConvertTo-Json
} catch {
    Write-Host "Failed with status code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "Error details:" -ForegroundColor Red
    $_.Exception.Message | Write-Host
    if ($_.ErrorDetails) { $_.ErrorDetails | Write-Host }
}
