pragma solidity ^0.8.20;

import "hardhat/console.sol";
import {CToken} from "../../../CErc20.sol";
import {Comptroller} from "../../../Comptroller.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {RedstoneOracle} from "../../../RedstoneOracle.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import {PriceOracle} from "../../../PriceOracle.sol";

import {IBaseV1Factory} from "../../interfaces/IBaseV1Factory.sol";
import {IBaseV1Pair} from "../../interfaces/IBaseV1Pair.sol";

interface IComptroller {
    function claimComp(address holder) external;
    function compAccrued(address holder) external view returns (uint);
}


interface IClpManager {
    function getPrice(bool _maximise) external view returns (uint256);
    function addLiquidity(
        address _token,
        uint256 _amount,
        uint256 _minUsdg,
        uint256 _minClp
    ) external returns (uint256);
    function removeLiquidity(
        address _tokenOut,
        uint256 _clpAmount,
        uint256 _minOut,
        address _receiver
    ) external returns (uint256);
    function cooldownDuration() external view returns (uint256);
}

interface IRewardRouterV2 {
    function stakedCadTracker() external view returns (address);
    function bonusCadTracker() external view returns (address);
    function feeCadTracker() external view returns (address);

    function feeClpTracker() external view returns (address);
    function stakedClpTracker() external view returns (address);

    function stakeCad(uint256 _amount) external;
    function stakeEsCad(uint256 _amount) external;
    function unstakeCad(uint256 _amount) external;
    function unstakeEsCad(uint256 _amount) external;
    function mintAndStakeClp(
        address _token,
        uint256 _amount,
        uint256 _minUsdg,
        uint256 _minClp
    ) external returns (uint256);

    function mintAndStakeClpETH(
        uint256 _minUsdg,
        uint256 _minClp
    ) external payable returns (uint256);

    function unstakeAndRedeemClp(
        address _tokenOut,
        uint256 _clpAmount,
        uint256 _minOut,
        address _receiver
    ) external returns (uint256);

    function unstakeAndRedeemClpETH(
        uint256 _clpAmount,
        uint256 _minOut,
        address payable _receiver
    ) external returns (uint256);

    function claim() external;

    function claimEsCad() external;

    function claimFees() external;

    function compound() external;
}

interface IRewardDistributor {
    function rewardToken() external view returns (address);
    function tokensPerInterval() external view returns (uint256);
    function pendingRewards() external view returns (uint256);
    function distribute() external returns (uint256);
}

interface IRewardTracker {
    function distributor() external view returns (address);
    function depositBalances(address _account, address _depositToken) external view returns (uint256);
    function stakedAmounts(address _account) external view returns (uint256);
    function updateRewards() external;
    function stake(address _depositToken, uint256 _amount) external;
    function stakeForAccount(address _fundingAccount, address _account, address _depositToken, uint256 _amount) external;
    function unstake(address _depositToken, uint256 _amount) external;
    function unstakeForAccount(address _account, address _depositToken, uint256 _amount, address _receiver) external;
    function tokensPerInterval() external view returns (uint256);
    function claim(address _receiver) external returns (uint256);
    function claimForAccount(address _account, address _receiver) external returns (uint256);
    function claimable(address _account) external view returns (uint256);
    function averageStakedAmounts(address _account) external view returns (uint256);
    function cumulativeRewards(address _account) external view returns (uint256);
}

interface IBaseToken {
    function totalSupply() external view returns (uint256);
    function nonStakingSupply() external view returns (uint256);
    function balances(address _account) external view returns (uint256);
    function stakedBalance(address _account) external view returns (uint256);

    function name() external view returns (string memory);
    function symbol() external view returns (string memory);

    function yieldTrackers(uint256 _index) external view returns (address);
    function inPrivateTransferMode() external view returns (bool);


    function claim(address _receiver) external;

    function totalStaked() external view returns (uint256);
    function balanceOf(
        address _account
    ) external view returns (uint256);
}

contract ClpFarmToken is ERC20, PriceOracle, Ownable {
    address public immutable NOTE;
    address public immutable WCANTO;
    address public vcClpFarmToken;

    address public cadRewardRouter;
    address public cadRewardRouter2;
    address public clpManager;

    IComptroller public comptroller;
    RedstoneOracle public priceOracle;

    uint256 previousRewardAmount = 0;
    uint256 rewardPerShare = 0;

    struct Reward {
        uint256 share;
        int256 debt;
    }

    mapping(address => Reward) public rewards;

    constructor(address _NOTE, address _WCANTO, address _cadRewardRouter, address _cadRewardRouter2, address _clpManager) ERC20("CLPFarmToken", "CLPFarmToken") Ownable(msg.sender) {
        NOTE = _NOTE;
        WCANTO = _WCANTO;
        cadRewardRouter = _cadRewardRouter;
        cadRewardRouter2 = _cadRewardRouter2;
        clpManager = _clpManager;
    }

    function setVcClpFarmToken(address _vcClpFarmToken) public onlyOwner {
        vcClpFarmToken = _vcClpFarmToken;
    }

    function executeWithPrice(
        bytes calldata _executeData,
        address _redstoneOracle,
        bytes32[] memory _redstoneIds,
        bytes calldata _redstoneData
    ) public returns (bytes memory) {
        RedstoneOracle(_redstoneOracle).setPrice(_redstoneIds, _redstoneData);
        return Address.functionDelegateCall(address(this), _executeData);
    }

    function getUnderlyingPrice(CToken cToken) public override view returns (uint) {
        require(address(cToken) == vcClpFarmToken, "ClpFarmToken: not clp token");

        return IClpManager(clpManager).getPrice(false) / 1e12;
    }

    function deposit(
        address _token,
        uint256 _amount,
        uint256 _minUsdg,
        uint256 _minClp
    ) external returns (uint256) {
        accrueRewards();

        IERC20(_token).transferFrom(msg.sender, address(this), _amount);
        IERC20(_token).approve(clpManager, _amount);

        // Todo: approve
        uint256 clpAmount = IRewardRouterV2(cadRewardRouter).mintAndStakeClp(
            _token,
            _amount,
            _minUsdg,
            _minClp
        );

        rewards[msg.sender].share += clpAmount;
        rewards[msg.sender].debt += int256(clpAmount) * int256(rewardPerShare) / 1e18;

        _mint(msg.sender, clpAmount);
    }

    function withdraw(
        address _tokenOut,
        uint256 _clpAmount,
        uint256 _minOut,
        address _receiver
    ) external returns (uint256) {
        require(_clpAmount > 0, "RewardRouter: invalid _clpAmount");
        accrueRewards();
        
        IRewardRouterV2(cadRewardRouter).unstakeAndRedeemClp(
            _tokenOut,
            _clpAmount,
            _minOut,
            _receiver
        );
        
        rewards[msg.sender].share -= _clpAmount;
        rewards[msg.sender].debt -= int256(_clpAmount) * int256(rewardPerShare) / 1e18;

        _burn(msg.sender, _clpAmount);
    }

    function accrueRewards() public {
        if (totalSupply() == 0) return;
        IRewardRouterV2(cadRewardRouter2).compound();
        IRewardRouterV2(cadRewardRouter2).claim();

        uint256 currentRewardAmount = IERC20(WCANTO).balanceOf(address(this));

        uint256 amountDelta = currentRewardAmount - previousRewardAmount;
        if (amountDelta == 0) return;

        rewardPerShare += amountDelta * 1e18 / totalSupply();
    }

    function adjustRewards(address from, address to, uint256 amount) public {
        accrueRewards();

        Reward storage fromReward = rewards[from];
        Reward storage toReward = rewards[to];
        if (fromReward.share - amount < balanceOf(from) + IERC20(vcClpFarmToken).balanceOf(from)) {
            revert ("LF: from user insufficient balance");
        }
        if (toReward.share + amount > balanceOf(to) + IERC20(vcClpFarmToken).balanceOf(to)) {
            revert ("LF: to user insufficient balance");
        }

        rewards[from].share -= amount;
        rewards[from].debt -= int256(amount) * int256(rewardPerShare) / 1e18;

        rewards[to].share += amount;
        rewards[to].debt += int256(amount) * int256(rewardPerShare) / 1e18;
    }

    function claimRewards() public {
        accrueRewards();

        int256 reward = (int256(rewards[msg.sender].share) * int256(rewardPerShare) / 1e18 - rewards[msg.sender].debt);
        rewards[msg.sender].debt = int256(rewards[msg.sender].share * rewardPerShare / 1e18);
        if (reward > 0) {
            IERC20(WCANTO).transfer(msg.sender, uint256(reward));
        }

        previousRewardAmount = IERC20(WCANTO).balanceOf(address(this)) + comptroller.compAccrued(address(this));
    }

    // temp
    function getNotePrice() public pure returns (uint256) {
        return 1e18;
    }
}