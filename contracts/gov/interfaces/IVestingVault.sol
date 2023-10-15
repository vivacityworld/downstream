// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface IVestingVault {
    function add(address[] memory _account, uint64[] memory _start, uint64[] memory _duration, uint256[] memory _amount) external;
    function remove(uint256 _vestingId, bool doRelease) external returns (uint256 rest);
    function transfer(address _to, uint256 _amount) external;
}