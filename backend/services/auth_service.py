import os
import logging
import jwt
from fastapi import Header, HTTPException, Request

logger = logging.getLogger("auth_service")

# Retrieve JWT secret from environment
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

async def get_current_user(request: Request, authorization: str = Header(None)) -> str:
    """
    FastAPI dependency to retrieve the current user's ID.
    1. Tries to extract and verify the Supabase JWT token from the Authorization header.
    2. Falls back to the 'user_id' query parameter if authorization header is missing (for local testing).
    3. Falls back to 'default_user' if neither is provided.
    """
    if authorization:
        try:
            parts = authorization.split(" ")
            if len(parts) == 2 and parts[0].lower() == "bearer":
                token = parts[1]
                if SUPABASE_JWT_SECRET:
                    try:
                        # Decode and verify the Supabase JWT token
                        payload = jwt.decode(
                            token,
                            SUPABASE_JWT_SECRET,
                            algorithms=["HS256"],
                            audience="authenticated"
                        )
                        user_id = payload.get("sub")
                        if not user_id:
                            raise HTTPException(status_code=401, detail="Invalid token: missing 'sub' claim")
                        return user_id
                    except jwt.ExpiredSignatureError:
                        raise HTTPException(status_code=401, detail="Authentication token has expired")
                    except jwt.InvalidTokenError as e:
                        raise HTTPException(status_code=401, detail=f"Invalid authentication token: {str(e)}")
                else:
                    # Secret is not set (e.g. local dev), decode without verifying signature
                    try:
                        payload = jwt.decode(token, options={"verify_signature": False})
                        user_id = payload.get("sub", "default_user")
                        return user_id
                    except jwt.InvalidTokenError:
                        return "default_user"
        except Exception as e:
            logger.warning(f"Auth token decoding failed: {e}")
            if SUPABASE_JWT_SECRET:
                raise HTTPException(status_code=401, detail="Failed to decode authentication token")

    # Fallback to query parameter
    query_user_id = request.query_params.get("user_id")
    if query_user_id:
        return query_user_id

    # Default fallback for development
    return "default_user"
