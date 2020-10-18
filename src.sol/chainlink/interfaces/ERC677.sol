// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.7.0;

import { IERC20 } from "../../interfaces/IERC20.sol";

interface IERC677 is IERC20 {
  event Transfer(address indexed from, address indexed to, uint value, bytes data);

  function transferAndCall(address to, uint value, bytes calldata data) external returns (bool success);
}
