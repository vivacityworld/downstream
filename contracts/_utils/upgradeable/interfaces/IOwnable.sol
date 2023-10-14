// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

/**
 * @title Staking
 * @notice Staking contract for VIVA holders
 * @dev This contract is used to stake VIVA tokens and receive voting power in Llama Governance
 */
interface IOwnable {
    function owner() external view returns (address);
    function pendingOwner() external view returns (address);
    function checkOwner() external view;
    function transferOwnership(address _pendingOwner) external;
    function acceptOwnership() external;
}