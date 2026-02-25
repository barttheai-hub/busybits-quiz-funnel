#!/usr/bin/env python3
"""Generate upcoming BusyBits sponsor follow-up batches within a horizon.

Reads sponsorship_outreach_tracker.csv and builds:
1) sponsor_followup_due_batch_<anchor-date>.csv
2) sponsor_followup_due_copy_batch_<anchor-date>.md

A row is eligible when:
- status == Sent
- contact_email exists
- notes contain "Sent ... on YYYY-MM-DD"
- sent_date + followup_days is in [anchor+1, anchor+horizon_days]
"""

from __future__ import annotations

import argparse
import csv
import datetime as dt
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BUILD = ROOT / "builds" / "busybits-newsletter"
TRACKER_DEFAULT = BUILD / "sponsorship_outreach_tracker.csv"

SENT_DATE_RE = re.compile(r"\bon\s*(\d{4}-\d{2}-\d{2})\b")


def parse_args() -> argparse.Namespace:
    today = dt.date.today()
    p = argparse.ArgumentParser(description="Generate upcoming sponsor follow-up queue")
    p.add_argument("--tracker", default=str(TRACKER_DEFAULT), help="Path to sponsorship tracker csv")
    p.add_argument("--anchor-date", default=today.isoformat(), help="Anchor date YYYY-MM-DD (default=today)")
    p.add_argument("--followup-days", type=int, default=3, help="Days after sent date to schedule follow-up")
    p.add_argument("--horizon-days", type=int, default=3, help="Lookahead window from anchor date (default 3 => tomorrow..+3d)")
    p.add_argument("--owner", default="Ziga", help="Owner name for output queue")
    p.add_argument("--out-dir", default=str(BUILD), help="Output directory")
    return p.parse_args()


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def write_csv(path: Path, rows: list[dict[str, str]], fields: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)


def extract_sent_date(notes: str) -> dt.date | None:
    m = SENT_DATE_RE.search(notes or "")
    if not m:
        return None
    try:
        return dt.date.fromisoformat(m.group(1))
    except ValueError:
        return None


def followup_subject(company: str) -> str:
    return f"Quick follow-up: BusyBits x {company}"


def followup_body(company: str, angle: str) -> str:
    return (
        f"Hi — quick bump on my note below.\\n\\n"
        f"Given {angle or 'your audience and product fit'}, I think a BusyBits placement could perform well this quarter. "
        f"Happy to send over concise options + projected deliverables if useful."
    )


def main() -> None:
    args = parse_args()
    tracker = read_csv(Path(args.tracker))

    anchor = dt.date.fromisoformat(args.anchor_date)
    window_start = anchor + dt.timedelta(days=1)
    window_end = anchor + dt.timedelta(days=args.horizon_days)

    queue: list[dict[str, str]] = []
    for row in tracker:
        if (row.get("status", "").strip().lower()) != "sent":
            continue
        email = (row.get("contact_email") or "").strip()
        if not email:
            continue

        sent_date = extract_sent_date(row.get("notes", ""))
        if not sent_date:
            continue
        due_date = sent_date + dt.timedelta(days=args.followup_days)
        if due_date < window_start or due_date > window_end:
            continue

        company = (row.get("company") or "").strip()
        angle = (row.get("outreach_angle") or "").strip()
        queue.append(
            {
                "followup_date": due_date.isoformat(),
                "company": company,
                "contact_name": (row.get("contact_role") or "").strip() or "Partnerships",
                "contact_email": email,
                "followup_step": "Follow-up #1",
                "owner": args.owner,
                "subject": followup_subject(company),
                "suggested_action": "Reply in same thread with concise bump",
                "outreach_angle": angle,
            }
        )

    queue.sort(key=lambda r: (r["followup_date"], r["company"].lower()))

    out_dir = Path(args.out_dir)
    csv_out = out_dir / f"sponsor_followup_due_batch_{anchor.isoformat()}.csv"
    md_out = out_dir / f"sponsor_followup_due_copy_batch_{anchor.isoformat()}.md"

    write_csv(
        csv_out,
        queue,
        [
            "followup_date",
            "company",
            "contact_name",
            "contact_email",
            "followup_step",
            "owner",
            "subject",
            "suggested_action",
            "outreach_angle",
        ],
    )

    with md_out.open("w", encoding="utf-8") as f:
        f.write("# Sponsor Follow-up Copy Batch\n\n")
        f.write(f"Anchor date: **{anchor.isoformat()}**\n")
        f.write(f"Window: **{window_start.isoformat()} → {window_end.isoformat()}**\n\n")
        f.write(f"Count: **{len(queue)}**\n\n")
        if not queue:
            f.write("No upcoming follow-up rows in this window.\n")
        else:
            for i, r in enumerate(queue, 1):
                f.write(f"## {i}. {r['company']}\n")
                f.write(f"- To: `{r['contact_email']}`\n")
                f.write(f"- Subject: {r['subject']}\n\n")
                f.write("```\n")
                f.write(f"{followup_body(r['company'], r.get('outreach_angle', ''))}\n")
                f.write("```\n\n")

    print(str(csv_out))
    print(str(md_out))


if __name__ == "__main__":
    main()
