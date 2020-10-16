import { BigNumber, Wallet } from "ethers";

import { AddressBook } from "../addressBook";

import { createUniswapOracle } from "./createUniswapOracle";
import { deployContracts } from "./deployContracts";

export const getPep = async (wallet: Wallet, addressBook: AddressBook): Promise<void> => {

  await deployContracts(wallet, addressBook, [
    ["Pep", []],
  ]);
  const pep = addressBook.getContract("Pep");

  console.log(`Pep price haz? ${await pep.haz()}`);
  await (await pep.poke()).wait();
  console.log(`Pep price haz? ${await pep.haz()}`);
  console.log(`Pep price: ${BigNumber.from(await pep.read())}`);

  // Next step: deploy a uniswap oracle
  // Last step: call pep.init(pair, isGovZero);

};

export const setPep = async (wallet: Wallet, addressBook: AddressBook): Promise<void> => {

  const pep = addressBook.getContract("Pep");
  // TODO seed uniswap pair

  await createUniswapOracle({ Sai: "1", Gov: "2" }, wallet, addressBook);
  await createUniswapOracle({ Sai: "1", Weth: "2" }, wallet, addressBook);

  try {
    await pep.init();
  } catch (e) {
    console.log(`Can't init pep: ${e.message}`);
  }

};
