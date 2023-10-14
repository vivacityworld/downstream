// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/Address.sol";

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IUnitroller} from "./interfaces/IUnitroller.sol";
import {IComptroller} from "./interfaces/IComptroller.sol";
import {ILlamaAccount} from "./interfaces/ILlamaAccount.sol";
import {ICToken} from "./interfaces/ICToken.sol";
import {ICRWA} from "./interfaces/ICRWA.sol";
import {ICCNote} from "./interfaces/ICCNote.sol";
import {IAdminable} from "./interfaces/IAdminable.sol";
import {IPriceOracleRouter} from "./interfaces/IPriceOracleRouter.sol";
import {ICErc20Delegator} from "./interfaces/ICErc20Delegator.sol";

import {LlamaBaseScript} from "./_llama/llama-scripts/LlamaBaseScript.sol";
import {LlamaUtils} from "./_llama/lib/LlamaUtils.sol";


/**
  * @title VivacityManageScript
  * @notice LlamaScript for managing Vivacity
  */  
contract VivacityManageScript is LlamaBaseScript {

  // ==========================
  // ========= Structs ========
  // ==========================

  struct AddCRWAParams {
    address comptroller;
    address cToken;
    address cTokenImplementation;
    address interestRateModel;
    address oracle;
    address whitelist;
    uint256 collateralFactor;
    uint256 reserveFactor;
    uint256 borrowCap;
  }

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
  /////     ADMINABLE       /////
  ///////////////////////////////

  function acceptAdmin(address comptroller) external onlyDelegateCall {
    IAdminable(comptroller)._acceptAdmin();
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

  ///////////////////////////////
  /////     PRICE ORACLE    /////
  ///////////////////////////////

  function setPriceOracle(address router, address token, address oracle) external onlyDelegateCall {
    IPriceOracleRouter(router).setOracle(token, oracle);
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

  // CCNote
  function setLendingLedger(address cToken, address lendingLedger) external onlyDelegateCall {
    ICCNote(cToken).setLendingLedger(lendingLedger);
  }

  // CRWA
  function setWhitelist(address cToken, address whitelist) external onlyDelegateCall {
    ICRWA(cToken).setWhitelist(whitelist);
  }

  // CRWA
  function setCRWAPriceOracle(address cToken, address oracle) external onlyDelegateCall {
    ICRWA(cToken).setPriceOracle(oracle);
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
