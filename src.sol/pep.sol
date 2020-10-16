// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.7.0;

import "./dappsys/thing.sol";
import "./interfaces/IPep.sol";

contract Pep is IPep, DSThing  {
    bool    has;
    bytes32 val;

    function peek() public override view returns (bytes32, bool) {
        return (val,has);
    }

    function read() public view returns (bytes32) {
        (bytes32 wut, bool haz) = peek();
        assert(haz);
        return wut;
    }

    function poke(bytes32 wut) public auth {
        val = wut;
        has = true;
    }

    function void() public auth {
        has = false;
    }
}
