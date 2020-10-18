// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.7.0;

interface IPip {

    // This is the only one required by SCD
    function read() external view returns (bytes32);

    function peek() external view returns (bytes32, bool);
    function poke() external;

}

