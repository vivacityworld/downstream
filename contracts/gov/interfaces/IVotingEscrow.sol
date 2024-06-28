// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.16;

/// @title IVotingEscrow
/// @notice Interface for the VotingEscrow contract
interface IVotingEscrow {
    // Events
    event Deposit(address indexed provider, uint256 value, uint256 locktime, LockAction indexed action, uint256 ts);
    event Withdraw(address indexed provider, uint256 value, LockAction indexed action, uint256 ts);
    event Unlock();

    // Governance
    function setGovernance(address _governance) external;
    function toggleUnlockOverride() external;

    // Lock management
    function lockEnd(address _addr) external view returns (uint256);
    function getLastUserPoint(address _addr)
        external
        view
        returns (int128 bias, int128 slope, uint256 ts);

    function checkpoint() external;
    function createLock(uint256 _value) external payable;
    function increaseAmount(uint256 _value) external payable;
    function withdraw() external;

    // Getters
    function balanceOf(address _owner) external view returns (uint256);
    function balanceOfAt(address _owner, uint256 _blockNumber) external view returns (uint256);
    function totalSupply() external view returns (uint256);
    function totalSupplyAt(uint256 _blockNumber) external view returns (uint256);

    // Miscellaneous
    enum LockAction {
        CREATE,
        INCREASE_AMOUNT,
        INCREASE_AMOUNT_AND_DELEGATION,
        INCREASE_TIME,
        WITHDRAW,
        QUIT,
        DELEGATE,
        UNDELEGATE
    }
}