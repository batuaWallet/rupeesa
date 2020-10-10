#!/usr/bin/env bash
set -eu

root="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." >/dev/null 2>&1 && pwd )"
project="`cat $root/package.json | grep '"name":' | head -n 1 | cut -d '"' -f 4 | tr '-' '_'`"

# make sure a network for this project has been created
docker swarm init 2> /dev/null || true
docker network create --attachable --driver overlay $project 2> /dev/null || true

image="trufflesuite/ganache-cli:v6.9.1"
if [[ -z "`docker image ls | grep ${image#*:} | grep ${image%:*}`" ]]
then
  echo "pulling image $image"
  docker pull $image
fi

docker run \
  --detach \
  --env "MNEMONIC=" \
  --name "${project}_ethprovider" \
  --network "$project" \
  --publish "8545:8545" \
  --rm \
  --tmpfs "/tmp" \
  $image \
    "--mnemonic=candy maple cake sugar pudding cream honey rich smooth crumble sweet treat" \
    "--gasLimit=50000000"
