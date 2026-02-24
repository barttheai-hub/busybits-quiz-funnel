#!/usr/bin/env python3
import csv
import datetime as dt
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BUILD = ROOT / "builds" / "busybits-newsletter"
TODAY = dt.date(2026, 2, 23)

ACTION_FILES = sorted(BUILD.glob("sponsor_outreach_actions_*.csv"))
rows = []
for f in ACTION_FILES:
    with f.open(newline="", encoding="utf-8") as fh:
        for r in csv.DictReader(fh):
            if not r:
                continue
            due_raw = (r.get("due_date") or "").strip()
            try:
                due = dt.date.fromisoformat(due_raw)
            except Exception:
                continue
            rows.append({
                "action_type": (r.get("action_type") or "").strip(),
                "company": (r.get("company") or "").strip(),
                "priority": (r.get("priority") or "").strip(),
                "status": (r.get("status") or "").strip(),
                "due_date": due,
                "has_contact": (r.get("has_contact") or "").strip().lower(),
                "contact_email": (r.get("contact_email") or "").strip(),
                "subject": (r.get("subject") or "").strip(),
                "next_action": (r.get("next_action") or "").strip(),
            })

# de-dupe by company+action, keep earliest due date
by_key = {}
for r in rows:
    k = (r["company"], r["action_type"])
    if k not in by_key or r["due_date"] < by_key[k]["due_date"]:
        by_key[k] = r
items = sorted(by_key.values(), key=lambda x: (x["due_date"], x["priority"], x["company"]))

overdue = [x for x in items if x["due_date"] < TODAY]
due_today = [x for x in items if x["due_date"] == TODAY]
next_48h = [x for x in items if TODAY < x["due_date"] <= TODAY + dt.timedelta(days=2)]
contact_gap = [x for x in items if x["has_contact"] != "yes" or not x["contact_email"]]

csv_out = BUILD / "sponsor_outreach_overdue_recovery_queue.csv"
with csv_out.open("w", newline="", encoding="utf-8") as fh:
    w = csv.writer(fh)
    w.writerow(["bucket", "due_date", "priority", "company", "action_type", "has_contact", "contact_email", "next_action", "subject"])
    for bucket, group in [("overdue", overdue), ("due_today", due_today), ("next_48h", next_48h)]:
        for r in group:
            w.writerow([bucket, r["due_date"].isoformat(), r["priority"], r["company"], r["action_type"], r["has_contact"], r["contact_email"], r["next_action"], r["subject"]])

md_out = BUILD / "sponsor_outreach_overdue_recovery_queue.md"
with md_out.open("w", encoding="utf-8") as fh:
    fh.write(f"# Sponsor Outreach Overdue Recovery Queue — {TODAY.isoformat()}\n\n")
    fh.write(f"Source files scanned: {len(ACTION_FILES)}\n\n")
    fh.write(f"- Overdue: **{len(overdue)}**\n")
    fh.write(f"- Due today: **{len(due_today)}**\n")
    fh.write(f"- Next 48h: **{len(next_48h)}**\n")
    fh.write(f"- Contact gaps in actionable set: **{len(contact_gap)}**\n\n")

    def section(title, group):
        fh.write(f"## {title}\n\n")
        if not group:
            fh.write("None.\n\n")
            return
        for i, r in enumerate(group, 1):
            email = r['contact_email'] or 'n/a'
            fh.write(
                f"{i}. **{r['company']}** ({r['priority']}) — {r['action_type']}\\n"
                f"   - Due: {r['due_date'].isoformat()} | Contact ready: {r['has_contact']} | Email: {email}\\n"
                f"   - Next: {r['next_action'] or 'n/a'}\\n"
                f"   - Subject: {r['subject'] or 'n/a'}\\n\n"
            )

    section("Overdue", overdue)
    section("Due Today", due_today)
    section("Next 48 Hours", next_48h)
    section("Contact Gap Queue", contact_gap)

print(f"Wrote {csv_out}")
print(f"Wrote {md_out}")
