from fastapi import APIRouter

from app.config import settings

router = APIRouter()


@router.get("/")
def root():
    return {"status": "ML Service Running", "version": settings.app_version}


@router.get("/health")
def health():
    return {"status": "healthy"}
