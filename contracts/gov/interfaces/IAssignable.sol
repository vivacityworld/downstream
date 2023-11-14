// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

interface IAssignable {
    function assignForCSR(address turnstile, uint256 tokenId) external;
}
