// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface ILendingLedger {

    struct RewardInformation {
        bool set;
        uint248 amount;
    }

    function userClaimedEpochs(address _market, address _lender) external view returns (uint256);
    function secondaryRewards(address _market, address _incentiveToken, uint256 _epoch) external view returns (uint256);
    function secondaryRewardsClaimed(address _market, address _lender, address _incentiveToken, uint256 _epoch) external view returns (bool);


    function lendingMarketBalancesEpoch(address _lender, address _market) external view returns (uint256 epoch);
    function lendingMarketBalances(address _lender, address _market, uint256 _epoch) external view returns (uint256 balance);

    function sync_ledger(address _lender, int256 _delta) external;

    function claim(address _market, uint256 _claimFromTimestamp, uint256 _claimUpToTimestamp) external;

    function rewardInformation(uint256 _epoch) external view returns (RewardInformation memory);

    function setSecondaryRewards(address _lendingMarket, address _incentiveToken, uint256 _fromEpoch, uint256 _toEpoch, uint256 _amountPerEpoch) external;
    function claimSecondaryRewards(address _lendingMarket, address _incentiveToken, uint256 _fromEpoch, uint256 _toEpoch) external;
}