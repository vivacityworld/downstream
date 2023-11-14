// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

interface ISPCTWhitelist {
    function isWhitelist(address account) external view returns (bool);
}
