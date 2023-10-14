// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface IOffchainFundPriceOracle {
    function currentPrice() external view returns (uint256);
}