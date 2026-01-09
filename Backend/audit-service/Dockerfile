# Build stage
FROM maven:3.9.6-eclipse-temurin-21-jammy AS build
WORKDIR /app
COPY pom.xml .
COPY audit-service/pom.xml audit-service/
RUN mvn -pl audit-service -am dependency:go-offline
COPY . .
RUN mvn -pl audit-service -am clean package -DskipTests

# Run stage
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
RUN addgroup --system spring && adduser --system spring --ingroup spring
USER spring
COPY --from=build /app/audit-service/target/*.jar app.jar
EXPOSE 8085
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -q --spider http://localhost:8085/actuator/health || exit 1
ENTRYPOINT ["java", "-jar", "app.jar"]
