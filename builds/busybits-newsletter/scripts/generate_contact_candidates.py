#!/usr/bin/env python3
"""Generate deterministic sponsor contact candidates + page checks for P1 ready-to-send rows.

This is a no-API fallback when live web search is unavailable.
"""
import argparse
import csv
from pathlib import Path

ALIAS_SCORING = [
    ("partnerships", 0.9, "most common partner inbox"),
    ("partners", 0.85, "common partner inbox"),
    ("sponsorships", 0.8, "common sponsorship inbox"),
    ("partnership", 0.65, "less common singular alias"),
    ("hello", 0.45, "generic inbox fallback"),
    ("press", 0.35, "media inbox fallback"),
]
PAGES = [
    ("/contact", 0.8, "primary contact page"),
    ("/pages/contact", 0.7, "alternate contact page"),
    ("/partners", 0.75, "possible partnerships page"),
    ("/affiliate", 0.6, "possible partner program page"),
]
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
        for alias, score, reason in ALIAS_SCORING:
            out_rows.append({
                "company": company,
                "domain": domain,
                "contact_candidate": f"{alias}@{domain}",
                "source": "alias_pattern",
                "source_url": f"https://{domain}/contact",
                "confidence": score,
                "reason": reason,
            })
        for page, score, reason in PAGES:
            out_rows.append({
                "company": company,
                "domain": domain,
                "contact_candidate": "(check page)",
                "source": "manual_page",
                "source_url": f"https://{domain}{page}",
                "confidence": score,
                "reason": reason,
            })

    out_rows.sort(key=lambda r: (r["company"], -r["confidence"], r["contact_candidate"]))

    csv_path = out_dir / f"sponsor_contact_candidates_{args.date}.csv"
    md_path = out_dir / f"sponsor_contact_candidates_{args.date}.md"

    with csv_path.open("w", newline="") as f:
        w = csv.DictWriter(
            f,
            fieldnames=["company", "domain", "contact_candidate", "source", "source_url", "confidence", "reason"],
        )
        w.writeheader()
        w.writerows(out_rows)

    with md_path.open("w") as f:
        f.write(f"# Sponsor Contact Candidates — {args.date}\n\n")
        current = None
        for r in out_rows:
            if r["company"] != current:
                current = r["company"]
                f.write(f"## {current} ({r['domain']})\n")
            f.write(
                f"- {r['contact_candidate']} — {r['source']} | confidence {r['confidence']:.2f} ({r['reason']}) (<{r['source_url']}>)\n"
            )

    print(csv_path)
    print(md_path)


if __name__ == "__main__":
    main()
