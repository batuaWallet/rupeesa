import promised from "chai-as-promised";
import { use } from "chai";
import { waffleChai } from "@ethereum-waffle/chai";
import { utils } from "ethers";

import { AddressBook, getAddressBook } from "../addressBook";

import { addressBookPath, provider } from "./constants";

const { randomBytes, hexlify } = utils;

use(promised);
use(waffleChai);

// Returns a different address book every time
export const getTestAddressBook = async (): Promise<AddressBook> => getAddressBook(
  addressBookPath.replace(".json", `.${hexlify(randomBytes(16)).substring(2)}.json`),
  (await provider.getNetwork()).chainId.toString(),
);

export { expect } from "chai";
