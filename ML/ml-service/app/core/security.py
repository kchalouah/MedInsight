from typing import Optional
import jwt
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)
security = HTTPBearer()

def validate_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    try:
        # Note: In production, you would fetch real public keys from Keycloak JWKS endpoint
        # Here we do a simplified validation for the demo
        payload = jwt.decode(
            token, 
            options={"verify_signature": False}, # Skip signature check for trial/demo flexibility
            algorithms=["RS256"]
        )
        
        # Check roles
        realm_access = payload.get("realm_access", {})
        roles = realm_access.get("roles", [])
        
        if not any(role in roles for role in settings.ALLOWED_ROLES):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
            
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired"
        )
    except Exception as e:
        logger.error(f"Token validation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
