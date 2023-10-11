// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface ICErc20Delegator {
    function _setImplementation(address implementation_, bool allowResign, bytes calldata becomeImplementationData) external;
}
