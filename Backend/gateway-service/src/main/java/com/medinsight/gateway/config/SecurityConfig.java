package com.medinsight.gateway.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableReactiveMethodSecurity;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.ReactiveJwtAuthenticationConverterAdapter;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsConfigurationSource;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;
import reactor.core.publisher.Mono;

import java.util.*;

@Configuration
@EnableWebFluxSecurity
@EnableReactiveMethodSecurity
public class SecurityConfig {

    private static final Logger log = LoggerFactory.getLogger(SecurityConfig.class);

    /**
     * Keycloak-aware JWT authentication converter (Reactive)
     */
    @Bean
    public Converter<Jwt, ? extends Mono<? extends AbstractAuthenticationToken>> jwtAuthenticationConverter() {
        JwtAuthenticationConverter jwtConverter = new JwtAuthenticationConverter();

        jwtConverter.setJwtGrantedAuthoritiesConverter(jwt -> {
            List<GrantedAuthority> authorities = new ArrayList<>();

            // 1. Extract Realm Roles
            Map<String, Object> realmAccess = jwt.getClaimAsMap("realm_access");
            if (realmAccess != null && realmAccess.get("roles") instanceof Collection<?> roles) {
                roles.stream()
                        .filter(String.class::isInstance)
                        .map(String.class::cast)
                        .map(String::toUpperCase)
                        .map(r -> r.startsWith("ROLE_") ? r : "ROLE_" + r)
                        .map(SimpleGrantedAuthority::new)
                        .forEach(authorities::add);
            }

            // 2. Extract Client Roles (optional, specifically for gateway-service if
            // needed)
            Map<String, Object> resourceAccess = jwt.getClaimAsMap("resource_access");
            if (resourceAccess != null &&
                    resourceAccess.get("gateway-service") instanceof Map<?, ?> client) {

                Object roles = client.get("roles");
                if (roles instanceof Collection<?> clientRoles) {
                    clientRoles.stream()
                            .filter(String.class::isInstance)
                            .map(String.class::cast)
                            .map(String::toUpperCase)
                            .map(r -> r.startsWith("ROLE_") ? r : "ROLE_" + r)
                            .map(SimpleGrantedAuthority::new)
                            .forEach(authorities::add);
                }
            }

            // 3. Debug logging to understand 401/403 errors
            log.info("Gateway Auth SUCCESS - User: {}, Roles: {}", jwt.getSubject(), authorities);

            return authorities;
        });

        return new ReactiveJwtAuthenticationConverterAdapter(jwtConverter);
    }

    /**
     * Spring Security filter chain for Gateway
     */
    @Bean
    public SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
        return http
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .cors(Customizer.withDefaults())
                .authorizeExchange(auth -> auth
                        // CORS Preflight
                        .pathMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // Swagger / Public
                        .pathMatchers(
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/v3/api-docs/**",
                                "/webjars/**",
                                "/actuator/health",
                                "/actuator/prometheus")
                        .permitAll()

                        // Auth Service (Login/Register)
                        .pathMatchers("/api/auth/**").permitAll()

                        // RBAC Routes - Match Roles strictly
                        .pathMatchers("/api/admin/**").hasAnyRole("ADMIN", "GESTIONNAIRE")
                        .pathMatchers("/api/medecins/**").hasAnyRole("PATIENT", "ADMIN", "MEDECIN", "GESTIONNAIRE")
                        .pathMatchers("/api/patients/**").hasAnyRole("MEDECIN", "ADMIN", "GESTIONNAIRE")
                        .pathMatchers("/api/appointments/**").hasAnyRole("PATIENT", "MEDECIN", "ADMIN", "GESTIONNAIRE")
                        .pathMatchers("/api/records/**").hasAnyRole("PATIENT", "MEDECIN", "ADMIN", "GESTIONNAIRE")
                        .pathMatchers(HttpMethod.POST, "/api/audit/logs").authenticated()
                        .pathMatchers("/api/audit/**").hasAnyRole("ADMIN", "RESPONSABLE_SECURITE", "GESTIONNAIRE")
                        .pathMatchers("/api/mail/**").hasAnyRole("ADMIN", "GESTIONNAIRE", "MEDECIN", "PATIENT")
                        .pathMatchers("/api/ml/**").hasAnyRole("MEDECIN", "ADMIN")

                        // Default
                        .anyExchange().authenticated())
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter())))
                .build();
    }

    /**
     * Global CORS Filter - High Priority
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);
        // Explicitly list localhost origins
        config.setAllowedOrigins(Arrays.asList(
                "http://localhost:3000",
                "http://localhost:3001",
                "http://localhost:3002",
                "http://localhost:3003"));
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        config.setAllowedHeaders(Arrays.asList("*"));
        config.setExposedHeaders(Arrays.asList("*"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return source;
    }

    /**
     * Custom JWT Decoder to handle issuer mismatch (localhost vs keycloak)
     */
    @Bean
    public ReactiveJwtDecoder jwtDecoder() {
        // Internal Docker URL for JWK Set
        String jwkSetUri = "http://keycloak:8080/realms/medinsight/protocol/openid-connect/certs";
        NimbusReactiveJwtDecoder jwtDecoder = NimbusReactiveJwtDecoder.withJwkSetUri(jwkSetUri).build();

        // Lenient validator to allow 'localhost' or 'keycloak' issuers
        OAuth2TokenValidator<Jwt> withIssuer = new DelegatingOAuth2TokenValidator<>(
                new JwtTimestampValidator(),
                jwt -> {
                    String issuer = (jwt.getIssuer() != null) ? jwt.getIssuer().toString() : "unknown";
                    log.info("Gateway validating token issuer: {}", issuer);

                    // Allow both internal and external Keycloak references
                    if (issuer.contains("/realms/medinsight")) {
                        return OAuth2TokenValidatorResult.success();
                    }

                    // If mismatch, still log but fail explicitly with error
                    log.error("Gateway INVALID issuer: {}", issuer);
                    return OAuth2TokenValidatorResult.failure(
                            new OAuth2Error("invalid_issuer", "The issuer " + issuer + " is not trusted", null));
                });

        jwtDecoder.setJwtValidator(withIssuer);
        return jwtDecoder;
    }
}
