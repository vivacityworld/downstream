// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface ICErc20Delegator {
    function _setImplementation(address implementation_, bool allowResign, bytes calldata becomeImplementationData) external;
}
