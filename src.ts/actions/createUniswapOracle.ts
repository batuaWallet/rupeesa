import { AddressZero, Zero } from "@ethersproject/constants";
import { utils, Wallet } from "ethers";

import { AddressBook, AddressBookEntry } from "../addressBook";

const { keccak256, parseEther } = utils;

export const createUniswapOracle = async (wallet: Wallet, addressBook: AddressBook): Promise<void> => {
  console.log("\nChecking Uniswap Pools..");

  const weth = addressBook.getContract("WETH").connect(wallet);
  const gov =  addressBook.getContract("Gov").connect(wallet);
  const uniswapFactory = addressBook.getContract("UniswapFactory").connect(wallet);
  const uniswapRouter = addressBook.getContract("UniswapRouter").connect(wallet);

  let tx;

  let pairAddress = await uniswapFactory.getPair(weth.address, gov.address);

  if (!pairAddress || pairAddress === AddressZero) {
    console.log(`Deploying new uniswap pair`);
    tx = await uniswapFactory.createPair(weth.address, gov.address);
    await wallet.provider.waitForTransaction(tx.hash);
    pairAddress = await uniswapFactory.getPair(weth.address, gov.address);
    addressBook.setEntry("UniswapPair-GemGov", {
      address: pairAddress,
      args: [weth.address, gov.address],
      txHash: tx.hash,
    } as AddressBookEntry);
  }
  const pair = addressBook.getContract("UniswapPair-GemGov").connect(wallet);
  console.log(`Uniswap pair is at ${pairAddress} for ${weth.address}:${gov.address}`);

  let reserves = await pair.getReserves();
  if (reserves[0].eq(Zero)) {
    console.log(`Adding reserves to pair`);
    const ethAmt = parseEther("100");
    const govAmt = parseEther("1000");
    console.log(`Approving tokens`);

    tx = await gov["approve(address,uint256)"](uniswapRouter.address, govAmt.mul(govAmt));
    await wallet.provider.waitForTransaction(tx.hash);

    console.log(`Adding liquidity`);
    tx = await uniswapRouter.addLiquidityETH(
      gov.address,
      govAmt,
      govAmt,
      ethAmt,
      wallet.address,
      Date.now() + 1000 * 60,
      { value: ethAmt },
    );
    await wallet.provider.waitForTransaction(tx.hash);
    reserves = await pair.getReserves();
  }
  console.log(`Uniswap pair ${pairAddress} has reserves: ${reserves}`);

};
