from __future__ import annotations

from pydantic import BaseModel


class GradingRule(BaseModel):
    grade: str
    level: int
    min_yellow: float = 0.0
    max_defect: float = 100.0
    max_green: float = 100.0


class GradingConfig(BaseModel):
    rules: list[GradingRule] = [
        # KW 1
        GradingRule(grade="KW 1", level=1, min_yellow=95.0, max_defect=1.0, max_green=2.0),
        GradingRule(grade="KW 1", level=2, min_yellow=90.0, max_defect=2.0, max_green=5.0),
        GradingRule(grade="KW 1", level=3, min_yellow=85.0, max_defect=3.0, max_green=8.0),
        # KW 2
        GradingRule(grade="KW 2", level=1, min_yellow=75.0, max_defect=5.0, max_green=15.0),
        GradingRule(grade="KW 2", level=2, min_yellow=65.0, max_defect=8.0, max_green=20.0),
        GradingRule(grade="KW 2", level=3, min_yellow=55.0, max_defect=10.0, max_green=25.0),
        # KW 3
        GradingRule(grade="KW 3", level=1, min_yellow=0.0, max_defect=15.0, max_green=100.0),
        GradingRule(grade="KW 3", level=2, min_yellow=0.0, max_defect=25.0, max_green=100.0),
    ]
