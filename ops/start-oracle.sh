#!/usr/bin/env bash
set -eu

# chainlink docs: https://docs.chain.link/docs/running-a-chainlink-node
stack="oracle"

root="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." >/dev/null 2>&1 && pwd )"
project="$(cat "$root/package.json" | grep '"name":' | head -n 1 | cut -d '"' -f 4 | tr '-' '_')"

# make sure a network for this project has been created
docker swarm init 2> /dev/null || true
docker network create --attachable --driver overlay "$project" 2> /dev/null || true

eth_image="trufflesuite/ganache-cli:v6.9.1"
db_image="postgres:12-alpine"
link_image="crypto_inr_chainlink:latest"

for image in $eth_image $db_image $link_image
do
  if [[ -z "$(docker image ls | grep ${image#*:} | grep ${image%:*})" ]]
  then
    echo "pulling image $image"
    docker pull $image
  fi
done

chain_data="$root/.chaindata"
rm -rf "$chain_data"
mkdir -p "$chain_data"

pg_db="$project"
pg_user="$project"
pg_password="$project"

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

  ethprovider:
    image: '$eth_image'
    environment:
      MNEMONIC: 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat'
    networks:
      - '$project'
    ports:
      - '8545:8545'
    tmpfs: '/tmp'
    volumes:
      - '$chain_data:/data'

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

  chainlink:
    image: '$link_image'
    command: ["local", "n"]
    environment:
      ALLOW_ORIGINS: '*'
      API_USER: 'user@example.com'
      API_PASSWORD: 'password'
      WALLET_PASSWORD: 'super secret password'
      CHAINLINK_TLS_PORT: '0'
      DATABASE_URL: 'postgresql://$pg_user:$pg_password@database:5432/$pg_db?sslmode=disable'
      ETH_CHAIN_ID: '1337'
      ETH_URL: 'ws://ethprovider:8545'
      GAS_UPDATER_ENABLED: 'false'
      LINK_CONTRACT_ADDRESS: '0x20fE562d797A42Dcb3399062AE9546cd06f63280'
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

EOF

docker stack deploy -c "$docker_compose" "$stack"
