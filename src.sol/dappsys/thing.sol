// SPDX-License-Identifier: GPL-3.0
// Copyright (C) 2017  DappHub, LLC

// thing.sol - `auth` with handy mixins. your things should be DSThings

pragma solidity ^0.7.0;

import "./auth.sol";
import "./note.sol";
import "./math.sol";

contract DSThing is DSAuth, DSNote, DSMath {

    function S(string memory s) internal pure returns (bytes4) {
        return bytes4(keccak256(abi.encodePacked(s)));
    }

}
