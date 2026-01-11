#!/usr/bin/env bash
set -euo pipefail

# This script bootstraps Keycloak for MedInsight: creates realm, roles, and a confidential client
# Requirements:
# - Keycloak Admin REST API reachable at $KEYCLOAK_URL (e.g., http://keycloak:8080)
# - Admin credentials in $KEYCLOAK_ADMIN / $KEYCLOAK_ADMIN_PASSWORD
# - Environment variables below can be overridden as needed

: "${KEYCLOAK_URL:=http://keycloak:8080}"
: "${KEYCLOAK_REALM:=medinsight}"
: "${KEYCLOAK_ADMIN:=admin}"
: "${KEYCLOAK_ADMIN_PASSWORD:=admin}"
: "${GATEWAY_CLIENT_ID:=medinsight-gateway}"
: "${GATEWAY_CLIENT_SECRET:=gateway-secret}"
: "${AUTH_SERVICE_CLIENT_ID:=auth-service}"
: "${AUTH_SERVICE_CLIENT_SECRET:=auth-service-secret}"
: "${FRONTEND_CLIENT_ID:=medinsight-frontend}"

# Roles to create at realm level
ROLES=("ADMIN" "MEDECIN" "PATIENT" "GESTIONNAIRE" "RESPONSABLE_SECURITE")

get_token() {
  curl -s -X POST "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" \
    -H 'Content-Type: application/x-www-form-urlencoded' \
    -d "username=$KEYCLOAK_ADMIN" \
    -d "password=$KEYCLOAK_ADMIN_PASSWORD" \
    -d 'grant_type=password' \
    -d 'client_id=admin-cli' | jq -r '.access_token'
}

create_realm_if_missing() {
  local token="$1"
  echo "[INFO] Ensuring realm '$KEYCLOAK_REALM' exists"
  local status
  status=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $token" \
    "$KEYCLOAK_URL/admin/realms/$KEYCLOAK_REALM")
  if [[ "$status" == "200" ]]; then
    echo "[OK] Realm exists"
  else
    echo "[INFO] Creating realm '$KEYCLOAK_REALM'"
    curl -s -X POST "$KEYCLOAK_URL/admin/realms" \
      -H "Authorization: Bearer $token" -H 'Content-Type: application/json' \
      -d "{\"realm\":\"$KEYCLOAK_REALM\",\"enabled\":true}"
    echo "[OK] Realm created"
  fi
}

create_roles() {
  local token="$1"
  for role in "${ROLES[@]}"; do
    echo "[INFO] Ensuring role '$role' exists"
    local status
    status=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $token" \
      "$KEYCLOAK_URL/admin/realms/$KEYCLOAK_REALM/roles/$role")
    if [[ "$status" == "200" ]]; then
      echo "[OK] Role '$role' exists"
    else
      curl -s -X POST "$KEYCLOAK_URL/admin/realms/$KEYCLOAK_REALM/roles" \
        -H "Authorization: Bearer $token" -H 'Content-Type: application/json' \
        -d "{\"name\":\"$role\"}"
      echo "[OK] Role '$role' created"
    fi
  done
}

create_confidential_client() {
  local token="$1" clientId="$2" clientSecret="$3"
  echo "[INFO] Ensuring client '$clientId' exists (confidential)"
  local existing
  existing=$(curl -s -H "Authorization: Bearer $token" \
    "$KEYCLOAK_URL/admin/realms/$KEYCLOAK_REALM/clients?clientId=$clientId")
  local id
  id=$(echo "$existing" | jq -r '.[0].id // empty')
  if [[ -z "$id" || "$id" == "null" ]]; then
    curl -s -X POST "$KEYCLOAK_URL/admin/realms/$KEYCLOAK_REALM/clients" \
      -H "Authorization: Bearer $token" -H 'Content-Type: application/json' \
      -d "{\"clientId\":\"$clientId\",\"enabled\":true,\"protocol\":\"openid-connect\",\"serviceAccountsEnabled\":true,\"publicClient\":false,\"secret\":\"$clientSecret\",\"redirectUris\":[\"*\"],\"webOrigins\":[\"*\"]}"
    echo "[OK] Client '$clientId' created"
  else
    echo "[OK] Client '$clientId' already exists"
  fi
}

create_public_client() {
  local token="$1" clientId="$2"
  echo "[INFO] Ensuring client '$clientId' exists (public)"
  local existing
  existing=$(curl -s -H "Authorization: Bearer $token" \
    "$KEYCLOAK_URL/admin/realms/$KEYCLOAK_REALM/clients?clientId=$clientId")
  local id
  id=$(echo "$existing" | jq -r '.[0].id // empty')
  if [[ -z "$id" || "$id" == "null" ]]; then
    curl -s -X POST "$KEYCLOAK_URL/admin/realms/$KEYCLOAK_REALM/clients" \
      -H "Authorization: Bearer $token" -H 'Content-Type: application/json' \
      -d "{\"clientId\":\"$clientId\",\"enabled\":true,\"protocol\":\"openid-connect\",\"publicClient\":true,\"redirectUris\":[\"http://localhost:3001/*\",\"http://localhost:3000/*\"],\"webOrigins\":[\"http://localhost:3001\",\"http://localhost:3000\"]}"
    echo "[OK] Client '$clientId' created"
  else
    echo "[OK] Client '$clientId' already exists"
  fi
}

main() {
  if ! command -v jq >/dev/null 2>&1; then
    echo "[ERROR] jq is required. Install jq and retry." >&2
    exit 1
  fi

  TOKEN=$(get_token)
  if [[ -z "$TOKEN" || "$TOKEN" == "null" ]]; then
    echo "[ERROR] Unable to obtain Keycloak admin token. Check credentials and URL." >&2
    exit 1
  fi

  create_realm_if_missing "$TOKEN"
  create_roles "$TOKEN"
  create_confidential_client "$TOKEN" "$GATEWAY_CLIENT_ID" "$GATEWAY_CLIENT_SECRET"
  create_confidential_client "$TOKEN" "$AUTH_SERVICE_CLIENT_ID" "$AUTH_SERVICE_CLIENT_SECRET"
  create_public_client "$TOKEN" "$FRONTEND_CLIENT_ID"

  # Optional: Configure OAuth identity providers if credentials are provided
  if [[ -n "${GOOGLE_CLIENT_ID:-}" && -n "${GOOGLE_CLIENT_SECRET:-}" ]]; then
    create_identity_provider "$TOKEN" "google" "$GOOGLE_CLIENT_ID" "$GOOGLE_CLIENT_SECRET"
  fi

  if [[ -n "${GITHUB_CLIENT_ID:-}" && -n "${GITHUB_CLIENT_SECRET:-}" ]]; then
    create_identity_provider "$TOKEN" "github" "$GITHUB_CLIENT_ID" "$GITHUB_CLIENT_SECRET"
  fi

  echo "[INFO] Creating default test users"
  create_default_users "$TOKEN"

  echo "[DONE] Keycloak bootstrap completed for realm '$KEYCLOAK_REALM'"
  echo ""
  echo "Test Users Created:"
  echo "  📧 admin@medinsight.tn      | Password: Admin123!     | Role: ADMIN (Admin Dashboard)"
  echo "  📧 security@medinsight.tn   | Password: Security123!  | Role: RESPONSABLE_SECURITE (Security)"
  echo "  📧 doctor@medinsight.tn     | Password: Doctor123!    | Role: MEDECIN (Doctor)"
  echo "  📧 patient@medinsight.tn    | Password: Patient123!   | Role: PATIENT (Patient)"
  echo ""
  echo "Login at: http://localhost:3000/login"
}

create_identity_provider() {
  local token="$1" provider="$2" clientId="$3" clientSecret="$4"
  echo "[INFO] Ensuring identity provider '$provider' exists"
  
  local existing
  existing=$(curl -s -H "Authorization: Bearer $token" \
    "$KEYCLOAK_URL/admin/realms/$KEYCLOAK_REALM/identity-provider/instances/$provider" 2>/dev/null || echo "{}")
  
  if echo "$existing" | jq -e '.alias' > /dev/null 2>&1; then
    echo "[OK] Identity provider '$provider' already exists"
  else
    local config
    if [[ "$provider" == "google" ]]; then
      config='{"alias":"google","providerId":"google","enabled":true,"trustEmail":true,"storeToken":true,"addReadTokenRoleOnCreate":false,"authenticateByDefault":false,"linkOnly":false,"firstBrokerLoginFlowAlias":"first broker login","config":{"clientId":"'"$clientId"'","clientSecret":"'"$clientSecret"'","defaultScope":"openid profile email","useJwksUrl":"true"}}'
    elif [[ "$provider" == "github" ]]; then
      config='{"alias":"github","providerId":"github","enabled":true,"trustEmail":true,"storeToken":true,"addReadTokenRoleOnCreate":false,"authenticateByDefault":false,"linkOnly":false,"firstBrokerLoginFlowAlias":"first broker login","config":{"clientId":"'"$clientId"'","clientSecret":"'"$clientSecret"'","defaultScope":"user:email"}}'
    else
      echo "[WARN] Unknown provider '$provider', skipping"
      return
    fi
    
    curl -s -X POST "$KEYCLOAK_URL/admin/realms/$KEYCLOAK_REALM/identity-provider/instances" \
      -H "Authorization: Bearer $token" -H 'Content-Type: application/json' \
      -d "$config" > /dev/null
    echo "[OK] Identity provider '$provider' created"
    
    # Create default role mapper for PATIENT role
    create_idp_role_mapper "$token" "$provider"
  fi
}

create_default_users() {
  local token="$1"
  
  create_user "$token" "admin@medinsight.tn" "Admin" "MedInsight" "Admin123!" "ADMIN"
  create_user "$token" "security@medinsight.tn" "Security" "Officer" "Security123!" "RESPONSABLE_SECURITE"
  create_user "$token" "doctor@medinsight.tn" "Dr. Test" "Doctor" "Doctor123!" "MEDECIN"
  create_user "$token" "patient@medinsight.tn" "Test" "Patient" "Patient123!" "PATIENT"
}

create_user() {
  local token="$1" email="$2" firstName="$3" lastName="$4" password="$5" role="$6"
  echo "[INFO] Creating user: $email"
  
  # Create user
  local user_data="{\"username\":\"$email\",\"email\":\"$email\",\"firstName\":\"$firstName\",\"lastName\":\"$lastName\",\"enabled\":true,\"emailVerified\":true}"
  local create_response
  create_response=$(curl -s -w "%{http_code}" -o /tmp/keycloak_create_user.log -X POST \
    "$KEYCLOAK_URL/admin/realms/$KEYCLOAK_REALM/users" \
    -H "Authorization: Bearer Token" -H 'Content-Type: application/json' \
    -d "$user_data")
  
  if [[ "$create_response" == "409" ]]; then
    echo "[OK] User already exists"
  elif [[ "$create_response" != "201" ]]; then
    echo "[WARN] Failed to create user (HTTP $create_response)"
    return
  fi
  
  # Get user ID
  local user_id
  user_id=$(curl -s -H "Authorization: Bearer $token" \
    "$KEYCLOAK_URL/admin/realms/$KEYCLOAK_REALM/users?username=$email" | jq -r '.[0].id // empty')
  
  if [[ -z "$user_id" ]]; then
    echo "[WARN] Could not retrieve user ID for $email"
    return
  fi
  
  # Set password
  local password_data="{\"type\":\"password\",\"value\":\"$password\",\"temporary\":false}"
  curl -s -X PUT "$KEYCLOAK_URL/admin/realms/$KEYCLOAK_REALM/users/$user_id/reset-password" \
    -H "Authorization: Bearer $token" -H 'Content-Type: application/json' \
    -d "$password_data" > /dev/null
  
  # Assign role
  local role_id
  role_id=$(curl -s -H "Authorization: Bearer $token" \
    "$KEYCLOAK_URL/admin/realms/$KEYCLOAK_REALM/roles/$role" | jq -r '.id // empty')
  
  if [[ -n "$role_id" ]]; then
    local role_mapping="[{\"id\":\"$role_id\",\"name\":\"$role\"}]"
    curl -s -X POST "$KEYCLOAK_URL/admin/realms/$KEYCLOAK_REALM/users/$user_id/role-mappings/realm" \
      -H "Authorization: Bearer $token" -H 'Content-Type: application/json' \
      -d "$role_mapping" > /dev/null
    echo "[OK] User '$email' created with role $role"
  fi
}

create_idp_role_mapper() {
  local token="$1" provider="$2"
  echo "[INFO] Creating default role mapper for '$provider'"
  
  local mapper_config='{"name":"default-patient-role","identityProviderAlias":"'"$provider"'","identityProviderMapper":"hardcoded-role-idp-mapper","config":{"role":"PATIENT"}}'
  
  curl -s -X POST "$KEYCLOAK_URL/admin/realms/$KEYCLOAK_REALM/identity-provider/instances/$provider/mappers" \
    -H "Authorization: Bearer $token" -H 'Content-Type: application/json' \
    -d "$mapper_config" > /dev/null 2>&1 || true
  
  echo "[OK] Role mapper created for '$provider'"
}

main "$@"
