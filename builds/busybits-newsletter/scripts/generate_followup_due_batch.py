#!/usr/bin/env python3
"""Generate a send-ready batch for follow-ups due on or before a target date.

Input: sponsor_followup_calendar_<date>.csv (from generate_followup_calendar.py)
Output: sponsor_followup_due_batch_<date>.csv/.md
"""

from __future__ import annotations

import argparse
import csv
from datetime import date
from pathlib import Path


def parse_date(s: str) -> date:
    return date.fromisoformat((s or "").strip())


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--calendar", required=True)
    p.add_argument("--date", required=True, help="YYYY-MM-DD")
    p.add_argument("--output-csv", required=True)
    p.add_argument("--output-md", required=True)
    args = p.parse_args()

    target = parse_date(args.date)

    with Path(args.calendar).open("r", newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    due = []
    for r in rows:
        try:
            if parse_date(r.get("followup_date", "")) <= target:
                due.append(r)
        except Exception:
            continue

    due.sort(key=lambda r: (r.get("followup_date", ""), r.get("company", ""), r.get("followup_step", "")))

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
        for r in due:
            w.writerow({k: r.get(k, "") for k in fieldnames})

    out_md = Path(args.output_md)
    with out_md.open("w", encoding="utf-8") as f:
        f.write(f"# Sponsor Follow-up Due Batch ({args.date})\n\n")
        f.write(f"Total due now: **{len(due)}**\n\n")
        if not due:
            f.write("No follow-ups are due yet.\n")
        else:
            for i, r in enumerate(due, 1):
                f.write(f"## {i}. {r.get('company','Unknown')} — {r.get('followup_step','')} ({r.get('followup_date','')})\n")
                f.write(f"- Contact: {r.get('contact_name','')} <{r.get('contact_email','')}>\n")
                f.write(f"- Subject: {r.get('subject','')}\n")
                f.write(f"- Action: {r.get('suggested_action','')}\n\n")

    print(f"DUE_BATCH_OK count={len(due)}")
    print(f"CSV: {out_csv}")
    print(f"MD: {out_md}")


if __name__ == "__main__":
    main()
