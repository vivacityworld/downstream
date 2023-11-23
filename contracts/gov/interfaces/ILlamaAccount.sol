// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface ILlamaAccount {

  struct ERC20Data {
    IERC20 token;
    address recipient;
    uint256 amount;
  }

  function llamaExecutor() external view returns (address);

  function initialize(bytes memory config) external returns (bool);

  function transferERC20(ERC20Data calldata erc20Data) external;
}
