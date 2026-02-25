#!/usr/bin/env python3
"""Automate BusyBits sponsor contact deduplication + tracker gap queue generation.

Outputs:
1) Unique contact candidates CSV (deduped by company+email and email globally)
2) Net-new fill queue CSV for tracker rows with status=Research Contact and missing contact_email
3) Markdown summary report with counts

Default behavior is date-aware:
- Input candidates defaults to latest `sponsor_contact_candidates_*.csv`
- Output filenames use `--date` (default: today)
"""

from __future__ import annotations

import argparse
import csv
import datetime as dt
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BUILD = ROOT / "builds" / "busybits-newsletter"
TRACKER_IN_DEFAULT = BUILD / "sponsorship_outreach_tracker.csv"


def norm(s: str) -> str:
    return " ".join((s or "").strip().lower().split())


def company_key(s: str) -> str:
    s = norm(s)
    s = re.sub(r"[\.,'&()/\-]", " ", s)
    s = re.sub(r"\b(inc|llc|ltd|limited|corp|corporation|co|company)\b", "", s)
    return " ".join(s.split())


def email_key(s: str) -> str:
    return norm(s)


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def write_csv(path: Path, rows: list[dict[str, str]], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)


def safe_float(value: str) -> float:
    try:
        return float((value or "").strip())
    except Exception:
        return 0.0


def pick_latest_candidates_csv() -> Path:
    files = sorted(BUILD.glob("sponsor_contact_candidates_*.csv"))
    if not files:
        raise FileNotFoundError("No sponsor_contact_candidates_*.csv found in builds/busybits-newsletter")
    return files[-1]


def parse_args() -> argparse.Namespace:
    today = dt.date.today().isoformat()
    p = argparse.ArgumentParser(description="Deduplicate sponsor contacts + build fill queue")
    p.add_argument("--date", default=today, help="Date tag for output files (YYYY-MM-DD). Default: today")
    p.add_argument("--candidates-in", default="", help="Input candidates CSV. Default: latest sponsor_contact_candidates_*.csv")
    p.add_argument("--tracker-in", default=str(TRACKER_IN_DEFAULT), help="Input tracker CSV")
    p.add_argument("--out-dir", default=str(BUILD), help="Output directory")
    return p.parse_args()


def main() -> None:
    args = parse_args()

    out_dir = Path(args.out_dir)
    candidates_in = Path(args.candidates_in) if args.candidates_in else pick_latest_candidates_csv()
    tracker_in = Path(args.tracker_in)

    candidates_out = out_dir / f"sponsor_contact_candidates_deduped_{args.date}.csv"
    fill_queue_out = out_dir / f"sponsor_tonight_contact_fill_{args.date}.csv"
    report_out = out_dir / f"sponsor_contact_dedupe_summary_{args.date}.md"

    candidates = read_csv(candidates_in)
    tracker = read_csv(tracker_in)

    tracker_emails = {
        email_key(r.get("contact_email", ""))
        for r in tracker
        if r.get("contact_email", "").strip()
    }

    # Deduplicate candidates: first by company+email, then by global email reuse.
    seen_pair: set[tuple[str, str]] = set()
    seen_email: set[str] = set()
    deduped_candidates: list[dict[str, str]] = []
    dropped_pair = 0
    dropped_email_global = 0

    for row in candidates:
        ckey = company_key(row.get("company", ""))
        ekey = email_key(row.get("contact_candidate", ""))
        pair = (ckey, ekey)

        if pair in seen_pair:
            dropped_pair += 1
            continue
        if ekey and ekey in seen_email:
            dropped_email_global += 1
            continue

        seen_pair.add(pair)
        if ekey:
            seen_email.add(ekey)
        deduped_candidates.append(row)

    # Build fastest operator queue:
    # only tracker rows needing contact research + no contact_email,
    # but with a deduped candidate available for same company.
    candidates_by_company: dict[str, list[dict[str, str]]] = {}
    for r in deduped_candidates:
        candidates_by_company.setdefault(company_key(r.get("company", "")), []).append(r)

    fill_queue: list[dict[str, str]] = []
    for t in tracker:
        if norm(t.get("status", "")) != "research contact":
            continue
        if t.get("contact_email", "").strip():
            continue

        ckey = company_key(t.get("company", ""))
        options = candidates_by_company.get(ckey, [])
        if not options:
            continue

        # Prefer highest confidence if numeric.
        options = sorted(options, key=lambda x: safe_float(x.get("confidence", "0")), reverse=True)
        pick = options[0]
        candidate_email = email_key(pick.get("contact_candidate", ""))

        if not candidate_email or candidate_email in tracker_emails:
            continue

        fill_queue.append(
            {
                "company": t.get("company", ""),
                "tier": t.get("tier", ""),
                "priority": t.get("priority", ""),
                "existing_status": t.get("status", ""),
                "contact_candidate": pick.get("contact_candidate", ""),
                "candidate_confidence": pick.get("confidence", ""),
                "candidate_source": pick.get("source", ""),
                "candidate_source_url": pick.get("source_url", ""),
                "next_action": "Validate + paste into sponsorship_outreach_tracker.csv, then set status=Ready to Send",
            }
        )

    # Sort for operator execution speed.
    priority_rank = {"high": 0, "medium": 1, "low": 2}
    fill_queue.sort(key=lambda r: (priority_rank.get(norm(r.get("priority", "")), 9), norm(r.get("company", ""))))

    write_csv(
        candidates_out,
        deduped_candidates,
        ["company", "domain", "contact_candidate", "source", "source_url", "confidence", "reason"],
    )

    write_csv(
        fill_queue_out,
        fill_queue,
        [
            "company",
            "tier",
            "priority",
            "existing_status",
            "contact_candidate",
            "candidate_confidence",
            "candidate_source",
            "candidate_source_url",
            "next_action",
        ],
    )

    with report_out.open("w", encoding="utf-8") as f:
        f.write("# Sponsor Contact Deduplication Summary\n\n")
        f.write(f"- Run date tag: {args.date}\n")
        f.write(f"- Candidate input file: `{candidates_in.name}`\n")
        f.write(f"- Tracker input file: `{tracker_in.name}`\n")
        f.write(f"- Candidate input rows: {len(candidates)}\n")
        f.write(f"- Candidate rows after dedupe: {len(deduped_candidates)}\n")
        f.write(f"- Dropped duplicate company+email rows: {dropped_pair}\n")
        f.write(f"- Dropped duplicate global email rows: {dropped_email_global}\n")
        f.write(f"- Tracker rows eligible for contact fill queue: {len(fill_queue)}\n")
        f.write(f"- Output candidates: `{candidates_out.name}`\n")
        f.write(f"- Output fill queue: `{fill_queue_out.name}`\n")

    print(str(candidates_out))
    print(str(fill_queue_out))
    print(str(report_out))


if __name__ == "__main__":
    main()
