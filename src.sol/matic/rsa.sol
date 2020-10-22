pragma solidity ^0.7.0;

import {StandardToken as ERC20 } from "../chainlink/vendor/StandardToken.sol";
import "./MetaTransaction.sol";

contract Rocket is ERC20, MetaTransactionStandard {
    uint256 public initialSupply = 1000000 ether;

    constructor()
        ERC20("Rocket", "RKT")
        MetaTransactionStandard("RocketTest", "1")
    {
        _mint(msgSender(), initialSupply);
    }
		
		// helper function
		function mint(uint256 supply) 
				public
		{
				_mint(msgSender(), supply);
		}

    function transfer(address recipient, uint256 amount) public virtual override returns (bool) {
        _transfer(msgSender(), recipient, amount);
        return true;
    }
}