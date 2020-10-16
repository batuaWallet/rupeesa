import { utils } from "ethers";

import { createUniswapOracle, deployContracts, mintTokens } from "../actions";
import { AddressBook } from "../addressBook";

import { alice } from "./constants";
import { expect, getTestAddressBook } from "./utils";

const { hexlify, zeroPad, toUtf8Bytes } = utils;

describe("Pep", () => {
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
    await expect(mintTokens(alice, addressBook)).to.be.fulfilled;
    await expect(createUniswapOracle(alice, addressBook)).to.be.fulfilled;
  });

  it("should be created without error", async () => {
    const gem = addressBook.getContract("WETH");
    const gov = addressBook.getContract("Gov");
    const uniPair = addressBook.getContract("UniswapPair-GemGov");
    const reserves = await uniPair.getReserves();
    console.log(`Reserves for ${gem.address}/${gov.address}: ${reserves}`);
  });

});
