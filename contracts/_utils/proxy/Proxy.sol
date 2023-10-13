// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import {Proxy} from "@openzeppelin/contracts/proxy/Proxy.sol";
import {ProxyStorageLib, ProxyStorage} from "./storages/ProxyStorage.sol";

/**
  * @title Proxy
  * @dev This contract provides support for upgradeability.
  */
contract VivaProxy is Proxy {

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor(address _implementation_) {
        ProxyStorageLib.get().implementation = _implementation_;
        ProxyStorageLib.get().version = 1;
    }

    function _implementation() internal view override returns (address) {
        return ProxyStorageLib.get().implementation;
    }
}