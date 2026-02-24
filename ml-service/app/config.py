from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_title: str = "QC Gabah ML Service"
    app_version: str = "3.0.0"
    max_image_width: int = 800

    # Green HSV defaults (unripe grains — checked before yellow)
    green_h_min: int = 28
    green_h_max: int = 95
    green_s_min: int = 25
    green_s_max: int = 255
    green_v_min: int = 40
    green_v_max: int = 255

    # Yellow HSV defaults (broad range to capture all golden shades)
    yellow_h_min: int = 8
    yellow_h_max: int = 35
    yellow_s_min: int = 25
    yellow_s_max: int = 255
    yellow_v_min: int = 50
    yellow_v_max: int = 255

    # Red low HSV defaults
    red_low_h_min: int = 0
    red_low_h_max: int = 10
    red_low_s_min: int = 50
    red_low_s_max: int = 255
    red_low_v_min: int = 40
    red_low_v_max: int = 255

    # Red high HSV defaults
    red_high_h_min: int = 170
    red_high_h_max: int = 179
    red_high_s_min: int = 50
    red_high_s_max: int = 255
    red_high_v_min: int = 40
    red_high_v_max: int = 255

    # Chalky defaults (low saturation, high value)
    chalky_h_min: int = 0
    chalky_h_max: int = 179
    chalky_s_min: int = 0
    chalky_s_max: int = 40
    chalky_v_min: int = 180
    chalky_v_max: int = 255

    # Damaged HSV defaults (truly brown/damaged grains only)
    damaged_h_min: int = 5
    damaged_h_max: int = 20
    damaged_s_min: int = 80
    damaged_s_max: int = 200
    damaged_v_min: int = 20
    damaged_v_max: int = 70

    # Rotten HSV defaults (near-black grains only)
    rotten_h_min: int = 0
    rotten_h_max: int = 179
    rotten_s_min: int = 0
    rotten_s_max: int = 255
    rotten_v_min: int = 10
    rotten_v_max: int = 30

    # Background thresholds
    bg_white_threshold: int = 240
    bg_dark_threshold: int = 10  # Lowered from 15 to preserve rotten grain pixels

    class Config:
        env_prefix = "ML_"


settings = Settings()
