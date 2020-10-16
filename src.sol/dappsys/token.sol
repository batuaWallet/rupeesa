// SPDX-License-Identifier: GPL-3.0
// Copyright (C) 2015, 2016, 2017  DappHub, LLC

// token.sol -- ERC20 implementation with minting and burning

pragma solidity ^0.7.0;

import "../interfaces/IDSToken.sol";

import "./base.sol";
import "./stop.sol";

contract DSToken is IDSToken, DSTokenBase(0), DSStop {

    bytes32  public  override  symbol;
    uint256  public  override  decimals = 18; // standard token precision. override to customize

    constructor(bytes32 symbol_) {
        symbol = symbol_;
    }

    function approve(address guy) public override stoppable returns (bool) {
        return super.approve(guy, uint(-1));
    }

    function approve(address guy, uint wad)
        public
        override(IDSToken, DSTokenBase)
        stoppable
        returns (bool)
    {
        return super.approve(guy, wad);
    }

    function transferFrom(address src, address dst, uint wad)
        public
        override(IDSToken, DSTokenBase)
        stoppable
        returns (bool)
    {
        if (src != msg.sender && _approvals[src][msg.sender] != uint(-1)) {
            _approvals[src][msg.sender] = sub(_approvals[src][msg.sender], wad);
        }

        _balances[src] = sub(_balances[src], wad);
        _balances[dst] = add(_balances[dst], wad);

        Transfer(src, dst, wad);

        return true;
    }

    function push(address dst, uint wad) public override {
        transferFrom(msg.sender, dst, wad);
    }

    function pull(address src, uint wad) public override {
        transferFrom(src, msg.sender, wad);
    }

    function move(address src, address dst, uint wad) public override {
        transferFrom(src, dst, wad);
    }

    function mint(uint wad) public override {
        mint(msg.sender, wad);
    }

    function burn(uint wad) public override {
        burn(msg.sender, wad);
    }

    function mint(address guy, uint wad) public override auth stoppable {
        _balances[guy] = add(_balances[guy], wad);
        _supply = add(_supply, wad);
        emit Mint(guy, wad);
    }

    function burn(address guy, uint wad) public override auth stoppable {
        if (guy != msg.sender && _approvals[guy][msg.sender] != uint(-1)) {
            _approvals[guy][msg.sender] = sub(_approvals[guy][msg.sender], wad);
        }
        _balances[guy] = sub(_balances[guy], wad);
        _supply = sub(_supply, wad);
        emit Burn(guy, wad);
    }

    // Optional token name
    bytes32   public  name = "";

    function setName(bytes32 name_) public auth {
        name = name_;
    }
}
