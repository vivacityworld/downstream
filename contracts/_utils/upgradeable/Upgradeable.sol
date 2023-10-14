// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import {ProxyStorageLib, ProxyStorage} from "../proxy/storages/ProxyStorage.sol";
import {OwnableStorageLib, OwnableStorage} from "./storages/OwnableStorage.sol";
import {IOwnable} from "./interfaces/IOwnable.sol";

/**
 * @title Upgradeable
 * @dev This contract provides support for upgradeability.
 */
abstract contract Upgradeable {

    event Upgraded(address indexed implementation, uint256 version);

    function version() external view returns (uint256) {
        return ProxyStorageLib.get().version;
    }

    function implementation() public view returns (address) {
        return ProxyStorageLib.get().implementation;
    }

    function upgrade(address _newImplementation, uint256 _version) external {
        require(msg.sender == OwnableStorageLib.get().owner, "Upgradeable: only owner can upgrade");
        require(_newImplementation != address(0), "Upgradeable: new implementation is the zero address");
        ProxyStorage storage ps = ProxyStorageLib.get();
        require(_version > ps.version, "Upgradeable: new version must be greater than current version");
        ps.implementation = _newImplementation;
        ps.version = _version;
    }
}