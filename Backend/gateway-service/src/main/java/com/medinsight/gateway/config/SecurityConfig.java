package com.medinsight.gateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableReactiveMethodSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.server.SecurityWebFilterChain;
import reactor.core.publisher.Mono;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.oauth2.server.resource.authentication.ReactiveJwtAuthenticationConverterAdapter;

@Configuration
@EnableReactiveMethodSecurity
public class SecurityConfig {

    /**
     * Extract Keycloak realm roles from claim realm_access.roles and convert to ROLE_*
     */
    private Converter<Jwt, Collection<GrantedAuthority>> keycloakRealmRoleAuthoritiesConverter() {
        return (jwt) -> {
            // Default converter to include scope authorities as well (SCOPE_*)
            JwtGrantedAuthoritiesConverter defaultScopes = new JwtGrantedAuthoritiesConverter();
            Collection<GrantedAuthority> scopeAuthorities = defaultScopes.convert(jwt);

            // Extract realm roles from Keycloak token
            Map<String, Object> realmAccess = jwt.getClaim("realm_access");
            Collection<String> roles = List.of();
            if (realmAccess != null) {
                Object rolesObj = realmAccess.get("roles");
                if (rolesObj instanceof Collection<?>) {
                    roles = ((Collection<?>) rolesObj).stream()
                            .filter(String.class::isInstance)
                            .map(String.class::cast)
                            .collect(Collectors.toList());
                }
            }

            Collection<GrantedAuthority> roleAuthorities = roles.stream()
                    .map(role -> (GrantedAuthority) () -> "ROLE_" + role.toUpperCase())
                    .collect(Collectors.toList());

            return new java.util.ArrayList<GrantedAuthority>() {{
                addAll(scopeAuthorities);
                addAll(roleAuthorities);
            }};
        };
    }

    private Converter<Jwt, Mono<AbstractAuthenticationToken>> reactiveJwtAuthenticationConverter() {
        JwtAuthenticationConverter delegate = new JwtAuthenticationConverter();
        delegate.setJwtGrantedAuthoritiesConverter(keycloakRealmRoleAuthoritiesConverter());
        return new ReactiveJwtAuthenticationConverterAdapter(delegate);
    }

    @Bean
    public SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
        return http
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .cors(cors -> cors.disable()) // Disable Spring Security's default CORS to let the Gateway handle it
                .authorizeExchange(auth -> auth
                        // Public endpoints (Swagger and health)
                        .pathMatchers(HttpMethod.OPTIONS, "/**").permitAll() // Allow preflight requests
                        .pathMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**", "/webjars/**").permitAll()
                        .pathMatchers("/api/*/v3/api-docs").permitAll()
                        .pathMatchers(HttpMethod.GET, "/actuator/health").permitAll()
                        .pathMatchers(HttpMethod.POST, "/api/auth/register/**").permitAll()
                        // RBAC rules for API routes
                        .pathMatchers("/api/admin/**").hasRole("ADMIN")
                        .pathMatchers("/api/patients/**").hasAnyRole("PATIENT", "ADMIN")
                        .pathMatchers("/api/doctors/**").hasAnyRole("DOCTOR", "ADMIN")
                        .pathMatchers("/api/appointments/**").authenticated()
                        // everything else requires authentication by default
                        .anyExchange().authenticated()
                )
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(reactiveJwtAuthenticationConverter()))
                )
                .build();
    }
}
