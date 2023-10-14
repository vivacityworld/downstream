// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface ILlamaCore {
  struct ActionInfo {
    uint256 id; // ID of the action.
    address creator; // Address that created the action.
    uint8 creatorRole; // The role that created the action.
    address strategy; // Strategy used to govern the action.
    address target; // Contract being called by an action.
    uint256 value; // Value in wei to be sent when the action is executed.
    bytes data; // Data to be called on the target when the action is executed.
  }
  
  function createAction(
      uint8 role,
      address strategy,
      address target,
      uint256 value,
      bytes calldata data,
      string memory description
    ) external returns (uint256 actionId);
  function executeAction(ActionInfo calldata actionInfo) external payable;
  function castApproval(uint8 role, ActionInfo calldata actionInfo, string calldata reason) external returns (uint96);

  function getQuantity(address policyholder, uint8 role) external view returns (uint96);
}
