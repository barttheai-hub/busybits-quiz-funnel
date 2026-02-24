#!/usr/bin/env python3
"""Generate a daily sponsorship outreach queue from the tracker.

Usage:
  python3 builds/busybits-newsletter/scripts/generate_daily_outreach_queue.py \
    --input builds/busybits-newsletter/sponsorship_outreach_tracker.csv \
    --output-csv builds/busybits-newsletter/sponsor_outreach_day_queue.csv \
    --output-md builds/busybits-newsletter/sponsor_outreach_day_queue.md \
    --limit 12
"""

from __future__ import annotations

import argparse
import csv
from datetime import datetime
from pathlib import Path

SEND_DAY_RANK = {
    "Tue": 1,
    "Wed": 2,
    "Thu": 3,
    "Fri": 4,
    "Next Tue": 5,
    "Next Wed": 6,
    "Next Thu": 7,
    "Next Fri": 8,
}

PRIORITY_RANK = {"P1": 1, "P2": 2, "P3": 3}


def sort_key(row: dict[str, str]) -> tuple[int, int, str]:
    return (
        PRIORITY_RANK.get((row.get("priority") or "").strip(), 99),
        SEND_DAY_RANK.get((row.get("target_send_day") or "").strip(), 99),
        (row.get("company") or "").lower(),
    )


def build_contact_research_prompt(company: str, role: str) -> str:
    return (
        f'Find {company} {role} decision-maker (name + work email + LinkedIn). '
        "Prioritize Head/Director of Partnerships, then Growth Marketing."
    )


def build_followup_plan(send_day: str) -> str:
    return f"Follow-up #1: +3 days after {send_day}; Follow-up #2: +7 days after {send_day}"


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--input", required=True)
    p.add_argument("--output-csv", required=True)
    p.add_argument("--output-md", required=True)
    p.add_argument("--limit", type=int, default=12)
    args = p.parse_args()

    in_path = Path(args.input)
    rows = list(csv.DictReader(in_path.open()))

    # Keep all Ready to send first, then Research contact.
    candidate_rows = [
        r
        for r in rows
        if (r.get("status") or "").strip() in {"Ready to send", "Research contact"}
    ]

    candidate_rows.sort(key=sort_key)
    picked = candidate_rows[: args.limit]

    enriched: list[dict[str, str]] = []
    for r in picked:
        company = (r.get("company") or "").strip()
        role = (r.get("contact_role") or "Partnerships").strip()
        send_day = (r.get("target_send_day") or "Tue").strip()
        status = (r.get("status") or "").strip()
        template = "Template A" if (r.get("category") or "").strip() in {"Health Tech", "Consumables"} else "Template B"

        enriched.append(
            {
                "company": company,
                "priority": (r.get("priority") or "").strip(),
                "category": (r.get("category") or "").strip(),
                "contact_role": role,
                "status": status,
                "template": template,
                "target_send_day": send_day,
                "outreach_angle": (r.get("outreach_angle") or "").strip(),
                "next_action": (r.get("next_action") or "").strip(),
                "contact_email": (r.get("contact_email") or "").strip(),
                "contact_research_prompt": build_contact_research_prompt(company, role),
                "followup_plan": build_followup_plan(send_day),
            }
        )

    out_csv = Path(args.output_csv)
    out_csv.parent.mkdir(parents=True, exist_ok=True)
    with out_csv.open("w", newline="") as f:
        fieldnames = [
            "company",
            "priority",
            "category",
            "contact_role",
            "status",
            "template",
            "target_send_day",
            "outreach_angle",
            "next_action",
            "contact_email",
            "contact_research_prompt",
            "followup_plan",
        ]
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(enriched)

    today = datetime.now().strftime("%Y-%m-%d")
    out_md = Path(args.output_md)
    lines = [
        f"# BusyBits Daily Sponsor Queue ({today})",
        "",
        f"Generated from: `{args.input}`",
        f"Total queued today: **{len(enriched)}**",
        "",
        "## Queue",
        "",
    ]

    for i, r in enumerate(enriched, start=1):
        lines.extend(
            [
                f"{i}. **{r['company']}** ({r['priority']} · {r['category']})",
                f"   - Status: {r['status']}",
                f"   - Template: {r['template']}",
                f"   - Target day: {r['target_send_day']}",
                f"   - Angle: {r['outreach_angle']}",
                f"   - Next action: {r['next_action']}",
                f"   - Research prompt: {r['contact_research_prompt']}",
                f"   - Follow-up plan: {r['followup_plan']}",
                "",
            ]
        )

    out_md.write_text("\n".join(lines))


if __name__ == "__main__":
    main()
