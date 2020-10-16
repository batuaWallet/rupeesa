// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.7.0;

import "./dappsys/token.sol";

contract Gov is DSToken {
    constructor(bytes32 symbol) DSToken(symbol) {}
}
