package com.medinsight.gateway;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.reactive.server.WebTestClient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.mockJwt;

import java.util.List;
import java.util.Map;

/**
 * Security integration tests for the Gateway.
 *
 * These tests do not call downstream services; instead they verify that
 * Spring Security rules are applied as expected. When a request is authorized,
 * it may result in 404 Not Found because no downstream route exists for some
 * tested paths — this is acceptable and confirms authorization passed.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
        "eureka.client.enabled=false",
        "spring.security.oauth2.resourceserver.jwt.jwk-set-uri=http://localhost:0"
})
@AutoConfigureWebTestClient
class SecurityConfigTest {

    @Autowired
    private WebTestClient webTestClient;

    @Test
    @DisplayName("Swagger UI is publicly accessible (no auth)")
    void swaggerUiIsPublic() {
        webTestClient.get()
                .uri("/swagger-ui.html")
                .exchange()
                .expectStatus().is3xxRedirection();
    }

    @Test
    @DisplayName("API docs are publicly accessible (no auth)")
    void apiDocsIsPublic() {
        webTestClient.get()
                .uri("/v3/api-docs")
                .exchange()
                .expectStatus().isOk()
                .expectHeader().contentTypeCompatibleWith(MediaType.APPLICATION_JSON);
    }

    @Nested
    class AdminAccess {
        @Test
        @DisplayName("/api/admin/** requires ROLE_ADMIN - with admin role -> allowed (404 after auth)")
        void adminWithAdminRoleAllowed() {
            webTestClient.mutateWith(mockJwt().jwt(jwt ->
                            jwt.claim("realm_access", Map.of("roles", List.of("ADMIN")))))
                    .get().uri("/api/admin/test")
                    .exchange()
                    .expectStatus()
                    .value(status -> {
                        assertThat(status).isNotEqualTo(401);
                        assertThat(status).isNotEqualTo(403);
                    });
        }

        @Test
        @DisplayName("/api/admin/** requires ROLE_ADMIN - with non-admin role -> 403")
        void adminWithNonAdminForbidden() {
            webTestClient.mutateWith(mockJwt().jwt(jwt ->
                            jwt.claim("realm_access", Map.of("roles", List.of("PATIENT")))))
                    .get().uri("/api/admin/test")
                    .exchange()
                    .expectStatus().isForbidden();
        }
    }

    @Nested
    class PatientAccess {
        @Test
        @DisplayName("/api/patients/** requires ROLE_PATIENT or ROLE_ADMIN - patient role -> allowed (404)")
        void patientsWithPatientRoleAllowed() {
            webTestClient.mutateWith(mockJwt().jwt(jwt ->
                            jwt.claim("realm_access", Map.of("roles", List.of("PATIENT")))))
                    .get().uri("/api/patients/test")
                    .exchange()
                    .expectStatus()
                    .value(status -> {
                        assertThat(status).isNotEqualTo(401);
                        assertThat(status).isNotEqualTo(403);
                    });
        }

        @Test
        @DisplayName("/api/patients/** with unrelated role -> 403")
        void patientsWithWrongRoleForbidden() {
            webTestClient.mutateWith(mockJwt().jwt(jwt ->
                            jwt.claim("realm_access", Map.of("roles", List.of("DOCTOR")))))
                    .get().uri("/api/patients/test")
                    .exchange()
                    .expectStatus().isForbidden();
        }

        @Test
        @DisplayName("/api/patients/** without token -> 401")
        void patientsWithoutTokenUnauthorized() {
            webTestClient.get().uri("/api/patients/test")
                    .exchange()
                    .expectStatus().isUnauthorized();
        }
    }

    @Nested
    class AppointmentsAccess {
        @Test
        @DisplayName("/api/appointments/** requires authentication (any role) -> 404 when authenticated")
        void appointmentsWithAnyAuthAllowed() {
            webTestClient.mutateWith(mockJwt().jwt(jwt ->
                            jwt.claim("realm_access", Map.of("roles", List.of("USER")))))
                    .get().uri("/api/appointments/test")
                    .exchange()
                    .expectStatus()
                    .value(status -> {
                        assertThat(status).isNotEqualTo(401);
                        assertThat(status).isNotEqualTo(403);
                    });
        }

        @Test
        @DisplayName("/api/appointments/** without token -> 401")
        void appointmentsWithoutTokenUnauthorized() {
            webTestClient.get().uri("/api/appointments/test")
                    .exchange()
                    .expectStatus().isUnauthorized();
        }
    }
}
