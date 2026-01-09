# ML Service (Machine Learning Service)

## Overview
The **ML Service** provides AI-powered medical predictions and treatment recommendations for the MedInsight platform. Built with FastAPI and Python, it offers diagnosis predictions and treatment suggestions based on patient clinical data.

## Architecture

### Technology Stack
- **Framework**: FastAPI 0.104.1
- **Language**: Python 3.11
- **ML Libraries**: scikit-learn, pandas, numpy
- **Authentication**: JWT validation
- **Service Discovery**: Eureka (via py-eureka-client)
- **API Documentation**: FastAPI automatic OpenAPI

### Port Configuration
- **Service Port**: 8086
- **Eureka Discovery**: 8761
- **Gateway Access**: http://localhost:8080/api/ml

## Key Features

1. **Diagnosis Prediction**: Predicts potential diseases based on symptoms and vitals
2. **Treatment Suggestions**: Recommends treatments based on diagnosis and patient history
3. **Risk Assessment**: Calculates disease risk probabilities
4. **Specialist Recommendations**: Suggests appropriate medical specialists
5. **Confidence Scoring**: Provides confidence levels for predictions
6. **RESTful API**: Easy integration with other microservices

## Data Models

### Request Models

#### ClinicalData (Diagnosis Input)
```python
class ClinicalData(BaseModel):
    age: int                          # Patient age
    gender: str                       # M, F, or Other
    symptoms: List[str]               # List of symptoms
    blood_pressure_systolic: int      # Systolic BP (mmHg)
    blood_pressure_diastolic: int     # Diastolic BP (mmHg)
    heart_rate: int                   # Heart rate (bpm)
    temperature: float                # Body temperature (°C)
    existing_conditions: Optional[List[str]] = []  # Chronic conditions
```

#### TreatmentRequest (Treatment Input)
```python
class TreatmentRequest(BaseModel):
    diagnosis: str                    # Primary diagnosis
    patient_age: int                  # Patient age
    severity: str                     # mild, moderate, severe
    history: Optional[List[str]] = [] # Medical history
```

### Response Models

#### DiagnosisPrediction
```python
class DiagnosisPrediction(BaseModel):
    disease_name: str                 # Predicted disease
    probability: float                # Confidence (0.0-1.0)
    confidence_level: str             # low, medium, high
    suggested_specialists: List[str]  # Recommended specialists
```

#### DiagnosisResponse
```python
class DiagnosisResponse(BaseModel):
    patient_id: Optional[str] = None
    predictions: List[DiagnosisPrediction]  # Top predictions
    status: str = "success"
```

#### TreatmentSuggestion
```python
class TreatmentSuggestion(BaseModel):
    medication: str                   # Medication name
    dosage: str                       # Recommended dosage
    duration: str                     # Treatment duration
    precaution: str                   # Important precautions
```

#### TreatmentResponse
```python
class TreatmentResponse(BaseModel):
    suggestions: List[TreatmentSuggestion]
    estimated_recovery_days: int
```

## REST API Endpoints

### Prediction Endpoints

#### Predict Diagnosis
```http
POST /api/v1/predict/diagnosis
Authorization: Bearer {token}
Content-Type: application/json

{
  "age": 45,
  "gender": "M",
  "symptoms": ["fever", "cough", "fatigue"],
  "blood_pressure_systolic": 130,
  "blood_pressure_diastolic": 85,
  "heart_rate": 78,
  "temperature": 38.5,
  "existing_conditions": ["hypertension"]
}
```

**Access**: `ROLE_MEDECIN`, `ROLE_ADMIN`

**Response**: `200 OK`
```json
{
  "patient_id": null,
  "predictions": [
    {
      "disease_name": "Influenza",
      "probability": 0.85,
      "confidence_level": "high",
      "suggested_specialists": ["General Practitioner", "Infectious Disease Specialist"]
    },
    {
      "disease_name": "Common Cold",
      "probability": 0.65,
      "confidence_level": "medium",
      "suggested_specialists": ["General Practitioner"]
    }
  ],
  "status": "success"
}
```

#### Suggest Treatment
```http
POST /api/v1/predict/treatment
Authorization: Bearer {token}
Content-Type: application/json

{
  "diagnosis": "Influenza",
  "patient_age": 45,
  "severity": "moderate",
  "history": ["hypertension"]
}
```

**Access**: `ROLE_MEDECIN`, `ROLE_ADMIN`

**Response**: `200 OK`
```json
{
  "suggestions": [
    {
      "medication": "Oseltamivir (Tamiflu)",
      "dosage": "75mg twice daily",
      "duration": "5 days",
      "precaution": "Take within 48 hours of symptom onset. Monitor blood pressure."
    },
    {
      "medication": "Acetaminophen",
      "dosage": "500mg every 6 hours",
      "duration": "As needed",
      "precaution": "Do not exceed 4000mg per day. For fever and pain relief."
    }
  ],
  "estimated_recovery_days": 7
}
```

## Machine Learning Models

### Diagnosis Model
- **Algorithm**: Random Forest Classifier / Gradient Boosting
- **Features**: Age, gender, symptoms, vitals, medical history
- **Output**: Disease probabilities with confidence scores
- **Training Data**: Synthetic medical data (expandable with real data)

### Treatment Model
- **Algorithm**: Rule-based system with ML enhancement
- **Input**: Diagnosis, patient demographics, severity, history
- **Output**: Medication recommendations with dosages
- **Knowledge Base**: Medical treatment guidelines

### Model Training
```python
# Example training pipeline
from sklearn.ensemble import RandomForestClassifier

def train_diagnosis_model(X_train, y_train):
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        random_state=42
    )
    model.fit(X_train, y_train)
    return model
```

## Service Layer

### Key Services

#### PredictionService
**Methods**:
- `predict_diagnosis(data: ClinicalData)` → DiagnosisResponse
  - Preprocesses clinical data
  - Runs ML model inference
  - Ranks predictions by probability
  - Adds specialist recommendations
  
- `suggest_treatment(request: TreatmentRequest)` → TreatmentResponse
  - Matches diagnosis to treatment protocols
  - Considers patient age and history
  - Adjusts for severity level
  - Provides precautions and warnings

#### FeatureEngineering
**Methods**:
- `encode_symptoms(symptoms: List[str])` - Convert symptoms to feature vector
- `normalize_vitals(vitals: dict)` - Normalize vital signs
- `calculate_risk_factors(patient_data: dict)` - Compute risk scores

## Security

### JWT Authentication
```python
from fastapi import Depends, HTTPException
from app.core.security import validate_token

@router.post("/diagnosis")
async def predict_diagnosis(
    data: ClinicalData,
    token: dict = Depends(validate_token)
):
    # Only doctors and admins can access
    if "MEDECIN" not in token.get("roles", []) and "ADMIN" not in token.get("roles", []):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    return await prediction_service.predict_diagnosis(data)
```

### Token Validation
- **Issuer**: Validates against Keycloak issuer
- **Signature**: Verifies JWT signature
- **Expiration**: Checks token expiry
- **Roles**: Extracts and validates user roles

## Eureka Integration

### Registration
```python
import py_eureka_client.eureka_client as eureka_client

def register_with_eureka():
    eureka_client.init(
        eureka_server=os.getenv("EUREKA_SERVER_URL", "http://discovery-service:8761/eureka/"),
        app_name="ml-service",
        instance_port=8086,
        instance_host=os.getenv("INSTANCE_HOST", "ml-service")
    )
```

### Health Check
```python
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "ml-service",
        "version": "1.0.0"
    }
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 8086 | Service port |
| `KEYCLOAK_ISSUER` | http://localhost:8180/realms/medinsight | Keycloak issuer |
| `EUREKA_SERVER_URL` | http://discovery-service:8761/eureka/ | Eureka URL |
| `INSTANCE_HOST` | ml-service | Service hostname |
| `MODEL_PATH` | ./models | ML model storage path |
| `LOG_LEVEL` | INFO | Logging level |

### Application Settings
```python
# app/core/config.py
class Settings(BaseSettings):
    PROJECT_NAME: str = "ML Service"
    API_V1_STR: str = "/api/v1"
    KEYCLOAK_ISSUER: str
    MODEL_PATH: str = "./models"
    
    class Config:
        env_file = ".env"
```

## Dependencies

### requirements.txt
```
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.4.2
scikit-learn==1.3.2
pandas==2.1.3
numpy==1.26.2
python-jose[cryptography]==3.3.0
py-eureka-client==0.11.0
httpx==0.25.1
```

## Build & Run

### Local Development
```bash
# Install dependencies
pip install -r requirements.txt

# Run service
uvicorn app.main:app --host 0.0.0.0 --port 8086 --reload
```

### Docker Build
```bash
docker build -t medinsight-ml-service .
```

### Docker Run
```bash
docker run -p 8086:8086 \
  -e KEYCLOAK_ISSUER=http://keycloak:8080/realms/medinsight \
  -e EUREKA_SERVER_URL=http://discovery-service:8761/eureka/ \
  medinsight-ml-service
```

### Docker Compose
```bash
docker-compose up -d ml-service
```

## API Documentation

### Interactive Docs
- **Swagger UI**: http://localhost:8086/docs
- **ReDoc**: http://localhost:8086/redoc
- **OpenAPI JSON**: http://localhost:8086/openapi.json

### Via Gateway
- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **Service docs**: http://localhost:8080/api/ml/v1/docs

## Model Management

### Model Versioning
```
models/
├── diagnosis_v1.pkl
├── diagnosis_v2.pkl
└── treatment_rules_v1.json
```

### Model Loading
```python
import joblib

class ModelManager:
    def __init__(self, model_path: str):
        self.diagnosis_model = joblib.load(f"{model_path}/diagnosis_v1.pkl")
    
    def predict(self, features):
        return self.diagnosis_model.predict_proba(features)
```

### Model Updates
1. Train new model offline
2. Save with version number
3. Update configuration to use new version
4. Restart service (zero-downtime with load balancer)

## Performance Optimization

### Caching
```python
from functools import lru_cache

@lru_cache(maxsize=1000)
def get_treatment_for_diagnosis(diagnosis: str, severity: str):
    # Cache treatment lookups
    return treatment_database.get(diagnosis, severity)
```

### Async Processing
```python
@router.post("/diagnosis")
async def predict_diagnosis(data: ClinicalData):
    # Non-blocking prediction
    result = await prediction_service.predict_diagnosis(data)
    return result
```

## Monitoring & Logging

### Logging
```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

logger.info(f"Prediction request for patient with symptoms: {symptoms}")
```

### Metrics
- Request count
- Prediction latency
- Model accuracy
- Error rate

## Error Handling

### Custom Exceptions
```python
class ModelNotLoadedException(Exception):
    pass

class InvalidInputException(Exception):
    pass

@app.exception_handler(ModelNotLoadedException)
async def model_not_loaded_handler(request, exc):
    return JSONResponse(
        status_code=503,
        content={"detail": "ML model not available"}
    )
```

## Testing

### Unit Tests
```python
def test_diagnosis_prediction():
    data = ClinicalData(
        age=30,
        gender="M",
        symptoms=["fever", "cough"],
        blood_pressure_systolic=120,
        blood_pressure_diastolic=80,
        heart_rate=72,
        temperature=38.5
    )
    
    result = prediction_service.predict_diagnosis(data)
    assert result.status == "success"
    assert len(result.predictions) > 0
```

### Integration Tests
```bash
pytest tests/ -v
```

## Best Practices

1. **Model Versioning**: Track model versions for reproducibility
2. **Input Validation**: Validate all clinical data
3. **Error Handling**: Graceful degradation when model unavailable
4. **Logging**: Log all predictions for audit trail
5. **Performance**: Cache frequent predictions
6. **Security**: Validate JWT tokens, restrict to medical staff
7. **Documentation**: Keep API docs up to date
8. **Testing**: Unit test models and endpoints
9. **Monitoring**: Track prediction accuracy over time
10. **Updates**: Regular model retraining with new data

## Future Enhancements

1. **Deep Learning Models**: Neural networks for complex diagnoses
2. **Image Analysis**: X-ray and MRI interpretation
3. **Drug Interactions**: Check for medication conflicts
4. **Personalized Medicine**: Patient-specific treatment plans
5. **Real-time Monitoring**: Continuous patient data analysis
6. **Federated Learning**: Privacy-preserving model training
7. **Explainable AI**: Interpretable prediction explanations
