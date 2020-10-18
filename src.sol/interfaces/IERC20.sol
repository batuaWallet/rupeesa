// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.7.0;

// Interface of the ERC20 standard as defined in the EIP
// + mint/burn methods which are useful during development

interface IERC20 {
    event Approval(address indexed src, address indexed guy, uint wad);
    event Transfer(address indexed src, address indexed dst, uint wad);

    function totalSupply() external view returns (uint);
    function balanceOf(address guy) external view returns (uint);
    function allowance(address src, address guy) external view returns (uint);

    function approve(address guy, uint wad) external returns (bool);
    function transfer(address dst, uint wad) external returns (bool);
    function transferFrom(address src, address dst, uint wad) external returns (bool);
}
