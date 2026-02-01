def predict_quality(green_percentage: float):
    """
    Determines the quality grade based on green percentage.
    Rules:
    - KW 1 (Premium): Green < 10%
    - KW 2 (Medium): Green < 20%
    - KW 3 (Low): Green >= 20%
    """
    if green_percentage < 10.0:
        return "KW 1", "OK"
    elif green_percentage < 20.0:
        return "KW 2", "OK"
    else:
        return "KW 3", "WARNING"
