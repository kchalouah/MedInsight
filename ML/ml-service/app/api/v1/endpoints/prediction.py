from typing import Dict, Any
from fastapi import APIRouter, Depends, status
from app.schemas.ml import DiagnosisResponse, clinicalData, TreatmentRequest, TreatmentResponse
from app.services.prediction_service import prediction_service
from app.core.security import validate_token

router = APIRouter()

@router.post("/diagnosis", response_model=DiagnosisResponse, status_code=status.HTTP_200_OK)
async def predict_diagnosis(
    data: clinicalData,
    token: Dict[str, Any] = Depends(validate_token)
):
    """
    Takes patient clinical data and returns disease risk probabilities.
    Restricted to MEDECIN and ADMIN roles.
    """
    return await prediction_service.predict_diagnosis(data)

@router.post("/treatment", response_model=TreatmentResponse, status_code=status.HTTP_200_OK)
async def predict_treatment(
    request: TreatmentRequest,
    token: Dict[str, Any] = Depends(validate_token)
):
    """
    Takes consultation data and returns treatment suggestions.
    Restricted to MEDECIN and ADMIN roles.
    """
    return await prediction_service.suggest_treatment(request)
