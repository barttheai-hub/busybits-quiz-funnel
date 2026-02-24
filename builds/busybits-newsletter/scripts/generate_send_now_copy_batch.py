#!/usr/bin/env python3
"""Generate send-ready copy for send-now sponsor actions (initial + follow-ups)."""

from __future__ import annotations

import argparse
import csv
from pathlib import Path


def load_rows(path: Path) -> list[dict[str, str]]:
    with path.open() as f:
        return list(csv.DictReader(f))


def build_copy(row: dict[str, str]) -> tuple[str, str]:
    company = (row.get("company") or "your team").strip() or "your team"
    action_type = (row.get("action_type") or "send_initial").strip()

    if action_type == "followup_2":
        subject = f"Last ping — BusyBits x {company}"
        body = (
            "Hi there,\n\n"
            "Last ping from me in case this got buried. If sponsorships are handled by someone else on your side, "
            "happy to route this correctly.\n\n"
            "If timing is better next month, I can also circle back then.\n\n"
            "Best,\nZiga"
        )
    elif action_type == "followup_1":
        subject = f"Quick follow-up — BusyBits x {company}"
        body = (
            "Hi there,\n\n"
            "Quick follow-up on the BusyBits sponsorship note I sent earlier this week. "
            "We reach a high-intent health/performance audience and have upcoming slots open.\n\n"
            "If useful, I can send over a 2-minute fit + pricing snapshot and a few recent partner outcomes.\n\n"
            "Best,\nZiga"
        )
    else:
        subject = f"Partnership idea — BusyBits x {company}"
        body = (
            "Hi there,\n\n"
            "I run BusyBits, a fitness/performance newsletter with an engaged audience of builders and operators. "
            "I think a {company} sponsorship slot could be a strong fit.\n\n"
            "If useful, I can send a short audience + pricing snapshot and 2 suggested integration angles.\n\n"
            "Best,\nZiga"
        ).format(company=company)

    return subject, body


def write_csv(path: Path, rows: list[dict[str, str]]) -> None:
    fields = [
        "company",
        "priority",
        "action_type",
        "due_date",
        "contact_email",
        "subject",
        "email_body",
    ]
    with path.open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)


def write_md(path: Path, rows: list[dict[str, str]]) -> None:
    lines = [
        "# Sponsor Send-Now Copy Batch",
        "",
        f"Count: **{len(rows)}**",
        "",
    ]

    if not rows:
        lines.append("No send-now rows with verified contacts.")
    else:
        for idx, row in enumerate(rows, start=1):
            lines.extend(
                [
                    f"## {idx}. {row['company']} ({row['priority']} · {row['action_type']})",
                    f"- To: {row['contact_email']}",
                    f"- Due: {row['due_date']}",
                    f"- Subject: {row['subject']}",
                    "",
                    "```text",
                    row["email_body"],
                    "```",
                    "",
                ]
            )

    path.write_text("\n".join(lines))


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--send-now", required=True, help="CSV from generate_send_now_batch.py")
    p.add_argument("--output-csv", required=True)
    p.add_argument("--output-md", required=True)
    args = p.parse_args()

    rows = load_rows(Path(args.send_now))
    out_rows: list[dict[str, str]] = []

    for row in rows:
        subject, body = build_copy(row)
        out_rows.append(
            {
                "company": row.get("company", ""),
                "priority": row.get("priority", ""),
                "action_type": row.get("action_type", ""),
                "due_date": row.get("due_date", ""),
                "contact_email": row.get("contact_email", ""),
                "subject": subject,
                "email_body": body,
            }
        )

    write_csv(Path(args.output_csv), out_rows)
    write_md(Path(args.output_md), out_rows)
    print(f"Wrote {len(out_rows)} send-now copy rows -> {args.output_csv}")


if __name__ == "__main__":
    main()
