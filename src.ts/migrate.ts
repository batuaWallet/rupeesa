import { getEthProvider } from "@connext/vector-utils";
import { EtherSymbol, Zero } from "@ethersproject/constants";
import { Contract, providers, utils, Wallet } from "ethers";
import { Argv } from "yargs";

import { artifacts } from "../artifacts";
import { cliOpts, ConstructorArgs } from "../constants";
import { getAddressBook, isContractDeployed, deployContract } from "../utils";
import { registerTransfer } from "./registerTransfer";

const { formatEther } = utils;

export const migrate = async (wallet: Wallet, addressBookPath: string): Promise<void> => {

  ////////////////////////////////////////
  // Environment Setup

  const chainId = process?.env?.REAL_CHAIN_ID || (await wallet.provider.getNetwork()).chainId;
  const balance = await wallet.getBalance();
  const nonce = await wallet.getTransactionCount();
  const providerUrl = (wallet.provider as providers.JsonRpcProvider).connection.url;

  console.log(`\nPreparing to migrate contracts to provider ${providerUrl} w chainId: ${chainId}`);
  console.log(`Deployer address=${wallet.address} nonce=${nonce} balance=${formatEther(balance)}`);

  if (balance.eq(Zero)) {
    throw new Error(`Account ${wallet.address} has zero balance on chain ${chainId}, aborting contract migration`);
  }

  const addressBook = getAddressBook(addressBookPath, chainId.toString());

  ////////////////////////////////////////
  // Deploy contracts

  const deployHelper = async (name: string, args: ConstructorArgs): Promise<Contract> => {
    const savedAddress = addressBook.getEntry(name)["address"];
    if (savedAddress && (await isContractDeployed(name, savedAddress, addressBook, wallet.provider, silent))) {
      console.log(`${name} is up to date, no action required. Address: ${savedAddress}`);
      return new Contract(savedAddress, artifacts[name].abi, wallet);
    } else {
      return await deployContract(name, args || [], wallet, addressBook, silent);
    }
  };

  const mastercopy = await deployHelper("ChannelMastercopy", []);
  await deployHelper("ChannelFactory", [{ name: "mastercopy", value: mastercopy.address }]);
  await deployHelper("TransferRegistry", []);

  // Transfers
  await deployHelper("HashlockTransfer", []);
  await deployHelper("Withdraw", []);

  // Register default transfers
  console.log("\nRegistering Withdraw and HashlockTransfer");
  await registerTransfer("Withdraw", wallet, addressBookPath, silent);
  await registerTransfer("HashlockTransfer", wallet, addressBookPath, silent);

  ////////////////////////////////////////
  // Print summary

  console.log("\nAll done!");
  const spent = formatEther(balance.sub(await wallet.getBalance()));
  const nTx = (await wallet.getTransactionCount()) - nonce;
  console.log(`Sent ${nTx} transaction${nTx === 1 ? "" : "s"} & spent ${EtherSymbol} ${spent}`);
};
