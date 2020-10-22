pragma solidity ^0.7.0;

contract ChainConstants {
    string constant public ERC712_VERSION = "1";

    uint256 constant public ROOT_CHAIN_ID = 5;
    bytes constant public ROOT_CHAIN_ID_BYTES = hex"05";

    uint256 constant public CHILD_CHAIN_ID = 80001;
    bytes constant public CHILD_CHAIN_ID_BYTES = hex"013881";
}
