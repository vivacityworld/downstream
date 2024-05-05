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

contract FarmToken is ERC20, PriceOracle, Ownable {
    address public immutable pair;
    address public immutable NOTE;
    address public immutable WCANTO;
    address public vcFarmToken;

    IComptroller public comptroller;
    RedstoneOracle public priceOracle;

    uint256 previousRewardAmount = 0;
    uint256 rewardPerShare = 0;

    struct Reward {
        uint256 share;
        int256 debt;
    }

    mapping(address => Reward) public rewards;

    constructor(address _NOTE, address _WCANTO, address _pair, RedstoneOracle _redstoneOracle, address _comptroller) ERC20("LF", "LF") Ownable(msg.sender) {
        pair = _pair;
        NOTE = _NOTE;
        WCANTO = _WCANTO;
        priceOracle = _redstoneOracle;
        comptroller = IComptroller(_comptroller);
    }

    function setVcFarmnToken(address _vcFarmToken) public onlyOwner {
        vcFarmToken = _vcFarmToken;
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

        require(address(cToken) == vcFarmToken, "FarmToken: not supported");

        address token0 = IBaseV1Pair(pair).token0();
        address token1 = IBaseV1Pair(pair).token0();
        (uint112 reserve0, uint112 reserve1, ) = IBaseV1Pair(pair).getReserves();

        uint256 token0Price = token0 == NOTE ? getNotePrice() : priceOracle.getPrice(token0);
        uint256 token1Price = token1 == NOTE ? getNotePrice() : priceOracle.getPrice(token1);

        uint256 token0TotalValue = reserve0 * token0Price;
        uint256 token1TotalValue = reserve1 * token1Price;
    
        uint256 totalSupply = IERC20(pair).totalSupply();

        return (token0TotalValue + token1TotalValue) / totalSupply;
    }

    function deposit(uint256 _amount) public {
        accrueRewards();

        IERC20(pair).transferFrom(msg.sender, address(this), _amount);

        rewards[msg.sender].share += _amount;
        rewards[msg.sender].debt += int256(_amount) * int256(rewardPerShare) / 1e18;

        _mint(msg.sender, _amount);
    }

    function withdraw(uint256 _amount) public {
        accrueRewards();

        rewards[msg.sender].share -= _amount;
        rewards[msg.sender].debt -= int256(_amount) * int256(rewardPerShare) / 1e18;

        IERC20(pair).transfer(msg.sender, _amount);

        _burn(msg.sender, _amount);
    }

    function accrueRewards() public {
        if (totalSupply() == 0) return;
        comptroller.claimComp(address(this));
        uint256 currentRewardAmount = IERC20(WCANTO).balanceOf(address(this)) + comptroller.compAccrued(address(this));

        uint256 amountDelta = currentRewardAmount - previousRewardAmount;
        if (amountDelta == 0) return;

        rewardPerShare += amountDelta * 1e18 / totalSupply();
    }

    function adjustRewards(address from, address to, uint256 amount) public {
        accrueRewards();

        Reward storage fromReward = rewards[from];
        Reward storage toReward = rewards[to];
        if (fromReward.share - amount < balanceOf(from) + IERC20(vcFarmToken).balanceOf(from)) {
            revert ("LF: from user insufficient balance");
        }
        if (toReward.share + amount > balanceOf(to) + IERC20(vcFarmToken).balanceOf(to)) {
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