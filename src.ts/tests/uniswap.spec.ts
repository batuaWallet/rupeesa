import { utils } from "ethers";

import { createUniswapOracle, deployContracts } from "../actions";
import { AddressBook } from "../addressBook";

import { alice } from "./constants";
import { expect, getTestAddressBook } from "./utils";

const { hexlify, zeroPad, toUtf8Bytes } = utils;

describe("Uniswap", () => {
  let addressBook: AddressBook;

  beforeEach(async () => {
    addressBook = await getTestAddressBook();
    await deployContracts(alice, addressBook, [
      ["WETH", []],
      ["Gov", [hexlify(zeroPad(toUtf8Bytes("UNI"),32))]],
      ["UniswapFactory", [alice.address]],
      ["UniswapRouter", ["UniswapFactory", "WETH"]],
    ]);
    console.log("UniswapRouter entry: ", addressBook.getEntry("UniswapRouter"));
  });

  it("should be created without error", async () => {
    await expect(createUniswapOracle(alice, addressBook)).to.be.fulfilled;
  });

});
