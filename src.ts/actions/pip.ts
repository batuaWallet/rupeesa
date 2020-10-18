import { BigNumber, utils, Wallet } from "ethers";

import { AddressBook } from "../addressBook";

import { deployContracts } from "./contracts";

const { hexlify, hexZeroPad, parseEther } = utils;

export const deployPip = async (wallet: Wallet, addressBook: AddressBook): Promise<void> => {
  console.log(`\nDeploying Pip`);

  await deployContracts(wallet, addressBook, [ ["Pip", []] ]);
  const pip = addressBook.getContract("Pip").connect(wallet);

  const inrPerEth = parseEther("28500");

  console.log(`Pip price ready? ${await pip.ready()}`);
  await (await pip.poke(hexZeroPad(hexlify(inrPerEth), 32))).wait();
  console.log(`Pip price ready? ${await pip.ready()}`);
  console.log(`Pip price: ${BigNumber.from(await pip.read())}`);

};
