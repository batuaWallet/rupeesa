import { constants, Contract, ContractFactory, Wallet, providers, utils, BigNumber } from "ethers";

import { AddressBook, AddressBookEntry } from "./addressBook";
import { artifacts } from "./artifacts";

const { EtherSymbol } = constants;
const { formatEther, keccak256, parseUnits } = utils;

const hash = (input: string): string => keccak256(`0x${input.replace(/^0x/, "")}`);

// Simple sanity checks to make sure contracts from our address book have been deployed
export const isContractDeployed = async (
  name: string,
  address: string | undefined,
  addressBook: AddressBook,
  provider: providers.Provider,
): Promise<boolean> => {
  console.log(`\nChecking for valid ${name} contract...`);
  if (!address || address === "") {
    console.log("This contract is not in our address book.");
    return false;
  }
  const savedCreationCodeHash = addressBook.getEntry(name).creationCodeHash;
  if (!artifacts || !artifacts[name]) {
    throw new Error(`No contract artifacts are available for ${name}`);
  }
  const creationCodeHash = hash(artifacts[name].bytecode || "0x00");
  if (!savedCreationCodeHash || savedCreationCodeHash !== creationCodeHash) {
    console.log(`creationCodeHash in our address book doen't match ${name} artifacts`);
    return false;
  }
  const savedRuntimeCodeHash = addressBook.getEntry(name).runtimeCodeHash;
  const runtimeCodeHash = hash(await provider.getCode(address));
  if (runtimeCodeHash === hash("0x00") || runtimeCodeHash === hash("0x")) {
    console.log("No runtimeCode exists at the address in our address book");
    return false;
  }
  if (savedRuntimeCodeHash !== runtimeCodeHash) {
    console.log(`runtimeCodeHash for ${address} does not match what's in our address book`);
    return false;
  }
  return true;
};

export const deployContract = async (
  name: string,
  args: string[],
  wallet: Wallet,
  addressBook: AddressBook,
): Promise<Contract> => {
  console.log(`Deploying ${name} with args [${args.join(", ")}]`);
  // NOTE: No special case for testnet token bc non-testnet-tokens are not mintable & throw errors
  const factory = ContractFactory.fromSolidity(artifacts[name]).connect(wallet);
  const deployTx = factory.getDeployTransaction(...args);
  const tx = await wallet.sendTransaction({
    ...deployTx,
    gasLimit: BigNumber.from("50000000"),
    gasPrice: parseUnits("100", 9),
  });
  console.log(`Sent transaction to deploy ${name}, txHash: ${tx.hash}`);
  const receipt = await tx.wait();
  const address = Contract.getContractAddress(tx);
  const contract = new Contract(address, artifacts[name].abi, wallet);

  console.log(`Success! Consumed ${receipt.gasUsed} gas worth ${EtherSymbol} ${formatEther(receipt.gasUsed.mul(tx.gasPrice))} deploying ${name} to address: ${address}`);
  const runtimeCodeHash = hash(await wallet.provider.getCode(address));
  const creationCodeHash = hash(artifacts[name].bytecode);
  addressBook.setEntry(name, {
    address,
    args: args.length === 0 ? undefined : args,
    creationCodeHash,
    runtimeCodeHash,
    txHash: tx.hash,
  } as AddressBookEntry);

  return contract;
};
