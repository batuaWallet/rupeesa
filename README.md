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

## Notes:

### Pit
Where gov tokens go when they're burned (eventually: or taken from when they're minted?)

### Pep
The gov/sai price feed.
Used once in Tub.wipe() (aka repay CDP debt) to determine how many gov token to move to/from the Pit based on the accumulated fees/rewards.

```
  (bytes32 val, bool ok) = pep.peek();
  if (ok && val != 0) gov.move(msg.sender, pit, wdiv(owe, uint(val)));
```

### Pip
The eth/sai price feed, this one sets the PEG


### Pyorp
The eth/sai price feed, this one sets the ACTUAL price (can be used to auto-set the stability fee according to demand).

## Oracles

Planning to use ChainLink. A few endpoints that will be aggregated:

```
curl https://api.wazirx.com/api/v2/tickers/ethinr |\
  jq '((.ticker.buy | tonumber) + (.ticker.sell | tonumber)) / 2'
```

```
curl https://api.coingecko.com/api/v3/coins/ethereum/history?date=18-10-2020 |\
  jq '.market_data.current_price.inr'
```
