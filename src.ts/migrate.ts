import { EtherSymbol, Zero } from "@ethersproject/constants";
import { Contract, providers, utils, Wallet } from "ethers";

import { getAddressBook } from "./addressBook";
import { artifacts } from "./artifacts";
import { isContractDeployed, deployContract } from "./deployContract";

const { formatEther, hexlify, toUtf8Bytes, zeroPad } = utils;

export const migrate = async (ethProviderUrl: string, mnemonic: string, addressBookPath: string): Promise<void> => {

  const provider = new providers.JsonRpcProvider(ethProviderUrl);
  const wallet = Wallet.fromMnemonic(mnemonic).connect(provider);

  ////////////////////////////////////////
  // Environment Setup

  const chainId = (await wallet.provider.getNetwork()).chainId.toString();
  const balance = await wallet.getBalance();
  const nonce = await wallet.getTransactionCount();

  console.log(`\nPreparing to migrate contracts to ${ethProviderUrl} w chainId: ${chainId}`);
  console.log(`Deployer address=${wallet.address} nonce=${nonce} balance=${formatEther(balance)}`);

  if (balance.eq(Zero)) {
    throw new Error(`Account ${wallet.address} has zero balance on chain ${chainId}, aborting contract migration`);
  }

  const addressBook = getAddressBook(addressBookPath, chainId);

  ////////////////////////////////////////
  // Deploy contracts

  const schema = [
    ["DSToken", [hexlify(zeroPad(toUtf8Bytes("COW"),32))]],
    ["WETH", []],
    ["GemFab", []],
    ["VoxFab", []],
    ["TubFab", []],
    ["TapFab", []],
    ["TopFab", []],
    ["MomFab", []],
    ["DadFab", []],
    ["GemPit", []],
    ["DaiFab", ["GemFab", "VoxFab", "TubFab", "TapFab", "TopFab", "MomFab", "DadFab"]],
  ] as [string, string[]][];

  const registry = {} as any;
  for (const [name, args] of schema) {
    const savedAddress = addressBook.getEntry(name)["address"];
    if (
      savedAddress &&
      await isContractDeployed(name, savedAddress, addressBook, wallet.provider)
    ) {
      console.log(`${name} is up to date, no action required. Address: ${savedAddress}`);
      registry[name] = new Contract(savedAddress, artifacts[name].abi, wallet);
    } else {
      registry[name] = await deployContract(
        name,
        args.map((arg: string): string => {
          return Object.keys(registry).includes(arg) ? registry[arg].address : arg;
        }),
        wallet,
        addressBook,
      );
    }
  }

  const fab = registry.DaiFab;
  let step;
  let tx;

  step = await fab.step();
  console.log(`Fab ${fab.address} is on step ${step}`);

  if (step.toString() === "0") {
    console.log(`Making tokens..`);
    tx = await fab.makeTokens();
    await provider.waitForTransaction(tx.hash);
    console.log(`sai=${await fab.sai()} | sin=${await fab.sin()} | skr=${await fab.skr()}`);
    step = await fab.step();
    console.log(`Fab ${fab.address} is on step ${step}`);
  }

  if (step.toString() === "1") {
    console.log(`Making Vox & Tub..`);
    const gem = registry.WETH.address; // collateral aka weth
    const gov = registry.DSToken.address; // governance token eg MKR
    const pip = hexlify(zeroPad("0x01", 20)); // TODO: reference price feed
    const pep = hexlify(zeroPad("0x02", 20)); // TODO: governance price feed
    const pit = registry.GemPit.address; // governance fee destination
    tx = await fab.makeVoxTub(gem, gov, pip, pep, pit);
    await provider.waitForTransaction(tx.hash);
    step = await fab.step();
    console.log(`Fab ${fab.address} is on step ${step}`);
  }

  if (step.toString() === "2") {
    console.log(`Making Tap & Top..`);
    tx = await fab.makeTapTop();
    await provider.waitForTransaction(tx.hash);
    step = await fab.step();
    console.log(`Fab ${fab.address} is on step ${step}`);
  }

  if (step.toString() === "3") {
    console.log("\nAll done!");
    const spent = formatEther(balance.sub(await wallet.getBalance()));
    const nTx = (await wallet.getTransactionCount()) - nonce;
    console.log(`Sent ${nTx} transaction${nTx === 1 ? "" : "s"} & spent ${EtherSymbol} ${spent}`);
  }

};
