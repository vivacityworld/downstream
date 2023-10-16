// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20, SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ILendingLedger} from "../interfaces/ILendingLedger.sol";

contract MockLendingLedger is ILendingLedger {
	uint256 public constant WEEK = 7 days;

	/// @dev Lending Market => Lender => Epoch
	mapping(address => mapping(address => uint256)) public lendingMarketBalancesEpoch;
	/// @dev Lending Market => Lender => Epoch => Balance
	mapping(address => mapping(address => mapping(uint256 => uint256))) public lendingMarketBalances;

    function sync_ledger(address _lender, int256 _delta) external {
		address lendingMarket = msg.sender;
		
		uint256 curEpoch = lendingMarketBalancesEpoch[lendingMarket][_lender];
		uint256 newEpoch = curEpoch + 1;
		lendingMarketBalancesEpoch[lendingMarket][_lender] = newEpoch;
		lendingMarketBalances[lendingMarket][_lender][newEpoch] = uint256(int256(lendingMarketBalances[lendingMarket][_lender][newEpoch]) + _delta);
	}

    function claim(address _market, uint256 _claimFromTimestamp, uint256 _claimUpToTimestamp) external {} 
	function setSecondaryRewards(address _lendingMarket, address _incentiveToken, uint256 _fromEpoch, uint256 _toEpoch, uint256 _amountPerEpoch) external {
		uint256 numWeeks = (_toEpoch - _fromEpoch) / WEEK + 1;
		SafeERC20.safeTransferFrom(IERC20(_incentiveToken), msg.sender, address(this), _amountPerEpoch * numWeeks);
	}
	function claimSecondaryRewards(address _lendingMarket, address _incentiveToken, uint256 _fromEpoch, uint256 _toEpoch) external {}

	function rewardInformation(uint256 _epoch) external view returns (RewardInformation memory) {
		return ILendingLedger.RewardInformation(false, 0);
	}

    function userClaimedEpochs(address _market, address _lender) external view returns (uint256) {}
    function secondaryRewards(address _market, address _incentiveToken, uint256 _epoch) external view returns (uint256) {}
    function secondaryRewardsClaimed(address _market, address _lender, address _incentiveToken, uint256 _epoch) external view returns (bool) {}

}
