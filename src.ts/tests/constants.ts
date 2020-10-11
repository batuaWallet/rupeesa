import waffle from "@nomiclabs/buidler-waffle";
waffle();

console.log(`${JSON.stringify(provider, null, 2)}`);

export const provider = process.env.provider!;
export const wallets = provider.getWallets();
export const alice = wallets[0];
export const bob = wallets[1];
export const rando = wallets[2];
export const addressBookPath = "/tmp/address-book.json";

/*
import env from "@nomiclabs/buidler";
import { Wallet } from "ethers";

export const provider = env.network.provider;
export const accounts = env.network.config.accounts;

export const getWallet = (i: number): Wallet =>
  (new Wallet(accounts[i.toString()].privateKey)).connect(provider);

export const alice = getWallet(0);
export const bob = getWallet(1);
export const rando = getWallet(2);
*/
