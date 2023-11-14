// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

interface ILlamaCore {

  enum ActionState {
    Active, // Action created and approval period begins.
    Canceled, // Action canceled by creator.
    Failed, // Action approval failed.
    Approved, // Action approval succeeded and ready to be queued.
    Queued, // Action queued for queueing duration and disapproval period begins.
    Expired, // block.timestamp is greater than Action's executionTime + expirationDelay.
    Executed // Action has executed successfully.
  }

  struct ActionInfo {
    uint256 id; // ID of the action.
    address creator; // Address that created the action.
    uint8 creatorRole; // The role that created the action.
    address strategy; // Strategy used to govern the action.
    address target; // Contract being called by an action.
    uint256 value; // Value in wei to be sent when the action is executed.
    bytes data; // Data to be called on the target when the action is executed.
  }
  
  function policy() external view returns (address);
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
  function getActionState(ActionInfo calldata actionInfo) external view returns (ActionState);

  function setScriptAuthorization(address script, bool authorized) external;
  function setStrategyLogicAuthorization(address strategyLogic, bool authorized) external;
  function createStrategies(address llamaStrategyLogic, bytes[] calldata strategyConfigs) external;
  function setStrategyAuthorization(address strategy, bool authorized) external;
  function setAccountLogicAuthorization(address accountLogic, bool authorized) external;
  function createAccounts(address llamaAccountLogic, bytes[] calldata accountConfigs) external;
  function setGuard(address target, bytes4 selector, address guard) external;
}
