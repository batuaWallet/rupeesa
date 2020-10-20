#!/usr/bin/env bash
set -eu

# chainlink docs: https://docs.chain.link/docs/running-a-chainlink-node
stack="oracle"

root="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." >/dev/null 2>&1 && pwd )"
project="$(grep -m 1 '"name":' "$root/package.json" | cut -d '"' -f 4 | tr '-' '_')"

# make sure a network for this project has been created
docker swarm init 2> /dev/null || true
docker network create --attachable --driver overlay "$project" 2> /dev/null || true

bash ops/start-ethprovider.sh

link_image="${project}_chainlink:latest"
db_image="postgres:12-alpine"

if ! grep -qs "${db_image%:*}" <<<"$(docker image ls | grep ${db_image#*:})"
then docker pull "$db_image"
fi

pg_db="$project"
pg_user="$project"
pg_password="$project"

link_address=$(jq '.["1337"].LinkToken.address' address-book.json | tr -d '"')

local_wallet_file="$root/.test-wallet.json"
inner_wallet_file="/test-wallet.json"

docker_compose=$root/.${stack}.docker-compose.yml
rm -f "$docker_compose"
cat - > "$docker_compose" <<EOF
version: '3.4'

networks:
  $project:
    external: true

volumes:
  chainlink:
  database:

services:

  chainlink:
    image: '$link_image'
    command: ["local", "n"]
    environment:
      ALLOW_ORIGINS: '*'
      API_USER: 'user@example.com'
      API_PASSWORD: 'password'
      WALLET_PASSWORD: 'password'
      WALLET_FILE: '$inner_wallet_file'
      CHAINLINK_TLS_PORT: '0'
      DATABASE_URL: 'postgresql://$pg_user:$pg_password@database:5432/$pg_db?sslmode=disable'
      ETH_CHAIN_ID: '1337'
      ETH_URL: 'ws://${project}_ethprovider:8545'
      GAS_UPDATER_ENABLED: 'false'
      LINK_CONTRACT_ADDRESS: '$link_address'
      LOG_LEVEL: 'info'
      MIN_OUTGOING_CONFIRMATIONS: '1'
      ROOT: '/root'
      SECURE_COOKIES: 'false'
    networks:
      - '$project'
    ports:
      - '6688:6688'
    tmpfs: /tmp
    volumes:
      - 'chainlink:/root'
      - '$local_wallet_file:$inner_wallet_file'

  database:
    image: '$db_image'
    environment:
      POSTGRES_DB: '$pg_db'
      POSTGRES_PASSWORD: '$pg_password'
      POSTGRES_USER: '$pg_user'
    networks:
      - '$project'
    ports:
      - '5432:5432'
    tmpfs: '/tmp'
    volumes:
      - 'database:/var/lib/postgresql/data'

EOF

docker stack deploy -c "$docker_compose" "$stack"
