#!/usr/bin/env python3
"""Generate a send-ready Himalaya shell script from outreach copy CSV.

Input CSV should include:
  company, contact_email, subject, email_body

Outputs:
  - bash script with one send_email call per row
  - markdown runbook summary for operators
"""

from __future__ import annotations

import argparse
import csv
from pathlib import Path


def esc_double_quotes(value: str) -> str:
    return value.replace('\\', '\\\\').replace('"', '\\"')


def make_bash_string(value: str) -> str:
    return f'"{esc_double_quotes(value)}"'


def load_rows(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        required = {"company", "contact_email", "subject", "email_body"}
        missing = required - set(reader.fieldnames or [])
        if missing:
            raise SystemExit(f"Missing required columns in {path}: {', '.join(sorted(missing))}")
        rows = [r for r in reader if (r.get("contact_email") or "").strip()]
    return rows


def write_script(rows: list[dict[str, str]], output: Path, from_identity: str) -> None:
    lines: list[str] = []
    lines.append("#!/usr/bin/env bash")
    lines.append("set -euo pipefail")
    lines.append("")
    lines.append(f"FROM={make_bash_string(from_identity)}")
    lines.append("")
    lines.append("send_email() {")
    lines.append("  local to=\"$1\"")
    lines.append("  local subject=\"$2\"")
    lines.append("  local body=\"$3\"")
    lines.append("  echo \"Sending to $to ...\"")
    lines.append("  cat <<EOF | himalaya message send")
    lines.append("From: $FROM")
    lines.append("To: $to")
    lines.append("Subject: $subject")
    lines.append("Content-Type: text/plain; charset=utf-8")
    lines.append("")
    lines.append("$body")
    lines.append("EOF")
    lines.append("}")
    lines.append("")

    for i, row in enumerate(rows, start=1):
        company = (row.get("company") or "Unknown").strip()
        to = (row.get("contact_email") or "").strip()
        subject = (row.get("subject") or "").strip()
        body = (row.get("email_body") or "").strip()

        if not to or not subject or not body:
            continue

        lines.append(f"# {i}. {company}")
        lines.append(f"send_email {make_bash_string(to)} {make_bash_string(subject)} {make_bash_string(body)}")
        lines.append("")

    lines.append("echo \"All queued sponsor emails sent.\"")
    output.write_text("\n".join(lines) + "\n", encoding="utf-8")
    output.chmod(0o755)


def write_runbook(rows: list[dict[str, str]], output: Path, script_path: Path) -> None:
    lines = [
        "# Sponsor Send Execution Runbook",
        "",
        f"Generated script: `{script_path.as_posix()}`",
        f"Queued emails: **{len(rows)}**",
        "",
        "## Companies in this run",
    ]

    if rows:
        for row in rows:
            company = (row.get("company") or "Unknown").strip()
            email = (row.get("contact_email") or "").strip()
            subject = (row.get("subject") or "").strip()
            lines.append(f"- **{company}** — {email} — _{subject}_")
    else:
        lines.append("- No send-ready rows with contact_email found.")

    lines.extend(
        [
            "",
            "## Execute",
            "```bash",
            f"bash {script_path.as_posix()}",
            "```",
        ]
    )

    output.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, help="CSV input (send-now or followup copy batch).")
    parser.add_argument("--output-script", required=True)
    parser.add_argument("--output-md", required=True)
    parser.add_argument("--from", dest="from_identity", default="Ziga <barttheai@gmail.com>")
    args = parser.parse_args()

    rows = load_rows(Path(args.input))
    script_path = Path(args.output_script)
    md_path = Path(args.output_md)

    write_script(rows, script_path, args.from_identity)
    write_runbook(rows, md_path, script_path)

    print(f"Generated script: {script_path}")
    print(f"Generated runbook: {md_path}")
    print(f"Queued rows: {len(rows)}")


if __name__ == "__main__":
    main()
