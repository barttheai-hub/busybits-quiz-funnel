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
import json
import subprocess
from pathlib import Path
from datetime import datetime


def run(cmd: list[str]) -> None:
    print("→", " ".join(cmd))
    subprocess.run(cmd, check=True)


def count_script_emails(path: Path) -> int:
    if not path.exists():
        return 0
    count = 0
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.strip().startswith("send_email "):
            count += 1
    return count


def should_skip_unchanged(state_file: Path, tracker: Path, run_date: str, limit: int) -> bool:
    if not state_file.exists() or not tracker.exists():
        return False
    try:
        state = json.loads(state_file.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return False

    prev_tracker_mtime_ns = int(state.get("tracker_mtime_ns", 0))
    prev_run_date = state.get("run_date")
    prev_limit = int(state.get("limit", -1))
    current_mtime_ns = tracker.stat().st_mtime_ns

    return (
        prev_tracker_mtime_ns == current_mtime_ns
        and prev_run_date == run_date
        and prev_limit == limit
    )


def write_state(state_file: Path, tracker: Path, run_date: str, limit: int) -> None:
    payload = {
        "tracker_mtime_ns": tracker.stat().st_mtime_ns if tracker.exists() else 0,
        "run_date": run_date,
        "limit": limit,
        "updated_at": datetime.now().isoformat(timespec="seconds"),
    }
    state_file.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def write_combined_send_runner(
    run_date: str,
    send_now_script: Path,
    followup_due_script: Path,
    contact_research_script: Path,
    output_script: Path,
    output_md: Path,
) -> None:
    send_now_count = count_script_emails(send_now_script)
    followup_count = count_script_emails(followup_due_script)
    contact_research_count = count_script_emails(contact_research_script)
    total = send_now_count + followup_count + contact_research_count

    script_lines = [
        "#!/usr/bin/env bash",
        "set -euo pipefail",
        "",
        f"echo \"BusyBits combined sponsor send run — {run_date}\"",
        f"echo \"Queued emails: send-now={send_now_count}, follow-up-due={followup_count}, contact-research={contact_research_count}, total={total}\"",
        "",
    ]

    if send_now_count > 0:
        script_lines.extend([
            f"echo \"[1/3] Sending send-now batch ({send_now_count})\"",
            f"bash {send_now_script.as_posix()}",
            "",
        ])
    else:
        script_lines.append('echo "[1/3] Send-now batch empty — skipping."')
        script_lines.append("")

    if followup_count > 0:
        script_lines.extend([
            f"echo \"[2/3] Sending follow-up due batch ({followup_count})\"",
            f"bash {followup_due_script.as_posix()}",
            "",
        ])
    else:
        script_lines.append('echo "[2/3] Follow-up due batch empty — skipping."')
        script_lines.append("")

    if contact_research_count > 0:
        script_lines.extend([
            f"echo \"[3/3] Sending contact-research batch ({contact_research_count})\"",
            f"bash {contact_research_script.as_posix()}",
            "",
        ])
    else:
        script_lines.append('echo "[3/3] Contact-research batch empty — skipping."')
        script_lines.append("")

    script_lines.append('echo "Combined sponsor send run complete."')
    output_script.write_text("\n".join(script_lines) + "\n", encoding="utf-8")
    output_script.chmod(0o755)

    md_lines = [
        "# Sponsor Combined Send Runbook",
        "",
        f"Date: **{run_date}**",
        f"Total queued emails: **{total}**",
        f"- Send-now: **{send_now_count}**",
        f"- Follow-up due: **{followup_count}**",
        f"- Contact-research: **{contact_research_count}**",
        "",
        "## Execution",
        "```bash",
        f"bash {output_script.as_posix()}",
        "```",
        "",
        "This runs all generated send scripts in order (send-now, follow-up-due, contact-research) and skips empty batches automatically.",
    ]
    output_md.write_text("\n".join(md_lines) + "\n", encoding="utf-8")


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
    p.add_argument(
        "--skip-if-unchanged",
        action="store_true",
        help="Skip regeneration when tracker mtime + run-date + limit are unchanged from last run.",
    )
    args = p.parse_args()

    root = Path(args.root)
    scripts = root / "scripts"
    run_date = args.date or datetime.now().strftime("%Y-%m-%d")

    tracker = root / "sponsorship_outreach_tracker.csv"
    state_file = root / ".daily_outreach_pipeline_state.json"
    deduped_tracker = root / "sponsorship_outreach_tracker_deduped.csv"
    dedupe_report_csv = root / f"sponsor_tracker_dedupe_report_{run_date}.csv"
    dedupe_report_md = root / f"sponsor_tracker_dedupe_report_{run_date}.md"
    day_queue_csv = root / "sponsor_outreach_day_queue.csv"
    day_queue_md = root / "sponsor_outreach_day_queue.md"
    send_pack_md = root / "sponsor_outreach_send_pack.md"
    board_csv = root / "sponsor_outreach_execution_board.csv"
    board_md = root / "sponsor_outreach_execution_board.md"
    actions_csv = root / f"sponsor_outreach_actions_{run_date}.csv"
    actions_md = root / f"sponsor_outreach_actions_{run_date}.md"
    contact_gap_csv = root / "sponsor_contact_gap_queue.csv"
    contact_gap_md = root / "sponsor_contact_gap_queue.md"
    contact_candidates_csv = root / f"sponsor_contact_candidates_{run_date}.csv"
    contact_candidates_md = root / f"sponsor_contact_candidates_{run_date}.md"
    send_now_csv = root / f"sponsor_send_now_batch_{run_date}.csv"
    send_now_md = root / f"sponsor_send_now_batch_{run_date}.md"
    send_now_copy_csv = root / f"sponsor_send_now_copy_batch_{run_date}.csv"
    send_now_copy_md = root / f"sponsor_send_now_copy_batch_{run_date}.md"
    followup_calendar_csv = root / f"sponsor_followup_calendar_{run_date}.csv"
    followup_calendar_md = root / f"sponsor_followup_calendar_{run_date}.md"
    followup_due_csv = root / f"sponsor_followup_due_batch_{run_date}.csv"
    followup_due_md = root / f"sponsor_followup_due_batch_{run_date}.md"
    followup_upcoming_csv = root / f"sponsor_followup_upcoming_batch_{run_date}.csv"
    followup_upcoming_md = root / f"sponsor_followup_upcoming_copy_batch_{run_date}.md"
    followup_due_copy_csv = root / f"sponsor_followup_due_copy_batch_{run_date}.csv"
    followup_due_copy_md = root / f"sponsor_followup_due_copy_batch_{run_date}.md"
    followup_copy_csv = root / f"sponsor_followup_copy_batch_{run_date}.csv"
    followup_copy_md = root / f"sponsor_followup_copy_batch_{run_date}.md"
    send_now_exec_sh = root / f"sponsor_send_now_exec_{run_date}.sh"
    send_now_exec_md = root / f"sponsor_send_now_exec_{run_date}.md"
    followup_due_exec_sh = root / f"sponsor_followup_due_exec_{run_date}.sh"
    followup_due_exec_md = root / f"sponsor_followup_due_exec_{run_date}.md"
    contact_research_exec_sh = root / f"sponsor_contact_research_exec_{run_date}.sh"
    contact_research_exec_md = root / f"sponsor_contact_research_exec_{run_date}.md"
    send_all_exec_sh = root / f"sponsor_send_all_exec_{run_date}.sh"
    send_all_exec_md = root / f"sponsor_send_all_exec_{run_date}.md"
    tonight_plan_md = root / f"sponsor_tonight_send_plan_{run_date}.md"
    tonight_fill_csv = root / f"sponsor_tonight_contact_fill_{run_date}.csv"
    kpi_md = root / "sponsor_outreach_kpi_snapshot.md"
    kpi_json = root / "sponsor_outreach_kpi_snapshot.json"
    operator_brief_md = root / f"sponsor_operator_brief_{run_date}.md"
    contact_sprint_csv = root / f"sponsor_contact_research_sprint_{run_date}.csv"
    contact_sprint_md = root / f"sponsor_contact_research_sprint_{run_date}.md"
    contact_sprint_copy_csv = root / f"sponsor_contact_research_copy_batch_{run_date}.csv"
    contact_sprint_copy_md = root / f"sponsor_contact_research_copy_batch_{run_date}.md"

    if args.skip_if_unchanged and should_skip_unchanged(state_file, tracker, run_date, args.limit):
        print("PIPELINE_SKIPPED")
        print("No changes detected in sponsorship_outreach_tracker.csv for current run date/limit.")
        return

    run([
        "python3",
        str(scripts / "dedupe_sponsor_tracker.py"),
        "--input",
        str(tracker),
        "--output",
        str(deduped_tracker),
        "--report-csv",
        str(dedupe_report_csv),
        "--report-md",
        str(dedupe_report_md),
    ])

    run([
        "python3",
        str(scripts / "generate_daily_outreach_queue.py"),
        "--input",
        str(deduped_tracker),
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

    run([
        "python3",
        str(scripts / "generate_contact_gap_queue.py"),
        "--input",
        str(board_csv),
        "--output-csv",
        str(contact_gap_csv),
        "--output-md",
        str(contact_gap_md),
        "--limit",
        str(args.limit),
    ])

    run([
        "python3",
        str(scripts / "generate_contact_candidates.py"),
        "--tracker",
        str(deduped_tracker),
        "--date",
        run_date,
        "--out-dir",
        str(root),
    ])

    run([
        "python3",
        str(scripts / "generate_contact_research_sprint.py"),
        "--actions",
        str(actions_csv),
        "--candidates",
        str(contact_candidates_csv),
        "--date",
        run_date,
        "--days",
        "2",
        "--limit",
        str(args.limit),
        "--output-csv",
        str(contact_sprint_csv),
        "--output-md",
        str(contact_sprint_md),
    ])

    run([
        "python3",
        str(scripts / "generate_contact_research_copy_batch.py"),
        "--input",
        str(contact_sprint_csv),
        "--output-csv",
        str(contact_sprint_copy_csv),
        "--output-md",
        str(contact_sprint_copy_md),
    ])

    run([
        "python3",
        str(scripts / "generate_send_now_batch.py"),
        "--actions",
        str(actions_csv),
        "--output-csv",
        str(send_now_csv),
        "--output-md",
        str(send_now_md),
    ])

    run([
        "python3",
        str(scripts / "generate_send_now_copy_batch.py"),
        "--send-now",
        str(send_now_csv),
        "--output-csv",
        str(send_now_copy_csv),
        "--output-md",
        str(send_now_copy_md),
    ])

    run([
        "python3",
        str(scripts / "generate_followup_calendar.py"),
        "--tracker",
        str(deduped_tracker),
        "--date",
        run_date,
        "--days",
        "10",
        "--output-csv",
        str(followup_calendar_csv),
        "--output-md",
        str(followup_calendar_md),
    ])

    run([
        "python3",
        str(scripts / "generate_followup_due_batch.py"),
        "--calendar",
        str(followup_calendar_csv),
        "--date",
        run_date,
        "--output-csv",
        str(followup_due_csv),
        "--output-md",
        str(followup_due_md),
    ])

    run([
        "python3",
        str(scripts / "generate_sponsor_upcoming_followups.py"),
        "--tracker",
        str(deduped_tracker),
        "--anchor-date",
        run_date,
        "--horizon-days",
        "3",
        "--out-dir",
        str(root),
    ])

    run([
        "python3",
        str(scripts / "generate_followup_copy_batch.py"),
        "--input",
        str(followup_due_csv),
        "--output-csv",
        str(followup_due_copy_csv),
        "--output-md",
        str(followup_due_copy_md),
    ])

    run([
        "python3",
        str(scripts / "generate_followup_copy_batch.py"),
        "--input",
        str(followup_upcoming_csv),
        "--output-csv",
        str(followup_copy_csv),
        "--output-md",
        str(followup_copy_md),
    ])

    run([
        "python3",
        str(scripts / "generate_send_execution_script.py"),
        "--input",
        str(send_now_copy_csv),
        "--output-script",
        str(send_now_exec_sh),
        "--output-md",
        str(send_now_exec_md),
    ])

    run([
        "python3",
        str(scripts / "generate_send_execution_script.py"),
        "--input",
        str(followup_due_copy_csv),
        "--output-script",
        str(followup_due_exec_sh),
        "--output-md",
        str(followup_due_exec_md),
    ])

    run([
        "python3",
        str(scripts / "generate_send_execution_script.py"),
        "--input",
        str(contact_sprint_copy_csv),
        "--output-script",
        str(contact_research_exec_sh),
        "--output-md",
        str(contact_research_exec_md),
    ])

    write_combined_send_runner(
        run_date=run_date,
        send_now_script=send_now_exec_sh,
        followup_due_script=followup_due_exec_sh,
        contact_research_script=contact_research_exec_sh,
        output_script=send_all_exec_sh,
        output_md=send_all_exec_md,
    )

    run([
        "python3",
        str(scripts / "generate_tonight_send_plan.py"),
        "--date",
        run_date,
        "--limit",
        str(args.limit),
        "--out",
        str(tonight_plan_md),
        "--csv-out",
        str(tonight_fill_csv),
    ])

    run([
        "python3",
        str(scripts / "generate_outreach_kpi_snapshot.py"),
        "--tracker",
        str(deduped_tracker),
        "--actions",
        str(actions_csv),
        "--board",
        str(board_csv),
        "--output-md",
        str(kpi_md),
        "--output-json",
        str(kpi_json),
    ])

    run([
        "python3",
        str(scripts / "generate_daily_operator_brief.py"),
        "--kpi-json",
        str(kpi_json),
        "--actions-csv",
        str(actions_csv),
        "--contact-gap-csv",
        str(contact_gap_csv),
        "--date",
        run_date,
        "--output",
        str(operator_brief_md),
    ])

    write_state(state_file, tracker, run_date, args.limit)

    maybe_log_progress(
        root=root,
        generated_files=[
            deduped_tracker,
            dedupe_report_csv,
            dedupe_report_md,
            day_queue_csv,
            day_queue_md,
            send_pack_md,
            board_csv,
            board_md,
            actions_csv,
            actions_md,
            contact_gap_csv,
            contact_gap_md,
            contact_candidates_csv,
            contact_candidates_md,
            contact_sprint_csv,
            contact_sprint_md,
            contact_sprint_copy_csv,
            contact_sprint_copy_md,
            send_now_csv,
            send_now_md,
            send_now_copy_csv,
            send_now_copy_md,
            followup_calendar_csv,
            followup_calendar_md,
            followup_due_csv,
            followup_due_md,
            followup_upcoming_csv,
            followup_upcoming_md,
            followup_due_copy_csv,
            followup_due_copy_md,
            followup_copy_csv,
            followup_copy_md,
            send_now_exec_sh,
            send_now_exec_md,
            followup_due_exec_sh,
            followup_due_exec_md,
            contact_research_exec_sh,
            contact_research_exec_md,
            send_all_exec_sh,
            send_all_exec_md,
            tonight_plan_md,
            tonight_fill_csv,
            kpi_md,
            kpi_json,
            operator_brief_md,
            state_file,
        ],
        run_date=run_date,
        should_log=args.log_progress,
    )

    print("\nPIPELINE_OK")
    print(f"Generated day queue: {day_queue_csv}")
    print(f"Generated send pack: {send_pack_md}")
    print(f"Generated execution board: {board_csv}")
    print(f"Generated action queue: {actions_csv}")
    print(f"Generated contact gap queue: {contact_gap_csv}")
    print(f"Generated contact candidates: {contact_candidates_csv}")
    print(f"Generated contact research sprint: {contact_sprint_csv}")
    print(f"Generated contact research copy batch: {contact_sprint_copy_csv}")
    print(f"Generated send-now batch: {send_now_csv}")
    print(f"Generated send-now copy batch: {send_now_copy_csv}")
    print(f"Generated follow-up calendar: {followup_calendar_csv}")
    print(f"Generated follow-up due batch: {followup_due_csv}")
    print(f"Generated follow-up upcoming batch: {followup_upcoming_csv}")
    print(f"Generated follow-up due copy batch: {followup_due_copy_csv}")
    print(f"Generated follow-up copy batch: {followup_copy_csv}")
    print(f"Generated send-now execution script: {send_now_exec_sh}")
    print(f"Generated follow-up due execution script: {followup_due_exec_sh}")
    print(f"Generated contact-research execution script: {contact_research_exec_sh}")
    print(f"Generated combined execution script: {send_all_exec_sh}")
    print(f"Generated tonight send plan: {tonight_plan_md}")
    print(f"Generated tonight contact fill sheet: {tonight_fill_csv}")
    print(f"Generated KPI snapshot: {kpi_md}")
    print(f"Generated operator brief: {operator_brief_md}")


if __name__ == "__main__":
    main()
