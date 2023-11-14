// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

interface IOffchainFundWhitelist {
    function isWhitelisted(address account) external view returns (bool);
}