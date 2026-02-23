#!/usr/bin/env python3
import csv
import urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
input_csv = ROOT / "builds" / "busybits-newsletter" / "sponsorship_outreach_tracker.csv"
output_csv = ROOT / "builds" / "busybits-newsletter" / "sponsorship_contact_research_queue.csv"

rows = []
with input_csv.open(newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for r in reader:
        if r.get("status", "").strip().lower() != "research contact":
            continue
        company = r["company"].strip()
        role = r.get("contact_role", "Partnerships").strip()

        q1 = f"{company} {role} linkedin"
        q2 = f"{company} sponsor newsletter"
        q3 = f"{company} partnerships email"

        rows.append({
            "company": company,
            "tier": r.get("tier", ""),
            "priority": r.get("priority", ""),
            "role_target": role,
            "linkedin_search_url": "https://www.google.com/search?q=" + urllib.parse.quote(q1),
            "sponsorship_search_url": "https://www.google.com/search?q=" + urllib.parse.quote(q2),
            "email_search_url": "https://www.google.com/search?q=" + urllib.parse.quote(q3),
            "status": "Queued",
            "contact_name": "",
            "contact_email": "",
            "source_url": "",
            "notes": ""
        })

output_csv.parent.mkdir(parents=True, exist_ok=True)
with output_csv.open("w", newline="", encoding="utf-8") as f:
    fieldnames = [
        "company", "tier", "priority", "role_target",
        "linkedin_search_url", "sponsorship_search_url", "email_search_url",
        "status", "contact_name", "contact_email", "source_url", "notes"
    ]
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)

print(f"Wrote {len(rows)} rows to {output_csv}")
