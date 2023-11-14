// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface ISPCTPriceOracle {
    function exchangeRate() external view returns (uint256);
}