#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
STATE="$ROOT/.dev-run"

# Stop only processes tracked by dev-start.sh. Walk Maven/npm child processes first.
stop_tree() {
  local pid="$1" child
  [[ "$pid" =~ ^[0-9]+$ ]] || return 0
  if ! kill -0 "$pid" 2>/dev/null; then return 0; fi
  while read -r child; do
    [[ -z "$child" ]] || stop_tree "$child"
  done < <(pgrep -P "$pid" 2>/dev/null || true)
  kill "$pid" 2>/dev/null || true
}
for name in frontend backend ollama; do
  pid_file="$STATE/$name.pid"
  if [[ -f "$pid_file" ]]; then
    pid="$(cat "$pid_file")"
    echo "Stopping $name (PID $pid)..."
    stop_tree "$pid"
    rm -f "$pid_file"
  fi
done

echo 'Stopping development PostgreSQL container (database volume is kept)...'
docker compose -f compose.yaml -f compose.dev.yaml stop db
printf '\nLocal development services stopped. Database data and downloaded Llama models are preserved.\n'
