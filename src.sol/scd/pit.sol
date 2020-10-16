// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2017  Rain Break <rainbreak@riseup.net>

// pit.sol -- a simple token burner

pragma solidity ^0.7.0;

import "../dappsys/token.sol";

contract GemPit {
    function burn(DSToken gem) public {
        gem.burn(gem.balanceOf(address(this)));
    }
}
