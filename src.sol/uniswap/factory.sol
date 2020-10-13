// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.7.0;

import "../interfaces/IUniswapFactory.sol";

import "./pair.sol";

contract UniswapFactory is IUniswapFactory {
    address public override feeTo;
    address public override feeToSetter;

    bytes public constant pairCreationCode = type(UniswapPair).creationCode;

    mapping(address => mapping(address => address)) public override getPair;
    address[] public override allPairs;

    constructor(address _feeToSetter) {
        feeToSetter = _feeToSetter;
    }

    function allPairsLength() external override view returns (uint) {
        return allPairs.length;
    }

    function createPair(address tokenA, address tokenB) external override returns (address pair) {
        require(tokenA != tokenB, "Uniswap: IDENTICAL_ADDRESSES");
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), "Uniswap: ZERO_ADDRESS");
        require(getPair[token0][token1] == address(0), "Uniswap: PAIR_EXISTS"); // single check is sufficient
        bytes memory bytecode = type(UniswapPair).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(token0, token1));
        UniswapPair pair = new UniswapPair{salt: salt}();
        pair.initialize(token0, token1);
        getPair[token0][token1] = address(pair);
        getPair[token1][token0] = address(pair); // populate mapping in the reverse direction
        allPairs.push(address(pair));
        emit PairCreated(token0, token1, address(pair), allPairs.length);
        return address(pair);
    }

    function setFeeTo(address _feeTo) external override {
        require(msg.sender == feeToSetter, "Uniswap: FORBIDDEN");
        feeTo = _feeTo;
    }

    function setFeeToSetter(address _feeToSetter) external override {
        require(msg.sender == feeToSetter, "Uniswap: FORBIDDEN");
        feeToSetter = _feeToSetter;
    }
}
