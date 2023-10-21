// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

interface ITurnstile {
    function register(address) external returns(uint256);
    function assign(uint256) external returns(uint256);
}