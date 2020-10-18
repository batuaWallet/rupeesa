// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.7.0;

import "./ERC677Token.sol";

contract LinkToken is ERC677Token {

  uint public override constant totalSupply = 10**27;
  string public constant name = "ChainLink Token";
  uint8 public constant decimals = 18;
  string public constant symbol = "LINK";

  constructor() {
    balances[msg.sender] = totalSupply;
  }

}
