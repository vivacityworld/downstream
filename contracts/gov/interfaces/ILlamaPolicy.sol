// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface ILlamaPolicy {
  function getQuantity(address policyholder, uint8 role) external view returns (uint96);
}
