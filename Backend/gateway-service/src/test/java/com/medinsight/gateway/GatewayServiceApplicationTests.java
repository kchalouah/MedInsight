package com.medinsight.gateway;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * Verifies that the Gateway application context loads with current configuration.
 */
@SpringBootTest(properties = {
        "eureka.client.enabled=false",
        "spring.security.oauth2.resourceserver.jwt.jwk-set-uri=http://localhost:0"
})
class GatewayServiceApplicationTests {

    @Test
    void contextLoads() {
        // Context load smoke test
    }
}
