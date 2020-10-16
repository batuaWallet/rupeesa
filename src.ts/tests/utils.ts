import promised from "chai-as-promised";
import { use } from "chai";
import { waffleChai } from "@ethereum-waffle/chai";

import { AddressBook, getAddressBook } from "../addressBook";

import { addressBookPath, alice, provider } from "./constants";

use(promised);
use(waffleChai);

export { expect } from "chai";

// Returns a different address book every time
export const getTestAddressBook = async (): Promise<AddressBook> => getAddressBook(
  addressBookPath.replace(".json", `.${Date.now()}.json`),
  (await provider.getNetwork()).chainId.toString(),
  alice,
);
