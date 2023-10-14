// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface ISDYCWhitelist {
    function isCustomer(address receiver) external view returns (bool);
}
