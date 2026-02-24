#!/usr/bin/env python3
"""Generate a send-now batch from daily sponsor actions.

Filters the action queue to items with contact details ready and outputs:
- CSV for quick import/mail-merge
- Markdown checklist for manual sending
"""

from __future__ import annotations

import argparse
import csv
from pathlib import Path


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--actions", required=True, help="Path to sponsor_outreach_actions_<date>.csv")
    p.add_argument("--output-csv", required=True)
    p.add_argument("--output-md", required=True)
    args = p.parse_args()

    rows = list(csv.DictReader(Path(args.actions).open()))

    send_now: list[dict[str, str]] = []
    for row in rows:
        if (row.get("has_contact") or "").strip().lower() != "yes":
            continue
        send_now.append(
            {
                "company": (row.get("company") or "").strip(),
                "priority": (row.get("priority") or "").strip(),
                "action_type": (row.get("action_type") or "").strip(),
                "due_date": (row.get("due_date") or "").strip(),
                "contact_email": (row.get("contact_email") or "").strip(),
                "subject": (row.get("subject") or "").strip(),
                "angle": (row.get("angle") or "").strip(),
                "next_action": "Send now",
            }
        )

    priority_rank = {"P1": 0, "P2": 1, "P3": 2}
    action_rank = {"followup_2": 0, "followup_1": 1, "send_initial": 2}
    send_now.sort(
        key=lambda r: (
            priority_rank.get(r.get("priority", "P3"), 9),
            r.get("due_date", ""),
            action_rank.get(r.get("action_type", "send_initial"), 9),
            r.get("company", ""),
        )
    )

    out_csv = Path(args.output_csv)
    out_csv.parent.mkdir(parents=True, exist_ok=True)
    fields = ["company", "priority", "action_type", "due_date", "contact_email", "subject", "angle", "next_action"]
    with out_csv.open("w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        writer.writerows(send_now)

    lines = [
        f"# Sponsor Send-Now Batch ({Path(args.actions).stem.replace('sponsor_outreach_actions_', '')})",
        "",
        f"Generated from: `{args.actions}`",
        f"Ready sends: **{len(send_now)}**",
        "",
        "## Checklist",
        "",
    ]

    if not send_now:
        lines.append("No send-now actions with verified contacts.")
    else:
        for i, row in enumerate(send_now, 1):
            lines.extend(
                [
                    f"{i}. **{row['company']}** ({row['priority']} · {row['action_type']})",
                    f"   - To: {row['contact_email']}",
                    f"   - Subject: {row['subject']}",
                    f"   - Angle: {row['angle']}",
                    "",
                ]
            )

    Path(args.output_md).write_text("\n".join(lines))


if __name__ == "__main__":
    main()
