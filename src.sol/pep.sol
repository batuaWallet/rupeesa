// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.7.0;

import "./dappsys/thing.sol";
import "./interfaces/IPep.sol";
import "./interfaces/IUniswapFactory.sol";
import "./interfaces/IUniswapPair.sol";
import "./lib/FixedPoint.sol";
import "./uniswap/library.sol";
import "./uniswap/oracleLib.sol";

// fixed window oracle that recomputes the average price for the entire period once every period
// note that the price average is only guaranteed to be over at least 1 period, but may be over a longer period
contract Pep is IPep, DSThing {
    using FixedPoint for *;

    bool internal govIsIndexZero;
    bool public ready;

    uint public constant PERIOD = 24 hours;

    IUniswapPair public pair;
    address public gov;

    uint    public priceCumulativeLast;
    uint32  public blockTimestampLast;
    FixedPoint.uq112x112 public priceAverage;

    function init(IUniswapPair _pair, bool _govIsIndexZero) public auth {
        require(!ready, "Pep: ALREADY_INITIALIZED");
        ready = true;

        pair = _pair;
        govIsIndexZero = _govIsIndexZero;

        gov = govIsIndexZero
          ?  _pair.token0()
          : _pair.token1();

        priceCumulativeLast = govIsIndexZero
          ? _pair.price0CumulativeLast()
          : _pair.price1CumulativeLast();

        uint112 reserve0;
        uint112 reserve1;
        (reserve0, reserve1, blockTimestampLast) = _pair.getReserves();
        // ensure that there"s liquidity in the pair
        require(
            reserve0 != 0 && reserve1 != 0,
            "ExampleOracleSimple: NO_RESERVES"
        );
    }

    function peek() public override view returns (bytes32, bool) {
        if (ready) {
          return (bytes32(uint(priceAverage.decode())), ready);
        } else {
          return (bytes32(uint(1)), ready);
        }
    }

    function read() external override view returns (bytes32) {
        (bytes32 wut, bool haz) = peek();
        require(haz, "Pep: HAZ_NOT");
        return wut;
    }

    function poke() external override {
        require(ready, "Pep: NOT_READY");

        (uint price0Cumulative, uint price1Cumulative, uint32 blockTimestamp) =
            UniswapOracleLibrary.currentCumulativePrices(address(pair));
        uint32 timeElapsed = blockTimestamp - blockTimestampLast; // overflow is desired

        // ensure that at least one full period has passed since the last update
        if (timeElapsed < PERIOD) {
          return;
        }

        uint priceCumulative = govIsIndexZero ? price0Cumulative : price1Cumulative;

        // overflow is desired, casting never truncates
        // cumulative price is in (uq112x112 price * seconds) units
        // so we simply wrap it after division by time elapsed
        priceAverage = FixedPoint.uq112x112(uint224(
          (priceCumulative - priceCumulativeLast) / timeElapsed
        ));

        priceCumulativeLast = priceCumulative;
        blockTimestampLast = blockTimestamp;
    }

}
