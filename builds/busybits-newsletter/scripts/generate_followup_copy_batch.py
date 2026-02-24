#!/usr/bin/env python3
"""Generate send-ready follow-up copy batch from follow-up rows."""

from __future__ import annotations

import argparse
import csv
from pathlib import Path


def load_rows(path: Path) -> list[dict[str, str]]:
    with path.open() as f:
        return list(csv.DictReader(f))


def build_copy(row: dict[str, str]) -> tuple[str, str]:
    contact_name = (row.get("contact_name") or "there").strip() or "there"
    company = (row.get("company") or "your team").strip() or "your team"
    followup_step = (row.get("followup_step") or "F/U").strip()

    if followup_step == "F/U1":
        subject = f"Quick follow-up — BusyBits x {company}"
        body = (
            f"Hi {contact_name},\n\n"
            f"Quick follow-up on the BusyBits sponsorship note I sent earlier this week. "
            f"We reach a high-intent health/performance audience and have upcoming slots open.\n\n"
            "If useful, I can send over a 2-minute fit + pricing snapshot and a few recent partner outcomes.\n\n"
            "Best,\nZiga"
        )
    else:
        subject = f"Last ping — BusyBits x {company}"
        body = (
            f"Hi {contact_name},\n\n"
            "Last ping from me in case this got buried. "
            "If sponsorships are handled by someone else on your side, happy to route this correctly.\n\n"
            "If timing is better next month, I can also circle back then.\n\n"
            "Best,\nZiga"
        )

    return subject, body


def write_csv(path: Path, rows: list[dict[str, str]]) -> None:
    fields = [
        "followup_date",
        "company",
        "contact_name",
        "contact_email",
        "followup_step",
        "owner",
        "subject",
        "email_body",
    ]
    with path.open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)


def write_md(path: Path, rows: list[dict[str, str]]) -> None:
    lines = [
        "# Sponsor Follow-up Copy Batch",
        "",
        f"Count: **{len(rows)}**",
        "",
    ]

    if not rows:
        lines.append("No upcoming follow-up rows in this window.")
    else:
        for idx, row in enumerate(rows, start=1):
            lines.extend(
                [
                    f"## {idx}. {row['company']} ({row['followup_step']}) — {row['followup_date']}",
                    f"- Contact: {row['contact_name']} <{row['contact_email']}>",
                    f"- Owner: {row['owner']}",
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
    p.add_argument("--input", required=True, help="CSV from follow-up queue generator (due or upcoming)")
    p.add_argument("--output-csv", required=True)
    p.add_argument("--output-md", required=True)
    args = p.parse_args()

    rows = load_rows(Path(args.input))
    out_rows: list[dict[str, str]] = []

    for row in rows:
        subject, body = build_copy(row)
        out_rows.append(
            {
                "followup_date": row.get("followup_date", ""),
                "company": row.get("company", ""),
                "contact_name": row.get("contact_name", ""),
                "contact_email": row.get("contact_email", ""),
                "followup_step": row.get("followup_step", ""),
                "owner": row.get("owner", ""),
                "subject": subject,
                "email_body": body,
            }
        )

    write_csv(Path(args.output_csv), out_rows)
    write_md(Path(args.output_md), out_rows)
    print(f"Wrote {len(out_rows)} follow-up copy rows -> {args.output_csv}")


if __name__ == "__main__":
    main()
