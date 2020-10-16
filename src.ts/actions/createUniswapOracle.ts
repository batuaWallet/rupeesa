import { AddressZero, Zero } from "@ethersproject/constants";
import { utils, Wallet } from "ethers";

import { AddressBook, AddressBookEntry } from "../addressBook";

const { formatEther, parseEther } = utils;

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

  const initPair = async (): Promise<string> => {
    console.log(`Approving ${uniswapRouter.address} to spend ${formatEther(amountA)} ${tokenNames[0]} tokens`);
    await(await tokenA["approve(address,uint256)"](uniswapRouter.address, amountA)).wait();
    console.log(`Approving ${uniswapRouter.address} to spend ${formatEther(amountB)} ${tokenNames[1]} tokens`);
    await(await tokenB["approve(address,uint256)"](uniswapRouter.address, amountB)).wait();
    console.log(`Adding liquidity to pair ${pair.address}`);
    const tx = await uniswapRouter.addLiquidity(
      tokenA.address,
      tokenB.address,
      amountA,
      amountB,
      amountA,
      amountB,
      wallet.address,
      Date.now() + 1000 * 60,
    );
    tx.wait();
    return tx.hash;

  };

  let pairAddress = await uniswapFactory.getPair(tokenA.address, tokenB.address);
  if (!pairAddress || pairAddress === AddressZero) {
    const txHash = await initPair();
    pairAddress = await uniswapFactory.getPair(tokenA.address, tokenB.address);
    addressBook.setEntry("UniswapPair-GemGov", {
      address: pairAddress,
      txHash,
    } as AddressBookEntry);
  }
  console.log(`Uniswap pair is at ${pairAddress} for ${tokenA.address}:${tokenB.address}`);

  const pair = addressBook.getContract("UniswapPair-GemGov").connect(wallet);
  let reserves = await pair.getReserves();
  if (reserves[0].eq(Zero)) {
    await initPair();
    reserves = await pair.getReserves();
  }

  console.log(`Uniswap pair ${pairAddress} has reserves: ${reserves}`);
};
