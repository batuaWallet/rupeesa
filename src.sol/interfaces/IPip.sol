// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.7.0;

interface IPip {

    function peek() external view returns (bytes32, bool);
    function read() external view returns (bytes32);
    function poke(bytes32 wut) external payable;
    function void() external payable;

}

