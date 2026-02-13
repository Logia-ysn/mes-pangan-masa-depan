from __future__ import annotations

from pydantic import BaseModel
from typing import Optional

from app.models.calibration import CalibrationProfile
from app.models.grading import GradingRule


class AnalyzeBase64Request(BaseModel):
    image_base64: str
    supplier: Optional[str] = None
    lot: Optional[str] = None


class AnalyzeDetailedRequest(BaseModel):
    image_base64: str
    supplier: Optional[str] = None
    lot: Optional[str] = None
    calibration: Optional[CalibrationProfile] = None
    grading_rules: Optional[list[GradingRule]] = None
