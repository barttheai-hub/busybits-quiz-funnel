#!/usr/bin/env python3
"""Run BusyBits sponsor outreach pipeline end-to-end.

This orchestrates all existing queue/send/follow-up generators in one command,
and can also log progress directly to Mission Control.

Usage:
  python3 builds/busybits-newsletter/scripts/run_daily_outreach_pipeline.py
  python3 builds/busybits-newsletter/scripts/run_daily_outreach_pipeline.py --date 2026-02-24 --limit 15
  python3 builds/busybits-newsletter/scripts/run_daily_outreach_pipeline.py --log-progress
"""

from __future__ import annotations

import argparse
import subprocess
from pathlib import Path
from datetime import datetime


def run(cmd: list[str]) -> None:
    print("→", " ".join(cmd))
    subprocess.run(cmd, check=True)


def maybe_log_progress(root: Path, generated_files: list[Path], run_date: str, should_log: bool) -> None:
    if not should_log:
        return

    repo_root = Path(__file__).resolve().parents[3]
    logger = repo_root / "mission-control" / "scripts" / "log_progress.sh"

    if not logger.exists():
        print(f"⚠ Mission Control logger not found: {logger}")
        return

    changed = ", ".join(str(p.as_posix()) for p in generated_files)

    cmd = [
        str(logger),
        "--task",
        "BusyBits sponsor outreach daily pipeline",
        "--files",
        changed,
        "--what",
        f"Ran end-to-end queue→send-pack→execution-board→follow-up generation for {run_date}.",
        "--why",
        "Turns sponsor outreach prep into one repeatable command, cutting daily execution overhead and reducing dropped follow-ups.",
        "--next",
        "Send top queued outreach emails, then update tracker statuses after each send.",
        "--resource-title",
        f"BusyBits Sponsor Outreach Actions ({run_date})",
        "--resource-type",
        "doc",
        "--resource-url",
        f"file://{(root / f'sponsor_outreach_actions_{run_date}.md').resolve()}",
        "--task-status",
        "In Progress",
    ]

    run(cmd)


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--root", default="builds/busybits-newsletter")
    p.add_argument("--limit", type=int, default=15)
    p.add_argument("--date", help="YYYY-MM-DD for action queue output (default: today)")
    p.add_argument(
        "--log-progress",
        action="store_true",
        help="Log a progress note/task/resource to Mission Control after successful pipeline run.",
    )
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

    maybe_log_progress(
        root=root,
        generated_files=[day_queue_csv, day_queue_md, send_pack_md, board_csv, board_md, actions_csv, actions_md],
        run_date=run_date,
        should_log=args.log_progress,
    )

    print("\nPIPELINE_OK")
    print(f"Generated day queue: {day_queue_csv}")
    print(f"Generated send pack: {send_pack_md}")
    print(f"Generated execution board: {board_csv}")
    print(f"Generated action queue: {actions_csv}")


if __name__ == "__main__":
    main()
