// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

struct LlamaStorage {
    address llamaCore;              // llamaCore contract address
    address llamaPolicy;            // llamaPolicy contract address
    address stakingModuleStrategy;  // stakingModuleStrategy contract address
    address stakerStrategy;         // stakerStrategy contract address   
    uint8 stakingModuleRole;        // stakingModule role id
    uint8 stakerRole;               // staker role id
}

library LlamaStorageLib {
    bytes32 private constant _LLAMA_STORAGE = keccak256(abi.encode("vivacity.contracts.gov.staking.storages.LlamaStorage"));


    function get() internal pure returns (LlamaStorage storage s) {
        bytes32 position = _LLAMA_STORAGE;
        assembly {
            s.slot := position
        }
    }
}
