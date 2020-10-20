#!/usr/bin/env bash
set -eu

root="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." >/dev/null 2>&1 && pwd )"
project="$(grep -m 1 '"name":' "$root/package.json" | cut -d '"' -f 4 | tr '-' '_')"

# make sure a network for this project has been created
docker swarm init 2> /dev/null || true
docker network create --attachable --driver overlay "$project" 2> /dev/null || true

name="${project}_ethprovider"

if grep -qs "$name" <<<"$(docker container ls)"
then echo "$name is already running" && exit
else echo "Launching $name"
fi

image="${project}_ethprovider:latest"

flag="$root/.migration-complete"
rm -rf "$flag"

# Mount repo into ethprovider:/root to trigger migration at startup
docker run \
  --detach \
  --env "ADDRESS_BOOK=/data/address-book.json" \
  --env "MNEMONIC=candy maple cake sugar pudding cream honey rich smooth crumble sweet treat" \
  --mount "type=bind,source=$root,target=/root" \
  --mount "type=bind,source=$root/address-book.json,target=/data/address-book.json" \
  --name "$name" \
  --network "$project" \
  --publish "8545:8545" \
  --rm \
  --tmpfs "/tmp" \
  "$image"

while [[ ! -f "$flag" ]]
do
  if grep -qs "$name" <<<"$(docker container ls)"
  then sleep 1
  else echo "Ethprovider failed to start up" && exit 1
  fi
done
