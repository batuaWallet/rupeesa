import { Zero } from "@ethersproject/constants";
import { utils, Wallet } from "ethers";

import { AddressBook } from "../addressBook";

import { deployContracts } from "./contracts";

const { formatEther, hexZeroPad, toUtf8Bytes, parseEther } = utils;

export const deployGov = async (wallet: Wallet, addressBook: AddressBook): Promise<void> => {
  console.log(`\nGetting Gov`);

  await deployContracts(wallet, addressBook, [
    ["Gov", [hexZeroPad(toUtf8Bytes("COW"), 32)]],
    ["Governance", []],
  ]);

  const gov = addressBook.getContract("Gov").connect(wallet);

  let balance = await gov.balanceOf(wallet.address);
  if (balance.eq(Zero)) {
    console.log(`Mintin some Govs`);
    await (await gov["mint(uint256)"](parseEther("100000"))).wait();
    balance = await gov.balanceOf(wallet.address);
  }
  console.log(`GOV balance: ${formatEther(balance)}`);

};
