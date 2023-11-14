// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

interface ILlamaPolicy {

  struct PermissionData {
    address target; // Contract being called by an action.
    bytes4 selector; // Selector of the function being called by an action.
    address strategy; // Strategy used to govern the action.
  }
  

  struct RoleHolderData {
    uint8 role; // ID of the role to set (uint8 ensures onchain enumerability when burning policies).
    address policyholder; // Policyholder to assign the role to.
    uint96 quantity; // Quantity of the role to assign to the policyholder, i.e. their (dis)approval quantity.
    uint64 expiration; // When the role expires.
  }

  struct RolePermissionData {
    uint8 role; // ID of the role to set (uint8 ensures onchain enumerability when burning policies).
    PermissionData permissionData; // The `(target, selector, strategy)` tuple that will be keccak256 hashed to
      // generate the permission ID to assign or unassign to the role
    bool hasPermission; // Whether to assign the permission or remove the permission.
  }

  function getQuantity(address policyholder, uint8 role) external view returns (uint96);
  function getRoleSupplyAsQuantitySum(uint8 role) external view returns (uint96 totalQuantity);
  function initializeRole(bytes memory description) external;
  function setRoleHolder(uint8 role, address policyholder, uint96 quantity, uint64 expiration) external;
  function setRolePermission(uint8 role, PermissionData memory permissionData, bool hasPermission) external;
  function revokePolicy(address policyholder) external;
  

}
