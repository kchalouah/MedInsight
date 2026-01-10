from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "MedInsight ML Service"
    API_V1_STR: str = "/ml"
    
    # Eureka Configuration
    EUREKA_SERVER_URL: str = "http://localhost:8761/eureka/"
    APP_NAME: str = "ml-service"
    INSTANCE_PORT: int = 8086
    INSTANCE_HOST: str = "localhost"
    
    # Keycloak / JWT Configuration
    KEYCLOAK_ISSUER: str = "http://localhost:8180/realms/medinsight"
    ALLOWED_ROLES: List[str] = ["MEDECIN", "ADMIN"]
    
    class Config:
        env_file = ".env"

settings = Settings()
