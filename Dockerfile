FROM eclipse-temurin:17-jdk AS build
WORKDIR /workspace

COPY app/ ./
RUN chmod +x ./mvnw
RUN ./mvnw -DskipTests package

FROM eclipse-temurin:17-jre AS runtime
WORKDIR /app

COPY --from=build /workspace/target/*.jar app.jar

EXPOSE 10000
ENTRYPOINT ["java", "-Dserver.port=10000", "-jar", "/app/app.jar"]
