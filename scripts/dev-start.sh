#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
STATE="$ROOT/.dev-run"
mkdir -p "$STATE"

if [[ ! -f .env ]]; then echo 'Missing .env in the project root.' >&2; exit 1; fi
if [[ ! -f compose.dev.yaml ]]; then echo 'Missing compose.dev.yaml in project root.' >&2; exit 1; fi
if ! docker info >/dev/null 2>&1; then echo 'Start Docker Desktop first.' >&2; exit 1; fi
for command in mvn npm curl ollama; do
  if ! command -v "$command" >/dev/null 2>&1; then echo "Missing required command: $command" >&2; exit 1; fi
done

# Only accept simple KEY=VALUE local dev entries, never execute the .env file.
get_env() {
  local key="$1" fallback="$2" value
  value="$(grep -E "^${key}=" .env | tail -n 1 | cut -d= -f2- || true)"
  value="${value%$'\r'}"
  printf '%s' "${value:-$fallback}"
}
export DB_NAME="$(get_env DB_NAME student_ai)"
export DB_USER="$(get_env DB_USER student_ai)"
export DB_PASSWORD="$(get_env DB_PASSWORD '')"
export OLLAMA_MODEL="$(get_env OLLAMA_MODEL llama3.1:8b)"
if [[ -z "$DB_PASSWORD" ]]; then echo 'DB_PASSWORD is missing in .env' >&2; exit 1; fi
export DB_URL="jdbc:postgresql://localhost:5432/${DB_NAME}"
export OLLAMA_BASE_URL="http://localhost:11434"

# Stop rather than accidentally replacing another server on our ports.
if lsof -nP -iTCP:8080 -sTCP:LISTEN 2>/dev/null | grep -q LISTEN; then
  echo 'Port 8080 is already in use. Stop the existing backend first.' >&2; exit 1
fi
if lsof -nP -iTCP:5173 -sTCP:LISTEN 2>/dev/null | grep -q LISTEN; then
  echo 'Port 5173 is already in use. Stop the existing frontend first.' >&2; exit 1
fi

# Ensure the Dockerized app is not running (it would claim port 8080).
if [[ "$(docker compose ps --status running --services 2>/dev/null | grep -cx app || true)" != "0" ]]; then
  echo 'Docker app service is running. Stop it with: docker compose stop app' >&2; exit 1
fi

echo 'Starting PostgreSQL...'
docker compose -f compose.yaml -f compose.dev.yaml up -d --wait db

if ! curl -fsS --max-time 3 http://localhost:11434/api/tags >/dev/null 2>&1; then
  echo 'Starting native Ollama...'
  nohup ollama serve > "$STATE/ollama.log" 2>&1 < /dev/null &
  echo $! > "$STATE/ollama.pid"
  for _ in {1..30}; do
    if curl -fsS --max-time 2 http://localhost:11434/api/tags >/dev/null 2>&1; then break; fi
    sleep 1
  done
fi
if ! curl -fsS --max-time 3 http://localhost:11434/api/tags >/dev/null; then
  echo "Ollama didn't start. See $STATE/ollama.log" >&2; exit 1
fi
if ! ollama show "$OLLAMA_MODEL" >/dev/null 2>&1; then
  echo "Downloading Ollama model: $OLLAMA_MODEL"
  ollama pull "$OLLAMA_MODEL"
fi

# Match the starter's Java target, even if Maven was previously using Java 25.
if [[ -x /usr/libexec/java_home ]]; then
  JAVA17="$(/usr/libexec/java_home -v 17 2>/dev/null || true)"
  if [[ -n "$JAVA17" ]]; then export JAVA_HOME="$JAVA17"; export PATH="$JAVA_HOME/bin:$PATH"; fi
fi

echo 'Starting Spring Boot...'
(cd "$ROOT/backend" && exec mvn spring-boot:run) > "$STATE/backend.log" 2>&1 < /dev/null &
echo $! > "$STATE/backend.pid"

if [[ ! -d frontend/node_modules ]]; then
  echo 'Installing frontend dependencies...'
  (cd frontend && npm install)
fi

echo 'Starting React/Vite...'
(cd "$ROOT/frontend" && exec npm run dev -- --host 127.0.0.1 --port 5173 --strictPort) > "$STATE/frontend.log" 2>&1 < /dev/null &
echo $! > "$STATE/frontend.pid"

printf '\nServices starting. URLs:\n  React:        http://localhost:5173\n  Spring Boot:  http://localhost:8080\n  Ollama:       http://localhost:11434\n'
printf 'Logs: .dev-run/backend.log and .dev-run/frontend.log\n'
printf 'Stop with: ./scripts/dev-stop.sh\n'
