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

# 1. AG1
send_email "Lisa Hassig <partnerships@ag1.com>" "Partnership idea — BusyBits x AG1" "Hi Lisa,

I run BusyBits, a fitness/performance newsletter with an engaged audience of builders and operators. I think a AG1 sponsorship slot could be a strong fit.

If useful, I can send a short audience + pricing snapshot and 2 suggested integration angles.

Best,
Ziga"

# 2. Joovv
send_email "Wesley Pfiffner <partnerships@joovv.com>" "Partnership idea — BusyBits x Joovv" "Hi Wesley,

I run BusyBits, a fitness/performance newsletter with an engaged audience of builders and operators. I think a Joovv sponsorship slot could be a strong fit.

If useful, I can send a short audience + pricing snapshot and 2 suggested integration angles.

Best,
Ziga"

# 3. LMNT
send_email "Sarah Halejian <partnerships@lmnt.com>" "Partnership idea — BusyBits x LMNT" "Hi Sarah,

I run BusyBits, a fitness/performance newsletter with an engaged audience of builders and operators. I think a LMNT sponsorship slot could be a strong fit.

If useful, I can send a short audience + pricing snapshot and 2 suggested integration angles.

Best,
Ziga"

# 4. Plunge
send_email "Ryan Duey <partnerships@plunge.com>" "Partnership idea — BusyBits x Plunge" "Hi Ryan,

I run BusyBits, a fitness/performance newsletter with an engaged audience of builders and operators. I think a Plunge sponsorship slot could be a strong fit.

If useful, I can send a short audience + pricing snapshot and 2 suggested integration angles.

Best,
Ziga"

# 5. SaunaSpace
send_email "Alexa Swenson <partnerships@saunaspace.com>" "Partnership idea — BusyBits x SaunaSpace" "Hi Alexa,

I run BusyBits, a fitness/performance newsletter with an engaged audience of builders and operators. I think a SaunaSpace sponsorship slot could be a strong fit.

If useful, I can send a short audience + pricing snapshot and 2 suggested integration angles.

Best,
Ziga"

echo "All queued sponsor emails sent."
