from pydantic import BaseModel


class ColorRange(BaseModel):
    h_min: int
    h_max: int
    s_min: int
    s_max: int
    v_min: int
    v_max: int


class CalibrationProfile(BaseModel):
    green: ColorRange
    yellow: ColorRange
    red_low: ColorRange
    red_high: ColorRange
    chalky: ColorRange
