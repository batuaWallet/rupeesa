import { EtherSymbol, Zero } from "@ethersproject/constants";
import { providers, utils, Wallet } from "ethers";
import { Argv } from "yargs";

import { deployContracts, deployPip, deployGov, deployPep, initPep, deploySai } from "./actions"; 
import { AddressBook, getAddressBook } from "./addressBook";

const { formatEther, parseEther } = utils;

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

  if (chainId === "1337") {
    console.log(`Migrating to local ganache testnet`);

    // Deploy "global" things that already exist on mainnet
    await deployContracts(wallet, addressBook, [
      ["Weth", []],
      ["UniswapFactory", [wallet.address]],
      ["UniswapRouter", ["UniswapFactory", "Weth"]],
    ]);

    await deployPip(wallet, addressBook);
    await deployPep(wallet, addressBook);
    await deployGov(wallet, addressBook);
    await deploySai(wallet, addressBook);
    await initPep(wallet, addressBook);

  } else if (chainId === "5") {
    console.log(`Migrations for Goerli testnet: ACTIVATED!`);

    // Deploy "global" things that already exist on mainnet
    await deployContracts(wallet, addressBook, [
      ["Weth", []],
      ["UniswapFactory", [wallet.address]],
      ["UniswapRouter", ["UniswapFactory", "Weth"]],
    ]);

    // Deploy pip stuff manually so we can config it more carefully than on ganache
    const initialPrice = "2850000"; // INR per 100 ETH
    await deployContracts(wallet, addressBook, [
      ["LinkToken", []],
      ["Operator", ["LinkToken"]],
      ["Pip", ["LinkToken", initialPrice]],
    ]);

    // Give pip some LINK if it doesn't have any yet
    const link = addressBook.getContract("LinkToken").connect(wallet);
    const pip = addressBook.getContract("Pip").connect(wallet);
    if ((await link.balanceOf(pip.address)).eq(Zero)) {
      const amt = parseEther("100");
      console.log(`Approving link tokens`);
      await (await link["approve(address,uint256)"](pip.address, amt)).wait();
      console.log(`Sending pip ${amt} link tokens & eth`);
      await (await link["transfer(address,uint256)"](pip.address, amt)).wait();
    }

    await deployPep(wallet, addressBook);
    await deployGov(wallet, addressBook);
    await deploySai(wallet, addressBook);

  } else {
    throw new Error(`Migrations for chain ${chainId} are not supported.`);
  }

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

