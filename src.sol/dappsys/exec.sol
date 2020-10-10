// SPDX-License-Identifier: GPL-3.0
// Copyright (C) 2017  DappHub, LLC

// exec.sol - base contract used by anything that wants to do "untyped" calls

pragma solidity ^0.7.0;

contract DSExec {
    function tryExec( address target, bytes memory data, uint value)
             internal
             returns (bool call_ret)
    {
        (bool success,) = target.call{value: value}(data);
        return success;
    }
    function exec( address target, bytes memory data, uint value)
             internal
    {
        if(!tryExec(target, data, value)) {
            revert();
        }
    }

    // Convenience aliases
    function exec( address t, bytes memory c )
        internal
    {
        exec(t, c, 0);
    }
    function exec( address t, uint256 v )
        internal
    {
        bytes memory c; exec(t, c, v);
    }
    function tryExec( address t, bytes memory c )
        internal
        returns (bool)
    {
        return tryExec(t, c, 0);
    }
    function tryExec( address t, uint256 v )
        internal
        returns (bool)
    {
        bytes memory c; return tryExec(t, c, v);
    }
}
