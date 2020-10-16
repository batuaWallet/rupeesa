// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.7.0;

interface IDSToken {

    event Mint(address indexed guy, uint wad);
    event Burn(address indexed guy, uint wad);

    function symbol() external returns(bytes32);
    function decimals() external returns(uint);

    function approve(address guy) external returns (bool);
    function approve(address guy, uint wad) external returns (bool);
    function burn(address guy, uint wad) external;
    function burn(uint wad) external;
    function mint(address guy, uint wad) external;
    function mint(uint wad) external;
    function move(address src, address dst, uint wad) external;
    function pull(address src, uint wad) external;
    function push(address dst, uint wad) external;
    function transferFrom(address src, address dst, uint wad) external returns(bool);

}
