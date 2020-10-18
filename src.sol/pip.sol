// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.7.0;

import "./chainlink/ChainlinkClient.sol";
import "./dappsys/thing.sol";
import "./interfaces/IPip.sol";

contract Pip is IPip, ChainlinkClient, DSThing  {
    bool    public ready;
    bytes32 val;

    function peek() public override view returns (bytes32, bool) {
        return (val,ready);
    }

    function read() public override view returns (bytes32) {
        (bytes32 wut, bool haz) = peek();
        require(haz, "Pip: HAZ_NOT");
        return wut;
    }

    function poke(bytes32 wut) public override auth {
        val = wut;
        ready = true;
    }

}
