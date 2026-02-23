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


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--tracker", default="builds/busybits-newsletter/sponsorship_outreach_tracker.csv")
    p.add_argument("--actions", default="builds/busybits-newsletter/sponsor_outreach_actions_today.csv")
    p.add_argument("--output-md", default="builds/busybits-newsletter/sponsor_outreach_kpi_snapshot.md")
    p.add_argument("--output-json", default="builds/busybits-newsletter/sponsor_outreach_kpi_snapshot.json")
    args = p.parse_args()

    tracker = read_csv(Path(args.tracker))
    actions = read_csv(Path(args.actions))

    status_counter = Counter((r.get("Status") or "Unknown").strip() for r in tracker)
    tier_counter = Counter((r.get("Tier") or "Unknown").strip() for r in tracker)
    action_counter = Counter((r.get("Action") or "Unknown").strip() for r in actions)
    p1_actions = [r for r in actions if (r.get("Priority") or "").strip().upper() == "P1"]

    snapshot = {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "tracker_total_companies": len(tracker),
        "tracker_by_status": dict(status_counter),
        "tracker_by_tier": dict(tier_counter),
        "today_action_total": len(actions),
        "today_actions_by_type": dict(action_counter),
        "today_p1_actions": len(p1_actions),
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
        "- Action mix:",
    ])

    for k, v in sorted(action_counter.items()):
        lines.append(f"  - {k}: {v}")

    lines.extend([
        "",
        "## Immediate Focus",
        "- Clear all P1 `send_initial` first.",
        "- Then execute `followup_1` items to recover warm leads.",
        "- Update tracker statuses same day to keep next queue accurate.",
        "",
    ])

    Path(args.output_md).write_text("\n".join(lines), encoding="utf-8")
    print("KPI_SNAPSHOT_OK")
    print(args.output_md)
    print(args.output_json)


if __name__ == "__main__":
    main()
