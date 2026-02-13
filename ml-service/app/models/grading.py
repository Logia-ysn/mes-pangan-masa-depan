from __future__ import annotations

from pydantic import BaseModel


class GradingRule(BaseModel):
    grade: str
    level: int
    max_green: float


class GradingConfig(BaseModel):
    rules: list[GradingRule] = [
        GradingRule(grade="KW 1", level=1, max_green=3.0),
        GradingRule(grade="KW 1", level=2, max_green=5.0),
        GradingRule(grade="KW 1", level=3, max_green=10.0),
        GradingRule(grade="KW 2", level=1, max_green=15.0),
        GradingRule(grade="KW 2", level=2, max_green=20.0),
        GradingRule(grade="KW 3", level=1, max_green=100.0),
    ]
