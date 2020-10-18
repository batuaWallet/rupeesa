import { Contract } from "ethers";

import { deployPip } from "../actions";
import { AddressBook } from "../addressBook";

import { alice } from "./constants";
import { getTestAddressBook } from "./utils";

describe("Pip", () => {
  let addressBook: AddressBook;
  let pip: Contract;

  beforeEach(async () => {
    addressBook = await getTestAddressBook();
    await deployPip(alice, addressBook);
    pip = addressBook.getContract("Pip");
  });

  it("should be created without error", async () => {
    console.log(`Pip deployed to ${pip.address} (price=${await pip.currentPrice()})`);
  });

  // it("should be peek-able", async () => {});
  // it("should be poke-able", async () => {});

});
