// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

struct OwnableStorage {
    address owner;
    address pendingOwner;
}

library OwnableStorageLib {
    bytes32 private constant _OWNABLE_STORAGE = keccak256(abi.encode("vivacity.contracts._utils.upgradeable.storages.OwnableStorage"));

    function get() internal pure returns (OwnableStorage storage s) {
        bytes32 position = _OWNABLE_STORAGE;
        assembly {
            s.slot := position
        }
    }
}
