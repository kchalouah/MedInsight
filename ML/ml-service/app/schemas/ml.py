from typing import List, Optional, Dict
from pydantic import BaseModel, Field

class clinicalData(BaseModel):
    age: int
    gender: str
    symptoms: List[str]
    blood_pressure_systolic: int
    blood_pressure_diastolic: int
    heart_rate: int
    temperature: float
    existing_conditions: Optional[List[str]] = []

class DiagnosisPrediction(BaseModel):
    disease_name: str
    probability: float
    confidence_level: str
    suggested_specialists: List[str]

class DiagnosisResponse(BaseModel):
    patient_id: Optional[str] = None
    predictions: List[DiagnosisPrediction]
    status: str = "success"

class TreatmentRequest(BaseModel):
    diagnosis: str
    patient_age: int
    severity: str
    history: Optional[List[str]] = []

class TreatmentSuggestion(BaseModel):
    medication: str
    dosage: str
    duration: str
    precaution: str

class TreatmentResponse(BaseModel):
    suggestions: List[TreatmentSuggestion]
    estimated_recovery_days: int
