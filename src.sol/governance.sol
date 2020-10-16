// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.7.0;

import "./dappsys/auth.sol";

// This disables admin-initiated global settlement & configuring price feed addresses
contract Governance is DSAuthority {
    address      public  owner;

    constructor () {
        owner = tx.origin;
    }

    function canCall(
        address src,
        address dst,
        bytes4 sig
    ) public override view returns (bool) {
      require(msg.sender == owner, "Governance: FORBIDDEN");
      // TODO: let pyorp set the stability fee (tax)? Is this even where that happens?
      return true;
    }
}
