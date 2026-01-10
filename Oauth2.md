OAuth Provider Setup Guide
This guide provides step-by-step instructions for obtaining OAuth 2.0 credentials from Google and GitHub, then configuring them in Keycloak for social login integration with MedInsight.

Google OAuth 2.0 Setup
Step 1: Access Google Cloud Console
Navigate to Google Cloud Console
Sign in with your Google account
If you don't have a project, create one:
Click the project dropdown at the top
Click "New Project"
Enter project name: MedInsight (or your preferred name)
Click "Create"
Step 2: Enable Google+ API (Optional but Recommended)
In the left sidebar, go to "APIs & Services" → "Library"
Search for "Google+ API" or "People API"
Click on it and press "Enable"
Step 3: Configure OAuth Consent Screen
Go to "APIs & Services" → "OAuth consent screen"
Choose "External" (for testing) or "Internal" (if using Google Workspace)
Click "Create"
Fill in the required information:
App name: MedInsight
User support email: Your email address
Developer contact information: Your email address
Click "Save and Continue"
Scopes: Click "Add or Remove Scopes"
Add: email, profile, openid
Click "Update" then "Save and Continue"
Test users (if External): Add test email addresses
Click "Save and Continue" → "Back to Dashboard"
Step 4: Create OAuth 2.0 Credentials
Go to "APIs & Services" → "Credentials"

Click "+ Create Credentials" → "OAuth client ID"

Select "Application type": Web application

Enter Name: MedInsight Web Client

Authorized JavaScript origins: Add:

http://localhost:8180
http://localhost:3001
Authorized redirect URIs: Add:

http://localhost:8180/realms/medinsight/broker/google/endpoint
IMPORTANT

The redirect URI format is: {KEYCLOAK_URL}/realms/{REALM_NAME}/broker/{PROVIDER_ALIAS}/endpoint

Replace google with your chosen provider alias in Keycloak (usually google)

Click "Create"

Copy and save the credentials:

Client ID: xxxxx.apps.googleusercontent.com
Client Secret: GOCSPX-xxxxx
Step 5: Add to Environment Variables
Add to your 
.env
 file:

# --- Google OAuth ---
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
GitHub OAuth Setup
Step 1: Access GitHub Developer Settings
Go to GitHub
Sign in to your account
Click your profile picture (top-right) → "Settings"
Scroll down in the left sidebar to "Developer settings"
Click "OAuth Apps" → "New OAuth App"
Step 2: Register New OAuth Application
Fill in the application details:

Application name: MedInsight
Homepage URL: http://localhost:3001
Application description: MedInsight E-Health Platform
Authorization callback URL:
http://localhost:8180/realms/medinsight/broker/github/endpoint
IMPORTANT

The callback URL format is: {KEYCLOAK_URL}/realms/{REALM_NAME}/broker/{PROVIDER_ALIAS}/endpoint

Replace github with your chosen provider alias in Keycloak (usually github)

Click "Register application"

Step 3: Generate Client Secret
After registration, you'll see your Client ID displayed
Click "Generate a new client secret"
Copy and save immediately (you won't be able to see it again):
Client ID: Iv1.xxxxxxxxxxxxxxxx or similar
Client Secret: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Step 4: Add to Environment Variables
Add to your 
.env
 file:

# --- GitHub OAuth ---
GITHUB_CLIENT_ID=Iv1.xxxxxxxxxxxxxxxx
GITHUB_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Keycloak Configuration
Option 1: Manual Configuration via Keycloak Admin UI
Configure Google Identity Provider
Open Keycloak Admin Console: http://localhost:8180
Login with admin credentials
Select the medinsight realm
Go to "Identity Providers" in the left sidebar
Click "Add provider" → Select "Google"
Configure:
Alias: google (must match redirect URI)
Display Name: Google
Client ID: Paste your Google Client ID
Client Secret: Paste your Google Client Secret
Default Scopes: openid profile email
Store Tokens: ON (optional, for accessing Google APIs later)
Trust Email: ON
Click "Save"
Configure GitHub Identity Provider
In the same "Identity Providers" section
Click "Add provider" → Select "GitHub"
Configure:
Alias: github (must match redirect URI)
Display Name: GitHub
Client ID: Paste your GitHub Client ID
Client Secret: Paste your GitHub Client Secret
Default Scopes: user:email
Store Tokens: ON (optional)
Trust Email: ON
Click "Save"
Option 2: Automated Configuration via Script
Update the 
keycloak-bootstrap.sh
 script to include identity provider creation:

create_identity_provider() {
  local token="$1" provider="$2" clientId="$3" clientSecret="$4"
  echo "[INFO] Ensuring identity provider '$provider' exists"
  
  local existing
  existing=$(curl -s -H "Authorization: Bearer $token" \
    "$KEYCLOAK_URL/admin/realms/$KEYCLOAK_REALM/identity-provider/instances/$provider")
  
  if echo "$existing" | jq -e '.alias' > /dev/null 2>&1; then
    echo "[OK] Identity provider '$provider' already exists"
  else
    local config
    if [[ "$provider" == "google" ]]; then
      config="{\"alias\":\"google\",\"providerId\":\"google\",\"enabled\":true,\"trustEmail\":true,\"storeToken\":true,\"config\":{\"clientId\":\"$clientId\",\"clientSecret\":\"$clientSecret\",\"defaultScope\":\"openid profile email\"}}"
    elif [[ "$provider" == "github" ]]; then
      config="{\"alias\":\"github\",\"providerId\":\"github\",\"enabled\":true,\"trustEmail\":true,\"storeToken\":true,\"config\":{\"clientId\":\"$clientId\",\"clientSecret\":\"$clientSecret\",\"defaultScope\":\"user:email\"}}"
    fi
    
    curl -s -X POST "$KEYCLOAK_URL/admin/realms/$KEYCLOAK_REALM/identity-provider/instances" \
      -H "Authorization: Bearer $token" -H 'Content-Type: application/json' \
      -d "$config"
    echo "[OK] Identity provider '$provider' created"
  fi
}
# Add to main() function:
if [[ -n "${GOOGLE_CLIENT_ID:-}" && -n "${GOOGLE_CLIENT_SECRET:-}" ]]; then
  create_identity_provider "$TOKEN" "google" "$GOOGLE_CLIENT_ID" "$GOOGLE_CLIENT_SECRET"
fi
if [[ -n "${GITHUB_CLIENT_ID:-}" && -n "${GITHUB_CLIENT_SECRET:-}" ]]; then
  create_identity_provider "$TOKEN" "github" "$GITHUB_CLIENT_ID" "$GITHUB_CLIENT_SECRET"
fi
Verification
Test Google Login
Navigate to your application login page or Keycloak account console:
http://localhost:8180/realms/medinsight/account
You should see a "Sign in with Google" button
Click it and verify:
Redirects to Google login
After authentication, redirects back to Keycloak
User is created in Keycloak with email from Google
Test GitHub Login
On the same login page
You should see a "Sign in with GitHub" button
Click it and verify:
Redirects to GitHub authorization
After authorization, redirects back to Keycloak
User is created in Keycloak with email from GitHub
Check User Creation
Go to Keycloak Admin Console
Navigate to Users in the medinsight realm
You should see users created via Google/GitHub with:
Email verified
Identity provider link showing the source (Google or GitHub)
Role Mapping for Social Login Users
By default, users logging in via Google/GitHub won't have any roles assigned. You have two options:

Option 1: Default Role Assignment
In Keycloak Admin Console, go to Realm Settings → User Registration
Set Default Roles to include PATIENT (or your preferred default)
All new users (including social login) will get this role automatically
Option 2: Identity Provider Mappers
Go to Identity Providers → Select Google or GitHub
Click "Mappers" tab → "Add mapper"
Create a mapper:
Name: default-patient-role
Mapper Type: Hardcoded Role
Role: Select PATIENT
Click "Save"
This ensures all users from that identity provider automatically get the PATIENT role.

Production Considerations
WARNING

For Production Deployment:

Update Redirect URIs with your production domain:

Google: https://yourdomain.com/realms/medinsight/broker/google/endpoint
GitHub: https://yourdomain.com/realms/medinsight/broker/github/endpoint
Use HTTPS - OAuth providers require HTTPS in production

Verify OAuth Consent Screen - Complete the verification process for Google

Secure Client Secrets - Use environment variables or secret management systems

Update Authorized Origins - Add your production frontend URL

Troubleshooting
Common Issues
Issue: "Redirect URI mismatch" error

Solution: Ensure the redirect URI in Google/GitHub exactly matches the format:

http://localhost:8180/realms/medinsight/broker/{provider}/endpoint
Issue: "Invalid client" error

Solution: Double-check that Client ID and Client Secret are correctly copied (no extra spaces)

Issue: User created but no email

Solution:

For Google: Ensure email scope is included
For GitHub: User must have a public email or grant email permission
Enable "Trust Email" in Keycloak identity provider settings
Issue: Social login button doesn't appear

Solution:

Verify identity provider is enabled in Keycloak
Clear browser cache
Check Keycloak logs for errors
Summary
After completing this setup:

✅ Users can register/login with Google
✅ Users can register/login with GitHub
✅ Users can still use traditional email/password registration
✅ All authentication flows are secured via Keycloak
✅ Social login users can be automatically assigned the PATIENT role
✅ The auth-service can manage all users regardless of authentication method
OAuth Setup Quick Reference
Google OAuth 2.0
1. Create OAuth Credentials
Go to: https://console.cloud.google.com/
Navigate to: APIs & Services → Credentials
Click: Create Credentials → OAuth client ID
Application type: Web application
2. Configure Redirect URI
http://localhost:8180/realms/medinsight/broker/google/endpoint
3. Add to .env
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
GitHub OAuth
1. Create OAuth App
Go to: https://github.com/settings/developers
Click: OAuth Apps → New OAuth App
2. Configure Callback URL
http://localhost:8180/realms/medinsight/broker/github/endpoint
3. Add to .env
GITHUB_CLIENT_ID=Iv1.xxxxxxxxxxxxxxxx
GITHUB_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Running the Bootstrap Script
After adding OAuth credentials to 
.env
:

# From the project root
docker-compose exec keycloak bash
cd /scripts
./keycloak-bootstrap.sh
Or run from host (if you have bash and jq installed):

cd c:\Users\Karim\Medinsightv2\scripts
bash keycloak-bootstrap.sh
The script will automatically: ✅ Create the medinsight realm
✅ Create all 5 roles
✅ Create auth-service and gateway clients
✅ Configure Google identity provider (if credentials provided)
✅ Configure GitHub identity provider (if credentials provided)
✅ Assign PATIENT role to all social login users

Production Redirect URIs
Replace localhost:8180 with your production Keycloak URL:

Google:

https://auth.yourdomain.com/realms/medinsight/broker/google/endpoint
GitHub:

https://auth.yourdomain.com/realms/medinsight/broker/github/endpoint