# Build stage
FROM maven:3.9.6-eclipse-temurin-21-jammy AS build
WORKDIR /app
COPY pom.xml .
COPY mail-service/pom.xml mail-service/
RUN mvn -pl mail-service -am dependency:go-offline
COPY . .
RUN mvn -pl mail-service -am clean package -DskipTests

# Run stage
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
RUN addgroup --system spring && adduser --system spring --ingroup spring
USER spring
COPY --from=build /app/mail-service/target/*.jar app.jar
EXPOSE 8087
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -q --spider http://localhost:8087/actuator/health || exit 1
ENTRYPOINT ["java", "-jar", "app.jar"]
