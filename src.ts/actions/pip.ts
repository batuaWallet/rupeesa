import { AddressZero, Zero } from "@ethersproject/constants";
import { BigNumber, providers, utils, Wallet } from "ethers";
import { Argv } from "yargs";

import { AddressBook, getAddressBook } from "../addressBook";

import { deployContracts } from "./contracts";

const { formatEther, parseEther } = utils;

// Hardcoded pip values
const initialPrice = "28500";
const chainlinkNodeAddress = "0x13cEa1EfD824A2C4F8bd482f7AB9F0ba9D66AF78";
const chainlinkJobId = "6f9039389ee14bffb51b226035542ab0";

export const deployPip = async (wallet: Wallet, addressBook: AddressBook): Promise<void> => {
  console.log(`\nDeploying Pip`);
  await deployContracts(wallet, addressBook, [
    ["LinkToken", []],
    ["Operator", ["LinkToken"]],
    ["Pip", ["LinkToken", initialPrice]],
  ]);
  const operator = addressBook.getContract("Operator").connect(wallet);
  const link = addressBook.getContract("LinkToken").connect(wallet);
  const pip = addressBook.getContract("Pip").connect(wallet);
  // Give pip some LINK if it doesn't have any yet
  if ((await link.balanceOf(pip.address)).eq(Zero)) {
    console.log(`Approving link tokens`);
    await (await link["approve(address,uint256)"](pip.address, parseEther("100"))).wait();
    console.log(`Sending pip some link tokens & eth`);
    await (await link["transfer(address,uint256)"](pip.address, parseEther("100"))).wait();
    await (await wallet.sendTransaction({ to: chainlinkNodeAddress, value: parseEther("1") })).wait();
  }
  if ((await pip.oracle()) == AddressZero) {
    await configPip(wallet, addressBook, operator.address, chainlinkJobId);
    await pokePip(wallet, addressBook);
  }
  console.log(`Pip price: ${formatEther(BigNumber.from(await pip.read()))}`);
};

export const configPip = async (wallet: Wallet, addressBook: AddressBook, operatorAddress?: string, jobId?: string): Promise<void> => {
  console.log(`\nConfiguring pip..`);
  const pip = addressBook.getContract("Pip").connect(wallet);
  let operator;
  if (!operatorAddress) {
    console.log(`No operator address provided, using the one we deployed`);
    operator = addressBook.getContract("Operator").connect(wallet);
    // Configure the chainlink node operator
    if ((await operator.getAuthorizationStatus(chainlinkNodeAddress))) {
      console.log(`Giving ${chainlinkNodeAddress} fulfillment permissions on operator contract`);
      await (await operator.setFulfillmentPermission(chainlinkNodeAddress, true)).wait();
    }
  } else {
    console.log(`Operator address ${operatorAddress} was given`);
    addressBook.setEntry("Operator", { address: operatorAddress });
    operator = addressBook.getContract("Operator").connect(wallet);
  }
  // Configure Pip's oracle & Job ID
  const currentOracle = await pip.oracle();
  const currentJob = await pip.jobId();
  if (currentOracle != operator.address || currentJob != jobId) {
    console.log(`Setting pip's oracle operator from ${currentOracle} to ${operator.address} w job ${jobId}`);
    await (await pip.setOracle(operator.address, jobId)).wait();
    console.log(`Pip is using oracle: ${await pip.oracle()}`);
  }
};

export const pokePip = async (wallet: Wallet, addressBook: AddressBook): Promise<void> => {
  console.log(`\nPoking pip..`);
  const pip = addressBook.getContract("Pip").connect(wallet);
  const [val, has] = await pip.peek();
  console.log(`Pip ready=${has} value=${val}`);
  console.log(`Sending pip.poke()`);
  await (await pip.poke()).wait();
  console.log("waiting for the chainlink oracle to update");
  /*
  for (let i=0; i<50; i++) {
    if ((await wallet.provider.getNetwork()).chainId === 1337) {
      await (wallet.provider as providers.JsonRpcProvider).send("evm_mine", []);
    }
    const newVal = await pip.read();
    if (newVal !== val) {
      console.log(`Pip value has been updated!`);
      break;
    } else {
      await new Promise(res => setTimeout(res, 1000));
    }
  }
  */
  const newVal = await pip.read();
  console.log(`Pip price: ${BigNumber.from(newVal)}`);
};

export const configPipCommand = {
  command: "configPip",
  describe: "Config pip",
  builder: (yargs: Argv): Argv => {
    return yargs
      .option("o", {
        alias: "operator",
        description: "Address of the operator contract that will fulfil chainlink requests",
        type: "string",
      })
      .option("j", {
        alias: "job-id",
        description: "Job Id for the oracle's request",
        type: "string",
      })
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
    await configPip(wallet, addressBook, argv.operator, argv.jobId);
  },
};

export const pokePipCommand = {
  command: "pokePip",
  describe: "Poke pip",
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
    await pokePip(wallet, addressBook);
  },
};
