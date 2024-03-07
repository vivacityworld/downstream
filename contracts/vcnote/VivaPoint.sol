// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";


/**
 * @title VivaPoint
 * @dev The VivaPoints contract accumulates points based on the amount of NOTE deposited by the account.
 */
contract VivaPoint is Ownable {

    event SetWhitelist(address account, bool isWhitelisted);
    event SetStartBlock(uint256 _startBlock);
    event SetEndBlock(uint256 _endBlock);
    event Update(address account, uint256 amount);

    struct UserInfo {
        uint256 accumulatedAmount;  // Amount of points that the account has accumulated.
        uint256 amount;             // Amount of NOTE deposited.
        uint256 lastUpdatedBlock;   // Last Block Number that accumulated points
    }
    
    // Whitelisted addresses that can accumulate points in account
    mapping(address => bool) public isWhitelisted;
    mapping(address => UserInfo) public userInfos;
    // The number of the block to start accumulating points
    uint256 public startBlock;
    // The number of the block to end accumulating points
    uint256 public endBlock;

    constructor(address initialOwner, uint256 _startBlock) Ownable(initialOwner) {
        require(_startBlock > block.number, "VivaPoint: cannot change start block after it has started");
        startBlock = _startBlock;
        endBlock = type(uint256).max;
    }

    function setWhitelist(address _account, bool _isWhitelisted) external onlyOwner {
        isWhitelisted[_account] = _isWhitelisted;
        emit SetWhitelist(_account, _isWhitelisted);
    }

    // Set the number of the block to end accumulating points
    function setEndBlock(uint256 _endBlock) external onlyOwner {
        require(_endBlock > block.number, "VivaPoint: cannot change end block after it has ended");
        require(endBlock > block.number, "VivaPoint: end block must be after start block");
        endBlock = _endBlock;
    }

    // Change the account's deposit amount and accumulate points.
    function update(address _account, uint256 _amount) external onlyWhitelisted(msg.sender) {
        UserInfo storage userInfo = userInfos[_account];

        // if startBlock is not reached yet, just update the amount
        if (startBlock >= block.number) {
            userInfo.lastUpdatedBlock = startBlock;
            userInfo.amount = _amount;

            emit Update(_account, _amount);
            return;
        }

        uint256 lastBlock = (endBlock < block.number ? endBlock : block.number);

        // if first update, just update the amount
        if (userInfo.lastUpdatedBlock == 0) {
            userInfo.lastUpdatedBlock = lastBlock;
            userInfo.amount = _amount;

            emit Update(_account, _amount);
            return;
        } 
        
        uint256 blockDelta = lastBlock - userInfo.lastUpdatedBlock;
        if (blockDelta == 0)  return;
        
        // accumulate points
        userInfo.accumulatedAmount += userInfo.amount * blockDelta;
        userInfo.amount = _amount;
        userInfo.lastUpdatedBlock = lastBlock;

        emit Update(_account, _amount);
        return;
    }

    modifier onlyWhitelisted(address _account) {
        require(isWhitelisted[_account], "VivaPoint: account is not whitelisted");
        _;
    }
} 