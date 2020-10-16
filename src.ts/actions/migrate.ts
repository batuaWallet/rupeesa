import { EtherSymbol } from "@ethersproject/constants";
import { providers, utils, Wallet } from "ethers";
import { Argv } from "yargs";

import { AddressBook, getAddressBook } from "../addressBook";
import { MigrationSchema } from "../types";

import { deployContracts } from "./deployContracts";
import { mintTokens } from "./mintTokens";
import { createUniswapOracle } from "./createUniswapOracle";
import { fabSai } from "./fabSai";

const { formatEther, hexlify, toUtf8Bytes, zeroPad } = utils;

export const migrate = async (wallet: Wallet, addressBook: AddressBook): Promise<void> => {

  const chainId = (await wallet.provider.getNetwork()).chainId.toString();

  ////////////////////////////////////////
  // Environment Setup

  const startBalance = await wallet.getBalance();
  const startNonce = await wallet.getTransactionCount();

  console.log(`\nPreparing to migrate contracts to chain ${chainId}`);
  console.log(`Deployer address=${wallet.address} nonce=${startNonce} balance=${formatEther(startBalance)}`);

  ////////////////////////////////////////
  // Deploy contracts

  let schema = [] as MigrationSchema;

  if (chainId === "1337") {
    schema = [
      ["Weth", []],
      ["Gov", [hexlify(zeroPad(toUtf8Bytes("GOV"),32))]],
      ["UniswapFactory", [wallet.address]],
      ["UniswapRouter", ["UniswapFactory", "Weth"]],
      ["Pip", []],
      ["Pep", []],
      ["GemFab", []],
      ["VoxFab", []],
      ["TubFab", []],
      ["TapFab", []],
      ["TopFab", []],
      ["MomFab", []],
      ["DadFab", []],
      ["GemPit", []],
      ["SaiFab", ["GemFab", "VoxFab", "TubFab", "TapFab", "TopFab", "MomFab", "DadFab"]],
    ];
  } else {
    throw new Error(`Migrations for chain ${chainId} are not supported.`);
  }

  await deployContracts(wallet, addressBook, schema);
  await mintTokens(wallet, addressBook);
  await fabSai(wallet, addressBook);

  // TODO: generate some Sai

  await createUniswapOracle({ Sai: "1", Gov: "2" }, wallet, addressBook);
  await createUniswapOracle({ Sai: "1", Weth: "2" }, wallet, addressBook);

  ////////////////////////////////////////
  // Print summary

  console.log("\nAll done!");
  const spent = formatEther(startBalance.sub(await wallet.getBalance()));
  const nTx = (await wallet.getTransactionCount()) - startNonce;
  console.log(`Sent ${nTx} transaction${nTx === 1 ? "" : "s"} & spent ${EtherSymbol} ${spent}`);
};

export const migrateCommand = {
  command: "migrate",
  describe: "Migrate contracts",
  builder: (yargs: Argv): Argv => {
    return yargs
      .option("a", {
        alias: "address-book",
        description: "The path to your address book file",
        type: "string",
        default: "./address-book.json",
      })
      .option("m", {
        alias: "mnemonic",
        description: "The mnemonic for an account which will pay for gas",
        type: "string",
        default: "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat",
      })
      .option("p", {
        alias: "eth-provider",
        description: "The URL of an Ethereum provider",
        type: "string",
        default: "http://localhost:8545",
      });
  },
  handler: async (argv: { [key: string]: any } & Argv["argv"]): Promise<void> => {
    const provider = new providers.JsonRpcProvider(argv.ethProvider);
    const wallet = Wallet.fromMnemonic(argv.mnemonic).connect(provider);
    const chainId = (await provider.getNetwork()).chainId.toString();
    const addressBook = getAddressBook(argv.addressBook, chainId);
    await migrate(wallet, addressBook);
  },
};

