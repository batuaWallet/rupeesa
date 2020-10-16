import { BigNumber, Wallet } from "ethers";

import { AddressBook } from "../addressBook";

import { createUniswapOracle } from "./createUniswapOracle";
import { deployContracts } from "./deployContracts";

export const getPep = async (wallet: Wallet, addressBook: AddressBook): Promise<void> => {
  console.log(`\nGetting Pep`);

  await deployContracts(wallet, addressBook, [
    ["Pep", []],
  ]);
  const pep = addressBook.getContract("Pep");

  console.log(`Pep price ready? ${await pep.ready()}`);

  // Next step: deploy a uniswap oracle
  // Last step: call pep.init(pair, isGovZero);

};

export const setPep = async (wallet: Wallet, addressBook: AddressBook): Promise<void> => {

  const pep = addressBook.getContract("Pep");
  const weth = addressBook.getContract("Weth");

  const wethAmt = "2";
  await (await weth.deposit({ value: BigNumber.from(wethAmt) })).wait();

  await createUniswapOracle({ Sai: "1", Gov: "2" }, wallet, addressBook);
  await createUniswapOracle({ Sai: "1", Weth: wethAmt }, wallet, addressBook);

  await pep.init();
  console.log(`Pep price ready? ${await pep.ready()}`);
  await (await pep.poke()).wait();

};
