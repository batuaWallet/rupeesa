// SPDX-License-Identifier: GPL-3.0
// Copyright (C) 2017  DappHub, LLC

// value.sol - a value is a simple thing, it can be get and set

pragma solidity ^0.7.0;

import "../interfaces/IDSValue.sol";

import "./thing.sol";

contract DSValue is IDSValue, DSThing {
    bool    has;
    bytes32 val;

    function peek() public override view returns (bytes32, bool) {
        return (val,has);
    }

    function read() public override view returns (bytes32) {
        (bytes32 wut, bool haz) = peek();
        assert(haz);
        return wut;
    }

    function poke(bytes32 wut) public override payable {
        val = wut;
        has = true;
    }

    function void() public override payable {
        has = false;
    }
}
