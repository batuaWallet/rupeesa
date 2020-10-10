import { utils } from "ethers";

import * as DadFab from "../artifacts/DadFab.json";
import * as DaiFab from "../artifacts/DaiFab.json";
import * as DSAuth from "../artifacts/DSAuth.json";
import * as DSAuthority from "../artifacts/DSAuthority.json";
import * as DSChief from "../artifacts/DSChief.json";
import * as DSChiefApprovals from "../artifacts/DSChiefApprovals.json";
import * as DSChiefFab from "../artifacts/DSChiefFab.json";
import * as DSExec from "../artifacts/DSExec.json";
import * as DSGuard from "../artifacts/DSGuard.json";
import * as DSGuardFactory from "../artifacts/DSGuardFactory.json";
import * as DSMath from "../artifacts/DSMath.json";
import * as DSNote from "../artifacts/DSNote.json";
import * as DSRoles from "../artifacts/DSRoles.json";
import * as DSSpell from "../artifacts/DSSpell.json";
import * as DSSpellBook from "../artifacts/DSSpellBook.json";
import * as DSStop from "../artifacts/DSStop.json";
import * as DSThing from "../artifacts/DSThing.json";
import * as DSToken from "../artifacts/DSToken.json";
import * as DSTokenBase from "../artifacts/DSTokenBase.json";
import * as DSValue from "../artifacts/DSValue.json";
import * as GemFab from "../artifacts/GemFab.json";
import * as GemPit from "../artifacts/GemPit.json";
import * as IERC20 from "../artifacts/IERC20.json";
import * as MomFab from "../artifacts/MomFab.json";
import * as Pep from "../artifacts/Pep.json";
import * as Pip from "../artifacts/Pip.json";
import * as SafeMath from "../artifacts/SafeMath.json";
import * as SaiMom from "../artifacts/SaiMom.json";
import * as SaiTap from "../artifacts/SaiTap.json";
import * as SaiTop from "../artifacts/SaiTop.json";
import * as SaiTub from "../artifacts/SaiTub.json";
import * as SaiVox from "../artifacts/SaiVox.json";
import * as TapFab from "../artifacts/TapFab.json";
import * as TestToken from "../artifacts/TestToken.json";
import * as TopFab from "../artifacts/TopFab.json";
import * as TubFab from "../artifacts/TubFab.json";
import * as UniswapV2Factory from "../artifacts/UniswapV2Factory.json";
import * as UniswapV2Router from "../artifacts/UniswapV2Router.json";
import * as VoxFab from "../artifacts/VoxFab.json";
import * as WETH from "../artifacts/WETH.json";

type Abi = Array<string | utils.FunctionFragment | utils.EventFragment | utils.ParamType>;

type Artifact = {
  contractName: string;
  abi: Abi;
  bytecode: string;
  deployedBytecode: string;
};

type Artifacts = { [contractName: string]: Artifact };

export const artifacts: Artifacts = {
  DadFab,
  DaiFab,
  DSAuth,
  DSAuthority,
  DSChief,
  DSChiefApprovals,
  DSChiefFab,
  DSExec,
  DSGuard,
  DSGuardFactory,
  DSMath,
  DSNote,
  DSRoles,
  DSSpell,
  DSSpellBook,
  DSStop,
  DSThing,
  DSToken,
  DSTokenBase,
  DSValue,
  GemFab,
  GemPit,
  IERC20,
  MomFab,
  Pep,
  Pip,
  SafeMath,
  SaiMom,
  SaiTap,
  SaiTop,
  SaiTub,
  SaiVox,
  TapFab,
  TestToken,
  TopFab,
  TubFab,
  UniswapV2Factory,
  UniswapV2Router,
  VoxFab,
  WETH,
} as any;

export {
  DadFab,
  DaiFab,
  DSAuth,
  DSAuthority,
  DSChief,
  DSChiefApprovals,
  DSChiefFab,
  DSExec,
  DSGuard,
  DSGuardFactory,
  DSMath,
  DSNote,
  DSRoles,
  DSSpell,
  DSSpellBook,
  DSStop,
  DSThing,
  DSToken,
  DSTokenBase,
  DSValue,
  GemFab,
  GemPit,
  IERC20,
  MomFab,
  Pep,
  Pip,
  SafeMath,
  SaiMom,
  SaiTap,
  SaiTop,
  SaiTub,
  SaiVox,
  TapFab,
  TestToken,
  TopFab,
  TubFab,
  UniswapV2Factory,
  UniswapV2Router,
  VoxFab,
  WETH,
};

