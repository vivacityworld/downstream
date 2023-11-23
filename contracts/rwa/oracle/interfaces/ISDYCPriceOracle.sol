// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

interface ISDYCPriceOracle {
    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );
    function decimals() external view returns (uint8);
}