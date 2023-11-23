// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

interface ICRWA {
    function setWhitelistRouter(address _whitelist) external;
    function setPriceOracle(address _oracle) external;
}
