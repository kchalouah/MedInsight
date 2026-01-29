# ========= BUILD STAGE =========
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /build

# Copy parent pom
COPY pom.xml .

# Copy all microservices' pom files
COPY appointment-service/pom.xml appointment-service/pom.xml
COPY audit-service/pom.xml audit-service/pom.xml
COPY auth-service/pom.xml auth-service/pom.xml
COPY discovery-service/pom.xml discovery-service/pom.xml
COPY gateway-service/pom.xml gateway-service/pom.xml
COPY mail-service/pom.xml mail-service/pom.xml
COPY medical-record-service/pom.xml medical-record-service/pom.xml

# Copy all source code folders
COPY appointment-service/ appointment-service/
COPY audit-service/ audit-service/
COPY auth-service/ auth-service/
COPY discovery-service/ discovery-service/
COPY gateway-service/ gateway-service/
COPY mail-service/ mail-service/
COPY medical-record-service/ medical-record-service/

# Pre-download dependencies for all modules (speedup)
RUN mvn dependency:go-offline

# Build ONLY the medical-record-service module and its dependencies, skip tests
RUN mvn -pl medical-record-service -am package -DskipTests

# ========= RUNTIME STAGE =========
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Create a system user for security
RUN addgroup --system spring && adduser --system spring --ingroup spring
USER spring

# Copy the built JAR of medical-record-service from the build stage
COPY --from=build /build/medical-record-service/target/*.jar app.jar

# Expose the port
EXPOSE 8084

# Run the JAR
ENTRYPOINT ["java", "-jar", "app.jar"]
