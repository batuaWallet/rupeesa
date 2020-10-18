import { BigNumber, utils, Wallet } from "ethers";

import { AddressBook } from "../addressBook";

import { createUniswapPair } from "./uniswapPair";
import { deployContracts } from "./contracts";

const { formatEther, parseEther } = utils;

export const deployPep = async (wallet: Wallet, addressBook: AddressBook): Promise<void> => {
  console.log(`\nGetting Pep`);

  await deployContracts(wallet, addressBook, [
    ["Pep", []],
  ]);
  const pep = addressBook.getContract("Pep").connect(wallet);

  console.log(`Pep price ready? ${await pep.ready()}`);

  // Next step: deploy a uniswap oracle
  // Last step: call pep.init(pair, isGovZero);

};

export const initPep = async (wallet: Wallet, addressBook: AddressBook): Promise<void> => {
  const gov = addressBook.getContract("Gov").connect(wallet);
  const sai = addressBook.getContract("Sai").connect(wallet);
  const govAmt = parseEther("100");
  const govPrice = "100";

  await createUniswapPair({
    Gov: govAmt,
    Sai: govAmt.mul(govPrice),
  }, wallet, addressBook);
  const pair = addressBook.getContract("UniswapPair-GovSai").connect(wallet);

  const token0 = await pair.token0();
  const token1 = await pair.token1();
  const govIsIndexZero = gov.address == token0;
  if (!govIsIndexZero && gov.address != token1) {
    throw new Error(`Gov=${gov.address} !== token0=${token0} or token1=${token1}`);
  }

  const pep = addressBook.getContract("Pep").connect(wallet);
  const ready = await pep.ready();
  if (!ready) {
    console.log(`Initializing Pep`);
    await pep.init(pair.address, govIsIndexZero);
  }
  let [val, has] = await pep.peek();
  console.log(`Pep ready=${has} value=${val}`);

  // Swap to register uniswap price updates
  const inAmt = parseEther("1");
  const saiBal = await sai.balanceOf(wallet.address);
  console.log(`Swapping ${formatEther(inAmt)} gov for sai`);
  console.log(`saiBal=${saiBal} govBal=${await gov.balanceOf(wallet.address)}`);
  const uniswap = addressBook.getContract("UniswapRouter").connect(wallet);
  await(await gov["approve(address,uint256)"](uniswap.address, inAmt)).wait();
  await(await uniswap.swapExactTokensForTokens(
    inAmt,
    inAmt,
    [gov.address, sai.address],
    wallet.address,
    BigNumber.from(Date.now() + 1000 * 60),
  )).wait();
  console.log(`Received ${formatEther((await sai.balanceOf(wallet.address)).sub(saiBal))} sai`);

  const outAmt = parseEther("100");
  const govBal = await gov.balanceOf(wallet.address);
  console.log(`Swapping gov for ${formatEther(outAmt)} sai`);
  await(await sai["approve(address,uint256)"](uniswap.address, parseEther("150"))).wait();
  await(await uniswap.swapTokensForExactTokens(
    parseEther("1"),
    parseEther("150"),
    [sai.address, gov.address],
    wallet.address,
    BigNumber.from(Date.now() + 1000 * 60),
  )).wait();
  console.log(`Spent ${formatEther((await gov.balanceOf(wallet.address)).sub(govBal))} gov`);
  console.log(`saiBal=${await sai.balanceOf(wallet.address)} govBal=${await gov.balanceOf(wallet.address)}`);

  await (await pep.poke()).wait();
  [val, has] = await pep.peek();
  console.log(`Pep ready=${has} value=${val}`);
  console.log(`Pep priceCumulativeLast=${await pep.priceCumulativeLast()}`);
  console.log(`Pep blockTimestampLast=${await pep.blockTimestampLast()}`);
  console.log(`Pep priceAverage=${await pep.priceAverage()}`);

  console.log(`\nPep price: ${BigNumber.from(val)}`);

};
