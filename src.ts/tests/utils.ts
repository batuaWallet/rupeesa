import promised from "chai-as-promised";
import { use } from "chai";
import { waffleChai } from "@ethereum-waffle/chai";
import { utils } from "ethers";

import { AddressBook, getAddressBook } from "../addressBook";

import { addressBookPath, alice, provider } from "./constants";

const { randomBytes, hexlify } = utils;

use(promised);
use(waffleChai);

// Returns a different address book every time
export const getTestAddressBook = async (): Promise<AddressBook> => getAddressBook(
  addressBookPath.replace(".json", `.${hexlify(randomBytes(8)).substring(2)}.json`),
  (await provider.getNetwork()).chainId.toString(),
  alice,
);

export { expect } from "chai";
