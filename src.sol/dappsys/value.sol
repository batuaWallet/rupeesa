// SPDX-License-Identifier: GPL-3.0
// Copyright (C) 2017  DappHub, LLC

// value.sol - a value is a simple thing, it can be get and set

pragma solidity ^0.7.0;

import "./thing.sol";

contract DSValue is DSThing {
    bool    has;
    bytes32 val;
    function peek() public view returns (bytes32, bool) {
        return (val,has);
    }
    function read() public view returns (bytes32) {
        var (wut, haz) = peek();
        assert(haz);
        return wut;
    }
    function poke(bytes32 wut) public note auth {
        val = wut;
        has = true;
    }
    function void() public note auth {  // unset the value
        has = false;
    }
}
