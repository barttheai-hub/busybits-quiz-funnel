#!/usr/bin/env bash
set -euo pipefail

echo "BusyBits combined sponsor send run — 2026-02-25"
echo "Queued emails: send-now=5, follow-up-due=0, contact-research=0, total=5"

echo "[1/3] Sending send-now batch (5)"
bash builds/busybits-newsletter/sponsor_send_now_exec_2026-02-25.sh

echo "[2/3] Follow-up due batch empty — skipping."

echo "[3/3] Contact-research batch empty — skipping."

echo "Combined sponsor send run complete."
