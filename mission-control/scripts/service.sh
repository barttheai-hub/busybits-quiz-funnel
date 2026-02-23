#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PID_FILE="$ROOT_DIR/.mission-control.pid"
LOG_FILE="$ROOT_DIR/.mission-control.log"

is_running() {
  if [[ -f "$PID_FILE" ]]; then
    local pid
    pid="$(cat "$PID_FILE" 2>/dev/null || true)"
    if [[ -n "${pid}" ]] && kill -0 "$pid" 2>/dev/null; then
      return 0
    fi
  fi
  return 1
}

start_service() {
  if is_running; then
    echo "Mission Control already running (pid $(cat "$PID_FILE"))."
    return 0
  fi

  cd "$ROOT_DIR"
  nohup node src/server.js >>"$LOG_FILE" 2>&1 &
  local pid=$!
  echo "$pid" > "$PID_FILE"
  sleep 1

  if kill -0 "$pid" 2>/dev/null; then
    echo "Mission Control started (pid $pid)."
    echo "Logs: $LOG_FILE"
  else
    echo "Failed to start Mission Control. Check logs: $LOG_FILE"
    rm -f "$PID_FILE"
    exit 1
  fi
}

stop_service() {
  if ! is_running; then
    echo "Mission Control is not running."
    rm -f "$PID_FILE"
    return 0
  fi

  local pid
  pid="$(cat "$PID_FILE")"
  kill "$pid" 2>/dev/null || true
  sleep 1

  if kill -0 "$pid" 2>/dev/null; then
    kill -9 "$pid" 2>/dev/null || true
  fi

  rm -f "$PID_FILE"
  echo "Mission Control stopped."
}

status_service() {
  if is_running; then
    echo "RUNNING (pid $(cat "$PID_FILE"))"
  else
    echo "STOPPED"
  fi
}

case "${1:-}" in
  start) start_service ;;
  stop) stop_service ;;
  restart) stop_service; start_service ;;
  status) status_service ;;
  *)
    echo "Usage: bash scripts/service.sh {start|stop|restart|status}"
    exit 1
    ;;
esac
