import { BigNumber, utils, Wallet } from "ethers";

import { AddressBook } from "../addressBook";

import { deployContracts } from "./deployContracts";

const { hexlify, hexZeroPad } = utils;

export const getPip = async (wallet: Wallet, addressBook: AddressBook): Promise<void> => {

  await deployContracts(wallet, addressBook, [ ["Pip", []] ]);
  const pip = addressBook.getContract("Pip");

  const inrPerEth = 28500;

  console.log(`Pip price haz? ${await pip.haz()}`);
  await (await pip.poke(hexZeroPad(hexlify(inrPerEth), 32))).wait();
  console.log(`Pip price haz? ${await pip.haz()}`);
  console.log(`Pip price: ${BigNumber.from(await pip.read())}`);

};
