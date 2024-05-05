// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

interface IVivacityBorrower {
    function borrowCallback(address borrower, uint256 amount) external returns (uint256);
}