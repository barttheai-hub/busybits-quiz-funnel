#!/usr/bin/env python3
"""Generate a ready-to-send BusyBits sponsorship outreach pack from daily queue CSV.

Usage:
  python3 builds/busybits-newsletter/scripts/generate_outreach_send_pack.py \
    --input builds/busybits-newsletter/sponsor_outreach_day_queue.csv \
    --output builds/busybits-newsletter/sponsor_outreach_send_pack.md \
    --limit 8
"""

from __future__ import annotations

import argparse
import csv
from datetime import datetime
from pathlib import Path


def subject_options(company: str, angle: str) -> tuple[str, str]:
    a = angle.strip().rstrip(".")
    return (
        f"BusyBits x {company} (pilot sponsor slot)",
        f"Quick idea: {a} for founder/operators",
    )


def build_email(company: str, angle: str) -> str:
    return (
        f"Hey {company} team —\n\n"
        "I run BusyBits, a high-performance newsletter for founders/operators.\n\n"
        f"I think there’s a clean pilot sponsor fit around this angle: {angle}.\n"
        "We can run a single-issue test with clear delivery timing and a concise sponsor block.\n\n"
        "If useful, I can send the one-issue pilot details (placement + timing + rate) in one short message.\n\n"
        "Open to a quick test?\n\n"
        "— Ziga"
    )


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--input", required=True)
    p.add_argument("--output", required=True)
    p.add_argument("--limit", type=int, default=8)
    args = p.parse_args()

    rows = list(csv.DictReader(Path(args.input).open()))
    picked = rows[: args.limit]

    today = datetime.now().strftime("%Y-%m-%d")
    lines = [
        f"# BusyBits Sponsor Outreach Send Pack ({today})",
        "",
        "Execution-ready draft emails generated from today's prioritized queue.",
        "",
        "## Offer Frame",
        "- Placement: Dedicated sponsor block in BusyBits",
        "- Audience: high-performance founders/operators",
        "- Pilot: 1 issue test",
        "- CTA: \"Open to a quick test?\"",
        "",
    ]

    for i, row in enumerate(picked, start=1):
        company = (row.get("company") or "").strip()
        angle = (row.get("outreach_angle") or "performance bottleneck").strip()
        target_day = (row.get("target_send_day") or "Tue").strip()
        followup = (row.get("followup_plan") or "Follow-up #1 +3 days; Follow-up #2 +7 days").strip()
        s1, s2 = subject_options(company, angle)
        email = build_email(company, angle)

        lines.extend(
            [
                f"## {i}) {company}",
                f"- Priority: {(row.get('priority') or '').strip()}",
                f"- Category: {(row.get('category') or '').strip()}",
                f"- Target send day: {target_day}",
                f"- Angle: {angle}",
                "",
                "**Subject options**",
                f"- {s1}",
                f"- {s2}",
                "",
                "**Email draft**",
                email,
                "",
                f"**Follow-up plan:** {followup}",
                "",
                "---",
                "",
            ]
        )

    lines.extend(
        [
            "## Send SOP (20-minute block)",
            "1. Send all emails in one focused block.",
            "2. Personalize first line if you have a specific contact name.",
            "3. After each send, update tracker status to `Sent`.",
            "4. Schedule follow-ups immediately.",
        ]
    )

    out = Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text("\n".join(lines))


if __name__ == "__main__":
    main()
