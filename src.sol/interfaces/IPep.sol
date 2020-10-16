// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.7.0;

interface IPep {

    // This is the only one required by SCD
    function peek() external view returns (bytes32, bool);

    function read() external view returns (bytes32);
    function poke() external;

}

