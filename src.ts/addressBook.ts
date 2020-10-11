import fs from "fs";

import { AddressZero } from "@ethersproject/constants";
import { Contract } from "ethers";

import { artifacts } from "./artifacts";

export type AddressBookEntry = {
  address: string;
  args?: string[];
  creationCodeHash?: string;
  runtimeCodeHash?: string;
  txHash?: string;
};

export type AddressBookJson = {
  [chainId: string]: {
    [contractName: string]: AddressBookEntry;
  };
};

export interface AddressBook {
  getContract: (contractName: string) => Contract;
  getEntry: (contractName: string) => AddressBookEntry;
  setEntry: (contractName: string, entry: AddressBookEntry) => void;
}

export const getAddressBook = (path: string, chainId: string): AddressBook => {
  if (!path) throw new Error(`A path to the address book file is required.`);
  if (!chainId) throw new Error(`A chainId is required.`);
  let addressBook: AddressBookJson = { [chainId]: {} };

  try {
    addressBook = JSON.parse(fs.readFileSync(path, "utf8") || "{}") as AddressBookJson;
  } catch (e) {
    if (e.message.includes("ENOENT: no such file")) {
      fs.writeFileSync(path, `{"${chainId}":{}}`);
    } else {
      throw e;
    }
  }

  addressBook = addressBook || {};
  addressBook[chainId] = addressBook[chainId] || {};

  const getEntry = (contractName: string): AddressBookEntry => {
    try {
      return addressBook[chainId][contractName] || { address: AddressZero };
    } catch (e) {
      return { address: AddressZero };
    }
  };

  const setEntry = (contractName: string, entry: AddressBookEntry): void => {
    addressBook[chainId][contractName] = entry;
    try {
      fs.writeFileSync(path, JSON.stringify(addressBook, null, 2));
    } catch (e) {
      throw Error(`setEntry(${contractName}, ${JSON.stringify(entry)}): ${e.message}`);
    }
  };

  const getContract = (contractName: string): Contract => {
    const entry = getEntry(contractName);
    if (entry.address == AddressZero) {
      throw Error(`getContract(${contractName}): NO_ADDRESS_BOOK_ENTRY`);
    }
    const artifact = artifacts[contractName];
    if (!artifact) {
      throw Error(`getContract(${contractName}): NO_AVAILABLE_ARTIFACTS`);
    }
    return new Contract(entry.address, artifact.abi);
  };

  return { getContract, getEntry, setEntry };
};
