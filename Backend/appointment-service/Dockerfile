# Build stage
FROM eclipse-temurin:17-jdk as build

WORKDIR /app

# Copy Maven wrapper and pom files
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
COPY ../pom.xml ../pom.xml

# Download dependencies
RUN ./mvnw dependency:go-offline -B

# Copy source code
COPY src ./src

# Build the application
RUN ./mvnw clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:17-jre

# Set non-root user for security
RUN useradd -ms /bin/bash spring
USER spring

WORKDIR /app

# Copy JAR from build stage
COPY --from=build /app/target/appointment-service-*.jar app.jar

# Expose port
EXPOSE 8082

# JVM options
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0"

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD wget -qO- http://localhost:8082/actuator/health | grep -q 'UP' || exit 1

# Run the application
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
