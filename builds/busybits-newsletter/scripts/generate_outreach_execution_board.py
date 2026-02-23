#!/usr/bin/env python3
"""Generate a sponsorship outreach execution board with send/follow-up dates.

Usage:
  python3 builds/busybits-newsletter/scripts/generate_outreach_execution_board.py \
    --input builds/busybits-newsletter/sponsor_outreach_day_queue.csv \
    --output-csv builds/busybits-newsletter/sponsor_outreach_execution_board.csv \
    --output-md builds/busybits-newsletter/sponsor_outreach_execution_board.md
"""

from __future__ import annotations

import argparse
import csv
from datetime import date, timedelta
from pathlib import Path

WEEKDAY_TO_NUM = {
    "Mon": 0,
    "Tue": 1,
    "Wed": 2,
    "Thu": 3,
    "Fri": 4,
    "Sat": 5,
    "Sun": 6,
}


def next_weekday(base: date, target: int) -> date:
    days_ahead = target - base.weekday()
    if days_ahead < 0:
        days_ahead += 7
    return base + timedelta(days=days_ahead)


def parse_target_day(raw: str, today: date) -> date:
    token = (raw or "Tue").strip()
    if token.startswith("Next "):
        day = token.replace("Next ", "", 1)
        d = next_weekday(today, WEEKDAY_TO_NUM.get(day, 1))
        return d + timedelta(days=7 if d <= today else 0)
    return next_weekday(today, WEEKDAY_TO_NUM.get(token, 1))


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--input", required=True)
    p.add_argument("--output-csv", required=True)
    p.add_argument("--output-md", required=True)
    args = p.parse_args()

    today = date.today()
    rows = list(csv.DictReader(Path(args.input).open()))

    output_rows: list[dict[str, str]] = []
    for row in rows:
        send_date = parse_target_day(row.get("target_send_day", "Tue"), today)
        follow_1 = send_date + timedelta(days=3)
        follow_2 = send_date + timedelta(days=7)
        output_rows.append(
            {
                "company": (row.get("company") or "").strip(),
                "priority": (row.get("priority") or "").strip(),
                "category": (row.get("category") or "").strip(),
                "contact_role": (row.get("contact_role") or "Partnerships").strip(),
                "status": "Research contact" if (row.get("status") or "").strip() == "Research contact" else "Ready to send",
                "target_send_day": (row.get("target_send_day") or "Tue").strip(),
                "send_date": send_date.isoformat(),
                "followup_1_date": follow_1.isoformat(),
                "followup_2_date": follow_2.isoformat(),
                "contact_name": "",
                "contact_email": "",
                "contact_linkedin": "",
                "email_subject": f"BusyBits x {(row.get('company') or '').strip()} (pilot sponsor slot)",
                "outreach_angle": (row.get("outreach_angle") or "performance bottleneck").strip(),
                "next_action": (row.get("next_action") or "").strip(),
                "owner": "Ziga",
                "notes": "",
            }
        )

    out_csv = Path(args.output_csv)
    out_csv.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = list(output_rows[0].keys()) if output_rows else [
        "company",
        "priority",
        "category",
        "contact_role",
        "status",
        "target_send_day",
        "send_date",
        "followup_1_date",
        "followup_2_date",
        "contact_name",
        "contact_email",
        "contact_linkedin",
        "email_subject",
        "outreach_angle",
        "next_action",
        "owner",
        "notes",
    ]
    with out_csv.open("w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(output_rows)

    ready = sum(1 for r in output_rows if r["status"] == "Ready to send")
    research = len(output_rows) - ready

    md_lines = [
        f"# Sponsor Outreach Execution Board ({today.isoformat()})",
        "",
        f"Generated from: `{args.input}`",
        f"Rows: **{len(output_rows)}** (Ready: **{ready}**, Research needed: **{research}**)",
        "",
        "## How to use",
        "1. Fill contact_name/contact_email/contact_linkedin for research rows.",
        "2. Send all `Ready to send` rows on `send_date`.",
        "3. Immediately schedule follow-up emails for `followup_1_date` and `followup_2_date`.",
        "4. Track reply outcomes in `notes` (Interested / Not now / No response).",
        "",
        "## Today-first queue",
        "",
    ]

    sorted_rows = sorted(output_rows, key=lambda r: (r["send_date"], r["priority"], r["company"]))
    for idx, r in enumerate(sorted_rows, 1):
        md_lines.extend(
            [
                f"{idx}. **{r['company']}** ({r['priority']} · {r['status']})",
                f"   - Send: {r['send_date']} | F/U1: {r['followup_1_date']} | F/U2: {r['followup_2_date']}",
                f"   - Angle: {r['outreach_angle']}",
                f"   - Next action: {r['next_action']}",
                "",
            ]
        )

    Path(args.output_md).write_text("\n".join(md_lines))


if __name__ == "__main__":
    main()
