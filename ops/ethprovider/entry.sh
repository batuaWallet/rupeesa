#!/bin/bash
set -e

if [[ -n "$MNEMONIC" ]]
then echo "Mnemonic provided via env var"
elif [[ -z "$MNEMONIC_FILE" ]]
then MNEMONIC="$(cat "$MNEMONIC_FILE")"
fi

address_book="${ADDRESS_BOOK:-/data/address-book.json}"
mnemonic="${MNEMONIC:-candy maple cake sugar pudding cream honey rich smooth crumble sweet treat}"

node /app/ganache-core.docker.cli.js \
  --data-dir=/tmp \
  --allowUnlimitedContractSize \
  --defaultBalanceEther=1000000000 \
  --gasLimit=50000000 \
  --host=0.0.0.0 \
  --mnemonic="$mnemonic" > /tmp/ganache.log &
pid=$!

sleep 2 # Give ganache a sec to wake up

cli="dist/src.ts/cli.js"
if [[ -f "$cli" ]]
then node $cli migrate --address-book "$address_book" --mnemonic "$mnemonic"
else echo "Not migrating, no CLI found at $cli"
fi

touch .migration-complete
wait $pid
