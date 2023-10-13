// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

struct ProxyStorage {
    address implementation;
    uint256 version;
}

library ProxyStorageLib {
    bytes32 private constant _PROXY_STORAGE = keccak256(abi.encode("vivacity.contracts._utils.proxy.storages.ProxyStorage"));

    function get() internal pure returns (ProxyStorage storage s) {
        bytes32 position = _PROXY_STORAGE;
        assembly {
            s.slot := position
        }
    }
}
