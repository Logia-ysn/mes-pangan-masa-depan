from app.config import settings
from app.models.calibration import CalibrationProfile, ColorRange
from app.models.grading import GradingConfig


def _default_profile() -> CalibrationProfile:
    return CalibrationProfile(
        green=ColorRange(
            h_min=settings.green_h_min, h_max=settings.green_h_max,
            s_min=settings.green_s_min, s_max=settings.green_s_max,
            v_min=settings.green_v_min, v_max=settings.green_v_max,
        ),
        yellow=ColorRange(
            h_min=settings.yellow_h_min, h_max=settings.yellow_h_max,
            s_min=settings.yellow_s_min, s_max=settings.yellow_s_max,
            v_min=settings.yellow_v_min, v_max=settings.yellow_v_max,
        ),
        red_low=ColorRange(
            h_min=settings.red_low_h_min, h_max=settings.red_low_h_max,
            s_min=settings.red_low_s_min, s_max=settings.red_low_s_max,
            v_min=settings.red_low_v_min, v_max=settings.red_low_v_max,
        ),
        red_high=ColorRange(
            h_min=settings.red_high_h_min, h_max=settings.red_high_h_max,
            s_min=settings.red_high_s_min, s_max=settings.red_high_s_max,
            v_min=settings.red_high_v_min, v_max=settings.red_high_v_max,
        ),
        chalky=ColorRange(
            h_min=settings.chalky_h_min, h_max=settings.chalky_h_max,
            s_min=settings.chalky_s_min, s_max=settings.chalky_s_max,
            v_min=settings.chalky_v_min, v_max=settings.chalky_v_max,
        ),
        damaged=ColorRange(
            h_min=settings.damaged_h_min, h_max=settings.damaged_h_max,
            s_min=settings.damaged_s_min, s_max=settings.damaged_s_max,
            v_min=settings.damaged_v_min, v_max=settings.damaged_v_max,
        ),
        rotten=ColorRange(
            h_min=settings.rotten_h_min, h_max=settings.rotten_h_max,
            s_min=settings.rotten_s_min, s_max=settings.rotten_s_max,
            v_min=settings.rotten_v_min, v_max=settings.rotten_v_max,
        ),
    )


class _CalibrationStore:
    def __init__(self) -> None:
        self._profile = _default_profile()
        self._grading = GradingConfig()

    def get_profile(self) -> CalibrationProfile:
        return self._profile

    def update_profile(self, profile: CalibrationProfile) -> CalibrationProfile:
        self._profile = profile
        return self._profile

    def get_grading(self) -> GradingConfig:
        return self._grading

    def update_grading(self, config: GradingConfig) -> GradingConfig:
        self._grading = config
        return self._grading

    def reset(self) -> None:
        self._profile = _default_profile()
        self._grading = GradingConfig()


calibration_store = _CalibrationStore()
