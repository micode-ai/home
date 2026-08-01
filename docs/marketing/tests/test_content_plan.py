# -*- coding: utf-8 -*-
"""The publishing calendar in `content-plan.md`.

The document states a scheduling rule and nothing enforced it: the first
version broke its own rule on 11 of 13 rows while the task report claimed the
weekdays had been verified. A weekday is arithmetic, so assert it rather than
claim it.
"""
import datetime
import re
from pathlib import Path

MARKETING = Path(__file__).resolve().parents[1]
PLAN = MARKETING / "content-plan.md"

RU_DAY = {0: "пн", 1: "вт", 2: "ср", 3: "чт",
          4: "пт", 5: "сб", 6: "вс"}

TOP = "верх"          # top of funnel
MIDDLE = "середина"  # product post

# LinkedIn is the one feed where both funnel levels compete for the same
# audience, so it is the feed the Tue/Thu rule is written for. Facebook,
# Instagram and Stories repackage the same top-of-funnel campaign on their own
# platform in the same week and are deliberately outside the rule.
LINKEDIN_WEEKDAY = {TOP: 1, MIDDLE: 3}  # Monday is 0


def _rows() -> list[dict]:
    rows = []
    for line in PLAN.read_text(encoding="utf-8").splitlines():
        if not line.startswith("|"):
            continue
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if len(cells) < 6 or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", cells[1]):
            continue
        rows.append({
            "n": cells[0],
            "date": datetime.date.fromisoformat(cells[1]),
            "day": cells[2],
            "campaign": cells[3],
            "level": cells[4],
            "channel": cells[5],
        })
    return rows


def test_the_schedule_table_was_actually_parsed():
    """Every check below loops over `_rows()`. If the table's shape ever
    changes so the parser matches nothing, all of those loops pass vacuously
    and this file silently stops testing the calendar at all."""
    rows = _rows()
    assert len(rows) == 13, f"expected 13 scheduled rows, parsed {len(rows)}"
    assert {r["level"] for r in rows} == {TOP, MIDDLE}


def test_every_row_labels_its_own_weekday_correctly():
    """The weekday column is a reader's shortcut; a wrong one is worse than
    none, because it is what stops anybody recomputing the date."""
    for row in _rows():
        expected = RU_DAY[row["date"].weekday()]
        assert row["day"] == expected, (
            f"row {row['n']} is labelled {row['day']!r} but "
            f"{row['date'].isoformat()} is a {expected!r}"
        )


def test_linkedin_rows_follow_the_weekday_rule():
    """Top of funnel on Tuesday, product on Thursday — the rule the document
    states in its own opening paragraph."""
    checked = 0
    for row in _rows():
        if not row["channel"].startswith("LinkedIn"):
            continue
        expected = LINKEDIN_WEEKDAY[row["level"]]
        assert row["date"].weekday() == expected, (
            f"row {row['n']} ({row['campaign']}, {row['level']}) falls on "
            f"{row['date'].strftime('%A')} {row['date'].isoformat()}; the rule "
            f"puts it on {RU_DAY[expected]}"
        )
        checked += 1
    assert checked >= 9, f"only {checked} LinkedIn rows found — the table changed shape"


def test_the_schedule_runs_forward():
    """Rows are read as a calendar, so row order and date order must agree —
    a swapped pair reads as a typo in the date rather than a reordering."""
    dates = [row["date"] for row in _rows()]
    assert dates == sorted(dates), dates
    assert len(set(dates)) == len(dates), "two posts scheduled on the same day"
