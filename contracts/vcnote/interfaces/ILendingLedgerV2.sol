// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

interface ILendingLedgerV2 {

    struct UserInfo {
        uint256 amount; // Amount of cNOTE that the user has provided.
        int256 rewardDebt; // Amount of CANTO entitled to the user.
        int256 secRewardDebt; // Amount of secondary rewards entitled to the user.
    }

    /// @dev Info of each lending market.
    struct MarketInfo {
        uint128 accCantoPerShare;
        uint128 secRewardsPerShare;
        uint64 lastRewardBlock;
    }

    function BLOCK_EPOCH() external view returns (uint256);
    function averageBlockTime() external view returns (uint256);
    function referenceBlockNumber() external view returns (uint256);
    function referenceBlockTime() external view returns (uint256);

    function userInfo(address _market, address _lender) external view returns (UserInfo memory);
    function marketInfo(address _market) external view returns (MarketInfo memory);
    function cantoPerBlock(uint256 _epoch) external view returns (uint256);
    function lendingMarketTotalBalance(address _market) external view returns (uint256);

    function lendingMarketWhitelist(address _market) external view returns (bool);
        
    function update_market(address _market) external; 
    function sync_ledger(address _lender, int256 _delta) external;
    function claim(address _market) external;
}