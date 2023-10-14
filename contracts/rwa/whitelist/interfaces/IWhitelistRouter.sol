// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface IWhitelistRouter {
    function isWhitelisted(address token, address receiver) external view returns (bool);
}
