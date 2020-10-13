import { AddressZero, Two } from "@ethersproject/constants";
import { Contract, utils, Wallet } from "ethers";

import { AddressBook, AddressBookEntry } from "../addressBook";
import { artifacts } from "../artifacts";

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
  const pair = new Contract(pairAddress, artifacts["UniswapPair"].abi, wallet);
  console.log(`Uniswap pair is at ${pairAddress} for ${weth.address}:${gov.address}`);
  console.log(`Pair at ${pairAddress} has ${((await wallet.provider.getCode(pairAddress)).length-2)/2} bytes of code`);

  let reserves;
  // let reserves = await pair.getReserves();
  // console.log(`Got reserves:`, reserves);
  if (true /*(reserves[0].eq(Zero)*/) {
    const ethAmt = parseEther("100");
    const govAmt = parseEther("1000");
    console.log(`Approving tokens`);
    tx = await gov["approve(address,uint256)"](uniswapRouter.address, govAmt.mul(govAmt));
    await wallet.provider.waitForTransaction(tx.hash);

    console.log(`pair code hash: ${keccak256(await uniswapFactory.pairCreationCode())}`);

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
