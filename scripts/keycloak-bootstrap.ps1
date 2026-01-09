$KEYCLOAK_URL = "http://localhost:8180"
$REALM = "medinsight"
$ADMIN_USER = "admin"
$ADMIN_PASS = "KeycloakAdmin2024!"

# Clients and Secrets
$CLIENTS = @(
    @{ clientId = "auth-service"; secret = "auth-service-secret" },
    @{ clientId = "medinsight-gateway"; secret = "gateway-secret" }
)

# Roles
$ROLES = @("ADMIN", "MEDECIN", "PATIENT", "GESTIONNAIRE", "RESPONSABLE_SECURITE")

Write-Host "[1/5] Getting Admin Token..." -ForegroundColor Cyan
try {
    $tokenResponse = Invoke-RestMethod -Uri "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" `
        -Method Post `
        -ContentType "application/x-www-form-urlencoded" `
        -Body @{
            username   = $ADMIN_USER
            password   = $ADMIN_PASS
            grant_type = "password"
            client_id  = "admin-cli"
        }
    $TOKEN = $tokenResponse.access_token
    $headers = @{ Authorization = "Bearer $TOKEN" }
} catch {
    Write-Error "Failed to connect to Keycloak. Is it running on $KEYCLOAK_URL?"
    exit
}

Write-Host "[2/5] Checking Realm '$REALM'..." -ForegroundColor Cyan
try {
    Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM" -Headers $headers -Method Get > $null
    Write-Host "Realm already exists." -ForegroundColor Yellow
} catch {
    Write-Host "Creating Realm '$REALM'..." -ForegroundColor Green
    $realmBody = @{ realm = $REALM; enabled = $true } | ConvertTo-Json
    Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms" -Headers $headers -Method Post -Body $realmBody -ContentType "application/json"
}

Write-Host "[3/5] Creating Roles..." -ForegroundColor Cyan
foreach ($role in $ROLES) {
    try {
        Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM/roles/$role" -Headers $headers -Method Get > $null
        Write-Host "Role '$role' already exists." -ForegroundColor Yellow
    } catch {
        Write-Host "Creating Role '$role'..." -ForegroundColor Green
        $roleBody = @{ name = $role } | ConvertTo-Json
        Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM/roles" -Headers $headers -Method Post -Body $roleBody -ContentType "application/json"
    }
}

Write-Host "[4/5] Creating Confidential Clients..." -ForegroundColor Cyan
foreach ($client in $CLIENTS) {
    $cid = $client.clientId
    $existing = Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM/clients?clientId=$cid" -Headers $headers -Method Get
    if ($existing.Count -eq 0) {
        Write-Host "Creating Client '$cid'..." -ForegroundColor Green
        $clientBody = @{
            clientId               = $cid
            enabled                = $true
            protocol               = "openid-connect"
            serviceAccountsEnabled = $true
            publicClient           = $false
            secret                 = $client.secret
            redirectUris           = @("*")
            webOrigins             = @("*")
        } | ConvertTo-Json
        Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM/clients" -Headers $headers -Method Post -Body $clientBody -ContentType "application/json"
    } else {
        Write-Host "Client '$cid' already exists." -ForegroundColor Yellow
    }
}

Write-Host "[5/5] Finalizing..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Green
Write-Host "Keycloak is now configured for MedInsight!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
