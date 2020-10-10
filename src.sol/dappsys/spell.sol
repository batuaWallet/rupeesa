// SPDX-License-Identifier: GPL-3.0
// Copyright (C) 2017  DappHub, LLC

// spell.sol - An un-owned object that performs one action one time only

pragma solidity ^0.7.0;

import "./exec.sol";
import "./note.sol";

contract DSSpell is DSExec, DSNote {
    address public whom;
    uint256 public mana;
    bytes   public data;
    bool    public done;

    function DSSpell(address whom_, uint256 mana_, bytes data_) public {
        whom = whom_;
        mana = mana_;
        data = data_;
    }
    // Only marked "done" if CALL succeeds (not exceptional condition).
    function cast() public note {
        require( !done );
        exec(whom, data, mana);
        done = true;
    }
}

contract DSSpellBook {
    function make(address whom, uint256 mana, bytes data) public returns (DSSpell) {
        return new DSSpell(whom, mana, data);
    }
}
