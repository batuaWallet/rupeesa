import { Wallet } from "ethers";

import { AddressBook, AddressBookEntry } from "../addressBook";

export const fabDai = async (wallet: Wallet, addressBook: AddressBook): Promise<void> => {

  const weth = addressBook.getContract("WETH").connect(wallet);
  const gem = weth; // collateral
  const gov = addressBook.getContract("DSToken").connect(wallet); // governance token eg MKR
  const pip = addressBook.getContract("Pip").connect(wallet); // TODO: reference price feed
  const pep = addressBook.getContract("Pep").connect(wallet); // TODO: governance price feed
  const pit = addressBook.getContract("Pit").connect(wallet); // governance fee destination
  const fab = addressBook.getContract("DaiFab").connect(wallet); // builder

  let tx;

  console.log("\nChecking SCD..");
  let step;

  step = await fab.step();
  console.log(`Fab ${fab.address} is on step ${step}`);

  if (step.toString() === "0") {
    console.log(`Making tokens..`);
    tx = await fab.makeTokens();
    await wallet.provider.waitForTransaction(tx.hash);
    const sai = await fab.sai();
    addressBook.setEntry("SAI", { address: sai, txHash: tx.hash } as AddressBookEntry);
    const sin = await fab.sin();
    addressBook.setEntry("SIN", { address: sin, txHash: tx.hash } as AddressBookEntry);
    const skr = await fab.skr();
    addressBook.setEntry("SKR", { address: skr, txHash: tx.hash } as AddressBookEntry);
    console.log(`sai=${sai} | sin=${sin} | skr=${skr}`);
    step = await fab.step();
    console.log(`Fab ${fab.address} is on step ${step}`);
  }

  if (step.toString() === "1") {
    console.log(`Making Vox & Tub..`);
    tx = await fab.makeVoxTub(gem.address, gov.address, pip.address, pep.address, pit.address);
    await wallet.provider.waitForTransaction(tx.hash);
    step = await fab.step();
    console.log(`Fab ${fab.address} is on step ${step}`);
  }

  if (step.toString() === "2") {
    console.log(`Making Tap & Top..`);
    tx = await fab.makeTapTop();
    await wallet.provider.waitForTransaction(tx.hash);
    step = await fab.step();
    console.log(`Fab ${fab.address} is on step ${step}`);
  }

};
