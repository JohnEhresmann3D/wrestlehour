#!/usr/bin/env sh
set -eu
PORT="${PORT:-8080}"
printf 'WrestleHour V1: http://localhost:%s\n' "$PORT"
python3 -m http.server "$PORT"
