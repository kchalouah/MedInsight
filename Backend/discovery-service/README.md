
```bash
# From project root
mvn -pl discovery-service -am test

# Or from the module directory
cd discovery-service
mvn test
```

Coverage:
- DiscoveryServiceApplicationTests: boots the Eureka Server Spring context and verifies it loads without errors.

## Docker

### Build image
```bash
# From project root (after building the JAR)
mvn -U -T 1C -pl discovery-service -am clean package
cd discovery-service
docker build -t medinsight/discovery-service:1.0.0 .
```

### Run container
```bash
docker run --rm -p 8761:8761 --name discovery medinsight/discovery-service:1.0.0
```

The service will be available at `http://localhost:8761` and health endpoint at `http://localhost:8761/actuator/health`.

## Notes
- To form an HA Eureka cluster, add additional peers and configure appropriate `eureka.client` and `eureka.instance` settings.
- JVM memory options can be adjusted with `JAVA_OPTS` environment variable when running the container.
