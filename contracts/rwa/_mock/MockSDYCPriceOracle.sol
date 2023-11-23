// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "../oracle/interfaces/ISDYCPriceOracle.sol";

contract MockSDYCPriceOracle is ISDYCPriceOracle {

    uint256 public price;
	uint8 public decimals;

	constructor(uint256 _price, uint8 _decimals) {
		price = _price;
		decimals = _decimals;
	}

	function setPrice(uint256 _price) external {
		price = _price;
	}

	function setDecimals(uint8 _decimals) external {
		decimals = _decimals;
	}

	function mockPrice() external view returns (uint256) {
		return price;
	}

 	function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        ) {
			return (0, int256(price), 0, 0, 0);
		}
}
