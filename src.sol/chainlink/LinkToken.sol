// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.7.0;

import "./ERC677Token.sol";
import { StandardToken } from "./vendor/StandardToken.sol";

contract LinkToken is StandardToken, ERC677Token {

  uint public override constant totalSupply = 10**27;
  string public constant name = "ChainLink Token";
  uint8 public constant decimals = 18;
  string public constant symbol = "LINK";

  constructor() {
    balances[msg.sender] = totalSupply;
  }

  /**
  * @dev transfer token to a specified address with additional data if the recipient is a contract.
  * @param _to The address to transfer to.
  * @param _value The amount to be transferred.
  * @param _data The extra data to be passed to the receiving contract.
  */
  function transferAndCall(address _to, uint _value, bytes calldata _data)
    public override
    validRecipient(_to)
    returns (bool success)
  {
    return ERC677Token(this).transferAndCall(_to, _value, _data);
  }

  /**
  * @dev transfer token to a specified address.
  * @param _to The address to transfer to.
  * @param _value The amount to be transferred.
  */
  function transfer(address _to, uint _value)
    public override(StandardToken, IERC20)
    validRecipient(_to)
    returns (bool success)
  {
    return ERC677Token(this).transfer(_to, _value);
  }

  /**
   * @dev Approve the passed address to spend the specified amount of tokens on behalf of msg.sender.
   * @param _spender The address which will spend the funds.
   * @param _value The amount of tokens to be spent.
   */
  function approve(address _spender, uint256 _value)
    public override(StandardToken, IERC20)
    validRecipient(_spender)
    returns (bool)
  {
    return ERC677Token(this).approve(_spender,  _value);
  }

  /**
   * @dev Transfer tokens from one address to another
   * @param _from address The address which you want to send tokens from
   * @param _to address The address which you want to transfer to
   * @param _value uint256 the amount of tokens to be transferred
   */
  function transferFrom(address _from, address _to, uint256 _value)
    public override(StandardToken, IERC20)
    validRecipient(_to)
    returns (bool)
  {
    return ERC677Token(this).transferFrom(_from, _to, _value);
  }


  // MODIFIERS

  modifier validRecipient(address _recipient) {
    require(_recipient != address(0) && _recipient != address(this));
    _;
  }

}
