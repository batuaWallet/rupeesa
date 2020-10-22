import { Contract, utils, BigNumber } from "ethers";
import * as sigUtil from "eth-sig-util";

import { Rocket } from "../artifacts";
import { deployContracts } from "../actions";
import { AddressBook } from "../addressBook";

import { alice, bob } from "./constants";
import { getTestAddressBook } from "./utils";

const domainType = [
    { name: "name", type: "string" },
    { name: "version", type: "string" },
    { name: "chainId", type: "uint256" },
    { name: "verifyingContract", type: "address" }
  ];

const metaTransactionType = [
  { name: "nonce", type: "uint256" },
  { name: "from", type: "address" },
  { name: "functionSignature", type: "bytes" }
];

describe.only("Rkt", () => {
  const rktI = new utils.Interface(Rocket.abi);
  let addressBook: AddressBook;
  let rkt: Contract;
  let domainData: any;


  beforeEach(async () => {
    addressBook = await getTestAddressBook();
    await deployContracts(alice, addressBook, [
      ["Rocket", ["Rocket", "RKT", "18", alice.address]],
    ]);
    rkt = addressBook.getContract("Rocket");

    domainData = {
      name: "Rocket",
      version: "1",
      chainId: 80001,
      verifyingContract: rkt.address
    };

  });

  it("should be created without error", async () => {
    console.log(`Rkt deployed to ${rkt.address}`);
  });

  it("should be able to mint by chainManager aka alice rn", async () => {
    await rkt.deposit(alice.address, utils.defaultAbiCoder.encode(['uint256'], [100]));

    const functionSignature = rktI.encodeFunctionData('transfer', [ bob.address, BigNumber.from(10)]);
    const nonce = (await rkt.getNonce(alice.address)).toNumber();
    const msg = {
      nonce,
      from: alice.address,
      functionSignature
    };

    const dataToSIgn = {
      types: {
        EIP712Domain: domainType,
        MetaTransaction: metaTransactionType
      },
      domain: domainData,
      primaryType: 'MetaTransaction' as const,
      message: msg
    }
      
    const signedMsg = sigUtil.signTypedData_v4(
      Buffer.from(alice.privateKey.slice(2,66), 'hex'),
      { data: dataToSIgn }
    );

    const sigParams = utils.splitSignature(signedMsg);

    await rkt.executeMetaTransaction(
      alice.address,
      functionSignature,
      sigParams.r,
      sigParams.s,
      sigParams.v
    );
   });

  // it("should be poke-able", async () => {});

});
