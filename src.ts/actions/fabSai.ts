import { Wallet } from "ethers";

import { AddressBook, AddressBookEntry } from "../addressBook";

export const fabSai = async (wallet: Wallet, addressBook: AddressBook): Promise<void> => {

  const weth = addressBook.getContract("Weth").connect(wallet);
  const gem = weth; // collateral
  const gov = addressBook.getContract("Gov").connect(wallet); // governance token eg MKR
  const pip = addressBook.getContract("Pip").connect(wallet); // TODO: reference price feed
  const pep = addressBook.getContract("Pep").connect(wallet); // TODO: governance price feed
  const pit = addressBook.getContract("GemPit").connect(wallet); // governance fee destination
  const fab = addressBook.getContract("SaiFab").connect(wallet); // builder

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
    tx = await fab.makeVoxTub(gem.address, gov.address, pip.address, pep.address, pit.address);
    await wallet.provider.waitForTransaction(tx.hash);
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
    await wallet.provider.waitForTransaction(tx.hash);
    const tap = await fab.tap();
    addressBook.setEntry("SaiTap", { address: tap, txHash: tx.hash } as AddressBookEntry);
    const top = await fab.top();
    console.log(`tap=${tap} | top=${top}`);
    addressBook.setEntry("SaiTop", { address: top, txHash: tx.hash } as AddressBookEntry);
    step = await fab.step();
    console.log(`Fab ${fab.address} is on step ${step}`);
  }

  console.log(`Single collateral Sai has been deployed to ${await fab.sai()}`);
  // TODO: add new contracts to address book

};
