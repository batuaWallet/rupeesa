// SPDX-License-Identifier: GPL-3.0
// Copyright (C) 2017  DappHub, LLC

// chief.sol - select an authority by consensus

pragma solidity ^0.7.0;

import "./token.sol";
import "./roles.sol";
import "./thing.sol";

// The right way to use this contract is probably to mix it with some kind
// of `DSAuthority`, like with `DSRoles`.
//   SEE DSChief
contract DSChiefApprovals is DSThing {
    mapping(bytes32=>address[]) public slates;
    mapping(address=>bytes32) public votes;
    mapping(address=>uint256) public approvals;
    mapping(address=>uint256) public deposits;
    DSToken public GOV; // voting token that gets locked up
    DSToken public IOU; // non-voting representation of a token, for e.g. secondary voting mechanisms
    address public hat; // the chieftain's hat

    uint256 public MAX_YAYS;

    event Etch(bytes32 indexed slate);

    // IOU constructed outside this contract reduces deployment costs significantly
    // lock/free/vote are quite sensitive to token invariants. Caution is advised.
    function DSChiefApprovals(DSToken GOV_, DSToken IOU_, uint MAX_YAYS_) public
    {
        GOV = GOV_;
        IOU = IOU_;
        MAX_YAYS = MAX_YAYS_;
    }

    function lock(uint wad)
        public
        note
    {
        GOV.pull(msg.sender, wad);
        IOU.mint(msg.sender, wad);
        deposits[msg.sender] = add(deposits[msg.sender], wad);
        addWeight(wad, votes[msg.sender]);
    }

    function free(uint wad)
        public
        note
    {
        deposits[msg.sender] = sub(deposits[msg.sender], wad);
        subWeight(wad, votes[msg.sender]);
        IOU.burn(msg.sender, wad);
        GOV.push(msg.sender, wad);
    }

    function etch(address[] yays)
        public
        note
        returns (bytes32 slate)
    {
        require( yays.length <= MAX_YAYS );
        requireByteOrderedSet(yays);

        bytes32 hash = keccak256(yays);
        slates[hash] = yays;
        Etch(hash);
        return hash;
    }

    function vote(address[] yays) public returns (bytes32)
        // note  both sub-calls note
    {
        var slate = etch(yays);
        vote(slate);
        return slate;
    }

    function vote(bytes32 slate)
        public
        note
    {
        uint weight = deposits[msg.sender];
        subWeight(weight, votes[msg.sender]);
        votes[msg.sender] = slate;
        addWeight(weight, votes[msg.sender]);
    }

    // like `drop`/`swap` except simply "elect this address if it is higher than current hat"
    function lift(address whom)
        public
        note
    {
        require(approvals[whom] > approvals[hat]);
        hat = whom;
    }

    function addWeight(uint weight, bytes32 slate)
        internal
    {
        var yays = slates[slate];
        for( uint i = 0; i < yays.length; i++) {
            approvals[yays[i]] = add(approvals[yays[i]], weight);
        }
    }

    function subWeight(uint weight, bytes32 slate)
        internal
    {
        var yays = slates[slate];
        for( uint i = 0; i < yays.length; i++) {
            approvals[yays[i]] = sub(approvals[yays[i]], weight);
        }
    }

    // Throws unless the array of addresses is a ordered set.
    function requireByteOrderedSet(address[] yays)
        internal
        pure
    {
        if( yays.length == 0 || yays.length == 1 ) {
            return;
        }
        for( uint i = 0; i < yays.length - 1; i++ ) {
            // strict inequality ensures both ordering and uniqueness
            require(uint(bytes32(yays[i])) < uint256(bytes32(yays[i+1])));
        }
    }
}


// `hat` address is unique root user (has every role) and the
// unique owner of role 0 (typically 'sys' or 'internal')
contract DSChief is DSRoles, DSChiefApprovals {

    function DSChief(DSToken GOV, DSToken IOU, uint MAX_YAYS)
             DSChiefApprovals (GOV, IOU, MAX_YAYS)
        public
    {
        authority = this;
        owner = 0;
    }

    function setOwner(address owner_) public {
        owner_;
        revert();
    }

    function setAuthority(DSAuthority authority_) public {
        authority_;
        revert();
    }

    function isUserRoot(address who)
        public
        constant
        returns (bool)
    {
        return (who == hat);
    }
    function setRootUser(address who, bool enabled) public {
        who; enabled;
        revert();
    }
}

contract DSChiefFab {
    function newChief(DSToken gov, uint MAX_YAYS) public returns (DSChief chief) {
        DSToken iou = new DSToken('IOU');
        chief = new DSChief(gov, iou, MAX_YAYS);
        iou.setOwner(chief);
    }
}
