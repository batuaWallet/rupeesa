import { Zero } from "@ethersproject/constants";
import { utils, Wallet } from "ethers";

import { AddressBook } from "../addressBook";

const { formatEther, parseEther } = utils;

export const mintTokens = async (wallet: Wallet, addressBook: AddressBook): Promise<void> => {
  console.log("\nChecking Tokens..");

  const gem = addressBook.getContract("WETH").connect(wallet);
  const gov = addressBook.getContract("DSToken").connect(wallet); // governance token eg MKR

  let balance;
  let tx;

  balance = await gem.balanceOf(wallet.address);
  if (balance.eq(Zero)) {
    console.log(`Depositing ETH to get WETH aka GEM`);
    tx = await gem.deposit({ value: parseEther("1000") });
    await wallet.provider.waitForTransaction(tx.hash);
    balance = await gem.balanceOf(wallet.address);
  }
  console.log(`WETH (Gem) balance: ${formatEther(balance)}`);

  balance = await gov.balanceOf(wallet.address);
  if (balance.eq(Zero)) {
    console.log(`Mintin some Govs`);
    tx = await gov["mint(uint256)"](parseEther("10000"));
    await wallet.provider.waitForTransaction(tx.hash);
    balance = await gov.balanceOf(wallet.address);
  }
  console.log(`GOV balance: ${formatEther(balance)}`);
};
