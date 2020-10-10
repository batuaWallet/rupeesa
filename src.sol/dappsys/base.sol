// SPDX-License-Identifier: GPL-3.0
// Copyright (C) 2015, 2016, 2017  DappHub, LLC

// base.sol -- basic ERC20 implementation

pragma solidity ^0.7.0;

import "../interfaces/IERC20.sol";
import "./math.sol";

contract DSTokenBase is IERC20, DSMath {
    uint256                                            _supply;
    mapping (address => uint256)                       _balances;
    mapping (address => mapping (address => uint256))  _approvals;

    constructor(uint supply) {
        _balances[msg.sender] = supply;
        _supply = supply;
    }

    function totalSupply() public override view returns (uint) {
        return _supply;
    }

    function balanceOf(address src) public override view returns (uint) {
        return _balances[src];
    }

    function allowance(address src, address guy) public override view returns (uint) {
        return _approvals[src][guy];
    }

    function transfer(address dst, uint wad) public override returns (bool) {
        return transferFrom(msg.sender, dst, wad);
    }

    function transferFrom(address src, address dst, uint wad)
        public
        virtual
        override
        returns (bool)
    {
        if (src != msg.sender) {
            _approvals[src][msg.sender] = sub(_approvals[src][msg.sender], wad);
        }
        _balances[src] = sub(_balances[src], wad);
        _balances[dst] = add(_balances[dst], wad);
        Transfer(src, dst, wad);
        return true;
    }

    function approve(address guy, uint wad) public virtual override returns (bool) {
        _approvals[msg.sender][guy] = wad;
        Approval(msg.sender, guy, wad);
        return true;
    }

}
