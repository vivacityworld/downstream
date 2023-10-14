// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title Llama Account Logic Interface
/// @author Llama (devsdosomething@llama.xyz)
/// @notice This is the interface for Llama accounts which can be used to hold assets for a Llama instance.
interface ILlamaPolicy {
  function getQuantity(address policyholder, uint8 role) external view returns (uint96);
}
