// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.10;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";

import {ILlamaCore} from "../interfaces/ILlamaCore.sol";
import {ILlamaPolicy} from "../interfaces/ILlamaPolicy.sol";
import {StakingStorageLib, StakingStorage} from "./storages/StakingStorage.sol";
import {Upgradeable} from "../../_utils/upgradeable/Upgradeable.sol";
import {Ownable} from "../../_utils/upgradeable/Ownable.sol";

/**
 * @title Staking
 * @notice Staking contract for VIVA holders
 * @dev This contract is used to stake VIVA tokens and receive voting power in Llama Governance
 */
contract Staking is Upgradeable, Ownable {
    using SafeCast for uint256;
    using SafeCast for int256;

    // ==============================
    // ======== Constants ===========
    // ==============================

    // A scaling factor for precision
    uint256 public constant SCALE = 1e18;

    // Selector for the 'setRoleHolder' function in llamaPolicy
    bytes4 public constant SELECTOR = bytes4(keccak256("setRoleHolder(uint8,address,uint96,uint64)"));

    // ==============================
    // ========== Events ============
    // ==============================

    event MoveDelegates(address indexed from, address indexed to, uint256 fromAmount, uint256 toAmount);

    // ==============================
    // ========= Initialize =========
    // ==============================

    /**
    * @notice Construct a new Staking contract
    * @param _viva VIVA token address
    * @param _llamaCore llamaCore contract address
    * @param _llamaPolicy llamaPolicy contract address
    * @param _stakingModuleStrategy Llama stakingModuleStrategy contract address
    * @param _stakingModuleRole Llama stakingModule role id
    * @param _stakerRole Llama staker role id
    */
    function initialize(address _viva, address _llamaCore, address _llamaPolicy, address _stakingModuleStrategy, uint8 _stakingModuleRole, uint8 _stakerRole) public {
        __initialize_Ownable(msg.sender);

        StakingStorage storage ss = StakingStorageLib.get();
        ss.viva = _viva;
        ss.llama.llamaCore = _llamaCore;
        ss.llama.llamaPolicy = _llamaPolicy;
        ss.llama.stakingModuleStrategy = _stakingModuleStrategy;
        ss.llama.stakingModuleRole = _stakingModuleRole;
        ss.llama.stakerRole = _stakerRole;
    }

    // ==============================
    // ======== External ============
    // ==============================

    /**
    * @notice Delegate VIVA tokens to another address
    * @param delegatee Address to delegate to
    * @param amount Amount of VIVA tokens to delegate
    */
    function delegate(address delegatee, uint256 amount) external {
        StakingStorage storage ss = StakingStorageLib.get();
        address currentDelegatee = ss.delegates[msg.sender];
        uint256 currentBalance = ss.balances[msg.sender];

        IERC20(ss.viva).transferFrom(msg.sender, address(this), amount);
        ss.balances[msg.sender] += amount;
        ss.delegates[msg.sender] = delegatee;

        _moveDelegates(currentDelegatee, currentBalance, delegatee, ss.balances[msg.sender]);
    }

    /**
    * @notice Undelegate VIVA tokens
    * @param amount Amount of VIVA tokens to undelegate
    */
    function undelegate(uint256 amount) public {
        StakingStorage storage ss = StakingStorageLib.get();
        require(ss.balances[msg.sender] >= amount, "Staking: insufficient balance");

        address currentDelegatee = ss.delegates[msg.sender];
        uint256 currentBalance = ss.balances[msg.sender];

        ss.balances[msg.sender] -= amount;
        IERC20(ss.viva).transfer(msg.sender, amount);

        _moveDelegates(currentDelegatee, currentBalance, currentDelegatee, ss.balances[msg.sender]);
    }

    // ==============================
    // ======== Internal ============
    // ==============================

    /**
    * @notice Move delagates from one address to another
    * @param previousDelegatee Address to move delegates from
    * @param previousAmount Amount of VIVA tokens to move delegates from
    * @param newDelegatee Address to move delegates to
    * @param newAmount Amount of VIVA tokens to move delegates to
    */
    function _moveDelegates(address previousDelegatee, uint256 previousAmount, address newDelegatee, uint256 newAmount) internal {
        uint96 previousPower = _downscale(previousAmount).toUint96();
        uint96 newPower = _downscale(newAmount).toUint96();

        if (previousDelegatee != newDelegatee) {
            if (previousDelegatee != address(0) && previousPower != 0) {
                _applyDeltaRoleHolder(previousDelegatee, previousPower, false);
            }
            if (newDelegatee != address(0) && newPower != 0) {
                _applyDeltaRoleHolder(newDelegatee, newPower, true);
            }
        } else {
            if (previousPower != newPower) {
                uint96 delta = newPower > previousPower ? newPower - previousPower : previousPower - newPower;
                bool increase = newPower > previousPower;
                 _applyDeltaRoleHolder(previousDelegatee, delta, increase);
            }
        }
        emit MoveDelegates(previousDelegatee, newDelegatee, previousAmount, newAmount);
    }

    /**
    * @notice Apply delta to role holder in llamaPolicy
    * @param holder Address of role holders to apply Delta
    * @param delta Amount of delta to apply
    * @param increase Whether to increase or decrease the delta
    */
    function _applyDeltaRoleHolder(address holder, uint96 delta, bool increase) internal {
        StakingStorage storage ss = StakingStorageLib.get();
        uint96 quantity = ILlamaPolicy(ss.llama.llamaPolicy).getQuantity(holder, ss.llama.stakerRole);
        uint96 newQuantity = increase ? quantity + delta : quantity - delta;
        uint64 expiration = newQuantity == 0 ? 0 : type(uint64).max;
        bytes memory data = abi.encodeWithSelector(SELECTOR, ss.llama.stakerRole, holder, newQuantity, expiration);

        uint256 actionId = ILlamaCore(ss.llama.llamaCore).createAction(ss.llama.stakingModuleRole, ss.llama.stakingModuleStrategy, ss.llama.llamaPolicy, 0, data, "");
        ILlamaCore.ActionInfo memory actionInfo = ILlamaCore.ActionInfo({
            id: actionId,
            creator: address(this),
            creatorRole: ss.llama.stakingModuleRole,
            strategy: ss.llama.stakingModuleStrategy,
            target: ss.llama.llamaPolicy,
            value: 0,
            data: data
        });
        ILlamaCore(ss.llama.llamaCore).castApproval(ss.llama.stakingModuleRole, actionInfo, "");
        ILlamaCore(ss.llama.llamaCore).executeAction(actionInfo);
    }

    /**
    * @notice Downscale a uint256
    * @param amount Amount to downscale
    */
    function _downscale(uint256 amount) internal pure returns (uint256) {
        return amount / SCALE; 
    }
}