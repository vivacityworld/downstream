// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ICERC20} from "./interfaces/ICERC20.sol";
import {ILendingLedger} from "./interfaces/ILendingLedger.sol";
import {VivaPointV2} from "./VivaPointV2.sol";
import "hardhat/console.sol";

/**
 * @title VivaPoint
 * @dev The VivaPoints contract accumulates points based on the amount of NOTE supplied/borrowed by the account.
 */
contract VivaPoint is Ownable {

    // Events to log changes and updates
    event SetWhitelist(address account, bool isWhitelisted);
    event SetSupplyPointRatePerTime(uint256 _rate);
    event SetBorrowPointRatePerTime(uint256 _rate);
    event SetReferrerIncentiveRate(uint256 _referrerIncentiveRate);
    event SetRefereeIncentiveRate(uint256 _refereeIncentiveRate);
    event SetVCNote(address _vcNote);
    event SetEndTime(uint256 _endTime);
    event SetReferral(address _referrer, address _referee);
    event UpdatePoint(address _account, uint256 _addedPoint, address _referrer, uint256 _addedReferrerPoint, uint256 _addedRefereePoint);
    event MigrateV1Point(address _account, uint256 _point);
    event MigrateV2Point(address _account, uint256 _point);

    // Structure to store user data
    struct User {
        // past version points
        uint256 v1Point;
        uint256 v2Point;
        // current version point
        uint256 v3Point;
        uint256 v3ReferralPoint;
        uint256 borrowAmount;
        uint256 supplyAmount;
        uint256 lastUpdatedTime;
    }

    // Mapping to store referrer and referees relationships
    mapping(address => address) public referrer;
    mapping(address => address[]) public referees;
    mapping(address => User) public users;
    
    // Configuration variables
    uint256 public supplyPointRatePerTime = uint256(31709791984); // 1e18 / 365 / 24 / 3600;
    uint256 public borrowPointRatePerTime = uint256(63419583968); // 2e18 / 365 / 24 / 3600;
    uint256 public referrerIncentiveRate = 0.1e18;
    uint256 public refereeIncentiveRate = 0.1e18;
    ICERC20 public vcNOTE;
    // Whitelisted addresses that can set referrals
    mapping(address => bool) public isWhitelisted;
    
    // The number of the block to start accumulating points
    uint256 public startTime;
    // The number of the block to end accumulating points
    uint256 public endTime;

    constructor(address _initialOwner, uint256 _startTime, address _vcNote) Ownable(_initialOwner) {
        require(_startTime > block.timestamp, "VivaPoint: cannot change start time after it has started");
        startTime = _startTime;
        endTime = type(uint256).max;
        vcNOTE = ICERC20(_vcNote);
    }

    // ==============================
    // ====== Config Functions ======
    // ==============================

    function setSupplyPointRatePerTime(uint256 _rate) public onlyOwner {
        supplyPointRatePerTime = _rate;
        emit SetSupplyPointRatePerTime(_rate);
    }

    function setBorrowPointRatePerTime(uint256 _rate) public onlyOwner {
        borrowPointRatePerTime = _rate;
        emit SetBorrowPointRatePerTime(_rate);
    }

    function setReferrerIncentiveRate(uint256 _incentive) public onlyOwner {
        referrerIncentiveRate = _incentive;
        emit SetReferrerIncentiveRate(_incentive);
    }

    function setrefereeIncentiveRate(uint256 _incentive) public onlyOwner {
        refereeIncentiveRate = _incentive;
        emit SetRefereeIncentiveRate(_incentive);
    }

    function setWhitelist(address _account, bool _isWhitelisted) external onlyOwner {
        isWhitelisted[_account] = _isWhitelisted;
        emit SetWhitelist(_account, _isWhitelisted);
    }

    function setVCNote(address _vcNote) external onlyOwner {
        vcNOTE = ICERC20(_vcNote);
        emit SetVCNote(_vcNote);

    }

    // Set the number of the block to end accumulating points
    function setEndTime(uint256 _endTime) external onlyOwner {
        require(_endTime > block.timestamp, "VivaPoint: cannot change end time after it has ended");
        require(endTime > block.timestamp, "VivaPoint: end time must be after start time");
        endTime = _endTime;

        emit SetEndTime(_endTime);
    }

    // ==============================
    // ===== Referral Functions =====
    // ==============================


    function setReferral(address _referrer, address _referee) public onlyWhitelisted(msg.sender) {
        _setReferral(_referrer, _referee);
    }

    function setReferral(address _referrer) public {
        _setReferral(_referrer, msg.sender);
    }

    function _setReferral(address _referrer, address _referee) internal {
        if (_referrer == _referee) return;
        update(_referee);

        referrer[_referee] = _referrer;
        referees[_referrer].push(_referee);
        
        emit SetReferral(_referrer, _referee);
    }

    // ==============================
    // ======  Point Functions  =====
    // ==============================

    // Change the account's supply/borrow amount and accumulate points.
    function update(address _account) public {
        User storage user = users[_account];
        // if startBlock is not reached yet, just update the amount
        if (startTime >= block.timestamp) {
            user.lastUpdatedTime = startTime;
            user.borrowAmount = vcNOTE.borrowBalanceCurrent(_account);
            user.supplyAmount = vcNOTE.balanceOfUnderlying(_account);

            emit UpdatePoint(_account, 0, address(0), 0, 0);
            return;
        }

        uint256 lastTime = (endTime < block.timestamp ? endTime : block.timestamp);
        uint256 timeDelta = lastTime - user.lastUpdatedTime;
        if (timeDelta == 0)  return;

        // accumulate points
        uint256 addedSupplyPoint = timeDelta * user.supplyAmount * supplyPointRatePerTime / 1e18;
        uint256 addedBorrowPoint = timeDelta * user.borrowAmount * borrowPointRatePerTime / 1e18;
        uint256 totalAddedPoint = addedSupplyPoint + addedBorrowPoint;

        user.v3Point += totalAddedPoint;

        address referrerAddress = referrer[_account];
        uint256 refereePoint = 0;
        uint256 referrerPoint = 0;
        if (referrerAddress != address(0)) {
            refereePoint = (totalAddedPoint * refereeIncentiveRate / 1e18);
            referrerPoint = (totalAddedPoint * referrerIncentiveRate / 1e18);

            user.v3ReferralPoint += refereePoint;
            users[referrerAddress].v3ReferralPoint += referrerPoint;
        }

        // update new amount and lastUpdatedTime
        user.borrowAmount = vcNOTE.borrowBalanceCurrent(_account);
        user.supplyAmount = vcNOTE.balanceOfUnderlying(_account);
        user.lastUpdatedTime = lastTime;

        emit UpdatePoint(_account, totalAddedPoint, referrerAddress, referrerPoint, refereePoint);
        return;
    }

    function updates(address[] memory _accounts) public {
        for (uint256 i=0; i<_accounts.length; i++) {
            update(_accounts[i]);
        }
    }

    function updateWithreferees(address _account) public {
        update(_account);
        address[] memory _referees = referees[_account];
        for (uint256 i=0; i<_referees.length; i++) {
            update(_referees[i]);
        }
    }

    // ==============================
    // ====== Migrate Functions =====
    // ==============================

    function migrateV1Point(address _account) public {
        uint256 startEpoch = 1701907200;
        uint256 endEpoch = 1710374400;
        uint256 week = 604800;

        ILendingLedger lendingLedgerV1 = ILendingLedger(0x85156B45B3C0F40f724637ebfEB035aFB29BD083);
        lendingLedgerV1.checkpoint_lender(address(0x74c6dBA944702007e3a18C2caad9F6F274cF38dD), _account, endEpoch);

        uint256 totalValue;
        for (uint256 epoch = startEpoch; epoch <= endEpoch; epoch += week) {
            totalValue += lendingLedgerV1.lendingMarketTimeWeightedBalances(address(0x74c6dBA944702007e3a18C2caad9F6F274cF38dD), _account, epoch);
        }
        users[_account].v1Point = totalValue / 31536000;
        emit MigrateV1Point(_account, users[_account].v1Point);
    }

    function migrateV2Point(address _account) public {
        VivaPointV2 vivaPointV2 = VivaPointV2(0x25423F587BE8f46bf271FC6fB953B70cD46A1d6D);

        uint256 v2EndBlock = 10_300_000;
        (uint256 accumulatedAmount, uint256 amount, uint256 lastUpdatedBlock) = vivaPointV2.userInfos(_account);

        uint256 blockDelta = v2EndBlock > block.number ? block.number - lastUpdatedBlock : v2EndBlock - lastUpdatedBlock;
        accumulatedAmount += blockDelta * amount;

        users[_account].v2Point = accumulatedAmount / 5437241; // 31536000 / 5.8;

        emit MigrateV2Point(_account, users[_account].v2Point);
    }

    modifier onlyWhitelisted(address _account) {
        require(isWhitelisted[_account], "VivaPoint: account is not whitelisted");
        _;
    }
} 