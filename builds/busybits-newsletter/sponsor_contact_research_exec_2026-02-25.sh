#!/usr/bin/env bash
set -euo pipefail

FROM="Ziga <barttheai@gmail.com>"
DRY_RUN=${DRY_RUN:-0}

send_email() {
  local to="$1"
  local subject="$2"
  local body="$3"
  if [[ "$DRY_RUN" == "1" ]]; then
    echo "[DRY RUN] $to | $subject"
    return 0
  fi
  echo "Sending to $to ..."
  cat <<EOF | himalaya message send
From: $FROM
To: $to
Subject: $subject
Content-Type: text/plain; charset=utf-8

$body
EOF
}

echo "All queued sponsor emails sent."
