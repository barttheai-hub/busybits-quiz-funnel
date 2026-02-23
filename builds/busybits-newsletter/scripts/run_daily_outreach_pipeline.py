#!/usr/bin/env python3
"""Run BusyBits sponsor outreach pipeline end-to-end.

This orchestrates all existing queue/send/follow-up generators in one command.

Usage:
  python3 builds/busybits-newsletter/scripts/run_daily_outreach_pipeline.py
  python3 builds/busybits-newsletter/scripts/run_daily_outreach_pipeline.py --date 2026-02-24 --limit 15
"""

from __future__ import annotations

import argparse
import subprocess
from pathlib import Path
from datetime import datetime


def run(cmd: list[str]) -> None:
    print("→", " ".join(cmd))
    subprocess.run(cmd, check=True)


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--root", default="builds/busybits-newsletter")
    p.add_argument("--limit", type=int, default=15)
    p.add_argument("--date", help="YYYY-MM-DD for action queue output (default: today)")
    args = p.parse_args()

    root = Path(args.root)
    scripts = root / "scripts"
    run_date = args.date or datetime.now().strftime("%Y-%m-%d")

    tracker = root / "sponsorship_outreach_tracker.csv"
    day_queue_csv = root / "sponsor_outreach_day_queue.csv"
    day_queue_md = root / "sponsor_outreach_day_queue.md"
    send_pack_md = root / "sponsor_outreach_send_pack.md"
    board_csv = root / "sponsor_outreach_execution_board.csv"
    board_md = root / "sponsor_outreach_execution_board.md"
    actions_csv = root / f"sponsor_outreach_actions_{run_date}.csv"
    actions_md = root / f"sponsor_outreach_actions_{run_date}.md"

    run([
        "python3",
        str(scripts / "generate_daily_outreach_queue.py"),
        "--input",
        str(tracker),
        "--output-csv",
        str(day_queue_csv),
        "--output-md",
        str(day_queue_md),
        "--limit",
        str(args.limit),
    ])

    run([
        "python3",
        str(scripts / "generate_outreach_send_pack.py"),
        "--input",
        str(day_queue_csv),
        "--output",
        str(send_pack_md),
        "--limit",
        "10",
    ])

    run([
        "python3",
        str(scripts / "generate_outreach_execution_board.py"),
        "--input",
        str(day_queue_csv),
        "--output-csv",
        str(board_csv),
        "--output-md",
        str(board_md),
    ])

    run([
        "python3",
        str(scripts / "generate_followup_queue.py"),
        "--input",
        str(board_csv),
        "--date",
        run_date,
        "--output-csv",
        str(actions_csv),
        "--output-md",
        str(actions_md),
    ])

    print("\nPIPELINE_OK")
    print(f"Generated day queue: {day_queue_csv}")
    print(f"Generated send pack: {send_pack_md}")
    print(f"Generated execution board: {board_csv}")
    print(f"Generated action queue: {actions_csv}")


if __name__ == "__main__":
    main()
