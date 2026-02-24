#!/usr/bin/env python3
"""Generate a concise operator brief from outreach pipeline outputs.

Inputs:
- sponsor_outreach_kpi_snapshot.json
- sponsor_outreach_actions_<date>.csv
- sponsor_contact_gap_queue.csv

Output:
- markdown brief with top priorities + blockers for immediate execution.
"""

from __future__ import annotations

import argparse
import csv
import json
from datetime import datetime
from pathlib import Path


def load_csv(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        return []
    with path.open(newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def urgency_rank(v: str) -> int:
    value = (v or "").strip().lower()
    return {"critical": 0, "high": 1, "medium": 2, "low": 3}.get(value, 9)


def priority_rank(v: str) -> int:
    value = (v or "").strip().upper()
    return {"P1": 0, "P2": 1, "P3": 2}.get(value, 9)


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--kpi-json", required=True)
    p.add_argument("--actions-csv", required=True)
    p.add_argument("--contact-gap-csv", required=True)
    p.add_argument("--output", required=True)
    p.add_argument("--date", default=datetime.now().strftime("%Y-%m-%d"))
    args = p.parse_args()

    kpi = json.loads(Path(args.kpi_json).read_text(encoding="utf-8"))
    actions = load_csv(Path(args.actions_csv))
    gaps = load_csv(Path(args.contact_gap_csv))

    actions_sorted = sorted(
        actions,
        key=lambda r: (
            urgency_rank(r.get("urgency", "")),
            -int(r.get("days_overdue", "0") or 0),
            priority_rank(r.get("priority", "")),
            r.get("company", ""),
        ),
    )

    top_actions = actions_sorted[:5]
    top_gaps = sorted(gaps, key=lambda r: (priority_rank(r.get("priority", "")), r.get("company", "")))[:5]

    lines: list[str] = []
    lines.append(f"# BusyBits Sponsor Operator Brief — {args.date}")
    lines.append("")
    lines.append("## KPI Snapshot")
    lines.append(f"- Today actions: {kpi.get('today_actions_total', 0)}")
    lines.append(f"- Overdue actions: {kpi.get('overdue_actions', 0)}")
    lines.append(f"- Ready-to-send total: {kpi.get('ready_to_send_total', 0)}")
    lines.append(f"- Ready-to-send with contact: {kpi.get('ready_to_send_with_contact', 0)}")
    lines.append(f"- Missing contact (ready): {kpi.get('ready_to_send_missing_contact', 0)}")
    lines.append("")

    lines.append("## Top 5 Actions to Execute Now")
    if top_actions:
        for row in top_actions:
            action = row.get("action_type", "action")
            company = row.get("company", "Unknown")
            due = row.get("due_date", "")
            urgency = row.get("urgency", "")
            overdue = row.get("days_overdue", "0")
            contact_name = row.get("contact_name", "")
            contact_email = row.get("contact_email", "")
            contact_bits = ""
            if contact_name or contact_email:
                contact_bits = f" | Contact: {(contact_name + ' ').strip()}<{contact_email}>" if contact_email else f" | Contact: {contact_name}"
            lines.append(
                f"- [{row.get('priority', 'P?')}] {company} — {action} (due {due}, urgency {urgency}, overdue {overdue}d){contact_bits}".rstrip()
            )
    else:
        lines.append("- No actions queued for this date.")
    lines.append("")

    lines.append("## Top Contact Gaps Blocking Sends")
    if top_gaps:
        for row in top_gaps:
            lines.append(
                f"- [{row.get('priority', 'P?')}] {row.get('company', 'Unknown')} — role: {row.get('contact_role', 'n/a')} — search: {row.get('search_query', '')}"
            )
    else:
        lines.append("- No contact gaps currently flagged.")
    lines.append("")

    lines.append("## Immediate Next Step")
    lines.append("1) Fill missing contacts for P1 rows above, 2) send due/overdue emails in order, 3) update tracker statuses after each send.")

    Path(args.output).write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"WROTE {args.output}")


if __name__ == "__main__":
    main()
