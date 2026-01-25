package com.medinsight.auth.service;

import com.medinsight.auth.config.KeycloakProperties;
import com.medinsight.auth.entity.RoleEnum;
import com.medinsight.auth.exception.KeycloakIntegrationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.springframework.core.ParameterizedTypeReference;

import java.util.List;
import java.util.Map;

/**
 * Service for interacting with Keycloak Admin REST API.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class KeycloakService {

    private final KeycloakProperties keycloakProperties;
    private final WebClient.Builder webClientBuilder;

    /**
     * Get admin access token from Keycloak.
     */
    private String getAdminToken() {
        try {
            WebClient webClient = webClientBuilder.build();

            MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
            formData.add("grant_type", "password");
            formData.add("client_id", "admin-cli");
            formData.add("username", keycloakProperties.getUsername());
            formData.add("password", keycloakProperties.getPassword());

            Map<String, Object> response = webClient.post()
                    .uri(keycloakProperties.getServerUrl() + "/realms/master/protocol/openid-connect/token")
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(BodyInserters.fromFormData(formData))
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response != null && response.containsKey("access_token")) {
                return (String) response.get("access_token");
            }
            throw new KeycloakIntegrationException("Failed to obtain admin token");
        } catch (WebClientResponseException e) {
            log.error("Failed to get admin token: {}", e.getMessage());
            throw new KeycloakIntegrationException("Failed to authenticate with Keycloak", e);
        }
    }

    /**
     * Create a user in Keycloak.
     *
     * @param email     User email
     * @param password  User password
     * @param firstName First name
     * @param lastName  Last name
     * @return Keycloak user ID
     */
    public String createUser(String email, String password, String firstName, String lastName) {
        try {
            String token = getAdminToken();
            WebClient webClient = webClientBuilder.build();

            Map<String, Object> userRepresentation = Map.of(
                    "username", email,
                    "email", email,
                    "firstName", firstName,
                    "lastName", lastName,
                    "enabled", true,
                    "emailVerified", true,
                    "credentials", List.of(Map.of(
                            "type", "password",
                            "value", password,
                            "temporary", false)));

            String createUserUrl = String.format("%s/admin/realms/%s/users",
                    keycloakProperties.getServerUrl(),
                    keycloakProperties.getRealm());

            webClient.post()
                    .uri(createUserUrl)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(userRepresentation)
                    .retrieve()
                    .toBodilessEntity()
                    .block();

            // Get the created user's ID
            return getUserIdByEmail(email, token);

        } catch (WebClientResponseException e) {
            log.error("Failed to create user in Keycloak: {}", e.getResponseBodyAsString());
            throw new KeycloakIntegrationException("Failed to create user in Keycloak: " + e.getMessage(), e);
        }
    }

    /**
     * Get user ID by email from Keycloak.
     */
    private String getUserIdByEmail(String email, String token) {
        try {
            WebClient webClient = webClientBuilder.build();

            String searchUrl = String.format("%s/admin/realms/%s/users?email=%s",
                    keycloakProperties.getServerUrl(),
                    keycloakProperties.getRealm(),
                    email);

            List<Map<String, Object>> users = webClient.get()
                    .uri(searchUrl)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                    .retrieve()
                    .bodyToFlux(new ParameterizedTypeReference<Map<String, Object>>() {
                    })
                    .collectList()
                    .block();

            if (users != null && !users.isEmpty()) {
                return (String) users.get(0).get("id");
            }
            throw new KeycloakIntegrationException("User created but ID not found");
        } catch (WebClientResponseException e) {
            log.error("Failed to get user ID: {}", e.getMessage());
            throw new KeycloakIntegrationException("Failed to retrieve user ID from Keycloak", e);
        }
    }

    /**
     * Assign a role to a user in Keycloak.
     *
     * @param keycloakUserId Keycloak user ID
     * @param role           Role to assign
     */
    public void assignRoleToUser(String keycloakUserId, RoleEnum role) {
        try {
            String token = getAdminToken();
            WebClient webClient = webClientBuilder.build();

            // Get role representation
            String getRoleUrl = String.format("%s/admin/realms/%s/roles/%s",
                    keycloakProperties.getServerUrl(),
                    keycloakProperties.getRealm(),
                    role.name());

            Map<String, Object> roleRepresentation = webClient.get()
                    .uri(getRoleUrl)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (roleRepresentation == null) {
                throw new KeycloakIntegrationException("Role not found in Keycloak: " + role.name());
            }

            // Assign role to user
            String assignRoleUrl = String.format("%s/admin/realms/%s/users/%s/role-mappings/realm",
                    keycloakProperties.getServerUrl(),
                    keycloakProperties.getRealm(),
                    keycloakUserId);

            webClient.post()
                    .uri(assignRoleUrl)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(List.of(roleRepresentation))
                    .retrieve()
                    .toBodilessEntity()
                    .block();

            log.info("Assigned role {} to user {}", role.name(), keycloakUserId);

        } catch (WebClientResponseException e) {
            log.error("Failed to assign role: {}", e.getResponseBodyAsString());
            throw new KeycloakIntegrationException("Failed to assign role in Keycloak", e);
        }
    }

    /**
     * Enable or disable a user in Keycloak.
     *
     * @param keycloakUserId Keycloak user ID
     * @param enabled        Enable or disable
     */
    public void setUserEnabled(String keycloakUserId, boolean enabled) {
        try {
            String token = getAdminToken();
            WebClient webClient = webClientBuilder.build();

            String updateUserUrl = String.format("%s/admin/realms/%s/users/%s",
                    keycloakProperties.getServerUrl(),
                    keycloakProperties.getRealm(),
                    keycloakUserId);

            Map<String, Object> update = Map.of("enabled", enabled);

            webClient.put()
                    .uri(updateUserUrl)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(update)
                    .retrieve()
                    .toBodilessEntity()
                    .block();

            log.info("Set user {} enabled status to {}", keycloakUserId, enabled);

        } catch (WebClientResponseException e) {
            log.error("Failed to update user status: {}", e.getMessage());
            throw new KeycloakIntegrationException("Failed to update user in Keycloak", e);
        }
    }

    /**
     * Delete a user in Keycloak.
     *
     * @param keycloakUserId Keycloak user ID
     */
    public void deleteUser(String keycloakUserId) {
        try {
            String token = getAdminToken();
            WebClient webClient = webClientBuilder.build();

            String deleteUserUrl = String.format("%s/admin/realms/%s/users/%s",
                    keycloakProperties.getServerUrl(),
                    keycloakProperties.getRealm(),
                    keycloakUserId);

            webClient.delete()
                    .uri(deleteUserUrl)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                    .retrieve()
                    .toBodilessEntity()
                    .block();

            log.info("Deleted user {} from Keycloak", keycloakUserId);

        } catch (WebClientResponseException e) {
            log.error("Failed to delete user from Keycloak: {}", e.getMessage());
            throw new KeycloakIntegrationException("Failed to delete user in Keycloak", e);
        }
    }

    /**
     * Fetch all users from Keycloak realm.
     */
    public List<Map<String, Object>> getAllUsers() {
        try {
            String token = getAdminToken();
            WebClient webClient = webClientBuilder.build();
            String getUsersUrl = String.format("%s/admin/realms/%s/users",
                    keycloakProperties.getServerUrl(),
                    keycloakProperties.getRealm());

            return webClient.get()
                    .uri(getUsersUrl)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                    .retrieve()
                    .bodyToFlux(new ParameterizedTypeReference<Map<String, Object>>() {
                    })
                    .collectList()
                    .block();
        } catch (Exception e) {
            log.error("Failed to fetch all users from Keycloak: {}", e.getMessage());
            return List.of();
        }
    }

    /**
     * Get user's realm roles from Keycloak.
     *
     * @param keycloakUserId Keycloak user ID
     * @return Primary role name (e.g., "ROLE_PATIENT")
     */
    public String getUserPrimaryRole(String keycloakUserId) {
        try {
            String token = getAdminToken();
            WebClient webClient = webClientBuilder.build();

            String getRolesUrl = String.format("%s/admin/realms/%s/users/%s/role-mappings/realm",
                    keycloakProperties.getServerUrl(),
                    keycloakProperties.getRealm(),
                    keycloakUserId);

            List<Map<String, Object>> roles = webClient.get()
                    .uri(getRolesUrl)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                    .retrieve()
                    .bodyToFlux(new ParameterizedTypeReference<Map<String, Object>>() {
                    })
                    .collectList()
                    .block();

            if (roles != null && !roles.isEmpty()) {
                log.info("Fetched {} roles for user {}: {}", roles.size(), keycloakUserId,
                        roles.stream().map(r -> r.get("name")).toList());

                // Return the first role found (prioritize non-default roles)
                for (Map<String, Object> role : roles) {
                    String roleName = (String) role.get("name");
                    // Skip default Keycloak roles
                    if (roleName != null && !roleName.equals("uma_authorization") && !roleName.equals("offline_access")
                            && !roleName.equals("default-roles-medinsight")) {
                        String finalRole = "ROLE_" + roleName;
                        log.info("Selected primary role for user {}: {}", keycloakUserId, finalRole);
                        return finalRole;
                    }
                }
            }

            log.warn("No suitable role found for user {}, defaulting to ROLE_PATIENT", keycloakUserId);
            // Default to PATIENT if no role found
            return "ROLE_PATIENT";

        } catch (WebClientResponseException e) {
            log.error("Failed to get user roles for {}: {}. Response: {}",
                    keycloakUserId, e.getMessage(), e.getResponseBodyAsString());
            return "ROLE_PATIENT"; // Default fallback
        }
    }

    /**
     * Change user password in Keycloak.
     */
    public void changeUserPassword(String keycloakUserId, String oldPassword, String newPassword) {
        try {
            // First verify old password by attempting to get a token
            WebClient webClient = webClientBuilder.build();

            // Get user's email first
            String token = getAdminToken();
            String getUserUrl = String.format("%s/admin/realms/%s/users/%s",
                    keycloakProperties.getServerUrl(),
                    keycloakProperties.getRealm(),
                    keycloakUserId);

            Map<String, Object> userInfo = webClient.get()
                    .uri(getUserUrl)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            String email = (String) userInfo.get("email");

            // Verify old password by attempting login
            MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
            formData.add("grant_type", "password");
            formData.add("client_id", "frontend");
            formData.add("username", email);
            formData.add("password", oldPassword);

            try {
                webClient.post()
                        .uri(keycloakProperties.getServerUrl() + "/realms/" + keycloakProperties.getRealm()
                                + "/protocol/openid-connect/token")
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                        .body(BodyInserters.fromFormData(formData))
                        .retrieve()
                        .bodyToMono(Map.class)
                        .block();
            } catch (WebClientResponseException e) {
                throw new KeycloakIntegrationException("Old password is incorrect");
            }

            // Now update password with admin token
            String resetPasswordUrl = String.format("%s/admin/realms/%s/users/%s/reset-password",
                    keycloakProperties.getServerUrl(),
                    keycloakProperties.getRealm(),
                    keycloakUserId);

            Map<String, Object> credentialRepresentation = Map.of(
                    "type", "password",
                    "value", newPassword,
                    "temporary", false);

            webClient.put()
                    .uri(resetPasswordUrl)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(credentialRepresentation)
                    .retrieve()
                    .toBodilessEntity()
                    .block();

            log.info("Successfully changed password for user: {}", keycloakUserId);

        } catch (KeycloakIntegrationException e) {
            throw e;
        } catch (WebClientResponseException e) {
            log.error("Failed to change password: {} - {}", e.getMessage(), e.getResponseBodyAsString());
            throw new KeycloakIntegrationException("Failed to change password in Keycloak", e);
        }
    }
}
