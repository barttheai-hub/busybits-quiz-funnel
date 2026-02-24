#!/usr/bin/env bash
set -e

FROM="Ziga <barttheai@gmail.com>"

send_email() {
  local to="$1"
  local subject="$2"
  local body="$3"
  
  echo "Sending to $to..."
  
  cat <<EOF | himalaya message send
From: $FROM
To: $to
Subject: $subject
Content-Type: text/plain; charset=utf-8

$body
EOF
}

# 1. Apollo Neuro
send_email "partnerships@apolloneuro.com" "BusyBits x Apollo Neuro (pilot sponsor slot)" "Hey Apollo Neuro team —

I run BusyBits, a high-performance newsletter for founders/operators.

I think there’s a clean pilot sponsor fit around this angle: Stress switch for founders.
We can run a single-issue test with clear delivery timing and a concise sponsor block.

If useful, I can send the one-issue pilot details (placement + timing + rate) in one short message.

Open to a quick test?

— Ziga"

# 2. Eight Sleep
send_email "partnerships@eightsleep.com" "BusyBits x Eight Sleep (pilot sponsor slot)" "Hey Eight Sleep team —

I run BusyBits, a high-performance newsletter for founders/operators.

I think there’s a clean pilot sponsor fit around this angle: Super-user sleep ROI story.
We can run a single-issue test with clear delivery timing and a concise sponsor block.

If useful, I can send the one-issue pilot details (placement + timing + rate) in one short message.

Open to a quick test?

— Ziga"

# 3. Levels
send_email "partnerships@levelshealth.com" "BusyBits x Levels (pilot sponsor slot)" "Hey Levels team —

I run BusyBits, a high-performance newsletter for founders/operators.

I think there’s a clean pilot sponsor fit around this angle: Metabolic focus and afternoon crash.
We can run a single-issue test with clear delivery timing and a concise sponsor block.

If useful, I can send the one-issue pilot details (placement + timing + rate) in one short message.

Open to a quick test?

— Ziga"

# 4. Oura
send_email "partnerships@ouraring.com" "BusyBits x Oura (pilot sponsor slot)" "Hey Oura team —

I run BusyBits, a high-performance newsletter for founders/operators.

I think there’s a clean pilot sponsor fit around this angle: Gamified readiness + deep work planning.
We can run a single-issue test with clear delivery timing and a concise sponsor block.

If useful, I can send the one-issue pilot details (placement + timing + rate) in one short message.

Open to a quick test?

— Ziga"

# 5. Whoop
send_email "partnerships@whoop.com" "BusyBits x Whoop (pilot sponsor slot)" "Hey Whoop team —

I run BusyBits, a high-performance newsletter for founders/operators.

I think there’s a clean pilot sponsor fit around this angle: Sustainable output + burnout prevention.
We can run a single-issue test with clear delivery timing and a concise sponsor block.

If useful, I can send the one-issue pilot details (placement + timing + rate) in one short message.

Open to a quick test?

— Ziga"

echo "All emails sent successfully."
