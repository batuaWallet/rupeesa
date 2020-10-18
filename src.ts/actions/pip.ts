import { BigNumber, Wallet } from "ethers";

import { AddressBook } from "../addressBook";

import { deployContracts } from "./contracts";

export const deployPip = async (wallet: Wallet, addressBook: AddressBook): Promise<void> => {
  console.log(`\nDeploying Pip`);

  const initialPrice = "28500";

  await deployContracts(wallet, addressBook, [
    ["LinkToken", []],
    ["Operator", ["LinkToken"]],
    ["Pip", ["LinkToken", initialPrice]],
  ]);

  const pip = addressBook.getContract("Pip").connect(wallet);

  // TODO: get the real oracle price
  const oracle = Wallet.createRandom();

  console.log(`Setting oracle to ${oracle.address}`);
  await (await pip.setOracle(oracle.address, "job number uno")).wait();

  console.log(`Poking pip..`);
  console.log(`pip methods: ${Object.keys(pip.functions)}`);
  await (await pip.poke()).wait();

  // TODO: wait until first chainlink update

  console.log(`Pip price: ${BigNumber.from(await pip.read())}`);

};
