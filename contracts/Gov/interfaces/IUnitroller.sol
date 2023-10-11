// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IUnitroller {
    function comptrollerImplementation() external view returns (address);
    function _acceptAdmin() external returns (uint);
    function _setPendingImplementation(address newPendingImplementation) external returns (uint);
}
