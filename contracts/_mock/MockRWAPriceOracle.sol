pragma solidity ^0.8.10;

import "../RWA/IRWAPriceOracle.sol";

contract MockRWAPriceOracle is IRWAPriceOracle {

    uint8 public immutable _decimals;
    uint256 public immutable _price;

		constructor(uint8 decimals_, uint256 price_) {
			_decimals = decimals_;
			_price = price_;
		}

		function mockDecimals() external view returns (uint8) {
			return _decimals;
		}

		function mockPrice() external view returns (uint256) {
			return _price;
		}

    function latestRoundData() external view returns (
				uint80 roundId,
				int256 answer,
				uint256 startedAt,
				uint256 updatedAt,
				uint80 answeredInRound
		) {
			return (0, int256(_price), 0, 0, 0);
		}

    function decimals() external view returns (uint8) {
			return _decimals;
    }
}
