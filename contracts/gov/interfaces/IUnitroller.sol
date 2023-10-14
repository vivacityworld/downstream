// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface IUnitroller {
    function comptrollerImplementation() external view returns (address);
    function _acceptAdmin() external returns (uint);
    function _setPendingImplementation(address newPendingImplementation) external returns (uint);
}
