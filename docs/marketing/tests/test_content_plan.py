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
# Instagram and Stories are outside the rule because they are different feeds
# with a different audience — a post there takes nothing away from the next
# LinkedIn post — and not because of what they carry: rows 2 and 3 do
# repackage the same top-of-funnel campaign, but rows 9 and 11 are product
# posts (`середина`) and repackage nothing.
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
    assert len(rows) == 14, f"expected 14 scheduled rows, parsed {len(rows)}"
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


def test_the_exempt_rows_are_a_feed_rule_not_a_funnel_rule():
    """The document used to justify exempting the non-LinkedIn rows by saying
    they repackage the same top-of-funnel campaign. Two of the four do not:
    rows 9 (`emarketing-ai`) and 11 (`budget-assistant`) are product posts,
    labelled `середина` in the table right below the claim. The exemption is
    correct — those are different feeds with a different audience, so they
    take nothing away from the next LinkedIn post — but the stated reason was
    not. Pinned here so the table and the paragraph cannot drift apart again:
    if every exempt row ever really did become top-of-funnel, the paragraph
    needs rewriting along with the schedule."""
    exempt = [row for row in _rows() if not row["channel"].startswith("LinkedIn")]
    assert exempt, "no non-LinkedIn rows parsed — the table changed shape"
    assert MIDDLE in {row["level"] for row in exempt}, (
        "every row exempt from the Tue/Thu rule is now top-of-funnel, so the "
        "paragraph's feed-based reasoning should be re-checked against the table"
    )
    assert TOP in {row["level"] for row in exempt}
