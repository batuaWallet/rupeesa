// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.7.0;

import "./dappsys/thing.sol";
import "./interfaces/IPep.sol";
import "./interfaces/IUniswapPair.sol";
import "./uniswap/oracle.sol";

contract Pep is IPep, DSThing  {
    bool ready;
    uint256 price = 1;
    uint256 nextPrice;
    uint256 prevPrice;

    address pair;
    uint8 govIsTokenZero;

    function peek() public override view returns (bytes32, bool) {
        if (ready) {
          uint256 currentPrice = getCurrentPrice();
          return (bytes32(price),true);
        } else {
          return (1,true);
        }
    }

    function setPair(address _pair, _govIsTokenZero: bool) public auth {
        pair = _pair;
        govIsTokenZero = _govIsTokenZero;
    }

    function getCurrentPrice() public {
        (
            uint price0Cumulative,
            uint price1Cumulative,
        ) = UniswapOracleLibrary.currentCumulativePrices(pair);
        if (govIsTokenZero) {
            return price0Cumulative;
        } else {
            return price1Cumulative;
        }
    }

    // helper function that returns the current block timestamp within the range of uint32, i.e. [0, 2**32 - 1]
    function currentBlockTimestamp() internal view returns (uint32) {
        return uint32(block.timestamp % 2 ** 32);
    }

    // target a 24 hr moving average
    // If oldPrice is > 24 hours old, set current price as new price and new as old
    // If oldPrice is > 12 hours old, set current price as new price

    uint oldPrice;
    uint newPrice;

    function poke() public auth {
        blockTimestamp = currentBlockTimestamp();
        (
            uint price0Cumulative,
            uint price1Cumulative,
            uint32 blockTimestamp
        ) = UniswapOracleLibrary.currentCumulativePrices(pair);
        has = true;
    }

}
