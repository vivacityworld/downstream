// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/Address.sol";

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IUnitroller} from "./interfaces/IUnitroller.sol";
import {IComptroller} from "./interfaces/IComptroller.sol";
import {ILlamaAccount} from "./interfaces/ILlamaAccount.sol";
import {ICToken} from "./interfaces/ICToken.sol";
import {ICRWA} from "./interfaces/ICRWA.sol";
import {ICCNote} from "./interfaces/ICCNote.sol";
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

  struct InitComptrollerParams {
    address comptroller;
    address unitroller;
    uint256 liquidationIncentive; 
    uint256 closeFactor;
    address oracle;
  }

  struct InitCRWAParams {
    address comptroller;
    address cToken;
    address cTokenImplementation;
    address interestRateModel;
    address oracle;
    address whitelist;
    uint256 collateralFactor;
    uint256 reserveFactor;
    uint256 borrowCap;
    uint256 borrowSpeed;
    uint256 supplySpeed;
    uint64 start;
    uint64 duration;
    address reservoir;
    address treasury;
  }

  struct InitCCNoteParams {
    address comptroller;
    address cToken;
    address cTokenImplementation;
    address interestRateModel;
    address oracle;
    address lendingLedger;
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
  /////     NEW PRODUCT     /////
  ///////////////////////////////

  function initComptroller(InitComptrollerParams memory params) external onlyDelegateCall {
    require(IUnitroller(params.unitroller).comptrollerImplementation() == params.comptroller, "E1");
    IUnitroller(params.unitroller)._acceptAdmin();
    
    IComptroller com = IComptroller(params.unitroller);

    address[] memory markets = com.getAllMarkets();
    require(markets.length == 0, "E2");

    com._setLiquidationIncentive(params.liquidationIncentive);
    com._setPriceOracle(params.oracle);
    com._setCloseFactor(params.closeFactor);
    com._setPauseGuardian(address(this));
  }

  function initCRWA(InitCRWAParams memory params) external onlyDelegateCall {
    ICToken cToken = ICToken(params.cToken);
    require(cToken.implementation() == params.cTokenImplementation, "E1");
    require(cToken.comptroller() == params.comptroller, "E2");
    cToken._acceptAdmin();
    cToken._setReserveFactor(params.reserveFactor);
    cToken._setInterestRateModel(params.interestRateModel);

    IComptroller comp = IComptroller(params.comptroller);
    comp._setCollateralFactor(params.cToken, params.collateralFactor);

    address[] memory cTokens = new address[](1);
    uint256[] memory borrowCaps = new uint256[](1);
    cTokens[0] = params.cToken;
    borrowCaps[0] = params.borrowCap;
    comp._setMarketBorrowCaps(cTokens, borrowCaps);

    ICRWA(params.cToken).setWhitelist(params.whitelist);
    ICRWA(params.cToken).setPriceOracle(params.oracle);
  }

  function initCCNote(InitCCNoteParams memory params) external onlyDelegateCall {
    ICToken cToken = ICToken(params.cToken);
    require(cToken.implementation() == params.cTokenImplementation, "E1");
    require(cToken.comptroller() == params.comptroller, "E2");

    cToken._acceptAdmin();
    cToken._setReserveFactor(params.reserveFactor);
    cToken._setInterestRateModel(params.interestRateModel);

    IComptroller comp = IComptroller(params.comptroller);
    comp._setCollateralFactor(params.cToken, params.collateralFactor);

    address[] memory cTokens = new address[](1);
    uint256[] memory borrowCaps = new uint256[](1);
    cTokens[0] = params.cToken;
    borrowCaps[0] = params.borrowCap;
    comp._setMarketBorrowCaps(cTokens, borrowCaps);

    ICCNote(params.cToken).setLendingLedger(params.lendingLedger);
  }


  //////////////////////////
  /////     REWARD     /////
  //////////////////////////

  // function removeReward(address comptroller, address cToken, address _reservoir, address treasury, bool doRelease) public {
  //   address[] memory cTokens = new address[](1);
  //   uint256[] memory supplySpeeds = new uint256[](1);
  //   uint256[] memory borrowSpeeds = new uint256[](1);
  //   cTokens[0] = cToken;
  //   supplySpeeds[0] = 0;
  //   borrowSpeeds[0] = 0;
  //   IComptroller(comptroller)._setCompSpeeds(cTokens, supplySpeeds, borrowSpeeds);

  //   VivaReservoir reservoir = VivaReservoir(_reservoir);
  //   uint256 rest = reservoir.remove(comptroller, cToken, doRelease);
  //   if (rest > 0) {
  //     reservoir.transfer(treasury, rest);
  //   }
  // }

  // function setReward(
  //   address comptroller,
  //   address cToken,
  //   uint256 borrowSpeed,
  //   uint256 supplySpeed,
  //   uint64 start,
  //   uint64 duration,
  //   address reservoir,
  //   address treasury
  // ) public {
  //     uint256 totalSpeed = supplySpeed + borrowSpeed;
  //     uint256 totalAmount = totalSpeed * duration;

  //     ILlamaAccount(treasury).transferERC20(
  //       ILlamaAccount.ERC20Data(
  //         IERC20(IComptroller(comptroller).getCompAddress()),
  //         reservoir,
  //         totalAmount
  //       )
  //     );
  //     VivaReservoir(reservoir).add(comptroller, cToken, start, duration, totalAmount);

  //     address[] memory cTokens = new address[](1);
  //     uint256[] memory supplySpeeds = new uint256[](1);
  //     uint256[] memory borrowSpeeds = new uint256[](1);

  //     cTokens[0] = cToken;
  //     supplySpeeds[0] = supplySpeed;
  //     borrowSpeeds[0] = borrowSpeed;
  //     IComptroller(comptroller)._setCompSpeeds(cTokens, borrowSpeeds, supplySpeeds);
  // }


  /////////////////////////////////
  /////     RISK PARAMETER    /////
  /////////////////////////////////

  function setLiquidationIncentive(address comptroller, uint256 liquidationIncentiveMantissa) external onlyDelegateCall {
    IComptroller(comptroller)._setLiquidationIncentive(liquidationIncentiveMantissa);
  }

  function setCloseFactor(address comptroller, uint256 closeFactorMantissa) external onlyDelegateCall {
    IComptroller(comptroller)._setCloseFactor(closeFactorMantissa);
  }

  function setCollateralFactor(address comptroller, address cToken, uint256 collateralFactorMantissa) external onlyDelegateCall {
    IComptroller(comptroller)._setCollateralFactor(cToken, collateralFactorMantissa);
  }

  function setPriceOracle(address router, address token, address oracle) external onlyDelegateCall {
    IPriceOracleRouter(router).setOracle(token, oracle);
  }

  function setBorrowCapGuardian(address comptroller, address guardian) external onlyDelegateCall {
    IComptroller(comptroller)._setBorrowCapGuardian(guardian);
  }

  function setPauseGuardian(address comptroller, address guardian) external onlyDelegateCall {
    IComptroller(comptroller)._setPauseGuardian(guardian);
  }

  function setBorrowCap(address comptroller, address cToken, uint256 borrowCap) external onlyDelegateCall {
    address[] memory cTokens = new address[](1);
    uint256[] memory borrowCaps = new uint256[](1);

    cTokens[0] = cToken;
    borrowCaps[0] = borrowCap;

    IComptroller(comptroller)._setMarketBorrowCaps(cTokens, borrowCaps);
  }

  function setReserveFactor(address cToken, uint256 reserveFactorMantissa) external onlyDelegateCall {
    ICToken(cToken)._setReserveFactor(reserveFactorMantissa);
  }

  function setInterestRateModel(address cToken, address interestRateModel) external onlyDelegateCall {
    ICToken(cToken)._setInterestRateModel(interestRateModel);
  }

  //////////////////////////
  /////     RESERVE    /////
  //////////////////////////

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
