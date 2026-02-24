#!/usr/bin/env python3
"""Deduplicate BusyBits sponsorship tracker rows and emit a merge report.

Rules:
- Group rows by normalized company name.
- Keep row with highest data completeness score.
- Prefer status priority: in negotiation > replied > sent > ready to send > research contact > drafted.
- Prefer rows with contact email and newer `last_contacted` where ties remain.
"""

from __future__ import annotations

import argparse
import csv
from datetime import datetime
from pathlib import Path

STATUS_SCORE = {
    "in negotiation": 70,
    "replied": 60,
    "sent": 50,
    "ready to send": 40,
    "research contact": 30,
    "drafted": 20,
}


def norm(s: str) -> str:
    return " ".join((s or "").strip().lower().split())


def parse_date(value: str) -> int:
    value = (value or "").strip()
    if not value:
        return 0
    for fmt in ("%Y-%m-%d", "%Y/%m/%d", "%m/%d/%Y"):
        try:
            return int(datetime.strptime(value, fmt).timestamp())
        except ValueError:
            continue
    return 0


def row_score(row: dict[str, str]) -> tuple[int, int, int]:
    status = norm(row.get("status", ""))
    status_score = STATUS_SCORE.get(status, 10)
    completeness = sum(1 for k, v in row.items() if (v or "").strip())
    recency = parse_date(row.get("last_contacted", ""))
    has_email = 1 if (row.get("contact_email", "").strip()) else 0
    # tuple order matters for max()
    return (status_score + has_email * 5, completeness, recency)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", required=True)
    ap.add_argument("--output", required=True)
    ap.add_argument("--report-csv", required=True)
    ap.add_argument("--report-md", required=True)
    args = ap.parse_args()

    inp = Path(args.input)
    rows = list(csv.DictReader(inp.open()))
    if not rows:
        raise SystemExit("No rows found in tracker")

    groups: dict[str, list[dict[str, str]]] = {}
    for r in rows:
        key = norm(r.get("company", "")) or f"__row_{len(groups)}"
        groups.setdefault(key, []).append(r)

    deduped: list[dict[str, str]] = []
    report: list[dict[str, str]] = []

    for key, bucket in groups.items():
        if len(bucket) == 1:
            deduped.append(bucket[0])
            continue

        ranked = sorted(bucket, key=row_score, reverse=True)
        keep = ranked[0]
        deduped.append(keep)

        kept_name = keep.get("company", key)
        for drop in ranked[1:]:
            report.append(
                {
                    "company": kept_name,
                    "kept_status": keep.get("status", ""),
                    "kept_contact_email": keep.get("contact_email", ""),
                    "dropped_status": drop.get("status", ""),
                    "dropped_contact_email": drop.get("contact_email", ""),
                    "reason": "Lower status/completeness/recency score",
                }
            )

    # stable sort for deterministic outputs
    deduped.sort(key=lambda r: norm(r.get("company", "")))
    report.sort(key=lambda r: norm(r.get("company", "")))

    out = Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)

    with out.open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(deduped)

    report_csv = Path(args.report_csv)
    with report_csv.open("w", newline="") as f:
        fields = [
            "company",
            "kept_status",
            "kept_contact_email",
            "dropped_status",
            "dropped_contact_email",
            "reason",
        ]
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(report)

    report_md = Path(args.report_md)
    with report_md.open("w") as f:
        f.write("# Sponsor Tracker Deduplication Report\n\n")
        f.write(f"- Input rows: {len(rows)}\n")
        f.write(f"- Deduped rows: {len(deduped)}\n")
        f.write(f"- Merged duplicates: {len(report)}\n\n")
        if not report:
            f.write("No duplicates found.\n")
        else:
            current = None
            for r in report:
                if r["company"] != current:
                    current = r["company"]
                    f.write(f"## {current}\n")
                f.write(
                    f"- kept `{r['kept_status']}` ({r['kept_contact_email'] or 'no email'}) vs dropped `{r['dropped_status']}` ({r['dropped_contact_email'] or 'no email'})\n"
                )

    print(out)
    print(report_csv)
    print(report_md)


if __name__ == "__main__":
    main()
