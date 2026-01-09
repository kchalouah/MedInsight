package com.medinsight.discovery;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * Simple context load test for the Eureka Server application.
 *
 * This verifies that the Spring application context can start successfully
 * with the current configuration. No mocks or web environment are required.
 */
@SpringBootTest
class DiscoveryServiceApplicationTests {

    @Test
    void contextLoads() {
        // If the application context fails to start, this test will fail.
    }
}
