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
    console.log('========== 1')
    const gem = addressBook.getContract("WETH");
    console.log('========== 2')
    const gov = addressBook.getContract("Gov");
    console.log('========== 3')
    const uniPair = addressBook.getContract("UniswapPair-GemGov");
    console.log('========== 4')
    const reserves = await uniPair.getReserves();
    console.log('========== 5')
    console.log(`Resevers for ${gem.address}/${gov.address}: ${JSON.stringify(reserves, null, 2)}`);
    console.log('========== 6')
  });

});
