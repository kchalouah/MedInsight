import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.security import validate_token

# Mock dependency
async def override_validate_token():
    return {"sub": "test-user", "realm_access": {"roles": ["MEDECIN"]}}

app.dependency_overrides[validate_token] = override_validate_token

@pytest.mark.asyncio
async def test_predict_diagnosis():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {
            "age": 30,
            "gender": "male",
            "symptoms": ["cough", "fever"],
            "blood_pressure_systolic": 120,
            "blood_pressure_diastolic": 80,
            "heart_rate": 72,
            "temperature": 38.5
        }
        response = await ac.post("/api/v1/predict/diagnosis", json=payload)
    
    assert response.status_code == 200
    data = response.json()
    assert "predictions" in data
    assert len(data["predictions"]) > 0

@pytest.mark.asyncio
async def test_predict_treatment():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {
            "diagnosis": "Common Cold",
            "patient_age": 30,
            "severity": "mild"
        }
        response = await ac.post("/api/v1/predict/treatment", json=payload)
    
    assert response.status_code == 200
    data = response.json()
    assert "suggestions" in data
    assert "estimated_recovery_days" in data
