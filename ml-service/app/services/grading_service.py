from __future__ import annotations

from app.models.grading import GradingRule


def determine_grade(
    yellow_pct: float,
    green_pct: float,
    defect_pct: float,
    rules: list[GradingRule],
) -> tuple[str, int, str]:
    """
    Multi-dimensional grading: checks yellow%, green%, and defect% (damaged+rotten).
    Grade is determined by the BEST matching rule (first match in sorted order).
    If defect > 25%, automatic REJECT.
    """
    # Automatic reject for extreme defect levels
    if defect_pct > 25.0:
        return "REJECT", 0, "REJECTED"

    # Sort rules by quality: KW 1 Lv.1 first (strictest), KW 3 Lv.2 last
    grade_order = {"KW 1": 0, "KW 2": 1, "KW 3": 2}
    sorted_rules = sorted(rules, key=lambda r: (grade_order.get(r.grade, 9), r.level))

    for rule in sorted_rules:
        if (yellow_pct >= rule.min_yellow
                and defect_pct <= rule.max_defect
                and green_pct <= rule.max_green):
            if rule.grade in ("KW 1", "KW 2"):
                status = "OK"
            elif rule.grade == "KW 2" and rule.level == 3:
                status = "WARNING"
            else:
                status = "WARNING"
            return rule.grade, rule.level, status

    # No rule matched — worst case
    return "KW 3", 1, "WARNING"
