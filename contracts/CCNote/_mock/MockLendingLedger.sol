pragma solidity ^0.8.10;

import "../interfaces/ILendingLedger.sol";

contract MockLendingLedger is ILendingLedger {

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

    function claim(address _market, uint256 _claimFromTimestamp, uint256 _claimUpToTimestamp) external {

	} 
}
