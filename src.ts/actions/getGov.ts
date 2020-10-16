import { Zero } from "@ethersproject/constants";
import { utils, Wallet } from "ethers";

import { AddressBook } from "../addressBook";

import { deployContracts } from "./deployContracts";

const { formatEther, parseEther } = utils;

export const getGov = async (wallet: Wallet, addressBook: AddressBook): Promise<void> => {

  await deployContracts(wallet, addressBook, [
    ["Gov", []],
    ["Governance", []],
  ]);

  const gov = addressBook.getContract("Gov");

  let balance = await gov.balanceOf(wallet.address);
  if (balance.eq(Zero)) {
    console.log(`Mintin some Govs`);
    await (await gov["mint(uint256)"](parseEther("10000"))).wait();
    balance = await gov.balanceOf(wallet.address);
  }
  console.log(`GOV balance: ${formatEther(balance)}`);

};
