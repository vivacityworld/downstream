// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface ILendingLedger {
    function lendingMarketBalancesEpoch(address _lender, address _market) external view returns (uint256 epoch);
    function lendingMarketBalances(address _lender, address _market, uint256 _epoch) external view returns (uint256 balance);

    function sync_ledger(address _lender, int256 _delta) external;
    function claim(address _market, uint256 _claimFromTimestamp, uint256 _claimUpToTimestamp) external;

    function setSecondaryRewards(address _lendingMarket, address _incentiveToken, uint256 _fromEpoch, uint256 _toEpoch, uint256 _amountPerEpoch) external;
    function claimSecondaryRewards(address _lendingMarket, address _incentiveToken, uint256 _fromEpoch, uint256 _toEpoch) external;
}