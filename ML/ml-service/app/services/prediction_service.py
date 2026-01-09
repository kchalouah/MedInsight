from typing import List
from app.schemas.ml import DiagnosisPrediction, DiagnosisResponse, TreatmentSuggestion, TreatmentResponse, clinicalData, TreatmentRequest
import random

class PredictionService:
    def __init__(self):
        # In a real app, you would load models here (e.g., joblib.load('model.pkt'))
        pass

    async def predict_diagnosis(self, data: clinicalData) -> DiagnosisResponse:
        # Mock ML Logic
        predictions = [
            DiagnosisPrediction(
                disease_name="Common Cold",
                probability=0.85 if "cough" in [s.lower() for s in data.symptoms] else 0.1,
                confidence_level="High",
                suggested_specialists=["General Practitioner"]
            ),
            DiagnosisPrediction(
                disease_name="Seasonal Allergy",
                probability=0.65,
                confidence_level="Medium",
                suggested_specialists=["Allergist"]
            )
        ]
        
        # Sort by probability
        predictions.sort(key=lambda x: x.probability, reverse=True)
        
        return DiagnosisResponse(
            patient_id=None,
            predictions=predictions
        )

    async def suggest_treatment(self, request: TreatmentRequest) -> TreatmentResponse:
        # Mock ML Logic
        suggestions = [
            TreatmentSuggestion(
                medication="Paracetamol",
                dosage="500mg",
                duration="5 days",
                precaution="Avoid alcohol"
            )
        ]
        
        if "cold" in request.diagnosis.lower():
            suggestions.append(TreatmentSuggestion(
                medication="Vitamin C",
                dosage="1000mg",
                duration="7 days",
                precaution="Take with water"
            ))

        return TreatmentResponse(
            suggestions=suggestions,
            estimated_recovery_days=random.randint(3, 10)
        )

prediction_service = PredictionService()
