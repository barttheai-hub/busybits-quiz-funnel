#!/usr/bin/env bash
set -euo pipefail

echo "BusyBits combined sponsor send run — 2026-02-26"
echo "Queued emails: send-now=8, follow-up-due=0, contact-research=0, total=8"

echo "[1/3] Sending send-now batch (8)"
bash builds/busybits-newsletter/sponsor_send_now_exec_2026-02-26.sh

echo "[2/3] Follow-up due batch empty — skipping."

echo "[3/3] Contact-research batch empty — skipping."

echo "Combined sponsor send run complete."
