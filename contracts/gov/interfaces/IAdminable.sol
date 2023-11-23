// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

interface IAdminable {
    function _acceptAdmin() external returns (uint);
}
