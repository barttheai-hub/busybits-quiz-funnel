#!/usr/bin/env python3
"""Generate a daily sponsor outreach action queue from execution board dates.

Usage:
  python3 builds/busybits-newsletter/scripts/generate_followup_queue.py \
    --input builds/busybits-newsletter/sponsor_outreach_execution_board.csv \
    --output-csv builds/busybits-newsletter/sponsor_outreach_actions_today.csv \
    --output-md builds/busybits-newsletter/sponsor_outreach_actions_today.md
"""

from __future__ import annotations

import argparse
import csv
from datetime import date, datetime
from pathlib import Path


def parse_date(raw: str | None) -> date | None:
    if not raw:
        return None
    raw = raw.strip()
    if not raw:
        return None
    return datetime.strptime(raw, "%Y-%m-%d").date()


def build_email_draft(row: dict[str, str]) -> str:
    company = row["company"]
    angle = row["angle"]
    action_type = row["action_type"]

    if action_type == "send_initial":
        return (
            f"Hey {company} team —\n\n"
            "I run BusyBits, a high-performance newsletter for founders/operators.\n\n"
            f"I think there’s a clean pilot sponsor fit around this angle: {angle}.\n"
            "If useful, I can send one short pilot option (placement + timing + rate).\n\n"
            "Open to a quick test?\n\n"
            "— Ziga"
        )

    if action_type == "followup_1":
        return (
            f"Hey {company} team — quick bump on this.\n\n"
            f"Still think {angle} is a strong fit for a BusyBits pilot sponsor slot. "
            "Happy to send the simple one-issue option if useful.\n\n"
            "Open to a quick test?\n\n"
            "— Ziga"
        )

    return (
        f"Hey {company} team — final nudge from me.\n\n"
        "If sponsorship planning is full right now, no worries. "
        f"If there’s still room, {angle} is the angle I’d test first with BusyBits.\n\n"
        "Should I send the 1-issue pilot details?\n\n"
        "— Ziga"
    )


def urgency_bucket(days_overdue: int) -> str:
    if days_overdue <= 0:
        return "due_today"
    if days_overdue <= 2:
        return "overdue_hot"
    return "overdue_stale"


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--input", required=True)
    p.add_argument("--output-csv", required=True)
    p.add_argument("--output-md", required=True)
    p.add_argument("--date", default=date.today().isoformat(), help="Action date in YYYY-MM-DD")
    p.add_argument(
        "--include-overdue",
        action="store_true",
        default=True,
        help="Include overdue actions (due date before --date). Enabled by default.",
    )
    args = p.parse_args()

    action_date = parse_date(args.date)
    if not action_date:
        raise SystemExit("Invalid --date. Use YYYY-MM-DD")

    rows = list(csv.DictReader(Path(args.input).open()))
    actions: list[dict[str, str]] = []

    for row in rows:
        company = (row.get("company") or "").strip()
        status = (row.get("status") or "").strip()
        contact_email = (row.get("contact_email") or "").strip()

        send_date = parse_date(row.get("send_date"))
        f1 = parse_date(row.get("followup_1_date"))
        f2 = parse_date(row.get("followup_2_date"))

        def append_if_due(due: date | None, action_type: str, next_with_contact: str, next_missing_contact: str) -> None:
            if not due:
                return
            is_due_today = due == action_date
            is_overdue = args.include_overdue and due < action_date
            if not (is_due_today or is_overdue):
                return

            days_overdue = max(0, (action_date - due).days)
            actions.append(
                {
                    "action_type": action_type,
                    "company": company,
                    "priority": (row.get("priority") or "").strip(),
                    "status": status,
                    "due_date": due.isoformat(),
                    "days_overdue": str(days_overdue),
                    "urgency": urgency_bucket(days_overdue),
                    "has_contact": "yes" if contact_email else "no",
                    "contact_email": contact_email,
                    "subject": (row.get("email_subject") or "").strip(),
                    "angle": (row.get("outreach_angle") or "").strip(),
                    "next_action": next_with_contact if contact_email else next_missing_contact,
                }
            )

        append_if_due(
            due=send_date,
            action_type="send_initial",
            next_with_contact="Send intro email",
            next_missing_contact="Research contact + send intro email",
        )
        append_if_due(
            due=f1,
            action_type="followup_1",
            next_with_contact="Send follow-up #1",
            next_missing_contact="Research contact + send follow-up #1",
        )
        append_if_due(
            due=f2,
            action_type="followup_2",
            next_with_contact="Send follow-up #2",
            next_missing_contact="Research contact + send follow-up #2",
        )

    priority_rank = {"P1": 0, "P2": 1, "P3": 2}
    urgency_rank = {"overdue_stale": 0, "overdue_hot": 1, "due_today": 2}
    actions.sort(
        key=lambda r: (
            priority_rank.get(r.get("priority", "P3"), 9),
            urgency_rank.get(r.get("urgency", "due_today"), 9),
            -int(r.get("days_overdue", "0")),
            r["company"],
            r["action_type"],
        )
    )

    out_csv = Path(args.output_csv)
    out_csv.parent.mkdir(parents=True, exist_ok=True)
    fields = [
        "action_type",
        "company",
        "priority",
        "status",
        "due_date",
        "days_overdue",
        "urgency",
        "has_contact",
        "contact_email",
        "subject",
        "angle",
        "next_action",
    ]
    with out_csv.open("w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        writer.writerows(actions)

    total = len(actions)
    with_contact = sum(1 for r in actions if r["has_contact"] == "yes")
    overdue_total = sum(1 for r in actions if int(r.get("days_overdue", "0")) > 0)

    lines = [
        f"# Sponsor Outreach Actions — {action_date.isoformat()}",
        "",
        f"Generated from: `{args.input}`",
        f"Actions due: **{total}** (with contact ready: **{with_contact}**, overdue included: **{overdue_total}**) ",
        "",
        "## Queue + Drafts",
        "",
    ]

    if not actions:
        lines.append("No outreach actions due for this date.")
    else:
        for i, r in enumerate(actions, 1):
            draft = build_email_draft(r)
            overdue_note = (
                f" | Overdue: {r['days_overdue']}d" if int(r.get("days_overdue", "0")) > 0 else ""
            )
            lines.extend(
                [
                    f"{i}. **{r['company']}** — {r['action_type']} ({r['priority']}, {r['urgency']}{overdue_note})",
                    f"   - Contact ready: {r['has_contact']} | Email: {r['contact_email'] or 'n/a'}",
                    f"   - Subject: {r['subject']}",
                    f"   - Next: {r['next_action']}",
                    "",
                    "   Draft:",
                    "",
                    "```",
                    draft,
                    "```",
                    "",
                ]
            )

    Path(args.output_md).write_text("\n".join(lines))


if __name__ == "__main__":
    main()
