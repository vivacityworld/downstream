// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.10;

struct StakingStorage {
    address viva;                           // VIVA token address
    mapping(address => uint256) balances;   // VIVA balances
    mapping(address => address) delegates;  // VIVA delegates
    StakingStorageLib.LlamaVariables llama; // llama variables
}

library StakingStorageLib {
    bytes32 private constant _STAKING_STORAGE = keccak256(abi.encode("vivacity.contracts.Gov.storage.StakingStorage"));

    struct LlamaVariables {
        address llamaCore;              // llamaCore contract address
        address llamaPolicy;            // llamaPolicy contract address
        address stakingModuleStrategy;  // stakingModuleStrategy contract address
        uint8 stakingModuleRole;        // stakingModule role id
        uint8 stakerRole;               // staker role id
    }

    function get() internal pure returns (StakingStorage storage s) {
        bytes32 position = _STAKING_STORAGE;
        assembly {
            s.slot := position
        }
    }
}
