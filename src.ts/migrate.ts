import { EtherSymbol, Zero } from "@ethersproject/constants";
import { Contract, providers, utils, Wallet } from "ethers";

import { getAddressBook } from "./addressBook";
import { artifacts } from "./artifacts";
import { isContractDeployed, deployContract } from "./deployContract";

const { formatEther } = utils;

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
    ["TestToken", []],
    ["WETH", []],
    ["GemFab", []],
    ["VoxFab", []],
    ["TubFab", []],
    ["TapFab", []],
    ["TopFab", []],
    ["MomFab", []],
    ["DadFab", []],
    ["DaiFab", ["GemFab", "VoxFab", "TubFab", "TapFab", "TopFab", "MomFab", "DadFab"]],
  ] as [string, string[]][];

  const registry = {} as any;
  for (const [name, args] of schema) {
    console.log(`Deploying ${name} with args [${args.join(", ")}]`);
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

  ////////////////////////////////////////
  // Print summary

  console.log("\nAll done!");
  const spent = formatEther(balance.sub(await wallet.getBalance()));
  const nTx = (await wallet.getTransactionCount()) - nonce;
  console.log(`Sent ${nTx} transaction${nTx === 1 ? "" : "s"} & spent ${EtherSymbol} ${spent}`);
};
