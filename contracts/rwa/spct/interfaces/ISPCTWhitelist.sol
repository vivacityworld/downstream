// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface ISPCTWhitelist {
    function isWhitelist(address account) external view returns (bool);
}
