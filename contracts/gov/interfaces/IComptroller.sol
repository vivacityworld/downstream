// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface IComptroller {
    function allMarkets() external view returns (address[] memory);
    function getAllMarkets() external view returns (address[] memory);
    function compSupplyState(address) external view returns (CompMarketState memory);
    function compBorrowState(address) external view returns (CompMarketState memory);

    function getCompAddress() external view returns (address);

    function _setCompSpeeds(address[] memory cTokens, uint[] memory supplySpeeds, uint[] memory borrowSpeeds) external;
    function _setLiquidationIncentive(uint256) external;
    function _setCloseFactor(uint256) external;
    function _setCollateralFactor(address, uint256) external;
    function _setMarketBorrowCaps(address[] memory cTokens, uint[] memory newBorrowCaps) external;
    function _setPriceOracle(address newOracle) external returns (uint);
    function _setPauseGuardian(address newPauseGuardian) external returns (uint);
    function _setBorrowCapGuardian(address newBorrowCapGuardian) external returns (bool);

    function _setMintPaused(address, bool) external;
    function _setBorrowPaused(address, bool) external;
    function _setTransferPaused(bool) external;
    function _setSeizePaused(bool) external;

    function _become(address) external;
}

struct CompMarketState {
    // The market's last updated compBorrowIndex or compSupplyIndex
    uint224 index;

    // The block number the index was last updated at
    uint32 block;
}