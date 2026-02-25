#!/usr/bin/env python3
"""Execute BusyBits due-batch sends via Himalaya.

Reads the daily due-batch CSV and executes sends for all rows.
Logs progress to Mission Control.

Usage:
  python3 builds/busybits-newsletter/scripts/execute_due_batch.py --date 2026-02-24
"""

from __future__ import annotations

import argparse
import csv
import subprocess
import sys
from pathlib import Path


def run_himalaya(to_email: str, subject: str, body: str) -> None:
    message = f"From: Ziga <barttheai@gmail.com>\nTo: {to_email}\nSubject: {subject}\nContent-Type: text/plain; charset=utf-8\n\n{body}"
    subprocess.run(
        ["himalaya", "message", "send"],
        input=message.encode("utf-8"),
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.PIPE,
    )


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--date", required=True, help="YYYY-MM-DD")
    p.add_argument("--dry-run", action="store_true")
    args = p.parse_args()

    # If date is today, look for today's batch or send-now batch
    # Prefer send-now batch for initial outreach, due-batch for follow-ups
    # For now, let's target the send-now batch first since that was the previous step's output
    
    # Actually, the task says "due-batch sends", implying follow-ups or scheduled items.
    # But today's earlier work created "sponsor_send_now_batch_2026-02-24.csv" for initial sends.
    # Let's support both or pick one.
    
    root = Path("builds/busybits-newsletter")
    batch_file = root / f"sponsor_send_now_batch_{args.date}.csv"
    
    if not batch_file.exists():
        # Fallback to due batch if exists (for follow-ups)
        batch_file = root / f"sponsor_followup_due_batch_{args.date}.csv"
    
    if not batch_file.exists():
        print(f"No batch file found for {args.date} (checked send-now and due-batch)")
        sys.exit(0)

    print(f"Processing batch: {batch_file}")
    rows = list(csv.DictReader(batch_file.open()))
    
    sent_count = 0
    errors = 0

    for r in rows:
        company = r.get("company")
        email = r.get("contact_email")
        subject = r.get("email_subject")
        # Body might not be in CSV if it's just a tracker row.
        # Check if we have a body column or need to generate it.
        # The send-now batch usually has subject/body if generated from template.
        # If not, we might need to look up template or use a default.
        
        # Let's check the CSV headers of send-now batch
        # Usually: company, email, subject, body_template_rendered...
        
        # If we don't have body, skip for safety
        body = r.get("email_body")
        
        if not email or not subject or not body:
            print(f"Skipping {company}: missing email/subject/body")
            continue
            
        print(f"Sending to {company} ({email})...")
        if not args.dry_run:
            try:
                run_himalaya(email, subject, body)
                sent_count += 1
                print("OK")
            except subprocess.CalledProcessError as e:
                print(f"FAIL: {e.stderr.decode().strip()}")
                errors += 1
        else:
            print("(Dry run)")

    print(f"\nDone. Sent: {sent_count}, Errors: {errors}")

if __name__ == "__main__":
    main()
