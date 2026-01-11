# MedInsight Keycloak Bootstrap Script (PowerShell 5.1+ Compatible)
# This script configures the medinsight realm, roles, and clients.

# --- Load .env variables if present ---
$envPath = Join-Path $PSScriptRoot "../.env"
if (Test-Path $envPath) {
    Write-Host "[INFO] Loading environment variables from $envPath" -ForegroundColor Gray
    foreach ($line in Get-Content $envPath) {
        if ($line -match "^(?<name>[^#=]+)=(?<value>.*)$") {
            $name = $matches.name.Trim()
            $value = $matches.value.Trim()
            if ($value -match "^['""](?<inner>.*)['""]$") { $value = $matches.inner }
            if (-not [string]::IsNullOrWhiteSpace($name)) {
                $ExecutionContext.SessionState.Path.SetLocation($PSScriptRoot) # Ensure we stay in scripts
                [System.Environment]::SetEnvironmentVariable($name, $value, "Process")
            }
        }
    }
}

$KEYCLOAK_URL = $env:KEYCLOAK_URL
if (-not $KEYCLOAK_URL -or $KEYCLOAK_URL -like "*keycloak:8080*") { 
    $KEYCLOAK_URL = "http://localhost:8180" 
}

$REALM = $env:KEYCLOAK_REALM
if (-not $REALM) { $REALM = "medinsight" }

$ADMIN_USER = $env:KEYCLOAK_ADMIN
if (-not $ADMIN_USER) { $ADMIN_USER = "admin" }

$ADMIN_PASS = $env:KEYCLOAK_ADMIN_PASSWORD
if (-not $ADMIN_PASS) { $ADMIN_PASS = "KeycloakAdmin2024!" }

# Clients and Secrets
$AUTH_SECRET = $env:AUTH_SERVICE_CLIENT_SECRET
if (-not $AUTH_SECRET) { $AUTH_SECRET = "auth-service-secret" }

$GATEWAY_SECRET = $env:GATEWAY_CLIENT_SECRET
if (-not $GATEWAY_SECRET) { $GATEWAY_SECRET = "gateway-secret" }

$CONFIDENTIAL_CLIENTS = @(
    @{ clientId = "auth-service"; secret = $AUTH_SECRET },
    @{ clientId = "medinsight-gateway"; secret = $GATEWAY_SECRET }
)
$FRONTEND_CLIENT_ID = "medinsight-frontend"

# Roles
$ROLES = @("ADMIN", "MEDECIN", "PATIENT", "GESTIONNAIRE", "RESPONSABLE_SECURITE")

Write-Host "`n[0/6] Configuration" -ForegroundColor Gray
Write-Host "    - URL:    $KEYCLOAK_URL"
Write-Host "    - Realm:  $REALM"
Write-Host "    - Admin:  $ADMIN_USER"
Write-Host "    - Pass:   ********"

Write-Host "`n[1/6] Getting Admin Token..." -ForegroundColor Cyan
try {
    $body = @{
        username   = $ADMIN_USER
        password   = $ADMIN_PASS
        grant_type = "password"
        client_id  = "admin-cli"
    }
    
    $tokenResponse = Invoke-RestMethod -Uri "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" `
        -Method Post `
        -ContentType "application/x-www-form-urlencoded" `
        -Body $body
        
    $TOKEN = $tokenResponse.access_token
    $headers = @{ 
        "Authorization" = "Bearer $TOKEN"
        "Content-Type"  = "application/json"
    }
    Write-Host "    [OK] Token obtained successfully." -ForegroundColor Green
} catch {
    Write-Host "    [ERROR] Failed to connect to Keycloak at $KEYCLOAK_URL" -ForegroundColor Red
    Write-Host "    Details: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Message -like "*401*") {
        Write-Host "    Hint: Check admin password (should match KEYCLOAK_ADMIN_PASSWORD in .env)" -ForegroundColor Yellow
    }
    exit
}

Write-Host "[2/6] Checking Realm '$REALM'..." -ForegroundColor Cyan
try {
    Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM" -Headers $headers -Method Get > $null
    Write-Host "    [OK] Realm exists." -ForegroundColor Yellow
} catch {
    Write-Host "    [INFO] Creating Realm '$REALM'..." -ForegroundColor Green
    $realmBody = @{ realm = $REALM; enabled = $true } | ConvertTo-Json
    Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms" -Headers $headers -Method Post -Body $realmBody
}

Write-Host "[3/6] Creating Roles..." -ForegroundColor Cyan
foreach ($role in $ROLES) {
    try {
        Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM/roles/$role" -Headers $headers -Method Get > $null
        Write-Host "    [OK] Role '$role' already exists." -ForegroundColor Yellow
    } catch {
        Write-Host "    [INFO] Creating Role '$role'..." -ForegroundColor Green
        $roleBody = @{ name = $role } | ConvertTo-Json
        Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM/roles" -Headers $headers -Method Post -Body $roleBody
    }
}

Write-Host "[4/6] Creating Confidential Clients..." -ForegroundColor Cyan
foreach ($client in $CONFIDENTIAL_CLIENTS) {
    $cid = $client.clientId
    $existing = Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM/clients?clientId=$cid" -Headers $headers -Method Get
    
    if ($existing.Count -eq 0) {
        Write-Host "    [INFO] Creating Client '$cid'..." -ForegroundColor Green
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
        Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM/clients" -Headers $headers -Method Post -Body $clientBody
    } else {
        Write-Host "    [OK] Client '$cid' already exists." -ForegroundColor Yellow
    }
}

Write-Host "[5/6] Creating Public Frontend Client (Port 3001/3000)..." -ForegroundColor Cyan
$existingFe = Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM/clients?clientId=$FRONTEND_CLIENT_ID" -Headers $headers -Method Get

if ($existingFe.Count -eq 0) {
    Write-Host "    [INFO] Creating Client '$FRONTEND_CLIENT_ID'..." -ForegroundColor Green
    $feBody = @{
        clientId     = $FRONTEND_CLIENT_ID
        enabled      = $true
        protocol     = "openid-connect"
        publicClient = $true
        redirectUris = @("http://localhost:3001/*", "http://localhost:3000/*")
        webOrigins   = @("http://localhost:3001", "http://localhost:3000")
    } | ConvertTo-Json
    Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM/clients" -Headers $headers -Method Post -Body $feBody
} else {
    Write-Host "    [OK] Client '$FRONTEND_CLIENT_ID' already exists." -ForegroundColor Yellow
}

Write-Host "[6/6] Configuring Social Identity Providers..." -ForegroundColor Cyan

function Create-IdP {
    param($provider, $clientId, $clientSecret)
    if (-not $clientId -or -not $clientSecret) { 
        Write-Host "    [SKIP] $provider credentials not found in env." -ForegroundColor DarkGray
        return 
    }

    Write-Host "    Checking Identity Provider '$provider'..." -ForegroundColor Gray
    try {
        Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM/identity-provider/instances/$provider" -Headers $headers -Method Get > $null
        Write-Host "    [OK] IDP '$provider' already exists." -ForegroundColor Yellow
    } catch {
        Write-Host "    [INFO] Creating IDP '$provider'..." -ForegroundColor Green
        $idpConfig = if ($provider -eq "google") {
            @{
                alias = "google"; providerId = "google"; enabled = $true; trustEmail = $true; storeToken = $true
                config = @{ clientId = $clientId; clientSecret = $clientSecret; defaultScope = "openid profile email"; useJwksUrl = "true" }
            }
        } else {
            @{
                alias = "github"; providerId = "github"; enabled = $true; trustEmail = $true; storeToken = $true
                config = @{ clientId = $clientId; clientSecret = $clientSecret; defaultScope = "user:email" }
            }
        }
        Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM/identity-provider/instances" -Headers $headers -Method Post -Body ($idpConfig | ConvertTo-Json -Depth 5)

        # Add Mapper
        $mapperBody = @{
            name = "default-patient-role"
            identityProviderAlias = $provider
            identityProviderMapper = "hardcoded-role-idp-mapper"
            config = @{ role = "PATIENT" }
        } | ConvertTo-Json
        Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM/identity-provider/instances/$provider/mappers" -Headers $headers -Method Post -Body $mapperBody
        Write-Host "    [OK] IDP '$provider' created with default PATIENT role mapper." -ForegroundColor Green
    }
}

$G_ID = $env:GOOGLE_CLIENT_ID
$G_SECRET = $env:GOOGLE_CLIENT_SECRET
$GH_ID = $env:GITHUB_CLIENT_ID
$GH_SECRET = $env:GITHUB_CLIENT_SECRET

Create-IdP "google" $G_ID $G_SECRET
Create-IdP "github" $GH_ID $GH_SECRET

Write-Host "`n[7/8] Creating Default Users..." -ForegroundColor Cyan

function New-KeycloakUser {
    param($Email, $FirstName, $LastName, $Password, $Role)
    
    Write-Host "    Creating user: $Email..." -ForegroundColor Gray
    $createUserUrl = "$KEYCLOAK_URL/admin/realms/$REALM/users"
    $userBody = @{
        username = $Email
        email = $Email
        firstName = $FirstName
        lastName = $LastName
        enabled = $true
        emailVerified = $true
    } | ConvertTo-Json
    
    try {
        Invoke-RestMethod -Uri $createUserUrl -Method Post -Headers $headers -Body $userBody
    } catch {
        if ($_.Exception.Response.StatusCode -eq 409) {
            Write-Host "    [OK] User already exists." -ForegroundColor Yellow
        } else {
            Write-Host "    [ERROR] Failed to create user: $_" -ForegroundColor Red
            return
        }
    }
    
    # Get user ID
    $getUserUrl = "$KEYCLOAK_URL/admin/realms/$REALM/users?username=$Email"
    $users = Invoke-RestMethod -Uri $getUserUrl -Method Get -Headers $headers
    $userId = $users[0].id
    
    # Set password
    $setPasswordUrl = "$KEYCLOAK_URL/admin/realms/$REALM/users/$userId/reset-password"
    $passwordBody = @{ type = "password"; value = $Password; temporary = $false } | ConvertTo-Json
    Invoke-RestMethod -Uri $setPasswordUrl -Method Put -Headers $headers -Body $passwordBody | Out-Null
    
    # Assign role
    $rolesUrl = "$KEYCLOAK_URL/admin/realms/$REALM/roles"
    $availableRoles = Invoke-RestMethod -Uri $rolesUrl -Method Get -Headers $headers
    $targetRole = $availableRoles | Where-Object { $_.name -eq $Role }
    
    if ($targetRole) {
        $assignRoleUrl = "$KEYCLOAK_URL/admin/realms/$REALM/users/$userId/role-mappings/realm"
        $roleBody = @(@{ id = $targetRole.id; name = $targetRole.name }) | ConvertTo-Json
        Invoke-RestMethod -Uri $assignRoleUrl -Method Post -Headers $headers -Body $roleBody -ContentType "application/json" | Out-Null
        Write-Host "    [OK] User '$Email' created with role $Role" -ForegroundColor Green
    }
}

# Create default test users
New-KeycloakUser "admin@medinsight.tn" "Admin" "MedInsight" "Admin123!" "ROLE_ADMIN"
New-KeycloakUser "security@medinsight.tn" "Security" "Officer" "Security123!" "ROLE_RESPONSABLE_SECURITE"
New-KeycloakUser "doctor@medinsight.tn" "Dr. Test" "Doctor" "Doctor123!" "ROLE_MEDECIN"
New-KeycloakUser "patient@medinsight.tn" "Test" "Patient" "Patient123!" "ROLE_PATIENT"

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Keycloak is now fully configured for MedInsight!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

Write-Host "`nTest Users Created:" -ForegroundColor Cyan
Write-Host "  📧 admin@medinsight.tn      | Password: Admin123!     | Role: ADMIN (Admin Dashboard)" -ForegroundColor White
Write-Host "  📧 security@medinsight.tn   | Password: Security123!  | Role: RESPONSABLE_SECURITE (Security)" -ForegroundColor White
Write-Host "  📧 doctor@medinsight.tn     | Password: Doctor123!    | Role: MEDECIN (Doctor)" -ForegroundColor White
Write-Host "  📧 patient@medinsight.tn    | Password: Patient123!   | Role: PATIENT (Patient)" -ForegroundColor White
Write-Host "`nLogin at: http://localhost:3000/login" -ForegroundColor Green
