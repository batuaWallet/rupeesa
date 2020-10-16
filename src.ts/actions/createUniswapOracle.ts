import { AddressZero, Zero } from "@ethersproject/constants";
import { utils, Wallet } from "ethers";

import { AddressBook, AddressBookEntry } from "../addressBook";

const { parseEther } = utils;

export const createUniswapOracle = async (
  initialReserves: { [name: string]: string },
  wallet: Wallet,
  addressBook: AddressBook,
): Promise<void> => {
  console.log("\nChecking Uniswap Pools..");

  const tokenNames = Object.keys(initialReserves);
  const tokenA = addressBook.getContract(tokenNames[0]);
  const tokenB = addressBook.getContract(tokenNames[1]);
  const amountA = parseEther(initialReserves[tokenNames[0]]);
  const amountB = parseEther(initialReserves[tokenNames[1]]);

  const uniswapFactory = addressBook.getContract("UniswapFactory").connect(wallet);
  const uniswapRouter = addressBook.getContract("UniswapRouter").connect(wallet);

  let tx;

  let pairAddress = await uniswapFactory.getPair(tokenA.address, tokenB.address);

  if (!pairAddress || pairAddress === AddressZero) {
    console.log(`Deploying new uniswap pair`);
    tx = await uniswapFactory.createPair(tokenA.address, tokenB.address);
    await wallet.provider.waitForTransaction(tx.hash);
    pairAddress = await uniswapFactory.getPair(tokenA.address, tokenB.address);
    addressBook.setEntry("UniswapPair-GemGov", {
      address: pairAddress,
      args: [tokenA.address, tokenB.address],
      txHash: tx.hash,
    } as AddressBookEntry);
  }
  const pair = addressBook.getContract("UniswapPair-GemGov").connect(wallet);
  console.log(`Uniswap pair is at ${pairAddress} for ${tokenA.address}:${tokenB.address}`);

  let reserves = await pair.getReserves();
  if (reserves[0].eq(Zero)) {
    console.log(`Adding reserves to pair`);
    console.log(`Approving tokens`);

    tx = await tokenA["approve(address,uint256)"](uniswapRouter.address, amountA.mul(amountA));
    await wallet.provider.waitForTransaction(tx.hash);

    tx = await tokenB["approve(address,uint256)"](uniswapRouter.address, amountB.mul(amountB));
    await wallet.provider.waitForTransaction(tx.hash);

    console.log(`Adding liquidity`);
    tx = await uniswapRouter.addLiquidity(
      tokenA.address,
      tokenB.address,
      amountA,
      amountB,
      amountA,
      amountB,
      wallet.address,
      Date.now() + 1000 * 60,
    );
    await wallet.provider.waitForTransaction(tx.hash);
    reserves = await pair.getReserves();
  }
  console.log(`Uniswap pair ${pairAddress} has reserves: ${reserves}`);

};
