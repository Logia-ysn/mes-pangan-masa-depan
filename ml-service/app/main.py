from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import health, analyze, analyze_detailed, calibration

import os

app = FastAPI(title=settings.app_title, version=settings.app_version)

# SEED_SECRET from env or default
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3005").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(analyze.router)
app.include_router(analyze_detailed.router)
app.include_router(calibration.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
