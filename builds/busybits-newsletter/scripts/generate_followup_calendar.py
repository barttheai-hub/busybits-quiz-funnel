#!/usr/bin/env python3
"""Generate upcoming sponsor follow-up calendar from tracker sent records.

Usage:
  python3 builds/busybits-newsletter/scripts/generate_followup_calendar.py \
    --tracker builds/busybits-newsletter/sponsorship_outreach_tracker.csv \
    --date 2026-02-24 \
    --days 10 \
    --output-csv builds/busybits-newsletter/sponsor_followup_calendar_2026-02-24.csv \
    --output-md builds/busybits-newsletter/sponsor_followup_calendar_2026-02-24.md
"""

from __future__ import annotations

import argparse
import csv
import re
from datetime import date, datetime, timedelta
from pathlib import Path

SENT_DATE_RE = re.compile(r"\bon\s+(\d{4}-\d{2}-\d{2})\b")


def parse_date(raw: str | None) -> date | None:
    if not raw:
        return None
    try:
        return datetime.strptime(raw.strip(), "%Y-%m-%d").date()
    except ValueError:
        return None


def extract_sent_date(row: dict[str, str]) -> date | None:
    notes = (row.get("notes") or "").strip()
    if notes:
        match = SENT_DATE_RE.search(notes)
        if match:
            return parse_date(match.group(1))

    # Fallback: if tracker ever stores date in next_action.
    fallback = (row.get("next_action") or "").strip()
    match = SENT_DATE_RE.search(fallback)
    if match:
        return parse_date(match.group(1))
    return None


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--tracker", required=True)
    p.add_argument("--date", default=date.today().isoformat(), help="Anchor date YYYY-MM-DD")
    p.add_argument("--days", type=int, default=10, help="Horizon window in days from --date")
    p.add_argument("--output-csv", required=True)
    p.add_argument("--output-md", required=True)
    args = p.parse_args()

    anchor = parse_date(args.date)
    if not anchor:
        raise SystemExit("Invalid --date. Use YYYY-MM-DD")

    horizon_end = anchor + timedelta(days=max(0, args.days))
    rows = list(csv.DictReader(Path(args.tracker).open()))

    out: list[dict[str, str]] = []
    for row in rows:
        status = (row.get("status") or "").strip().lower()
        if status != "sent":
            continue

        sent_date = extract_sent_date(row)
        if not sent_date:
            continue

        for offset, action_type in ((3, "followup_1"), (7, "followup_2")):
            due = sent_date + timedelta(days=offset)
            if due < anchor or due > horizon_end:
                continue
            out.append(
                {
                    "company": (row.get("company") or "").strip(),
                    "priority": (row.get("priority") or "").strip(),
                    "contact_email": (row.get("contact_email") or "").strip(),
                    "outreach_angle": (row.get("outreach_angle") or "").strip(),
                    "sent_date": sent_date.isoformat(),
                    "action_type": action_type,
                    "due_date": due.isoformat(),
                    "days_until_due": str((due - anchor).days),
                    "next_action": f"Send {action_type.replace('_', ' ')}",
                }
            )

    priority_rank = {"P1": 0, "P2": 1, "P3": 2}
    out.sort(
        key=lambda r: (
            r["due_date"],
            priority_rank.get(r.get("priority", "P3"), 9),
            r["company"],
            r["action_type"],
        )
    )

    out_csv = Path(args.output_csv)
    out_csv.parent.mkdir(parents=True, exist_ok=True)
    fields = [
        "company",
        "priority",
        "contact_email",
        "outreach_angle",
        "sent_date",
        "action_type",
        "due_date",
        "days_until_due",
        "next_action",
    ]
    with out_csv.open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(out)

    lines = [
        f"# Sponsor Follow-up Calendar ({anchor.isoformat()} → {horizon_end.isoformat()})",
        "",
        f"Generated from: `{args.tracker}`",
        f"Upcoming follow-ups: **{len(out)}**",
        "",
    ]

    if not out:
        lines.append("No follow-ups scheduled in this window.")
    else:
        lines.append("## Queue")
        lines.append("")
        for i, r in enumerate(out, 1):
            lines.extend(
                [
                    f"{i}. **{r['company']}** ({r['priority']}) — {r['action_type']} due {r['due_date']} (in {r['days_until_due']}d)",
                    f"   - Contact: {r['contact_email'] or 'n/a'}",
                    f"   - Angle: {r['outreach_angle']}",
                    "",
                ]
            )

    Path(args.output_md).write_text("\n".join(lines))


if __name__ == "__main__":
    main()
