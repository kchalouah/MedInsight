package com.medinsight.gateway;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cloud.gateway.route.RouteLocator;
import reactor.core.publisher.Flux;

import java.util.Set;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Verifies that Gateway routes are loaded from application.yml.
 */
@SpringBootTest(properties = {
        "eureka.client.enabled=false",
        "spring.security.oauth2.resourceserver.jwt.jwk-set-uri=http://localhost:0"
})
class GatewayRoutesTest {

    @Autowired
    private RouteLocator routeLocator;

    @Test
    void requiredRoutesAreRegistered() {
        // Collect route IDs from RouteLocator
        Set<String> routeIds = Flux.from(routeLocator.getRoutes())
                .map(route -> route.getId())
                .collectList()
                .blockOptional()
                .map(list -> list.stream().collect(Collectors.toSet()))
                .orElseGet(java.util.Collections::emptySet);

        assertThat(routeIds)
                .as("Gateway route IDs should include all configured routes")
                .contains("patients-route", "doctors-route", "appointments-route", "auth-route");
    }
}
