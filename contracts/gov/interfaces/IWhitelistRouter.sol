// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

interface IWhitelistRouter {
    function isWhitelisted(address token, address receiver) external view returns (bool);
    function setWhitelistContract(address token, address whitelistContract) external;
}
