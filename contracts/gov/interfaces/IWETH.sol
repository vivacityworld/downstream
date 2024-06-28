// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.20;

interface IWETH {
    function deposit() external payable;
    function withdraw(uint amount) external;
}