#!/usr/bin/env bash
set -euo pipefail

FROM="Ziga <barttheai@gmail.com>"
DRY_RUN=${DRY_RUN:-0}

send_email() {
  local to="$1"
  local subject="$2"
  local body="$3"
  if [[ "$DRY_RUN" == "1" ]]; then
    echo "[DRY RUN] To: $to | Subject: $subject"
    echo "Body: $body"
    echo "---------------------------------------------------"
    return 0
  fi
  echo "Sending to $to ..."
  # Use template send to ensure headers are correctly formatted
  cat <<EOF | himalaya message send
From: $FROM
To: $to
Subject: $subject
Content-Type: text/plain; charset=utf-8

$body
EOF
}

# 1. Clay
send_email "partnerships@clay.earth" "BusyBits x Clay (pilot sponsor slot)" "Hey Clay team —

I run BusyBits, a high-performance newsletter for founders/operators.

I think there’s a clean pilot sponsor fit around this angle: Relationship leverage system.
If useful, I can send one short pilot option (placement + timing + rate).

Open to a quick test?

— Ziga"

# 2. Motion
send_email "partnerships@usemotion.com" "BusyBits x Motion (pilot sponsor slot)" "Hey Motion team —

I run BusyBits, a high-performance newsletter for founders/operators.

I think there’s a clean pilot sponsor fit around this angle: Calendar autopilot for focus.
If useful, I can send one short pilot option (placement + timing + rate).

Open to a quick test?

— Ziga"

# 3. Notion
send_email "partnerships@makenotion.com" "BusyBits x Notion (pilot sponsor slot)" "Hey Notion team —

I run BusyBits, a high-performance newsletter for founders/operators.

I think there’s a clean pilot sponsor fit around this angle: Operator knowledge OS.
If useful, I can send one short pilot option (placement + timing + rate).

Open to a quick test?

— Ziga"

# 4. Opal
send_email "partnerships@opal.so" "BusyBits x Opal (pilot sponsor slot)" "Hey Opal team —

I run BusyBits, a high-performance newsletter for founders/operators.

I think there’s a clean pilot sponsor fit around this angle: Attention defense for creators.
If useful, I can send one short pilot option (placement + timing + rate).

Open to a quick test?

— Ziga"

# 5. Readwise
send_email "partnerships@readwise.io" "BusyBits x Readwise (pilot sponsor slot)" "Hey Readwise team —

I run BusyBits, a high-performance newsletter for founders/operators.

I think there’s a clean pilot sponsor fit around this angle: Learning retention for founders.
If useful, I can send one short pilot option (placement + timing + rate).

Open to a quick test?

— Ziga"

# 6. Sunsama
send_email "partnerships@sunsama.com" "BusyBits x Sunsama (pilot sponsor slot)" "Hey Sunsama team —

I run BusyBits, a high-performance newsletter for founders/operators.

I think there’s a clean pilot sponsor fit around this angle: Daily planning for reduced burnout.
If useful, I can send one short pilot option (placement + timing + rate).

Open to a quick test?

— Ziga"

# 7. Superhuman
send_email "partnerships@superhuman.com" "BusyBits x Superhuman (pilot sponsor slot)" "Hey Superhuman team —

I run BusyBits, a high-performance newsletter for founders/operators.

I think there’s a clean pilot sponsor fit around this angle: Inbox throughput for founders.
If useful, I can send one short pilot option (placement + timing + rate).

Open to a quick test?

— Ziga"

# 8. TextExpander
send_email "partnerships@textexpander.com" "BusyBits x TextExpander (pilot sponsor slot)" "Hey TextExpander team —

I run BusyBits, a high-performance newsletter for founders/operators.

I think there’s a clean pilot sponsor fit around this angle: 10x communication throughput.
If useful, I can send one short pilot option (placement + timing + rate).

Open to a quick test?

— Ziga"

echo "All queued sponsor emails sent."
