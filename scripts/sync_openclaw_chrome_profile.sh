#!/usr/bin/env bash
set -euo pipefail

SRC_DIR="${1:-$HOME/Library/Application Support/Google/Chrome}"
DST_DIR="${2:-$HOME/.openclaw/browser/openclaw/user-data}"
BACKUP_DIR="${DST_DIR}.bak.$(date +%s)"

log() { printf "[sync-openclaw] %s\n" "$*"; }
err() { printf "[sync-openclaw][error] %s\n" "$*" >&2; }

if [[ ! -d "$SRC_DIR" ]]; then
  err "Source Chrome profile not found: $SRC_DIR"
  exit 1
fi

if pgrep -x "Google Chrome" >/dev/null 2>&1; then
  err "Google Chrome is running. Quit Chrome first, then rerun."
  exit 1
fi

if pgrep -f "openclaw.*browser|openclaw browser|Chrome.*openclaw" >/dev/null 2>&1; then
  log "Detected possible OpenClaw browser process. Continuing (copy is still safe if profile dir is idle)."
fi

log "Source: $SRC_DIR"
log "Destination: $DST_DIR"

mkdir -p "$(dirname "$DST_DIR")"

if [[ -d "$DST_DIR" ]]; then
  log "Backing up existing destination to: $BACKUP_DIR"
  mv "$DST_DIR" "$BACKUP_DIR"
fi

log "Syncing profile with rsync..."
rsync -a --delete "$SRC_DIR/" "$DST_DIR/"

log "Removing copied lock/singleton files..."
find "$DST_DIR" -name "Singleton*" -delete 2>/dev/null || true
find "$DST_DIR" -name "*.lock" -delete 2>/dev/null || true

log "Done."
log "Next: restart gateway + start managed browser"
log "  openclaw gateway restart"
log "  openclaw browser --browser-profile openclaw start"
log "Verify:"
log "  openclaw browser --browser-profile openclaw status"
