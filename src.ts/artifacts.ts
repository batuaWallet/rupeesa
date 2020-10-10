import { utils } from "ethers";

import * as TestToken from "../artifacts/TestToken.json";

type Abi = Array<string | utils.FunctionFragment | utils.EventFragment | utils.ParamType>;

type Artifact = {
  contractName: string;
  abi: Abi;
  bytecode: string;
  deployedBytecode: string;
};

type Artifacts = { [contractName: string]: Artifact };

export const artifacts: Artifacts = {
  TestToken,
} as any;

export {
  TestToken,
};

