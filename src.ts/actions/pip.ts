import { BigNumber, providers, utils, Wallet } from "ethers";
import { Argv } from "yargs";

import { AddressBook, getAddressBook } from "../addressBook";

import { deployContracts } from "./contracts";

const { formatEther, parseEther } = utils;

const chainlinkNodeAddress = "0x13cEa1EfD824A2C4F8bd482f7AB9F0ba9D66AF78";
const chainlinkJobId = "6f9039389ee14bffb51b226035542ab0";

export const deployPip = async (wallet: Wallet, addressBook: AddressBook): Promise<void> => {
  console.log(`\nDeploying Pip`);

  const initialPrice = "28500";

  await deployContracts(wallet, addressBook, [
    ["LinkToken", []],
    ["Operator", ["LinkToken"]],
    ["Pip", ["LinkToken", initialPrice]],
  ]);

  const link = addressBook.getContract("LinkToken").connect(wallet);
  const pip = addressBook.getContract("Pip").connect(wallet);
  const operator = addressBook.getContract("Operator").connect(wallet);

  console.log(`Approving link tokens`);
  await (await link["approve(address,uint256)"](pip.address, parseEther("100"))).wait();

  console.log(`Sending pip some link tokens & eth`);
  await (await link["transfer(address,uint256)"](pip.address, parseEther("10"))).wait();
  await (await wallet.sendTransaction({ to: chainlinkNodeAddress, value: parseEther("1") })).wait();

  console.log(`Giving ${chainlinkNodeAddress} fulfillment permissions on operator contract`);
  await (await operator.setFulfillmentPermission(chainlinkNodeAddress, true)).wait();

  console.log(`Setting pip's oracle operator to ${operator.address} w job ${chainlinkJobId}`);
  await (await pip.setOracle(operator.address, chainlinkJobId)).wait();

  console.log(`Pip initial price: ${formatEther(BigNumber.from(await pip.read()))}`);

  console.log(`Poking pip..`);
  await (await pip.poke()).wait();
  console.log(`Pip has been poked`);

};

export const pokePip = async (wallet: Wallet, addressBook: AddressBook): Promise<void> => {
  const operator = addressBook.getContract("Operator").connect(wallet);
  const pip = addressBook.getContract("Pip").connect(wallet);
  console.log(`Setting pip's oracle operator to ${operator.address} w job ${chainlinkJobId}`);
  await (await pip.setOracle(operator.address, chainlinkJobId)).wait();
  console.log(`Poking pip..`);
  await (await pip.poke()).wait();
  console.log(`Peeking pip..`);
  const [val, has] = await pip.peek();
  console.log(`Pip ready=${has} value=${val}`);
  console.log(`\nPip price: ${BigNumber.from(val)}`);
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
