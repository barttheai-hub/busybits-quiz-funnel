#!/usr/bin/env python3
"""Generate deterministic sponsor contact candidates + page checks for P1 ready-to-send rows.

This is a no-API fallback when live web search is unavailable.
"""
import argparse
import csv
from pathlib import Path

ALIASES = ["partnerships", "partners", "partnership", "sponsorships", "hello", "press"]
PAGES = ["/contact", "/pages/contact", "/partners", "/affiliate"]
DOMAIN_OVERRIDES = {
    "Levels": "levelshealth.com",
    "Oura": "ouraring.com",
}


def slug_domain(company: str) -> str:
    cleaned = "".join(ch.lower() for ch in company if ch.isalnum())
    return f"{cleaned}.com"


def load_companies(tracker_csv: Path):
    rows = list(csv.DictReader(tracker_csv.open()))
    picked = [r for r in rows if r.get("status") == "Ready to send" and r.get("priority") == "P1"]
    out = []
    for r in picked:
        company = r["company"].strip()
        domain = DOMAIN_OVERRIDES.get(company, slug_domain(company))
        out.append((company, domain))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--tracker", required=True)
    ap.add_argument("--date", required=True)
    ap.add_argument("--out-dir", default=".")
    args = ap.parse_args()

    tracker = Path(args.tracker)
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    companies = load_companies(tracker)
    out_rows = []
    for company, domain in companies:
        for alias in ALIASES:
            out_rows.append({
                "company": company,
                "domain": domain,
                "contact_candidate": f"{alias}@{domain}",
                "source": "alias_pattern",
                "source_url": f"https://{domain}/contact",
            })
        for page in PAGES:
            out_rows.append({
                "company": company,
                "domain": domain,
                "contact_candidate": "(check page)",
                "source": "manual_page",
                "source_url": f"https://{domain}{page}",
            })

    csv_path = out_dir / f"sponsor_contact_candidates_{args.date}.csv"
    md_path = out_dir / f"sponsor_contact_candidates_{args.date}.md"

    with csv_path.open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["company", "domain", "contact_candidate", "source", "source_url"])
        w.writeheader()
        w.writerows(out_rows)

    with md_path.open("w") as f:
        f.write(f"# Sponsor Contact Candidates — {args.date}\n\n")
        current = None
        for r in out_rows:
            if r["company"] != current:
                current = r["company"]
                f.write(f"## {current} ({r['domain']})\n")
            f.write(f"- {r['contact_candidate']} — {r['source']} (<{r['source_url']}>)\n")

    print(csv_path)
    print(md_path)


if __name__ == "__main__":
    main()
