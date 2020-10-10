// SPDX-License-Identifier: GPL-3.0
// Copyright (C) 2017  DappHub, LLC

// stop.sol -- mixin for enable/disable functionality

pragma solidity ^0.7.0;

import "./auth.sol";
import "./note.sol";

contract DSStop is DSNote, DSAuth {

    bool public stopped;

    modifier stoppable {
        require(!stopped);
        _;
    }
    function stop() public auth note {
        stopped = true;
    }
    function start() public auth note {
        stopped = false;
    }

}
