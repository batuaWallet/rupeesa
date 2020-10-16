// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2016, 2017  Nikolai Mushegian <nikolai@dapphub.com>
// Copyright (C) 2016, 2017  Daniel Brockman <daniel@dapphub.com>
// Copyright (C) 2017        Rain Break <rainbreak@riseup.net>

// vox.sol -- target price feed

pragma solidity ^0.7.0;

import "../dappsys/thing.sol";

contract SaiVox is DSThing {
    uint256  _par;
    uint256  _way;

    uint256  public  fix;
    uint256  public  how;
    uint256  public  tau;

    constructor(uint par_) {
        _par = fix = par_;
        _way = RAY;
        tau  = era();
    }

    function era() public view returns (uint) {
        return block.timestamp;
    }

    function mold(bytes32 param, uint val) public payable note auth {
        if (param == "way") _way = val;
    }

    // Sai Target Price (ref per dai)
    function par() public returns (uint) {
        prod();
        return _par;
    }
    function way() public returns (uint) {
        prod();
        return _way;
    }

    function tell(uint256 ray) public payable note auth {
        fix = ray;
    }
    function tune(uint256 ray) public payable note auth {
        how = ray;
    }

    function prod() public payable note {
        uint256 age = era() - tau;
        if (age == 0) return;  // optimised
        tau = era();

        if (_way != RAY) _par = rmul(_par, rpow(_way, age));  // optimised

        if (how == 0) return;  // optimised
        int128 wag = int128(how * age);
        _way = inj(prj(_way) + (fix < _par ? wag : -wag));
    }

    function inj(int128 x) internal pure returns (uint256) {
        return x >= 0 ? uint256(x) + RAY
            : rdiv(RAY, RAY + uint256(-x));
    }
    function prj(uint256 x) internal pure returns (int128) {
        return x >= RAY ? int128(x - RAY)
            : int128(RAY) - int128(rdiv(RAY, x));
    }
}
