// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "../oracle/interfaces/IOffchainFundPriceOracle.sol";

contract MockOffchainFundPriceOracle is IOffchainFundPriceOracle {

    uint256 public price;

	constructor(uint256 _price) {
		price = _price;
	}

	function setPrice(uint256 _price) external {
		price = _price;
	}

	function mockPrice() external view returns (uint256) {
		return price;
	}

    function currentPrice() external view returns (uint256) {
		return price;
	}

    function reportBalance(uint256 _balance, uint256 _balance1, uint256 _balance2) public {}
}
