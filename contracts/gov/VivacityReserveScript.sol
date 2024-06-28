// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {ITurnstile} from "../_interfaces/ITurnstile.sol";
import {ICToken} from "./interfaces/ICToken.sol";
import {IVotingEscrow} from "./interfaces/IVotingEscrow.sol";
import {IGaugeController} from "./interfaces/IGaugeController.sol";
import {IWETH} from "./interfaces/IWETH.sol";
import {IBaseV1Pair} from "./interfaces/IBaseV1Pair.sol";

import {LlamaAccount} from "./_llama/accounts/LlamaAccount.sol";
import {LlamaBaseScript} from "./_llama/llama-scripts/LlamaBaseScript.sol";
import {LlamaUtils} from "./_llama/lib/LlamaUtils.sol";

/**
  * @title VivacityReserveScript
  * @notice LlamaScript for managing Vivacity Reserve
  */  
contract VivacityReserveScript is LlamaBaseScript {

  address constant VOTING_ESCROW = 0x4e227C8fa2Ee37F86C997E238AB0eF9D8d33a262;
  address constant GAUGE_CONTROLLER = 0x714770417BfC164eEBAe8a0ebAE47e80f663F5cA;
  address constant WCANTO = 0x826551890Dc65655a0Aceca109aB11AbDbD7a07B;
  address constant NOTE = 0x4e71A2E537B7f9D9413D3991D37958c0b5e1e503;
  address constant CANTO_NOTE_POOL = 0x1D20635535307208919f0b67c3B2065965A85aA9;
  address constant TREASURY = 0xFA6d5952638D07fac97d2eF615F4E623c8F151fE;

  ///////////////////////////////
  /////       GENERAL       /////
  ///////////////////////////////

  function multicall(bytes[] calldata data) external onlyDelegateCall returns (bytes[] memory results) {
    results = new bytes[](data.length);
    for (uint256 i = 0; i < data.length; i++) {
      results[i] = Address.functionDelegateCall(SELF, data[i]);
    }
    return results;
  }

  ///////////////////////////
  /////      MANAGE     /////
  ///////////////////////////

  function reduceReserve(address _cToken, uint256 _amount) external onlyDelegateCall {
    IERC20 underlying = IERC20(ICToken(_cToken).underlying());
    uint256 beforeBalance = underlying.balanceOf(address(this));
    ICToken(_cToken)._reduceReserves(_amount);
    underlying.transfer(TREASURY, underlying.balanceOf(address(this)) - beforeBalance);
  }

  function withdrawCSR(address _turnstile, uint256 _tokenId, uint256 _amount) external onlyDelegateCall {
    ITurnstile(_turnstile).withdraw(_tokenId, payable(TREASURY), _amount);
  }

  function createLock(uint256 _amount) external onlyDelegateCall {
    LlamaAccount(payable(TREASURY)).execute(
      VOTING_ESCROW, 
      false, 
      _amount, 
      abi.encodeWithSignature("createLock(uint256)", _amount)
    );
  }

  function increaseAmount(uint256 _amount) external onlyDelegateCall {
    LlamaAccount(payable(TREASURY)).execute(
      VOTING_ESCROW, 
      false, 
      _amount, 
      abi.encodeWithSignature("increaseAmount(uint256)", _amount)
    );
  }

  function vote(address _gauge, uint256 _weight) external onlyDelegateCall {
    LlamaAccount(payable(TREASURY)).execute(
      GAUGE_CONTROLLER, 
      false, 
      0, 
      abi.encodeWithSignature("vote_for_gauge_weights(address,uint256)", _gauge, _weight)
    );
  }

  function wrapCanto(uint256 _amount) external onlyDelegateCall {
    LlamaAccount(payable(TREASURY)).execute(
      WCANTO, 
      false, 
      _amount, 
      abi.encodeWithSignature("deposit()")
    );
  }

  function unwrapWCanto(uint256 _amount) external onlyDelegateCall {
    LlamaAccount(payable(TREASURY)).execute(
      WCANTO, 
      false, 
      0, 
      abi.encodeWithSignature("withdraw(uint256)", _amount)
    );
  }

  function swap(uint256 _amountIn, address _tokenIn) external onlyDelegateCall {
    uint256 amountOut = IBaseV1Pair(CANTO_NOTE_POOL).getAmountOut(_amountIn, _tokenIn);
    (uint256 _amount0Out, uint256 _amount1Out) = IBaseV1Pair(CANTO_NOTE_POOL).token0() == _tokenIn ? (uint256(0), amountOut) : (amountOut, uint256(0));
    
    LlamaAccount(payable(TREASURY)).execute(
      _tokenIn, 
      false, 
      0, 
      abi.encodeWithSignature("transfer(address,uint256)", CANTO_NOTE_POOL, _amountIn)
    );
    LlamaAccount(payable(TREASURY)).execute(
      CANTO_NOTE_POOL, 
      false, 
      0, 
      abi.encodeWithSignature("swap(uint256,uint256,address,bytes)", _amount0Out, _amount1Out, TREASURY, "")
    );
    
  }
}
