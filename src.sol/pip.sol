// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.7.0;

import "./chainlink/ChainlinkClient.sol";
import "./dappsys/thing.sol";
import "./interfaces/IPip.sol";

contract Pip is IPip, ChainlinkClient, DSThing  {
    using Chainlink for Chainlink.Request;

    uint256 constant private ORACLE_PAYMENT = 1 * LINK;

    uint256 public currentPrice; // Price in units of n INR per 100 ETH

    // Temp storage used by poke to make the chainlink request
    address public oracle;
    string public jobId;

    event RequestPriceFulfilled(bytes32 indexed requestId, uint256 indexed price);

    constructor(address linkTokenAddress, uint256 initialPrice) {
        currentPrice = initialPrice;
        setChainlinkToken(linkTokenAddress);
    }

    function peek() public override view returns (bytes32, bool) {
        // convert to n INR per wad ETH (wad=10^18).
        return (bytes32(currentPrice * 10000000000000000), true);
    }

    function read() public override view returns (bytes32) {
        (bytes32 wut, bool haz) = peek();
        require(haz, "Pip: HAZ_NOT");
        return wut;
    }

    function setOracle(address _oracle, string memory _jobId) external auth {
        oracle = _oracle;
        jobId = _jobId;
    }

    function poke() external override auth {
        require(oracle != address(0), "Pip: ORACLE_ZERO");
        requestPrice(oracle, jobId);
    }

    function fulfillPrice(bytes32 _requestId, uint256 _price)
      public
      recordChainlinkFulfillment(_requestId)
    {
      emit RequestPriceFulfilled(_requestId, _price);
      currentPrice = _price;
    }

    function withdrawLink() public auth {
      LinkTokenInterface link = LinkTokenInterface(chainlinkTokenAddress());
      require(link.transfer(msg.sender, link.balanceOf(address(this))), "Unable to transfer");
    }

    function cancelRequest(
      bytes32 _requestId,
      uint256 _payment,
      bytes4 _callbackFunctionId,
      uint256 _expiration
    )
      public
      auth
    {
      cancelChainlinkRequest(_requestId, _payment, _callbackFunctionId, _expiration);
    }

    function requestPrice(address _oracle, string memory _jobId)
        private
        auth
    {
        Chainlink.Request memory req = buildChainlinkRequest(
            stringToBytes32(_jobId),
            address(this),
            this.fulfillPrice.selector
        );
        req.add("get", "https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=INR");
        req.add("path", "INR");
        req.addInt("times", 100);
        sendChainlinkRequestTo(_oracle, req, ORACLE_PAYMENT);
    }

    function stringToBytes32(string memory source) private pure returns (bytes32 result) {
        bytes memory tempEmptyStringTest = bytes(source);
        if (tempEmptyStringTest.length == 0) {
            return 0x0;
        }

        assembly { // solhint-disable-line no-inline-assembly
            result := mload(add(source, 32))
        }
    }

}
