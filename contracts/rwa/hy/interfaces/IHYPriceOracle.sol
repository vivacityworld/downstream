// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

interface IHYPriceOracle {
    function rate() external view returns(uint256);
}