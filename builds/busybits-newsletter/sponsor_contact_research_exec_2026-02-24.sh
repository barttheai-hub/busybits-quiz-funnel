#!/usr/bin/env bash
set -euo pipefail

FROM="Ziga <barttheai@gmail.com>"

send_email() {
  local to="$1"
  local subject="$2"
  local body="$3"
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
