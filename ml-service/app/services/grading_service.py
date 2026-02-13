from __future__ import annotations

from app.models.grading import GradingRule


def determine_grade(
    green_pct: float,
    rules: list[GradingRule],
) -> tuple[str, int, str]:
    sorted_rules = sorted(rules, key=lambda r: r.max_green)
    for rule in sorted_rules:
        if green_pct < rule.max_green:
            status = "OK" if rule.grade in ("KW 1", "KW 2") else "WARNING"
            return rule.grade, rule.level, status

    # No rule matched — worst case
    last = sorted_rules[-1] if sorted_rules else None
    if last:
        status = "OK" if last.grade in ("KW 1", "KW 2") else "WARNING"
        return last.grade, last.level, status
    return "KW 3", 1, "WARNING"
