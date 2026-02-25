#!/usr/bin/env python3
"""Generate initial outreach copy for contact-research sprint rows.

This produces a copy batch with subject/body drafts so once an email is verified,
the operator can send immediately without drafting from scratch.
"""

from __future__ import annotations

import argparse
import csv
from pathlib import Path


SUBJECT_TEMPLATES = [
    "BusyBits x {company} — quick sponsorship fit check",
    "Partnership idea for {company} + BusyBits",
    "{company} sponsorship slot in BusyBits",
]


def load_rows(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        return []
    with path.open(newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def build_subject(company: str, i: int) -> str:
    return SUBJECT_TEMPLATES[i % len(SUBJECT_TEMPLATES)].format(company=company)


def build_body(company: str, action_type: str, due_date: str) -> str:
    urgency = ""
    if due_date:
        urgency = f" We’re currently locking sponsor slots around {due_date}."

    return (
        f"Hi {{first_name}},\n\n"
        f"I run sponsorships for BusyBits (high-performance fitness newsletter, 100k+ subscribers). "
        f"I think {company} could be a strong fit for an upcoming issue.{urgency}\n\n"
        "If helpful, I can send a 1-page media kit with audience profile, past sponsor examples, and package options.\n\n"
        "Would you be the right person to coordinate this, or should I reach out to someone else on your team?\n\n"
        "Best,\n"
        "Ziga"
    )


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--input", required=True, help="Contact research sprint CSV")
    p.add_argument("--output-csv", required=True)
    p.add_argument("--output-md", required=True)
    args = p.parse_args()

    rows = load_rows(Path(args.input))
    out: list[dict[str, str]] = []

    for idx, r in enumerate(rows):
        company = (r.get("company") or "").strip()
        if not company:
            continue

        out.append(
            {
                "company": company,
                "priority": (r.get("priority") or "P3").strip(),
                "action_type": (r.get("action_type") or "send_initial").strip(),
                "due_date": (r.get("due_date") or "").strip(),
                "candidate_email": (r.get("candidate_email") or "").strip(),
                "subject": build_subject(company, idx),
                "body": build_body(
                    company=company,
                    action_type=(r.get("action_type") or "send_initial").strip(),
                    due_date=(r.get("due_date") or "").strip(),
                ),
            }
        )

    out_csv = Path(args.output_csv)
    out_md = Path(args.output_md)
    out_csv.parent.mkdir(parents=True, exist_ok=True)

    fieldnames = [
        "company",
        "priority",
        "action_type",
        "due_date",
        "candidate_email",
        "subject",
        "body",
    ]

    with out_csv.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(out)

    with out_md.open("w", encoding="utf-8") as f:
        f.write("# Sponsor Contact Research Copy Batch\n\n")
        f.write(f"Rows: {len(out)}\n\n")
        if not out:
            f.write("No rows to generate copy for.\n")
        for i, row in enumerate(out, start=1):
            f.write(f"## {i}. {row['company']} ({row['priority']})\n")
            if row["candidate_email"]:
                f.write(f"- Candidate email: {row['candidate_email']}\n")
            f.write(f"- Subject: {row['subject']}\n")
            f.write("- Body:\n\n")
            f.write("```\n")
            f.write(row["body"])
            f.write("\n```\n\n")

    print(f"Wrote {out_csv}")
    print(f"Wrote {out_md}")


if __name__ == "__main__":
    main()
