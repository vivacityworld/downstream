// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

interface IVivaPoint {
    function setWhitelist(address _account, bool _isWhitelisted) external;
    function setEndTime(uint256 _endBlock) external;
    function update(address _account) external;
    function setReferral(address _referrer, address _referree) external;
} 