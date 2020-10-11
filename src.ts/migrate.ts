import { AddressZero, EtherSymbol, Zero } from "@ethersproject/constants";
import { Contract, providers, utils, Wallet } from "ethers";

import { getAddressBook, AddressBookEntry } from "./addressBook";
import { artifacts } from "./artifacts";
import { isContractDeployed, deployContract } from "./deployContract";

const { formatEther, parseEther, hexlify, toUtf8Bytes, zeroPad } = utils;

export const migrate = async (ethProviderUrl: string, mnemonic: string, addressBookPath: string): Promise<void> => {

  const provider = new providers.JsonRpcProvider(ethProviderUrl);
  const wallet = Wallet.fromMnemonic(mnemonic).connect(provider);

  ////////////////////////////////////////
  // Environment Setup

  const chainId = (await wallet.provider.getNetwork()).chainId.toString();
  const startBalance = await wallet.getBalance();
  const startNonce = await wallet.getTransactionCount();

  console.log(`\nPreparing to migrate contracts to ${ethProviderUrl} w chainId: ${chainId}`);
  console.log(`Deployer address=${wallet.address} nonce=${startNonce} balance=${formatEther(startBalance)}`);

  if (startBalance.eq(Zero)) {
    throw new Error(`Account ${wallet.address} has zero balance on chain ${chainId}, aborting contract migration`);
  }

  const addressBook = getAddressBook(addressBookPath, chainId);

  ////////////////////////////////////////
  // Deploy contracts

  const schema = [
    ["WETH", []],
    ["DSToken", [hexlify(zeroPad(toUtf8Bytes("GOV"),32))]],
    ["UniswapFactory", [wallet.address]],
    ["UniswapRouter", ["UniswapFactory", "WETH"]],
    ["Pip", []],
    ["Pep", []],
    ["GemFab", []],
    ["VoxFab", []],
    ["TubFab", []],
    ["TapFab", []],
    ["TopFab", []],
    ["MomFab", []],
    ["DadFab", []],
    ["GemPit", []],
    ["DaiFab", ["GemFab", "VoxFab", "TubFab", "TapFab", "TopFab", "MomFab", "DadFab"]],
  ] as [string, string[]][];

  const registry = {} as any;
  for (const [name, args] of schema) {
    const savedAddress = addressBook.getEntry(name)["address"];
    if (
      savedAddress &&
      await isContractDeployed(name, savedAddress, addressBook, wallet.provider)
    ) {
      console.log(`${name} is up to date, no action required. Address: ${savedAddress}`);
      registry[name] = new Contract(savedAddress, artifacts[name].abi, wallet);
    } else {
      registry[name] = await deployContract(
        name,
        args.map((arg: string): string => {
          return Object.keys(registry).includes(arg) ? registry[arg].address : arg;
        }),
        wallet,
        addressBook,
      );
    }
  }

  const weth = registry.WETH; // collateral aka weth

  const gem = weth; // collateral aka weth
  const gov = registry.DSToken; // governance token eg MKR
  const pip = registry.Pip; // TODO: reference price feed
  const pep = registry.Pep; // TODO: governance price feed
  const pit = registry.GemPit; // governance fee destination

  let balance;
  let tx;

  ////////////////////////////////////////
  // Mint Tokens
  console.log("\nChecking Tokens..");

  balance = await gem.balanceOf(wallet.address);
  if (balance.eq(Zero)) {
    console.log(`Depositing ETH to get WETH aka GEM`);
    tx = await gem.deposit({ value: parseEther("1000") });
    await provider.waitForTransaction(tx.hash);
    balance = await gem.balanceOf(wallet.address);
  }
  console.log(`GEM balance: ${formatEther(balance)}`);

  balance = await gov.balanceOf(wallet.address);
  if (balance.eq(Zero)) {
    console.log(`Mintin some Govs`);
    tx = await gov["mint(uint256)"](parseEther("10000"));
    await provider.waitForTransaction(tx.hash);
    balance = await gov.balanceOf(wallet.address);
  }
  console.log(`GOV balance: ${formatEther(balance)}`);

  ////////////////////////////////////////
  // Create Uniswap Pools
  console.log("\nChecking Uniswap Pools..");

  const uniswapFactory = registry.UniswapFactory;
  const uniswapRouter = registry.UniswapRouter;

  let pairAddress = await uniswapFactory.getPair(gem.address, gov.address);
  if (!pairAddress || pairAddress === AddressZero) {
    console.log(`Deploying new uniswap pair`);
    tx = await uniswapFactory.createPair(gem.address, gov.address);
    await provider.waitForTransaction(tx.hash);
    pairAddress = await uniswapFactory.getPair(gem.address, gov.address);
    addressBook.setEntry("UniswapPair-GemGov", {
      address: pairAddress,
      args: [gem.address, gov.address],
      txHash: tx.hash,
    } as AddressBookEntry);
  }
  const pair = new Contract(pairAddress, artifacts["UniswapPair"].abi, wallet);
  console.log(`Uniswap pair is at ${pairAddress} for ${gem.address}:${gov.address}`);

  let reserves = await pair.getReserves();
  if (reserves[0].eq(Zero)) {
    const ethAmt = parseEther("100");
    const govAmt = parseEther("1000");
    console.log(`Approving tokens | ${Object.keys(gov)} | ${Object.keys(gov.functions)}`);
    tx = await gov["approve(address,uint256)"](uniswapRouter.address, govAmt);
    await provider.waitForTransaction(tx.hash);
    console.log(`Adding liquidity | ${Object.keys(gov)} | ${Object.keys(gov.functions)}`);
    tx = await uniswapRouter.addLiquidityETH(
      gov.address,
      ethAmt,
      ethAmt,
      govAmt,
      wallet.address,
      Date.now() + 1000 * 60,
      { value: ethAmt },
    );
    await provider.waitForTransaction(tx.hash);
    reserves = await pair.getReserves();
  }
  console.log(`Uniswap pair ${pairAddress} has reserves: ${reserves}`);

  ////////////////////////////////////////
  // Execute the Fab build process

  console.log("\nChecking SCD..");
  const fab = registry.DaiFab;
  let step;

  step = await fab.step();
  console.log(`Fab ${fab.address} is on step ${step}`);

  if (step.toString() === "0") {
    console.log(`Making tokens..`);
    tx = await fab.makeTokens();
    await provider.waitForTransaction(tx.hash);
    const sai = await fab.sai();
    addressBook.setEntry("SAI", { address: sai, txHash: tx.hash } as AddressBookEntry);
    const sin = await fab.sin();
    addressBook.setEntry("SIN", { address: sin, txHash: tx.hash } as AddressBookEntry);
    const skr = await fab.skr();
    addressBook.setEntry("SKR", { address: skr, txHash: tx.hash } as AddressBookEntry);
    console.log(`sai=${sai} | sin=${sin} | skr=${skr}`);
    step = await fab.step();
    console.log(`Fab ${fab.address} is on step ${step}`);
  }

  if (step.toString() === "1") {
    console.log(`Making Vox & Tub..`);
    tx = await fab.makeVoxTub(gem.address, gov.address, pip.address, pep.address, pit.address);
    await provider.waitForTransaction(tx.hash);
    step = await fab.step();
    console.log(`Fab ${fab.address} is on step ${step}`);
  }

  if (step.toString() === "2") {
    console.log(`Making Tap & Top..`);
    tx = await fab.makeTapTop();
    await provider.waitForTransaction(tx.hash);
    step = await fab.step();
    console.log(`Fab ${fab.address} is on step ${step}`);
  }

  ////////////////////////////////////////
  // Print summary

  console.log("\nAll done!");
  const spent = formatEther(startBalance.sub(await wallet.getBalance()));
  const nTx = (await wallet.getTransactionCount()) - startNonce;
  console.log(`Sent ${nTx} transaction${nTx === 1 ? "" : "s"} & spent ${EtherSymbol} ${spent}`);

};
