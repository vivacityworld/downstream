// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.16;


interface ILendingLedger {
    function lendingMarketBalancesEpoch(address _lender, address _market) external view returns (uint256 epoch);
    function lendingMarketBalances(address _lender, address _market, uint256 _epoch) external view returns (uint256 balance);

    function sync_ledger(address _lender, int256 _delta) external;
    function claim(address _market, uint256 _claimFromTimestamp, uint256 _claimUpToTimestamp) external;
}