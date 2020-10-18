#!/bin/bash
set -e

echo "Starting chainlink in env:"
env

if [[ -z "$DATABASE_URL" ]]
then echo "A DATABASE_URL env var is required" && exit 1
fi

PG_HOST="${DATABASE_URL#*@}"
PG_HOST="${PG_HOST%/*}"

echo "Waiting for database at $PG_HOST to wake up.."
wait-for -q -t 60 "$PG_HOST" 2>&1 | sed '/nc: bad address/d'
echo "Database is awake, launching chainlink node.."

echo "${API_USER:-user@example.com}" > .api
echo "${API_PASSWORD:-password}" >> .api

echo "${WALLET_PASSWORD:-super secret password}" > .password

exec chainlink local node -a .api -p .password
