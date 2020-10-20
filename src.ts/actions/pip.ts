import { BigNumber, utils, Wallet } from "ethers";

import { AddressBook } from "../addressBook";

import { deployContracts } from "./contracts";

const { formatEther, parseEther } = utils;

const chainlinkNodeAddress = "0x13cEa1EfD824A2C4F8bd482f7AB9F0ba9D66AF78";
const chainlinkJobId = "0ac16970f00248439968b162fbb9bf06";

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

  console.log(`Sending pip some link tokens`);
  await (await link["transfer(address,uint256)"](pip.address, parseEther("10"))).wait();

  console.log(`Giving ${chainlinkNodeAddress} fulfillment permissions on operator contract`);
  await (await operator.setFulfillmentPermission(chainlinkNodeAddress, true)).wait();

  console.log(`Setting pip's oracle operator to ${operator.address} w job ${chainlinkJobId}`);
  await (await pip.setOracle(operator.address, chainlinkJobId)).wait();

  console.log(`Poking pip..`);
  console.log(`pip methods: ${Object.keys(pip.functions)}`);
  await (await pip.poke()).wait();

  // TODO: wait until first chainlink update

  console.log(`Pip price: ${formatEther(BigNumber.from(await pip.read()))}`);

};
