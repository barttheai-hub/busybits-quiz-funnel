#!/usr/bin/env python3
"""Generate a due-soon contact research sprint from action + candidate files."""

from __future__ import annotations

import argparse
import csv
from collections import defaultdict
from datetime import datetime
from pathlib import Path


def load_csv(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        return []
    with path.open(newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def parse_date(value: str) -> datetime:
    try:
        return datetime.strptime((value or "").strip(), "%Y-%m-%d")
    except Exception:
        return datetime.max


def to_int(value: str, default: int = 0) -> int:
    try:
        return int((value or "").strip())
    except Exception:
        return default


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--actions", required=True)
    p.add_argument("--candidates", required=True)
    p.add_argument("--date", required=True)
    p.add_argument("--days", type=int, default=2)
    p.add_argument("--limit", type=int, default=20)
    p.add_argument("--output-csv", required=True)
    p.add_argument("--output-md", required=True)
    args = p.parse_args()

    run_date = datetime.strptime(args.date, "%Y-%m-%d")
    horizon = run_date.toordinal() + args.days

    actions = load_csv(Path(args.actions))
    candidates = load_csv(Path(args.candidates))

    by_company: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in candidates:
        by_company[row.get("company", "").strip()].append(row)

    for rows in by_company.values():
        rows.sort(key=lambda r: float(r.get("confidence") or 0), reverse=True)

    queue: list[dict[str, str]] = []
    for row in actions:
        company = (row.get("company") or "").strip()
        due = parse_date(row.get("due_date") or "")
        if not company or due == datetime.max:
            continue

        has_contact = (row.get("has_contact") or "").strip().lower() == "yes"
        if has_contact:
            continue

        if due.toordinal() > horizon:
            continue

        company_candidates = by_company.get(company, [])
        top = company_candidates[0] if company_candidates else {}

        queue.append(
            {
                "company": company,
                "priority": (row.get("priority") or "P3").strip(),
                "action_type": (row.get("action_type") or "send_initial").strip(),
                "due_date": due.strftime("%Y-%m-%d"),
                "days_overdue": str(to_int(row.get("days_overdue"), 0)),
                "candidate_email": (top.get("contact_candidate") or "").strip(),
                "candidate_confidence": (top.get("confidence") or "").strip(),
                "candidate_reason": (top.get("reason") or "").strip(),
                "source_url": (top.get("source_url") or "").strip(),
                "search_query": f"{company} partnerships email linkedin",
                "google_search_url": f"https://www.google.com/search?q={company.replace(' ', '+')}+partnerships+email+linkedin",
            }
        )

    def rank_key(r: dict[str, str]):
        return (
            {"P1": 0, "P2": 1, "P3": 2}.get(r["priority"], 3),
            parse_date(r["due_date"]),
            -to_int(r["days_overdue"]),
        )

    queue.sort(key=rank_key)
    queue = queue[: args.limit]

    out_csv = Path(args.output_csv)
    out_md = Path(args.output_md)
    out_csv.parent.mkdir(parents=True, exist_ok=True)

    fieldnames = [
        "company",
        "priority",
        "action_type",
        "due_date",
        "days_overdue",
        "candidate_email",
        "candidate_confidence",
        "candidate_reason",
        "source_url",
        "search_query",
        "google_search_url",
    ]

    with out_csv.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(queue)

    with out_md.open("w", encoding="utf-8") as f:
        f.write(f"# Sponsor Contact Research Sprint — {args.date}\n\n")
        f.write(f"Window: due within {args.days} day(s) | Rows: {len(queue)}\n\n")
        if not queue:
            f.write("No due-soon actions missing contacts.\n")
        for i, r in enumerate(queue, start=1):
            f.write(f"## {i}. {r['company']} ({r['priority']})\n")
            f.write(f"- Action: {r['action_type']} | Due: {r['due_date']} | Days overdue: {r['days_overdue']}\n")
            f.write(f"- Candidate: {r['candidate_email'] or '—'} (confidence: {r['candidate_confidence'] or '—'})\n")
            if r["candidate_reason"]:
                f.write(f"- Why candidate: {r['candidate_reason']}\n")
            if r["source_url"]:
                f.write(f"- Source: {r['source_url']}\n")
            f.write(f"- Search: {r['google_search_url']}\n\n")

    print(f"Wrote {out_csv}")
    print(f"Wrote {out_md}")


if __name__ == "__main__":
    main()
