// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import {OwnableStorageLib, OwnableStorage} from "./storages/OwnableStorage.sol";

import {IOwnable} from "./interfaces/IOwnable.sol";

/**
  * @title Ownable
  * @dev The Ownable contract has an owner address, and provides basic authorization control
  */
abstract contract Ownable is IOwnable {

    // event
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // error
    error OwnableUnauthorizedAccount(address account);

    modifier onlyOwner() {
        checkOwner();
        _;
    }

    function __initialize_Ownable(address _owner) internal virtual {
        OwnableStorage storage os = OwnableStorageLib.get();
        os.owner = _owner;
        emit OwnershipTransferred(address(0), _owner);
    }

    function owner() public view virtual returns (address) {
        OwnableStorage storage os = OwnableStorageLib.get();
        return os.owner;
    }

    function pendingOwner() public view virtual returns (address) {
        OwnableStorage storage os = OwnableStorageLib.get();
        return os.pendingOwner;
    }

    function checkOwner() public view virtual {
        if (owner() != msg.sender) {
            revert OwnableUnauthorizedAccount(msg.sender);
        }
    }

    function transferOwnership(address _pendingOwner) external virtual onlyOwner {
        OwnableStorage storage os = OwnableStorageLib.get();
        os.pendingOwner = _pendingOwner;
    }

    function acceptOwnership() external virtual {
        OwnableStorage storage os = OwnableStorageLib.get();
        require(msg.sender == os.pendingOwner, "VivaProxy: only pending owner can accept ownership");
        address previousOwner = os.owner;
        os.owner = os.pendingOwner;
        os.pendingOwner = address(0);

        emit OwnershipTransferred(previousOwner, os.owner);
    }
}