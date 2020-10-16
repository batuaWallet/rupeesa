import { Contract } from "ethers";

import { getPep } from "../actions";
import { AddressBook } from "../addressBook";

import { alice } from "./constants";
import { getTestAddressBook } from "./utils";

describe.skip("Pep", () => {
  let addressBook: AddressBook;
  let pep: Contract;

  beforeEach(async () => {
    addressBook = await getTestAddressBook();
    await getPep(alice, addressBook);
    pep = addressBook.getContract("Pep");
  });

  it("should be created without error", async () => {
    console.log(`Pep deployed to ${pep.address} (ready=${await pep.ready()})`);
  });


  // it("should be peek-able", async () => {});
  // it("should be poke-able", async () => {});

});
