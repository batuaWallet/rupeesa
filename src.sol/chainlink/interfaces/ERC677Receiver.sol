// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.7.0;

interface ERC677Receiver {
  function onTokenTransfer(address _sender, uint _value, bytes calldata _data) external;
}
