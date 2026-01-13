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
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import reactor.core.publisher.Mono;

import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.oauth2.server.resource.authentication.ReactiveJwtAuthenticationConverterAdapter;
import org.springframework.core.convert.converter.Converter;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Configuration
@EnableReactiveMethodSecurity
public class SecurityConfig {

    private Converter<Jwt, Mono<AbstractAuthenticationToken>> reactiveJwtAuthenticationConverter() {
        return jwt -> {
            // Extract realm roles
            Map<String, Object> realmAccess = jwt.getClaimAsMap("realm_access");
            Collection<String> roles = List.of();
            if (realmAccess != null && realmAccess.containsKey("roles")) {
                Object rolesObj = realmAccess.get("roles");
                if (rolesObj instanceof Collection<?>) {
                    roles = ((Collection<?>) rolesObj).stream()
                            .filter(String.class::isInstance)
                            .map(String.class::cast)
                            .collect(Collectors.toList());
                }
            }

            Collection<GrantedAuthority> roleAuthorities = roles.stream()
                    .map(role -> {
                        String r = role.toUpperCase();
                        return new SimpleGrantedAuthority(r.startsWith("ROLE_") ? r : "ROLE_" + r);
                    })
                    .collect(Collectors.toList());

            // Extract scopes
            JwtGrantedAuthoritiesConverter scopeConverter = new JwtGrantedAuthoritiesConverter();
            Collection<GrantedAuthority> scopeAuthorities = scopeConverter.convert(jwt);

            // Combine
            Collection<GrantedAuthority> allAuthorities = Stream.concat(
                    roleAuthorities.stream(),
                    scopeAuthorities.stream()
            ).collect(Collectors.toList());

            return Mono.just(new org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken(jwt, allAuthorities));
        };
    }

    @Bean
    public SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
        return http
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .cors(org.springframework.security.config.Customizer.withDefaults()) // Use property-based globalcors
                .authorizeExchange(auth -> auth
                        // Public endpoints (Swagger and health)
                        .pathMatchers(HttpMethod.OPTIONS, "/**").permitAll() // Allow preflight requests
                        .pathMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**", "/webjars/**").permitAll()
                        .pathMatchers("/api/auth/**").permitAll()
                        .pathMatchers("/api/auth/v3/api-docs").permitAll()
                        // RBAC rules for API routes
                        .pathMatchers("/api/admin/**").hasAnyRole("ADMIN", "GESTIONNAIRE")
                        .pathMatchers("/api/medecins/**").hasAnyRole("PATIENT", "ADMIN", "MEDECIN", "GESTIONNAIRE")
                        .pathMatchers("/api/appointments/**").hasAnyRole("PATIENT", "MEDECIN", "ADMIN", "GESTIONNAIRE")
                        .pathMatchers("/api/records/**").hasAnyRole("PATIENT", "MEDECIN", "ADMIN", "GESTIONNAIRE")
                        .pathMatchers("/api/audit/**").hasAnyRole("ADMIN", "RESPONSABLE_SECURITE")
                        .pathMatchers("/api/mail/**").hasAnyRole("ADMIN", "GESTIONNAIRE", "MEDECIN")
                        .pathMatchers("/api/ml/**").hasAnyRole("MEDECIN", "ADMIN")
                        // everything else requires authentication by default
                        .anyExchange().authenticated()
                )
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(reactiveJwtAuthenticationConverter()))
                )
                .build();
    }
}
