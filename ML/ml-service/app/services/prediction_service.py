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
                disease_name="Rhume banal",
                probability=0.85 if "toux" in [s.lower() for s in data.symptoms] or "fièvre" in [s.lower() for s in data.symptoms] else 0.1,
                confidence_level="Haute",
                suggested_specialists=["Généraliste"]
            ),
            DiagnosisPrediction(
                disease_name="Grippe Saisonnière",
                probability=0.72 if "fièvre" in [s.lower() for s in data.symptoms] else 0.05,
                confidence_level="Moyenne",
                suggested_specialists=["Généraliste", "Infectiologue"]
            ),
            DiagnosisPrediction(
                disease_name="Allergie Respiratoire",
                probability=0.45 if "éternuement" in [s.lower() for s in data.symptoms] else 0.2,
                confidence_level="Moyenne",
                suggested_specialists=["Allergologue"]
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
