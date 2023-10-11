// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface ICRWA {
    function setWhitelist(address _whitelist) external;
    function setPriceOracle(address _oracle) external;
}
