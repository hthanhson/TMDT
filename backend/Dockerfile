FROM maven:3.8.7-eclipse-temurin-17-alpine AS build
WORKDIR /app

# Copy pom.xml for dependency resolution with better caching
COPY pom.xml .
# Download dependencies and cache them
RUN mvn dependency:go-offline -B

# Copy source files and build
COPY src ./src
RUN mvn package -DskipTests

# Runtime stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Create volume directory for uploads
RUN mkdir -p /app/uploads
VOLUME /app/uploads

# Create directory for logs
RUN mkdir -p /app/logs
VOLUME /app/logs

# Copy JAR from build stage
COPY --from=build /app/target/*.jar app.jar

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -q --spider http://localhost:8080/actuator/health || exit 1

# Expose ports - API and WebSocket
EXPOSE 8080
EXPOSE 8088

# Set Java options for containerized environment
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"] 