# Crytpo INR

An ERC20 token pegged to the Indian Rupee, powered by a fork of MakerDAO

## Getting Started


**Prerequisites:**

- `make`: Probably already installed, otherwise install w `brew install make` or `apt install make` or similar.
- `jq`: Probably not installed yet, install w `brew install jq` or `apt install jq` or similar.
- `docker`: See the [Docker website](https://www.docker.com/) for installation instructions.

Make sure you have docker permissions by running something like this (linux only, docker on Mac does this for you):

```
sudo usermod -aG docker `whoami`
```

To start, clone & enter this repo:

```bash
git clone https://github.com/batuaWallet/crypto-inr.git
cd crypto-inr
```

To build everything you need, run:

```
make
```

To start a local testnet, run:

```
make start-ethprovider
```

To deploy these contracts to the local testnet, run:

```
make migrate
```

## Deploying contracts to mainnet

Coming soon
