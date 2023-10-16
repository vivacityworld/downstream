// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

struct StakingStorage {
    address viva;                                 // VIVA token address
    mapping(address => uint256) balances;         // VIVA balances
    mapping(address => address) delegates;        // VIVA delegates
    mapping(address => uint256) lockedBalances;   // VIVA locked
    mapping(uint256 => Proposal) proposals;       // proposers
    uint256 reserve;                              // VIVA reserve
    uint96 deposit;                               // VIVA lock amount
}

struct Proposal {
    address proposer;
    uint96 deposit;
}

library StakingStorageLib {
    bytes32 private constant _STAKING_STORAGE = keccak256(abi.encode("vivacity.contracts.gov.staking.storages.StakingStorage"));

    function get() internal pure returns (StakingStorage storage s) {
        bytes32 position = _STAKING_STORAGE;
        assembly {
            s.slot := position
        }
    }
}
