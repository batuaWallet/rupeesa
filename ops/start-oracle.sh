#!/usr/bin/env bash
set -eu

# chainlink docs: https://docs.chain.link/docs/running-a-chainlink-node
stack="oracle"

root="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." >/dev/null 2>&1 && pwd )"
project="`cat $root/package.json | grep '"name":' | head -n 1 | cut -d '"' -f 4 | tr '-' '_'`"

# make sure a network for this project has been created
docker swarm init 2> /dev/null || true
docker network create --attachable --driver overlay $project 2> /dev/null || true

eth_image="trufflesuite/ganache-cli:v6.9.1"
db_image="postgres:12-alpine"
link_image="smartcontract/chainlink:latest"

for image in $eth_image $db_image $link_image
do
  if [[ -z "`docker image ls | grep ${image#*:} | grep ${image%:*}`" ]]
  then
    echo "pulling image $image"
    docker pull $image
  fi
done

pg_db="$project"
pg_user="$project"
pg_password="$project"

docker_compose=$root/.${stack}.docker-compose.yml
rm -f $docker_compose
cat - > $docker_compose <<EOF
version: '3.4'

networks:
  $project:
    external: true

volumes:
  chaindata:
  oracledata:
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
      - 'chaindata:/data'

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
    image: 'smartcontract/chainlink'
    command: ["local", "n"]
    environment:
      DATABASE_URL: 'postgresql://$pg_user:$pg_password@database:5432/$pg_db'
      ROOT: '/root'
      LOG_LEVEL: 'debug'
      ETH_CHAIN_ID: '1337'
      MIN_OUTGOING_CONFIRMATIONS: '1'
      LINK_CONTRACT_ADDRESS: '0x20fE562d797A42Dcb3399062AE9546cd06f63280'
      CHAINLINK_TLS_PORT: '0'
      SECURE_COOKIES: 'false'
      GAS_UPDATER_ENABLED: 'true'
      ETH_URL: 'http://ethprovider:8545'
      ALLOW_ORIGINS: '*'
    networks:
      - '$project'
    ports:
      - '6688:6688'
    tmpfs: /tmp
    volumes:
      - 'oracledata:/root'

EOF

docker stack deploy -c $docker_compose $stack
