# MedInsight ML Service

Machine Learning-powered medical prediction service built with **FastAPI**.

## Features
- **Diagnosis Prediction**: Predict disease risks from symptoms and clinical data.
- **Treatment Suggestions**: Intelligently suggest treatments based on diagnosis and clinical severity.
- **Eureka Integration**: Dynamically registers with the Eureka discovery server.
- **Security**: JWT-based authentication compatible with the MedInsight Keycloak realm.
- **Auditing**: Middleware-based logging of all requests and latency.
- **CORS**: Enabled for frontend integration.

## API Documentation
Once running, visit:
- Swagger UI: `http://localhost:8086/docs`
- ReDoc: `http://localhost:8086/redoc`

## Project Structure
```text
ml-service/
├── app/
│   ├── api/          # Route handlers
│   ├── core/         # Config, Security, Eureka client
│   ├── schemas/      # Pydantic models (validation)
│   ├── services/     # ML logic & model stubs
│   └── main.py       # App entry point
├── tests/            # Unit tests
├── Dockerfile        # Container config
└── requirements.txt  # Python dependencies
```

## Setup & Run

### Local Setup
1. Create a virtual environment: `python -m venv venv`
2. Activate it: `source venv/bin/activate` (or `venv\Scripts\activate` on Windows)
3. Install dependencies: `pip install -r requirements.txt`
4. Run the app: `uvicorn app.main:app --host 0.0.0.0 --port 8086 --reload`

### Testing
Run tests using pytest:
```bash
pytest
```

### Docker
```bash
docker build -t ml-service .
docker run -p 8086:8086 ml-service
```
