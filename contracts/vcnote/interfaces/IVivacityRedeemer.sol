// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

interface IVivacityRedeemer {
    function redeemCallback(address redeemer, uint256 amount) external returns (uint256);
}