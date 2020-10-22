#!/usr/bin/env bash
set -eu

# chainlink docs: https://docs.chain.link/docs/running-a-chainlink-node
stack="oracle"

root="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." >/dev/null 2>&1 && pwd )"
project="$(grep -m 1 '"name":' "$root/package.json" | cut -d '"' -f 4 | tr '-' '_')"

# make sure a network for this project has been created
docker swarm init 2> /dev/null || true
docker network create --attachable --driver overlay "$project" 2> /dev/null || true

########################################
## Load env vars & config

default_eth_url=ws://${project}_ethprovider:8545

WALLET_FILE=${WALLET_FILE:-$root/.test-wallet.json}
WALLET_PASSWORD=${WALLET_PASSWORD:-password}
API_USER=${API_USER:-user}
API_PASSWORD=${API_PASSWORD:-password}
ETH_URL=${ETH_URL:-$default_eth_url}
DOMAINNAME=${DOMAINNAME:-localhost}
CHAIN_ID=${CHAIN_ID:-1337}

########################################
## Configure Ethereum connection & addresses

if [[ "$ETH_URL" == "$default_eth_url" ]]
then bash ops/start-ethprovider.sh
fi

link_address=$(jq '.["'"$CHAIN_ID"'"].LinkToken.address' address-book.json | tr -d '"')

if [[ -z "$link_address" || "$link_address" == "null" ]]
then echo "Failed to find a LINK token on chain $CHAIN_ID"
fi

########################################
## Configure Docker Images

link_image="${project}_chainlink:latest"
db_image="postgres:12-alpine"

if ! grep -qs "${db_image%:*}" <<<"$(docker image ls | grep ${db_image#*:})"
then docker pull "$db_image"
fi

pg_db="$project"
pg_user="$project"
pg_password="$project"

common="networks:
      - '$project'
    logging:
      driver: 'json-file'
      options:
          max-size: '10m'"

########################################
## Configure Proxy/HTTPS

if [[ -n "$DOMAINNAME" && "$DOMAINNAME" != "localhost" ]]
then
  proxy_service="

  proxy:
    $common
    networks:
      - '$project'
    logging:
      driver: 'json-file'
      options:
          max-size: '100m'
    image: '${project}_proxy:latest'
    ports:
      - '80:80'
      - '443:443'
    environment:
      DOMAINNAME: '$DOMAINNAME'
      CHAINLINK_URL: 'chainlink:6688'
    volumes:
      - 'certs:/etc/letsencrypt'

  "
  node_ports=""
else
  proxy_service=""
  node_ports="ports:
      - '6688:6688'"
fi

########################################
## Launch it

inner_wallet_file="/wallet.json"

docker_compose=$root/.${stack}.docker-compose.yml
rm -f "$docker_compose"
cat - > "$docker_compose" <<EOF
version: '3.4'

networks:
  $project:
    external: true

volumes:
  certs:
  chainlink:
  database:

services:

  $proxy_service

  chainlink:
    image: '$link_image'
    $common
    command: ["local", "n"]
    environment:
      ALLOW_ORIGINS: '*'
      API_USER: '$API_USER'
      API_PASSWORD: '$API_PASSWORD'
      WALLET_PASSWORD: '$WALLET_PASSWORD'
      WALLET_FILE: '$inner_wallet_file'
      CHAINLINK_TLS_PORT: '0'
      DATABASE_URL: 'postgresql://$pg_user:$pg_password@database:5432/$pg_db?sslmode=disable'
      ETH_CHAIN_ID: '1337'
      ETH_URL: '$ETH_URL'
      GAS_UPDATER_ENABLED: 'false'
      LINK_CONTRACT_ADDRESS: '$link_address'
      LOG_LEVEL: 'info'
      MIN_OUTGOING_CONFIRMATIONS: '1'
      ROOT: '/root'
      SECURE_COOKIES: 'false'
    $node_ports
    tmpfs: /tmp
    volumes:
      - 'chainlink:/root'
      - '$WALLET_FILE:$inner_wallet_file'

  database:
    image: '$db_image'
    $common
    environment:
      POSTGRES_DB: '$pg_db'
      POSTGRES_PASSWORD: '$pg_password'
      POSTGRES_USER: '$pg_user'
    tmpfs: '/tmp'
    volumes:
      - 'database:/var/lib/postgresql/data'

EOF

docker stack deploy -c "$docker_compose" "$stack"
