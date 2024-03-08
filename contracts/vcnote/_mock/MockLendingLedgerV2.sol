// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {IERC20, SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ILendingLedgerV2} from "../interfaces/ILendingLedgerV2.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {IERC20, SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract MockLendingLedgerV2 {
    // Constants
    uint256 public constant BLOCK_EPOCH = 100_000; // 100000 blocks, roughly 1 week
    uint256 public averageBlockTime = 5700; // Average block time in milliseconds
    uint256 public referenceBlockNumber;
    uint256 public referenceBlockTime; // Used to convert block numbers to timestamps together with averageBlockTime

    // State
    address public governance;
    mapping(address => bool) public lendingMarketWhitelist;

    /// @dev Info for each user.
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

    mapping(address => mapping(address => UserInfo)) public userInfo; // Info of each user for the different lending markets
    mapping(address => MarketInfo) public marketInfo; // Info of each lending market

    mapping(uint256 => uint256) public cantoPerBlock; // CANTO per block for each epoch

    /// @dev Lending Market => Epoch => Balance
    mapping(address => uint256) public lendingMarketTotalBalance; // Total balance locked within the market

    modifier onlyGovernance() {
        require(msg.sender == governance);
        _;
    }

    constructor(address _governance) {
        governance = _governance;
        referenceBlockNumber = block.number;
        referenceBlockTime = block.timestamp;
    }

    /// @notice Set governance address
    /// @param _governance New governance address
    function setGovernance(address _governance) external onlyGovernance {
        governance = _governance;
    }

    function update_market(address _market) public {
        require(lendingMarketWhitelist[_market], "Market not whitelisted");
        MarketInfo storage market = marketInfo[_market];
        if (block.number > market.lastRewardBlock) {
            uint256 marketSupply = lendingMarketTotalBalance[_market];
            if (marketSupply > 0) {
                uint256 i = market.lastRewardBlock;
                while (i < block.number) {
                    uint256 epoch = (i / BLOCK_EPOCH) * BLOCK_EPOCH; // Rewards and voting weights are aligned on a weekly basis
                    uint256 nextEpoch = epoch + BLOCK_EPOCH;
                    uint256 blockDelta = Math.min(nextEpoch, block.number) - i;
                    // May not be the exact time, but will ensure that it is equal for all users and epochs.
                    // If this ever drifts significantly, the average block time and / or reference block time & number can be updated. However, update_market needs to be called for all markets beforehand.
                    market.accCantoPerShare += uint128(
                        (blockDelta * cantoPerBlock[epoch] * 1e18) / marketSupply
                    );
                    market.secRewardsPerShare += uint128((blockDelta * 1e36) / marketSupply); // Scale by 1e18, consumers need to divide by it
                    i += blockDelta;
                }
            }
            market.lastRewardBlock = uint64(block.number);
        }
    }

    /// @notice Function that is called by the lending market on cNOTE deposits / withdrawals
    /// @param _lender The address of the lender
    /// @param _delta The amount of cNote deposited (positive) or withdrawn (negative)
    function sync_ledger(address _lender, int256 _delta) external {
        address lendingMarket = msg.sender;
        update_market(lendingMarket); // Checks if the market is whitelisted
        MarketInfo storage market = marketInfo[lendingMarket];
        UserInfo storage user = userInfo[lendingMarket][_lender];

        if (_delta >= 0) {
            user.amount += uint256(_delta);
            user.rewardDebt += int256((uint256(_delta) * market.accCantoPerShare) / 1e18);
            user.secRewardDebt += int256((uint256(_delta) * market.secRewardsPerShare) / 1e18);
        } else {
            user.amount -= uint256(-_delta);
            user.rewardDebt -= int256((uint256(-_delta) * market.accCantoPerShare) / 1e18);
            user.secRewardDebt -= int256((uint256(-_delta) * market.secRewardsPerShare) / 1e18);
        }
        int256 updatedMarketBalance = int256(lendingMarketTotalBalance[lendingMarket]) + _delta;
        require(updatedMarketBalance >= 0, "Market balance underflow"); // Sanity check performed here, but the market should ensure that this never happens
        lendingMarketTotalBalance[lendingMarket] = uint256(updatedMarketBalance);
    }

    /// @notice Claim the CANTO for a given market. Can only be performed for prior (i.e. finished) epochs, not the current one
    /// @param _market Address of the market
    function claim(address _market) external {
        update_market(_market); // Checks if the market is whitelisted
        MarketInfo storage market = marketInfo[_market];
        UserInfo storage user = userInfo[_market][msg.sender];
        int256 accumulatedCanto = int256((uint256(user.amount) * market.accCantoPerShare) / 1e18);
        int256 cantoToSend = accumulatedCanto - user.rewardDebt;

        user.rewardDebt = accumulatedCanto;

        if (cantoToSend > 0) {
            (bool success, ) = msg.sender.call{value: uint256(cantoToSend)}("");
            require(success, "Failed to send CANTO");
        }
    }

    /// @notice Used by governance to set the overall CANTO rewards per epoch
    /// @param _fromEpoch From which epoch (provided as block number) to set the rewards from
    /// @param _toEpoch Until which epoch (provided as block number) to set the rewards to
    /// @param _amountPerBlock The amount per block
    function setRewards(
        uint256 _fromEpoch,
        uint256 _toEpoch,
        uint256 _amountPerBlock
    ) external onlyGovernance {
        require(_fromEpoch % BLOCK_EPOCH == 0 && _toEpoch % BLOCK_EPOCH == 0, "Invalid block number");
        for (uint256 i = _fromEpoch; i <= _toEpoch; i += BLOCK_EPOCH) {
            cantoPerBlock[i] = _amountPerBlock;
        }
    }

    /// @notice Used by governance to whitelist a lending market
    /// @param _market Address of the market to whitelist
    /// @param _isWhiteListed Whether the market is whitelisted or not
    function whiteListLendingMarket(address _market, bool _isWhiteListed) external onlyGovernance {
        require(lendingMarketWhitelist[_market] != _isWhiteListed, "No change");
        lendingMarketWhitelist[_market] = _isWhiteListed;
        if (_isWhiteListed) {
            marketInfo[_market].lastRewardBlock = uint64(block.number);
        }
    }

    /// @notice Used by governance to set the block time parameters if the drift is too large
    /// @param _averageBlockTime The average block time in milliseconds
    /// @param _referenceBlockTime The reference block time
    /// @param _referenceBlockNumber The reference block number
    function setBlockTimeParameters(
        uint256 _averageBlockTime,
        uint256 _referenceBlockTime,
        uint256 _referenceBlockNumber
    ) external onlyGovernance {
        averageBlockTime = _averageBlockTime;
        referenceBlockTime = _referenceBlockTime;
        referenceBlockNumber = _referenceBlockNumber;
    }

    receive() external payable {}
}