// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import {IERC20, SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ILendingLedger} from "../interfaces/ILendingLedger.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

contract MockLendingLedger {
    // Constants
    uint256 public constant WEEK = 7 days;

    // State
    address public governance;
    mapping(address => bool) public lendingMarketWhitelist;
    /// @dev Lending Market => Lender => Epoch => Balance
    mapping(address => mapping(address => mapping(uint256 => uint256))) public lendingMarketBalances; // cNote balances of users within the lending markets, indexed by epoch
    mapping(address => mapping(address => mapping(uint256 => uint256))) public lendingMarketTimeWeightedBalances; // Time-weighted cNote balances of users within the lending markets, indexed by epoch
    /// @dev Lending Market => Lender => Epoch
    mapping(address => mapping(address => uint256)) public lendingMarketBalancesEpoch; // Epoch when the last update happened
    /// @dev Lending Market => Epoch => Balance
    mapping(address => mapping(uint256 => uint256)) public lendingMarketTotalBalance; // Total balance locked within the market, i.e. sum of lendingMarketBalances for all
    mapping(address => mapping(uint256 => uint256)) public lendingMarketTotalTimeWeightedBalance;
    /// @dev Lending Market => Epoch
    mapping(address => uint256) public lendingMarketTotalBalanceEpoch; // Epoch when the last update happened
    /// @dev Lending Market => Lender => Epoch
    mapping(address => mapping(address => uint256)) public userClaimedEpoch; // Until which epoch a user has claimed for a particular market (exclusive this value)
    /// @dev Lending Market => Token => Epoch => Rewards
    mapping(address => mapping(address => mapping(uint256 => uint256))) public secondaryRewards;
    /// @dev Lending Market => Token => Epoch => User => Claimed
    mapping(address => mapping(address => mapping(uint256 => mapping(address => bool)))) public secondaryRewardsClaimed;

    struct RewardInformation {
        bool set;
        uint248 amount;
    }
    mapping(uint256 => RewardInformation) public rewardInformation;

    event SecondaryRewardsSet(address indexed market, address indexed token, uint256 fromEpoch, uint256 toEpoch, uint256 amount);

    /// @notice Check that a provided timestamp is a valid epoch (divisible by WEEK) or infinity
    /// @param _timestamp Timestamp to check
    modifier is_valid_epoch(uint256 _timestamp) {
        require(_timestamp % WEEK == 0 || _timestamp == type(uint256).max, "Invalid timestamp");
        _;
    }

    modifier onlyGovernance() {
        require(msg.sender == governance);
        _;
    }

    constructor() {}

    /// @notice Fill in gaps in the user market balances history (if any exist)
    /// @param _market Address of the market
    /// @param _lender Address of the lender
    /// @param _forwardTimestampLimit Until which epoch (provided as timestamp) should the update be applied. If it is higher than the current epoch timestamp, this will be used.
    function _checkpoint_lender(
        address _market,
        address _lender,
        uint256 _forwardTimestampLimit
    ) private {
        uint256 currEpoch = (block.timestamp / WEEK) * WEEK;

        uint256 lastUserUpdateEpoch = lendingMarketBalancesEpoch[_market][_lender];
        uint256 updateUntilEpoch = Math.min(currEpoch, _forwardTimestampLimit);
        if (lastUserUpdateEpoch == 0) {
            // Store epoch of first deposit
            userClaimedEpoch[_market][_lender] = currEpoch;
            lendingMarketBalancesEpoch[_market][_lender] = currEpoch;
        } else if (lastUserUpdateEpoch < currEpoch) {
            // Fill in potential gaps in the user balances history
            uint256 lastUserBalance = lendingMarketBalances[_market][_lender][lastUserUpdateEpoch];
            for (uint256 i = lastUserUpdateEpoch + WEEK; i <= updateUntilEpoch; i += WEEK) {
                lendingMarketBalances[_market][_lender][i] = lastUserBalance;
                lendingMarketTimeWeightedBalances[_market][_lender][i] = lastUserBalance * WEEK;
            }
            if (updateUntilEpoch > lastUserUpdateEpoch) {
                lendingMarketBalancesEpoch[_market][_lender] = updateUntilEpoch;
            }
        }
    }

    /// @notice Fill in gaps in the market total balances history (if any exist)
    /// @param _market Address of the market
    /// @param _forwardTimestampLimit Until which epoch (provided as timestamp) should the update be applied. If it is higher than the current epoch timestamp, this will be used.
    function _checkpoint_market(address _market, uint256 _forwardTimestampLimit) private {
        uint256 currEpoch = (block.timestamp / WEEK) * WEEK;
        uint256 lastMarketUpdateEpoch = lendingMarketTotalBalanceEpoch[_market];
        uint256 updateUntilEpoch = Math.min(currEpoch, _forwardTimestampLimit);
        if (lastMarketUpdateEpoch == 0) {
            lendingMarketTotalBalanceEpoch[_market] = currEpoch;
        } else if (lastMarketUpdateEpoch < currEpoch) {
            // Fill in potential gaps in the market total balances history
            uint256 lastMarketBalance = lendingMarketTotalBalance[_market][lastMarketUpdateEpoch];
            for (uint256 i = lastMarketUpdateEpoch + WEEK; i <= updateUntilEpoch; i += WEEK) {
                lendingMarketTotalBalance[_market][i] = lastMarketBalance;
                lendingMarketTotalTimeWeightedBalance[_market][i] = lastMarketBalance * WEEK;
            }
            if (updateUntilEpoch > lastMarketUpdateEpoch) {
                // Only update epoch when we actually checkpointed to avoid decreases
                lendingMarketTotalBalanceEpoch[_market] = updateUntilEpoch;
            }
        }
    }

    /// @notice Trigger a checkpoint explicitly.
    ///     Never needs to be called explicitly, but could be used to ensure the checkpoints within the other functions consume less gas (because they need to forward less epochs)
    /// @param _market Address of the market
    /// @param _forwardTimestampLimit Until which epoch (provided as timestamp) should the update be applied. If it is higher than the current epoch timestamp, this will be used.
    function checkpoint_market(address _market, uint256 _forwardTimestampLimit)
        external
        is_valid_epoch(_forwardTimestampLimit)
    {
        require(lendingMarketTotalBalanceEpoch[_market] > 0, "No deposits for this market");
        _checkpoint_market(_market, _forwardTimestampLimit);
    }

    /// @param _market Address of the market
    /// @param _lender Address of the lender
    /// @param _forwardTimestampLimit Until which epoch (provided as timestamp) should the update be applied. If it is higher than the current epoch timestamp, this will be used.
    function checkpoint_lender(
        address _market,
        address _lender,
        uint256 _forwardTimestampLimit
    ) external is_valid_epoch(_forwardTimestampLimit) {
        require(lendingMarketBalancesEpoch[_market][_lender] > 0, "No deposits for this lender in this market");
        _checkpoint_lender(_market, _lender, _forwardTimestampLimit);
    }

    /// @notice Function that is called by the lending market on cNOTE deposits / withdrawals
    /// @param _lender The address of the lender
    /// @param _delta The amount of cNote deposited (positive) or withdrawn (negative)
    function sync_ledger(address _lender, int256 _delta) external {
        address lendingMarket = msg.sender;

        _checkpoint_lender(lendingMarket, _lender, type(uint256).max);
        uint256 currEpoch = (block.timestamp / WEEK) * WEEK;
        uint256 nextEpoch = currEpoch + WEEK;
        int256 updatedLenderBalance = int256(lendingMarketBalances[lendingMarket][_lender][currEpoch]) + _delta;
        int256 updatedTimeWeightedBalance = int256(lendingMarketTimeWeightedBalances[lendingMarket][_lender][currEpoch]) + _delta * int256(nextEpoch - block.timestamp);
        require(updatedLenderBalance >= 0, "Lender balance underflow"); // Sanity check performed here, but the market should ensure that this never happens
        require(updatedTimeWeightedBalance >= 0, "Time weighted balance underflow");
        lendingMarketBalances[lendingMarket][_lender][currEpoch] = uint256(updatedLenderBalance);
        lendingMarketTimeWeightedBalances[lendingMarket][_lender][currEpoch] = uint256(updatedTimeWeightedBalance);

        _checkpoint_market(lendingMarket, type(uint256).max);
        int256 updatedMarketBalance = int256(lendingMarketTotalBalance[lendingMarket][currEpoch]) + _delta;
        int256 updatedMarketTimeWeightedBalance = int256(lendingMarketTotalTimeWeightedBalance[lendingMarket][currEpoch]) + _delta * int256(nextEpoch - block.timestamp);
        require(updatedMarketBalance >= 0, "Market balance underflow"); // Sanity check performed here, but the market should ensure that this never happens
        require(updatedMarketTimeWeightedBalance >= 0, "Time weighted balance underflow");
        lendingMarketTotalBalance[lendingMarket][currEpoch] = uint256(updatedMarketBalance);
        lendingMarketTotalTimeWeightedBalance[lendingMarket][currEpoch] = uint256(updatedMarketTimeWeightedBalance);
    }

    /// @notice Claim the CANTO for a given market. Can only be performed for prior (i.e. finished) epochs, not the current one
    /// @param _market Address of the market
    /// @param _claimFromTimestamp From which epoch (provided as timestmap) should the claim start. Usually, this parameter should be set to 0, in which case the epoch of the last claim will be used.
    ///     However, it can be useful to skip certain epochs, e.g. when the balance was very low or 0 (after everything was withdrawn) and the gas usage should be reduced.
    ///     Note that all rewards are forfeited forever if epochs are explicitly skipped by providing this parameter
    /// @param _claimUpToTimestamp Until which epoch (provided as timestamp) should the claim be applied. If it is higher than the timestamp of the previous epoch, this will be used
    ///     Set to type(uint256).max to claim all possible epochs
    function claim(
        address _market,
        uint256 _claimFromTimestamp,
        uint256 _claimUpToTimestamp
    ) external is_valid_epoch(_claimFromTimestamp) is_valid_epoch(_claimUpToTimestamp) {
        address lender = msg.sender;
        uint256 userLastClaimed = userClaimedEpoch[_market][lender];
        require(userLastClaimed > 0, "No deposits for this user");
        _checkpoint_lender(_market, lender, _claimUpToTimestamp);
        _checkpoint_market(_market, _claimUpToTimestamp);
        uint256 currEpoch = (block.timestamp / WEEK) * WEEK;
        uint256 claimStart = Math.max(userLastClaimed, _claimFromTimestamp);
        uint256 claimEnd = Math.min(currEpoch - WEEK, _claimUpToTimestamp);
        uint256 cantoToSend;
        if (claimEnd >= claimStart) {
            // This ensures that we only set userClaimedEpoch when a claim actually happened
            for (uint256 i = claimStart; i <= claimEnd; i += WEEK) {
                uint256 userBalanceWeighted = lendingMarketTimeWeightedBalances[_market][lender][i];
                uint256 marketBalanceWeighted = lendingMarketTotalTimeWeightedBalance[_market][i];
                RewardInformation memory ri = rewardInformation[i];
                require(ri.set, "Reward not set yet"); // Can only claim for epochs where rewards are set, even if it is set to 0
                uint256 marketWeight = 1e18;
                cantoToSend += (marketWeight * userBalanceWeighted * ri.amount) / (1e18 * marketBalanceWeighted); // (marketWeight / 1e18) * (userBalance / marketBalance) * ri.amount;
            }
            userClaimedEpoch[_market][lender] = claimEnd + WEEK;
        }
        if (cantoToSend > 0) {
            (bool success, ) = msg.sender.call{value: cantoToSend}("");
            require(success, "Failed to send CANTO");
        }
    }

    /// @notice Used by governance to set the overall CANTO rewards per epoch
    /// @param _fromEpoch From which epoch (provided as timestamp) to set the rewards from
    /// @param _toEpoch Until which epoch (provided as timestamp) to set the rewards to
    /// @param _amountPerEpoch The amount per epoch
    function setRewards(
        uint256 _fromEpoch,
        uint256 _toEpoch,
        uint248 _amountPerEpoch
    ) external is_valid_epoch(_fromEpoch) is_valid_epoch(_toEpoch) onlyGovernance {
        for (uint256 i = _fromEpoch; i <= _toEpoch; i += WEEK) {
            RewardInformation storage ri = rewardInformation[i];
            require(!ri.set, "Rewards already set");
            ri.set = true;
            ri.amount = _amountPerEpoch;
        }
    }

    /// @notice Allows anyone to add additional ERC20 rewards
    /// @param _lendingMarket Address of the lending market
    /// @param _incentiveToken Address of the ERC20 token that will be distributed
    /// @param _fromEpoch From which epoch (provided as timestamp) to set the rewards from
    /// @param _toEpoch Until which epoch (provided as timestamp) to set the rewards to
    /// @param _amountPerEpoch The amount per epoch
    function setSecondaryRewards(
        address _lendingMarket,
        address _incentiveToken,
        uint256 _fromEpoch,
        uint256 _toEpoch,
        uint256 _amountPerEpoch
    ) external is_valid_epoch(_fromEpoch) is_valid_epoch(_toEpoch) {
        uint256 currEpoch = (block.timestamp / WEEK) * WEEK;
        require(_fromEpoch > currEpoch, "Cannot set rewards for past epochs");
        uint256 numWeeks = (_toEpoch - _fromEpoch) / WEEK + 1;
        SafeERC20.safeTransferFrom(IERC20(_incentiveToken), msg.sender, address(this), _amountPerEpoch * numWeeks);
        for (uint256 i = _fromEpoch; i <= _toEpoch; i += WEEK) {
            // We increase the amount to support multiple calls (potentially even from different users)
            secondaryRewards[_lendingMarket][_incentiveToken][i] += _amountPerEpoch;
        }
        emit SecondaryRewardsSet(_lendingMarket, _incentiveToken, _fromEpoch, _toEpoch, _amountPerEpoch);
    }

    /// @notice Called by lenders to claim secondary rewards
    /// @param _lendingMarket Address of the lending market
    /// @param _incentiveToken Address of the incentive token to claim for
    /// @param _fromEpoch From which epoch (provided as timestamp) to claim
    /// @param _toEpoch Until which epoch (provided as timestamp) to claim
    function claimSecondaryRewards(
        address _lendingMarket,
        address _incentiveToken,
        uint256 _fromEpoch,
        uint256 _toEpoch
    ) external is_valid_epoch(_fromEpoch) is_valid_epoch(_toEpoch) {
        uint256 currEpoch = (block.timestamp / WEEK) * WEEK;
        require (_toEpoch < currEpoch - WEEK, "Can only claim for the past");
        uint256 rewardsToSend; // Will be in decimals of token
        for (uint256 i = _fromEpoch; i <= _toEpoch; i += WEEK) {
            require(!secondaryRewardsClaimed[_lendingMarket][_incentiveToken][i][msg.sender], "Already claimed");
            uint256 secondaryRewardsForWeek = secondaryRewards[_lendingMarket][_incentiveToken][i];
            uint256 userBalanceWeighted = lendingMarketTimeWeightedBalances[_lendingMarket][msg.sender][i];
            uint256 marketBalanceWeighted = lendingMarketTotalTimeWeightedBalance[_lendingMarket][i];
            rewardsToSend += (secondaryRewardsForWeek * userBalanceWeighted) / (marketBalanceWeighted); // tokDec + 18 - 18 -> tokDec decimals
            secondaryRewardsClaimed[_lendingMarket][_incentiveToken][i][msg.sender] = true;
        }
        SafeERC20.safeTransfer(IERC20(_incentiveToken), msg.sender, rewardsToSend);
    }

    receive() external payable {}
}