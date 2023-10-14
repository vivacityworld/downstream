// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface IGaugeController {
    function get_gauge_weight(address _gauge) external view returns (uint256);
    function get_total_weight() external view returns (uint256);
}