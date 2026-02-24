#!/usr/bin/env python3
"""Generate a contact-gap queue from outreach execution board.

Focuses on rows that are ready (or nearly ready) to send but missing contact
identity/email data, so research can be executed in priority order.
"""

from __future__ import annotations

import argparse
import csv
from datetime import datetime
from pathlib import Path

PRIORITY_RANK = {"P1": 1, "P2": 2, "P3": 3}


def sort_key(row: dict[str, str]) -> tuple[int, str, str]:
    return (
        PRIORITY_RANK.get((row.get("priority") or "").strip(), 99),
        (row.get("send_date") or "9999-99-99").strip(),
        (row.get("company") or "").lower(),
    )


def search_query(company: str, role: str) -> str:
    return f'{company} {role} partnerships email linkedin'


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--input", default="builds/busybits-newsletter/sponsor_outreach_execution_board.csv")
    p.add_argument("--output-csv", default="builds/busybits-newsletter/sponsor_contact_gap_queue.csv")
    p.add_argument("--output-md", default="builds/busybits-newsletter/sponsor_contact_gap_queue.md")
    p.add_argument("--limit", type=int, default=30)
    args = p.parse_args()

    in_path = Path(args.input)
    rows = list(csv.DictReader(in_path.open("r", encoding="utf-8", newline="")))

    candidates = []
    for r in rows:
        status = (r.get("status") or "").strip().lower()
        if status not in {"ready to send", "research contact"}:
            continue

        missing_name = not (r.get("contact_name") or "").strip()
        missing_email = not (r.get("contact_email") or "").strip()
        missing_linkedin = not (r.get("contact_linkedin") or "").strip()

        if not (missing_name or missing_email or missing_linkedin):
            continue

        company = (r.get("company") or "").strip()
        role = (r.get("contact_role") or "Partnerships").strip()

        candidates.append(
            {
                "company": company,
                "priority": (r.get("priority") or "").strip(),
                "status": (r.get("status") or "").strip(),
                "send_date": (r.get("send_date") or "").strip(),
                "contact_role": role,
                "missing_fields": ", ".join(
                    [
                        label
                        for label, missing in [
                            ("contact_name", missing_name),
                            ("contact_email", missing_email),
                            ("contact_linkedin", missing_linkedin),
                        ]
                        if missing
                    ]
                ),
                "search_query": search_query(company, role),
                "google_search_url": f'https://www.google.com/search?q={search_query(company, role).replace(" ", "+")}',
                "notes": (r.get("notes") or "").strip(),
            }
        )

    candidates.sort(key=sort_key)
    selected = candidates[: args.limit]

    out_csv = Path(args.output_csv)
    out_csv.parent.mkdir(parents=True, exist_ok=True)
    with out_csv.open("w", encoding="utf-8", newline="") as f:
        fields = [
            "company",
            "priority",
            "status",
            "send_date",
            "contact_role",
            "missing_fields",
            "search_query",
            "google_search_url",
            "notes",
        ]
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(selected)

    out_md = Path(args.output_md)
    lines = [
        f"# Sponsor Contact Gap Queue ({datetime.now().strftime('%Y-%m-%d')})",
        "",
        f"Generated from: `{args.input}`",
        f"Rows requiring contact enrichment: **{len(selected)}**",
        "",
    ]

    for i, r in enumerate(selected, start=1):
        lines.extend(
            [
                f"{i}. **{r['company']}** ({r['priority']} · send {r['send_date'] or 'TBD'})",
                f"   - Missing: {r['missing_fields']}",
                f"   - Role target: {r['contact_role']}",
                f"   - Search query: `{r['search_query']}`",
                f"   - Search URL: {r['google_search_url']}",
                "",
            ]
        )

    out_md.write_text("\n".join(lines), encoding="utf-8")
    print("CONTACT_GAP_QUEUE_OK")
    print(args.output_csv)
    print(args.output_md)


if __name__ == "__main__":
    main()
