#!/usr/bin/env python3
"""Generate a KPI snapshot for BusyBits sponsor outreach pipeline.

Outputs a compact markdown + json summary with queue health metrics to help
prioritize daily revenue actions.
"""

from __future__ import annotations

import argparse
import csv
import json
from collections import Counter
from datetime import datetime
from pathlib import Path


def read_csv(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def pick(row: dict[str, str], *keys: str) -> str:
    for k in keys:
        if k in row and row[k] is not None:
            return str(row[k]).strip()
    return ""


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--tracker", default="builds/busybits-newsletter/sponsorship_outreach_tracker.csv")
    p.add_argument("--actions", default="builds/busybits-newsletter/sponsor_outreach_actions_today.csv")
    p.add_argument("--board", default="builds/busybits-newsletter/sponsor_outreach_execution_board.csv")
    p.add_argument("--output-md", default="builds/busybits-newsletter/sponsor_outreach_kpi_snapshot.md")
    p.add_argument("--output-json", default="builds/busybits-newsletter/sponsor_outreach_kpi_snapshot.json")
    args = p.parse_args()

    tracker = read_csv(Path(args.tracker))
    actions = read_csv(Path(args.actions))
    board = read_csv(Path(args.board))

    status_counter = Counter((pick(r, "status", "Status") or "Unknown") for r in tracker)
    tier_counter = Counter((pick(r, "tier", "Tier") or "Unknown") for r in tracker)
    action_counter = Counter((pick(r, "action_type", "Action") or "Unknown") for r in actions)
    p1_actions = [r for r in actions if pick(r, "priority", "Priority").upper() == "P1"]
    overdue_actions = [
        r for r in actions
        if pick(r, "status", "Status").lower() != "done"
        and pick(r, "due_date", "Due Date")
        and pick(r, "due_date", "Due Date") < datetime.now().strftime("%Y-%m-%d")
    ]

    p1_send_initial = [
        r for r in actions
        if pick(r, "priority", "Priority").upper() == "P1"
        and pick(r, "action_type", "Action").lower() == "send_initial"
        and pick(r, "status", "Status").lower() != "done"
    ]
    p1_followup_1 = [
        r for r in actions
        if pick(r, "priority", "Priority").upper() == "P1"
        and pick(r, "action_type", "Action").lower() == "followup_1"
        and pick(r, "status", "Status").lower() != "done"
    ]

    ready_rows = [r for r in board if pick(r, "status", "Status").lower() == "ready to send"]
    ready_missing_contact = [r for r in ready_rows if not pick(r, "contact_email", "Contact Email")]
    ready_with_contact = [r for r in ready_rows if pick(r, "contact_email", "Contact Email")]

    snapshot = {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "tracker_total_companies": len(tracker),
        "tracker_by_status": dict(status_counter),
        "tracker_by_tier": dict(tier_counter),
        "today_action_total": len(actions),
        "today_actions_by_type": dict(action_counter),
        "today_p1_actions": len(p1_actions),
        "today_overdue_actions": len(overdue_actions),
        "today_p1_send_initial": len(p1_send_initial),
        "today_p1_followup_1": len(p1_followup_1),
        "ready_to_send_total": len(ready_rows),
        "ready_to_send_with_contact": len(ready_with_contact),
        "ready_to_send_missing_contact": len(ready_missing_contact),
    }

    Path(args.output_json).write_text(json.dumps(snapshot, indent=2), encoding="utf-8")

    lines = [
        "# BusyBits Sponsor Outreach KPI Snapshot",
        "",
        f"Generated: {snapshot['generated_at']}",
        "",
        "## Tracker Health",
        f"- Total companies in tracker: **{snapshot['tracker_total_companies']}**",
        "- By status:",
    ]
    for k, v in sorted(status_counter.items()):
        lines.append(f"  - {k}: {v}")

    lines.extend([
        "- By tier:",
    ])
    for k, v in sorted(tier_counter.items()):
        lines.append(f"  - {k}: {v}")

    lines.extend([
        "",
        "## Today Action Queue",
        f"- Total actions due: **{snapshot['today_action_total']}**",
        f"- P1 actions due: **{snapshot['today_p1_actions']}**",
        f"- P1 send_initial due: **{snapshot['today_p1_send_initial']}**",
        f"- P1 followup_1 due: **{snapshot['today_p1_followup_1']}**",
        f"- Overdue actions: **{snapshot['today_overdue_actions']}**",
        f"- Ready-to-send rows: **{snapshot['ready_to_send_total']}**",
        f"- Ready-to-send with contact email: **{snapshot['ready_to_send_with_contact']}**",
        f"- Ready-to-send missing contact email: **{snapshot['ready_to_send_missing_contact']}**",
        "- Action mix:",
    ])

    for k, v in sorted(action_counter.items()):
        lines.append(f"  - {k}: {v}")

    lines.extend([
        "",
        "## Immediate Focus",
        "- Clear all P1 `send_initial` first.",
        "- Then execute P1 `followup_1` items to recover warm leads.",
        f"- Tonight's send capacity (ready + contactable): **{snapshot['ready_to_send_with_contact']}**.",
    ])

    if snapshot["ready_to_send_missing_contact"] > 0:
        lines.append("- Resolve missing contact emails on ready-to-send rows before drafting.")
    if snapshot["today_overdue_actions"] > 0:
        lines.append("- Clear overdue actions first to avoid compounding follow-up slippage.")

    lines.extend([
        "- Update tracker statuses same day to keep next queue accurate.",
        "",
    ])

    Path(args.output_md).write_text("\n".join(lines), encoding="utf-8")
    print("KPI_SNAPSHOT_OK")
    print(args.output_md)
    print(args.output_json)


if __name__ == "__main__":
    main()
