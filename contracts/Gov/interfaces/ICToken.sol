// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface ICToken {
    function underlying() external view returns (address);
    function _acceptAdmin() external returns (uint);
    function implementation() external view returns (address);
    function comptroller() external view returns (address);

    function _setReserveFactor(uint256) external returns (uint256);
    function _setInterestRateModel(address) external returns (uint256);
    function _reduceReserves(uint256) external returns (uint256);
}
