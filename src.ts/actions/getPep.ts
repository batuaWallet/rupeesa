import { BigNumber, utils, Wallet } from "ethers";

import { AddressBook } from "../addressBook";

import { createUniswapOracle } from "./createUniswapOracle";
import { deployContracts } from "./deployContracts";

const { formatEther, parseEther } = utils;

export const getPep = async (wallet: Wallet, addressBook: AddressBook): Promise<void> => {
  console.log(`\nGetting Pep`);

  await deployContracts(wallet, addressBook, [
    ["Pep", []],
  ]);
  const pep = addressBook.getContract("Pep");

  console.log(`Pep price ready? ${await pep.ready()}`);

  // Next step: deploy a uniswap oracle
  // Last step: call pep.init(pair, isGovZero);

};

export const setPep = async (wallet: Wallet, addressBook: AddressBook): Promise<void> => {
  const gov = addressBook.getContract("Gov");
  const sai = addressBook.getContract("Sai");
  const govAmt = parseEther("100");
  const govPrice = "100";

  await createUniswapOracle({
    Gov: govAmt,
    Sai: govAmt.mul(govPrice),
  }, wallet, addressBook);
  const pair = addressBook.getContract("UniswapPair-GovSai");

  const token0 = await pair.token0();
  const token1 = await pair.token1();
  const govIsIndexZero = gov.address == token0;
  if (gov.address != token1) {
    throw new Error(`Gov=${gov.address} !== token0=${token0} or token1=${token1}`);
  }

  const pep = addressBook.getContract("Pep");
  console.log(`Pep price ready? ${await pep.ready()}`);
  await pep.init(pair.address, govIsIndexZero);

  let [val, has] = await pep.peek();
  console.log(`Pep ready=${has} value=${val}`);

  // Swap to register uniswap price updates
  const inAmt = parseEther("1");
  const saiBal = await sai.balanceOf(wallet.address);
  console.log(`Swapping ${formatEther(inAmt)} gov for sai`);
  console.log(`saiBal=${saiBal} govBal=${await gov.balanceOf(wallet.address)}`);
  const uniswap = addressBook.getContract("UniswapRouter");
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
  await(await sai["approve(address,uint256)"](uniswap.address, parseEther("110"))).wait();
  await(await uniswap.swapTokensForExactTokens(
    parseEther("1"),
    parseEther("110"),
    [sai.address, gov.address],
    wallet.address,
    BigNumber.from(Date.now() + 1000 * 60),
  )).wait();
  console.log(`Spent ${formatEther((await gov.balanceOf(wallet.address)).sub(govBal))} gov`);
  console.log(`saiBal=${await sai.balanceOf(wallet.address)} govBal=${await gov.balanceOf(wallet.address)}`);

  await (await pep.poke()).wait();
  [val, has] = await pep.peek();
  console.log(`Pep ready=${has} value=${val}`);
  console.log(`Pep gov=${await pep.gov()}`);
  console.log(`Pep pair=${await pep.pair()}`);
  console.log(`Pep priceCumulativeLast=${await pep.priceCumulativeLast()}`);
  console.log(`Pep blockTimestampLast=${await pep.blockTimestampLast()}`);
  console.log(`Pep priceAverage=${await pep.priceAverage()}`);

  console.log(`\nPair token0=${await pair.token0()}`);
  console.log(`Pair token1=${await pair.token1()}`);
  console.log(`Pair reserves=${await pair.getReserves()}`);
  console.log(`Pair price0CumulativeLast=${await pair.price0CumulativeLast()}`);
  console.log(`Pair price1CumulativeLast=${await pair.price1CumulativeLast()}`);
  console.log(`Pair kLast=${await pair.kLast()}`);

  console.log(`\nPep price: ${BigNumber.from(val)}`);

};
