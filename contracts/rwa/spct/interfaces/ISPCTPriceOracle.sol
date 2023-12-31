// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

interface ISPCTPriceOracle {
    function exchangeRate() external view returns (uint256);
}