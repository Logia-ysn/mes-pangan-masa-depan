from fastapi import APIRouter

from app.models.calibration import CalibrationProfile
from app.models.grading import GradingConfig
from app.services.calibration_store import calibration_store

router = APIRouter(prefix="/calibration", tags=["calibration"])


@router.get("")
def get_calibration():
    return {
        "profile": calibration_store.get_profile(),
        "grading": calibration_store.get_grading(),
    }


@router.put("")
def update_calibration(profile: CalibrationProfile):
    updated = calibration_store.update_profile(profile)
    return {"profile": updated}


@router.put("/grading")
def update_grading(config: GradingConfig):
    updated = calibration_store.update_grading(config)
    return {"grading": updated}


@router.post("/reset")
def reset_calibration():
    calibration_store.reset()
    return {"message": "Reset to defaults", "profile": calibration_store.get_profile(), "grading": calibration_store.get_grading()}
