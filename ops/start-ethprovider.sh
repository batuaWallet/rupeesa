#!/usr/bin/env bash
set -eu

root="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." >/dev/null 2>&1 && pwd )"
project="$(grep '"name":' "$root/package.json" | head -n 1 | cut -d '"' -f 4 | tr '-' '_')"

# make sure a network for this project has been created
docker swarm init 2> /dev/null || true
docker network create --attachable --driver overlay "$project" 2> /dev/null || true

image="${project}_ethprovider:latest"

# Add this to trigger migration at startup
#  --mount "type=bind,source=$root,target=/root" \

docker run \
  --detach \
  --env "MNEMONIC=candy maple cake sugar pudding cream honey rich smooth crumble sweet treat" \
  --env "ADDRESS_BOOK=/data/address-book.json" \
  --name "${project}_ethprovider" \
  --mount "type=bind,source=$root/address-book.json,target=/data/address-book.json" \
  --network "$project" \
  --publish "8545:8545" \
  --rm \
  --tmpfs "/tmp" \
  "$image"
