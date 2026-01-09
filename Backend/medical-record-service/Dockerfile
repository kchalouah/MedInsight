# Build stage
FROM maven:3.9.6-eclipse-temurin-21-jammy AS build
WORKDIR /app
COPY pom.xml .
COPY medical-record-service/pom.xml medical-record-service/
RUN mvn -pl medical-record-service -am dependency:go-offline
COPY . .
RUN mvn -pl medical-record-service -am clean package -DskipTests

# Run stage
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
RUN addgroup --system spring && adduser --system spring --ingroup spring
USER spring
COPY --from=build /app/medical-record-service/target/*.jar app.jar
EXPOSE 8084
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -q --spider http://localhost:8084/actuator/health || exit 1
ENTRYPOINT ["java", "-jar", "app.jar"]
