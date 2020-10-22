import { Two, Zero } from "@ethersproject/constants";
import { BigNumber, utils, Wallet } from "ethers";

import { AddressBook, AddressBookEntry } from "../addressBook";

import { deployContracts } from "./contracts";

const { formatEther, hexZeroPad, parseEther, parseUnits } = utils;

export const deploySai = async (wallet: Wallet, addressBook: AddressBook): Promise<void> => {
  console.log(`\nDeploying Sai`);

  await deployContracts(wallet, addressBook, [
    ["GemFab", []],
    ["VoxFab", []],
    ["TubFab", []],
    ["TapFab", []],
    ["TopFab", []],
    ["MomFab", []],
    ["DadFab", []],
    ["GemPit", []],
    ["SaiFab", ["GemFab", "VoxFab", "TubFab", "TapFab", "TopFab", "MomFab", "DadFab"]],
  ]);

  const fab = addressBook.getContract("SaiFab").connect(wallet); // builder
  const weth = addressBook.getContract("Weth").connect(wallet);
  let step;
  let tx;

  step = await fab.step();
  console.log(`Fab ${fab.address} is on step ${step}`);

  if (step.toString() === "0") {
    console.log(`Making tokens..`);
    tx = await fab.makeTokens();
    await tx.wait();
    const sai = await fab.sai();
    addressBook.setEntry("Sai", { address: sai, txHash: tx.hash } as AddressBookEntry);
    const sin = await fab.sin();
    addressBook.setEntry("Sin", { address: sin, txHash: tx.hash } as AddressBookEntry);
    const skr = await fab.skr();
    addressBook.setEntry("Skr", { address: skr, txHash: tx.hash } as AddressBookEntry);
    console.log(`sai=${sai} | sin=${sin} | skr=${skr}`);
    step = await fab.step();
    console.log(`Fab ${fab.address} is on step ${step}`);
  }

  if (step.toString() === "1") {
    console.log(`Making Vox & Tub..`);
    const gem = weth.address; // collateral
    const gov = addressBook.getContract("Gov").address; // governance token eg MKR
    const pip = addressBook.getContract("Pip").address; // TODO: reference price feed
    const pep = addressBook.getContract("Pep").address; // TODO: governance price feed
    const pit = addressBook.getContract("GemPit").address; // governance fee destination
    tx = await fab.makeVoxTub(gem, gov, pip, pep, pit);
    await tx.wait();
    const vox = await fab.vox();
    addressBook.setEntry("SaiVox", { address: vox, txHash: tx.hash } as AddressBookEntry);
    const tub = await fab.tub();
    addressBook.setEntry("SaiTub", { address: tub, txHash: tx.hash } as AddressBookEntry);
    console.log(`vox=${vox} | tub=${tub}`);
    step = await fab.step();
    console.log(`Fab ${fab.address} is on step ${step}`);
  }

  if (step.toString() === "2") {
    console.log(`Making Tap & Top..`);
    tx = await fab.makeTapTop();
    await tx.wait();
    const tap = await fab.tap();
    addressBook.setEntry("SaiTap", { address: tap, txHash: tx.hash } as AddressBookEntry);
    const top = await fab.top();
    console.log(`tap=${tap} | top=${top}`);
    addressBook.setEntry("SaiTop", { address: top, txHash: tx.hash } as AddressBookEntry);
    step = await fab.step();
    console.log(`Fab ${fab.address} is on step ${step}`);
  }

  if (step.toString() === "3") {
    console.log(`Configuring params..`);
    await (await fab.configParams({ gasLimit: parseUnits("7", 6) })).wait();
    step = await fab.step();
    console.log(`Fab ${fab.address} is on step ${step}`);
  }

  if (step.toString() === "4") {
    console.log(`Verifying params..`);
    await (await fab.verifyParams({ gasLimit: parseUnits("7", 6) })).wait();
    step = await fab.step();
    console.log(`Fab ${fab.address} is on step ${step}`);
  }

  if (step.toString() === "5") {
    console.log(`Configuring auth..`);
    const governance = addressBook.getContract("Governance").connect(wallet);
    await (await fab.configAuth(governance.address)).wait();
    step = await fab.step();
    console.log(`Fab ${fab.address} is on step ${step}`);
  }

  console.log(`Single collateral Sai has been deployed to ${await fab.sai()}`);

  const sai = addressBook.getContract("Sai").connect(wallet);
  const tub = addressBook.getContract("SaiTub").connect(wallet);
  const skr = addressBook.getContract("Skr").connect(wallet);

  const totalSupply = await sai.totalSupply();

  // Mint some Sai
  if (totalSupply.eq(Zero)) {

    /* TODO: how does governance work to raise the debt ceiling?
    console.log(`Raising the dai debt ceiling (tax)`);
    console.log(`"cap" => ${utils.formatBytes32String("cap")}`);
    console.log(`tub owner: ${await tub.owner()}`);
    console.log(`Raising dai debt ceiling (tax) from ${formatEther(await tub.tax())}`);
    await (await tub.mold(utils.formatBytes32String("cap"), parseEther("1000000"))).wait();
    console.log(`Dai debt ceiling (tax) set to ${formatEther(await tub.tax())}`);
    */

    console.log(`Sai supply is zero, minting some`);
    const depositAmount = parseEther("10");
    await (await weth.deposit({ value: depositAmount })).wait();
    await (await weth.approve(tub.address, depositAmount)).wait();
    await (await tub.join(depositAmount)).wait();
    console.log(`Tub.join was a major success`);
    const skrBal = await skr.balanceOf(wallet.address);
    console.log(`We got ${formatEther(skrBal)} SKKRRRRR`);

    console.log(`cupi before: ${await tub.cupi()}`);
    (await tub.open()).wait();
    const cupi = await tub.cupi();
    const cup = hexZeroPad(cupi, 32);
    console.log(`cupi=${cupi} | cup=${cup}`);
    const cupInfo = await tub.cups(cup);
    console.log(`Opened CDP #${cupi}: ${cupInfo}`);
    console.log(`CDP lad: ${await tub.lad(cup)}`);

    // TODO: assert that we are using the proper cup number

    await (await skr["approve(address)"](tub.address)).wait();
    await (await tub.lock(cup, skrBal)).wait();
    console.log(`Locked all of our SKRR`);
    console.log(`CDP #${cupi} Status: ${await tub.cups(cup)}`);

    const pip = addressBook.getContract("Pip").connect(wallet);

    const inrPerEth = formatEther(BigNumber.from(await pip.read())).split(".")[0];
    console.log(`inrPerEth=${inrPerEth}`);
    const drawAmt = BigNumber.from(inrPerEth).mul(depositAmount).div(Two);

    console.log(`Drawing ${formatEther(drawAmt)} Sai from cup ${cup}`);
    await (await tub.draw(cup, drawAmt, { gasLimit: parseUnits("7", 6) })).wait();
    console.log(`Drew a bunch of Sai`);

  }

  console.log(`Sai supply is ${formatEther(await sai.totalSupply())}`);

};
