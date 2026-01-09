package com.medinsight.gateway.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.License;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "MedInsight API Gateway",
                version = "1.0.0",
                description = "API Gateway for MedInsight microservices. Routes requests, enforces security (JWT/RBAC with Keycloak), and exposes OpenAPI docs.",
                contact = @Contact(name = "MedInsight Team", email = "support@medinsight.example"),
                license = @License(name = "Apache-2.0")
        )
)
public class OpenApiConfig {
    // Springdoc will auto-configure for WebFlux. No additional beans needed for basic setup.
}
