#!/usr/bin/env python3
"""Generate an execution-ready sponsor contact research sprint for tonight.

Inputs:
- sponsor_outreach_execution_board.csv
- sponsor_contact_gap_queue.csv

Output:
- sponsor_tonight_send_plan_<date>.md
- sponsor_tonight_contact_fill_<date>.csv
"""

from __future__ import annotations
import argparse
import csv
from collections import Counter
from datetime import date, datetime
from pathlib import Path


def read_csv(path: Path):
    with path.open(newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument("--date", default=date.today().isoformat(), help="Run date (YYYY-MM-DD)")
    p.add_argument("--limit", type=int, default=10, help="Max companies to include")
    p.add_argument("--out", default="", help="Optional markdown output path")
    p.add_argument("--csv-out", default="", help="Optional CSV output path")
    return p.parse_args()


def main():
    args = parse_args()
    root = Path(__file__).resolve().parents[1]
    board_path = root / "sponsor_outreach_execution_board.csv"
    gap_path = root / "sponsor_contact_gap_queue.csv"

    board = read_csv(board_path)
    gaps = read_csv(gap_path)

    # prioritize send date = tomorrow and P1 first
    tomorrow = datetime.fromisoformat(args.date).date().fromordinal(
        datetime.fromisoformat(args.date).date().toordinal() + 1
    ).isoformat()

    priorities = {"P1": 0, "P2": 1, "P3": 2}

    selected = [
        r for r in board
        if (r.get("send_date") == tomorrow)
        and not (r.get("contact_email") or "").strip()
    ]
    selected.sort(key=lambda r: (priorities.get(r.get("priority", "P3"), 9), r.get("company", "")))
    selected = selected[: args.limit]

    gap_by_company = {g.get("company", ""): g for g in gaps}

    by_priority = Counter(r.get("priority", "P3") for r in selected)

    lines = []
    lines.append(f"# Sponsor Tonight Send Plan — {args.date}")
    lines.append("")
    lines.append("## Objective")
    lines.append(f"Fill missing contacts tonight for tomorrow's send wave (**{tomorrow}**) so outreach can go out without blockers.")
    lines.append("")
    lines.append("## Capacity Snapshot")
    lines.append(f"- Companies queued: **{len(selected)}**")
    lines.append(f"- Priority mix: " + ", ".join(f"{k}: {by_priority.get(k,0)}" for k in ["P1", "P2", "P3"]))
    lines.append("")
    lines.append("## Contact Research Queue")

    if not selected:
        lines.append("No missing-contact companies matched tomorrow's send date.")
    else:
        for i, row in enumerate(selected, 1):
            company = row.get("company", "")
            gap = gap_by_company.get(company, {})
            lines.append(f"### {i}. {company} ({row.get('priority','P3')})")
            lines.append(f"- Target role: {row.get('contact_role','Partnerships')}")
            lines.append(f"- Outreach angle: {row.get('outreach_angle','')}")
            lines.append(f"- Subject draft: {row.get('email_subject','')}")
            lines.append(f"- Google search: {gap.get('google_search_url','')}")
            lines.append(f"- Query: `{gap.get('search_query','')}`")
            lines.append(f"- Fill fields: contact_name, contact_email, contact_linkedin")
            lines.append("")

    lines.append("## Definition of Done")
    lines.append("- All listed companies have contact_name, contact_email, contact_linkedin filled in `sponsor_outreach_execution_board.csv`.")
    lines.append("- Regenerate next-day action queue and send pack after contact fill.")

    out_path = Path(args.out) if args.out else (root / f"sponsor_tonight_send_plan_{args.date}.md")
    out_path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")

    csv_out_path = Path(args.csv_out) if args.csv_out else (root / f"sponsor_tonight_contact_fill_{args.date}.csv")
    csv_fields = [
        "company",
        "priority",
        "send_date",
        "target_role",
        "search_query",
        "google_search_url",
        "contact_name",
        "contact_email",
        "contact_linkedin",
        "status",
        "notes",
    ]
    with csv_out_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=csv_fields)
        writer.writeheader()
        for row in selected:
            company = row.get("company", "")
            gap = gap_by_company.get(company, {})
            writer.writerow(
                {
                    "company": company,
                    "priority": row.get("priority", "P3"),
                    "send_date": row.get("send_date", ""),
                    "target_role": row.get("contact_role", "Partnerships"),
                    "search_query": gap.get("search_query", ""),
                    "google_search_url": gap.get("google_search_url", ""),
                    "contact_name": "",
                    "contact_email": "",
                    "contact_linkedin": "",
                    "status": "to_research",
                    "notes": "",
                }
            )

    print(out_path)
    print(csv_out_path)


if __name__ == "__main__":
    main()
