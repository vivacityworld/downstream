// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/Address.sol";

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ITurnstile} from "../_interfaces/ITurnstile.sol";
import {IAssignable} from "./interfaces/IAssignable.sol";
import {IUnitroller} from "./interfaces/IUnitroller.sol";
import {IComptroller} from "./interfaces/IComptroller.sol";
import {ILlamaAccount} from "./interfaces/ILlamaAccount.sol";
import {IVestingVault} from "./interfaces/IVestingVault.sol";
import {ICToken} from "./interfaces/ICToken.sol";
import {ICRWA} from "./interfaces/ICRWA.sol";
import {IVCNote} from "./interfaces/IVCNote.sol";
import {IAdminable} from "./interfaces/IAdminable.sol";
import {IOwnable} from "./interfaces/IOwnable.sol";
import {IPriceOracleRouter} from "./interfaces/IPriceOracleRouter.sol";
import {IWhitelistRouter} from "./interfaces/IWhitelistRouter.sol";
import {ICErc20Delegator} from "./interfaces/ICErc20Delegator.sol";

import {LlamaBaseScript} from "./_llama/llama-scripts/LlamaBaseScript.sol";
import {LlamaUtils} from "./_llama/lib/LlamaUtils.sol";

/**
  * @title VivacityManageScript
  * @notice LlamaScript for managing Vivacity
  */  
contract VivacityManageScript is LlamaBaseScript {


  // ========================
  // ======== Events ========
  // ========================

  event RegisterForCSR(uint256 tokenId);
  event AssignForCSR(address target, uint256 tokenId);

  // ========================
  // ======== Errors ========
  // ========================

  /// @dev The call did not succeed.
  /// @param index Index of the arbitrary function being called.
  /// @param revertData Data returned by the called function.
  error CallReverted(uint256 index, bytes revertData);

  /// @dev The provided arrays do not have the same length.
  error MismatchedArrayLengths();


  ///////////////////////////////
  /////       GENERAL       /////
  ///////////////////////////////

  function aggregate(address[] calldata targets, bytes[] calldata data)
    external
    onlyDelegateCall
    returns (bytes[] memory returnData)
  {
    if (targets.length != data.length) revert MismatchedArrayLengths();
    uint256 length = data.length;
    returnData = new bytes[](length);
    for (uint256 i = 0; i < length; i = LlamaUtils.uncheckedIncrement(i)) {
      (bool success, bytes memory response) = targets[i].call(data[i]);
      if (!success) revert CallReverted(i, response);
      returnData[i] = response;
    }
  }

  function multicall(bytes[] calldata data) external onlyDelegateCall returns (bytes[] memory results) {
    results = new bytes[](data.length);
    for (uint256 i = 0; i < data.length; i++) {
      results[i] = Address.functionDelegateCall(SELF, data[i]);
    }
    return results;
  }

  ///////////////////////////////
  /////         CSR         /////
  ///////////////////////////////

  function registerForCSR(address turnstile) external onlyDelegateCall {
    uint256 tokenId = ITurnstile(turnstile).register(address(this));
    emit RegisterForCSR(tokenId);
  }

  function assignForCSR(address target, address turnstile, uint256 tokenId) external onlyDelegateCall {
    IAssignable(target).assignForCSR(turnstile, tokenId);
    emit AssignForCSR(target, tokenId);
  }

  function withdrawCSR(address turnstile, uint256 _tokenId, address payable _recipient, uint256 _amount) external onlyDelegateCall {
    ITurnstile(turnstile).withdraw(_tokenId, _recipient, _amount);
  }

  ///////////////////////////////
  /////     ADMINABLE       /////
  ///////////////////////////////

  function acceptAdmin(address target) external onlyDelegateCall {
    IAdminable(target)._acceptAdmin();
  }

  function acceptOwnership(address target) external onlyDelegateCall {
    IOwnable(target).acceptOwnership();
  }

  ///////////////////////////////
  /////     COMPTROLLER     /////
  ///////////////////////////////

  function setLiquidationIncentive(address comptroller, uint256 liquidationIncentiveMantissa) external onlyDelegateCall {
    IComptroller(comptroller)._setLiquidationIncentive(liquidationIncentiveMantissa);
  }

  function setCloseFactor(address comptroller, uint256 closeFactorMantissa) external onlyDelegateCall {
    IComptroller(comptroller)._setCloseFactor(closeFactorMantissa);
  }

  function setBorrowCapGuardian(address comptroller, address guardian) external onlyDelegateCall {
    IComptroller(comptroller)._setBorrowCapGuardian(guardian);
  }

  function setPauseGuardian(address comptroller, address guardian) external onlyDelegateCall {
    IComptroller(comptroller)._setPauseGuardian(guardian);
  }

  function setComptrollerPriceOracle(address comptroller, address oracle) external onlyDelegateCall {
    IComptroller(comptroller)._setPriceOracle(oracle);
  }

  function supportMarket(address comptroller, address cToken) external onlyDelegateCall {
    require(ICToken(cToken).comptroller() == comptroller, "VivacityManageScript: cToken does not match comptroller");
    IComptroller(comptroller)._supportMarket(cToken);
  }

  ///////////////////////////////
  /////     PRICE ORACLE    /////
  ///////////////////////////////

  function setPriceOracle(address router, address token, address oracle) external onlyDelegateCall {
    IPriceOracleRouter(router).setOracle(token, oracle);
  }

  ///////////////////////////////
  /////       WHITELIST     /////
  ///////////////////////////////

  function setWhitelist(address router, address token, address whitelistContract) external onlyDelegateCall {
    IWhitelistRouter(router).setWhitelistContract(token, whitelistContract);
  }

  /////////////////////////////////
  /////         CToken        /////
  /////////////////////////////////

  function setCollateralFactor(address comptroller, address cToken, uint256 collateralFactorMantissa) external onlyDelegateCall {
    IComptroller(comptroller)._setCollateralFactor(cToken, collateralFactorMantissa);
  }

  function setBorrowCap(address comptroller, address cToken, uint256 borrowCap) external onlyDelegateCall {
    address[] memory cTokens = new address[](1);
    uint256[] memory borrowCaps = new uint256[](1);

    cTokens[0] = cToken;
    borrowCaps[0] = borrowCap;

    IComptroller(comptroller)._setMarketBorrowCaps(cTokens, borrowCaps);
  }

  function setInterestRateModel(address cToken, address interestRateModel) external onlyDelegateCall {
    ICToken(cToken)._setInterestRateModel(interestRateModel);
  }

  // VCNote
  function setLendingLedger(address cToken, address lendingLedger) external onlyDelegateCall {
    IVCNote(cToken).setLendingLedger(lendingLedger);
  }

  // CRWA
  function setRWAWhitelistRouter(address cToken, address whitelist) external onlyDelegateCall {
    ICRWA(cToken).setWhitelistRouter(whitelist);
  }

  //////////////////////////
  /////     RESERVE    /////
  //////////////////////////

  function setReserveFactor(address cToken, uint256 reserveFactorMantissa) external onlyDelegateCall {
    ICToken(cToken)._setReserveFactor(reserveFactorMantissa);
  }

  function reduceReserves(address cToken, uint256 reduceAmount, address treasury) external onlyDelegateCall {
    uint256 reduced = ICToken(cToken)._reduceReserves(reduceAmount);
    IERC20(ICToken(cToken).underlying()).transfer(treasury, reduced);
  }

  ///////////////////////////
  /////     GUARDIAN    /////
  ///////////////////////////

  function setMintPaused(address comptroller, address cToken, bool state) external onlyDelegateCall {
    IComptroller(comptroller)._setMintPaused(cToken, state);
  }

  function setBorrowPaused(address comptroller, address cToken, bool state) external onlyDelegateCall {
    IComptroller(comptroller)._setBorrowPaused(cToken, state);
  }

  function setTransferPaused(address comptroller, bool state) external onlyDelegateCall {
    IComptroller(comptroller)._setTransferPaused(state);
  }

  function setSeizePaused(address comptroller, bool state) external onlyDelegateCall {
    IComptroller(comptroller)._setSeizePaused(state);
  }


  ///////////////////////////
  /////     VESTING     /////
  ///////////////////////////

  function addVestings(address vestingVault, address[] memory _account, uint64[] memory _start, uint64[] memory _duration, uint256[] memory _amount) external onlyDelegateCall {
    IVestingVault(vestingVault).add(_account, _start, _duration, _amount);
  }

  function removeVesting(address vestingVault, uint256 vestingId, bool doRelease) external onlyDelegateCall {
    IVestingVault(vestingVault).remove(vestingId, doRelease);
  }

  function transferFromVesting(address vestingVault, address _to, uint256 _amount) external onlyDelegateCall {
    IVestingVault(vestingVault).transfer(_to, _amount);
  }


  //////////////////////////
  /////     UPGRADE    /////
  //////////////////////////

  function upgradeComptrollerImplementation(address comptroller, address newImplementation) external onlyDelegateCall {
    IUnitroller(comptroller)._setPendingImplementation(newImplementation);
    IComptroller(newImplementation)._become(comptroller);
  }

  function upgradeCTokenImplementation(address cToken, address newImplementation) external onlyDelegateCall {
    ICErc20Delegator(cToken)._setImplementation(newImplementation, false, "");
  }
}
