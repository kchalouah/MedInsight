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
  echo "[INFO] Processing identity provider '$provider'..."
  
  # 1. Delete Existing IDP (Force clean state)
  curl -s -X DELETE "$KEYCLOAK_URL/admin/realms/$KEYCLOAK_REALM/identity-provider/instances/$provider" \
    -H "Authorization: Bearer $token" > /dev/null 2>&1
  echo "[INFO] Removed existing IDP '$provider' to ensure fresh configuration."

  # 2. Create IDP
  local config
  if [[ "$provider" == "google" ]]; then
    config="{
      \"alias\": \"google\",
      \"providerId\": \"google\",
      \"enabled\": true,
      \"trustEmail\": true,
      \"storeToken\": true,
      \"addReadTokenRoleOnCreate\": false,
      \"authenticateByDefault\": false,
      \"linkOnly\": false,
      \"firstBrokerLoginFlowAlias\": \"first broker login\",
      \"config\": {
        \"clientId\": \"$clientId\",
        \"clientSecret\": \"$clientSecret\",
        \"defaultScope\": \"openid profile email\",
        \"useJwksUrl\": \"true\",
        \"guiOrder\": \"\",
        \"syncMode\": \"IMPORT\"
      }
    }"
  elif [[ "$provider" == "github" ]]; then
    config="{\"alias\":\"github\",\"providerId\":\"github\",\"enabled\":true,\"trustEmail\":true,\"storeToken\":true,\"addReadTokenRoleOnCreate\":false,\"authenticateByDefault\":false,\"linkOnly\":false,\"firstBrokerLoginFlowAlias\":\"first broker login\",\"config\":{\"clientId\":\"$clientId\",\"clientSecret\":\"$clientSecret\",\"defaultScope\":\"user:email\",\"syncMode\":\"IMPORT\"}}"
  else
    echo "[WARN] Unknown provider '$provider', skipping"
    return
  fi
  
  curl -s -X POST "$KEYCLOAK_URL/admin/realms/$KEYCLOAK_REALM/identity-provider/instances" \
    -H "Authorization: Bearer $token" -H 'Content-Type: application/json' \
    -d "$config"
  echo "[OK] Identity provider '$provider' created"
  
  # 3. Create Mapper
  create_idp_role_mapper "$token" "$provider"
}

create_idp_role_mapper() {
  local token="$1" provider="$2"
  echo "[INFO] Creating role mapper for '$provider'"
  
  local mapper_config="{
    \"name\": \"default-patient-role\",
    \"identityProviderAlias\": \"$provider\",
    \"identityProviderMapper\": \"oidc-hardcoded-role-idp-mapper\",
    \"config\": {
      \"role\": \"PATIENT\",
      \"syncMode\": \"IMPORT\"
    }
  }"
  
  curl -s -X POST "$KEYCLOAK_URL/admin/realms/$KEYCLOAK_REALM/identity-provider/instances/$provider/mappers" \
    -H "Authorization: Bearer $token" -H 'Content-Type: application/json' \
    -d "$mapper_config"
  echo "[OK] Role mapper created for '$provider'"
}

main "$@"
