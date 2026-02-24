#!/usr/bin/env python3
"""Generate a send-ready batch for follow-ups due in the next N days.

Input: sponsor_followup_calendar_<date>.csv (from generate_followup_calendar.py)
Output: sponsor_followup_upcoming_batch_<date>.csv/.md
"""

from __future__ import annotations

import argparse
import csv
from datetime import date, timedelta
from pathlib import Path


def parse_date(s: str) -> date:
    return date.fromisoformat((s or "").strip())


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--calendar", required=True)
    p.add_argument("--date", required=True, help="YYYY-MM-DD")
    p.add_argument("--days", type=int, default=3, help="Lookahead window in days (default: 3)")
    p.add_argument("--output-csv", required=True)
    p.add_argument("--output-md", required=True)
    args = p.parse_args()

    start = parse_date(args.date)
    end = start + timedelta(days=max(0, args.days))

    with Path(args.calendar).open("r", newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    upcoming = []
    for r in rows:
        try:
            d = parse_date(r.get("followup_date", ""))
        except Exception:
            continue
        if start <= d <= end:
            upcoming.append(r)

    upcoming.sort(key=lambda r: (r.get("followup_date", ""), r.get("company", ""), r.get("followup_step", "")))

    fieldnames = [
        "followup_date",
        "company",
        "contact_name",
        "contact_email",
        "followup_step",
        "owner",
        "subject",
        "suggested_action",
    ]

    out_csv = Path(args.output_csv)
    out_csv.parent.mkdir(parents=True, exist_ok=True)
    with out_csv.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        for r in upcoming:
            w.writerow({k: r.get(k, "") for k in fieldnames})

    out_md = Path(args.output_md)
    with out_md.open("w", encoding="utf-8") as f:
        f.write(f"# Sponsor Follow-up Upcoming Batch ({args.date} +{args.days}d)\n\n")
        f.write(f"Window: **{start.isoformat()} → {end.isoformat()}**\n\n")
        f.write(f"Total upcoming: **{len(upcoming)}**\n\n")
        if not upcoming:
            f.write("No follow-ups due in this lookahead window.\n")
        else:
            for i, r in enumerate(upcoming, 1):
                f.write(f"## {i}. {r.get('company','Unknown')} — {r.get('followup_step','')} ({r.get('followup_date','')})\n")
                f.write(f"- Contact: {r.get('contact_name','')} <{r.get('contact_email','')}>\n")
                f.write(f"- Subject: {r.get('subject','')}\n")
                f.write(f"- Action: {r.get('suggested_action','')}\n\n")

    print(f"UPCOMING_BATCH_OK count={len(upcoming)}")
    print(f"CSV: {out_csv}")
    print(f"MD: {out_md}")


if __name__ == "__main__":
    main()
