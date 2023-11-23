// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

interface IPriceOracleRouter {
    function setOracle(address cToken, address oracle) external;
    function getOracle(address cToken) external view returns (address);
}
