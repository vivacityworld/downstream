// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.10;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ILlamaCore} from "./interfaces/ILlamaCore.sol";
import {ILlamaPolicy} from "./interfaces/ILlamaPolicy.sol";

import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";

/**
 * @title Staking
 * @notice Staking contract for VIVA holders
 * @dev This contract is used to stake VIVA tokens and receive voting power in Llama Governance
 */
contract Staking {
    using SafeCast for uint256;
    using SafeCast for int256;

    // ==============================
    // ======== Variables ===========
    // ==============================

    // A scaling factor for precision
    uint256 public constant SCALE = 1e18;

    // Selector for the 'setRoleHolder' function in llamaPolicy
    bytes4 private constant SELECTOR = bytes4(keccak256("setRoleHolder(uint8,address,uint96,uint64)"));

    // Llama variables
    address public immutable llamaCore;             // llamaCore contract address
    address public immutable llamaPolicy;           // llamaPolicy contract address
    address public immutable stakingModuleStrategy; // stakingModuleStrategy contract address
    uint8 public immutable stakingModuleRole;       // stakingModule role id
    uint8 public immutable stakerRole;              // staker role id

    // VIVA staking variables
    address public immutable viva;                  // VIVA token address
    mapping(address => uint256) public balances;    // VIVA balances
    mapping(address => address) public delegates;   // VIVA delegates


    // ==============================
    // ========== Events ============
    // ==============================

    event MoveDelegates(address indexed from, address indexed to, uint256 fromAmount, uint256 toAmount);

    // ==============================
    // ======== Constructor =========
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
    constructor (address _viva, address _llamaCore, address _llamaPolicy, address _stakingModuleStrategy, uint8 _stakingModuleRole, uint8 _stakerRole) {
        viva = _viva;
        llamaCore = _llamaCore;
        llamaPolicy = _llamaPolicy;
        stakingModuleStrategy = _stakingModuleStrategy;
        stakingModuleRole = _stakingModuleRole;
        stakerRole = _stakerRole;
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
        address currentDelegatee = delegates[msg.sender];
        uint256 currentBalance = balances[msg.sender];

        IERC20(viva).transferFrom(msg.sender, address(this), amount);
        balances[msg.sender] += amount;
        delegates[msg.sender] = delegatee;

        _moveDelegates(currentDelegatee, currentBalance, delegatee, balances[msg.sender]);
    }

    /**
    * @notice Undelegate VIVA tokens
    * @param amount Amount of VIVA tokens to undelegate
    */
    function undelegate(uint256 amount) public {
        require(balances[msg.sender] >= amount, "Staking: insufficient balance");

        address currentDelegatee = delegates[msg.sender];
        uint256 currentBalance = balances[msg.sender];

        balances[msg.sender] -= amount;
        IERC20(viva).transfer(msg.sender, amount);

        _moveDelegates(currentDelegatee, currentBalance, currentDelegatee, balances[msg.sender]);
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
        uint96 quantity = ILlamaPolicy(llamaPolicy).getQuantity(holder, stakerRole);
        uint96 newQuantity = increase ? quantity + delta : quantity - delta;
        uint64 expiration = newQuantity == 0 ? 0 : type(uint64).max;
        bytes memory data = abi.encodeWithSelector(SELECTOR, stakerRole, holder, newQuantity, expiration);

        uint256 actionId = ILlamaCore(llamaCore).createAction(stakingModuleRole, stakingModuleStrategy, llamaPolicy, 0, data, "");
        ILlamaCore.ActionInfo memory actionInfo = ILlamaCore.ActionInfo({
            id: actionId,
            creator: address(this),
            creatorRole: stakingModuleRole,
            strategy: stakingModuleStrategy,
            target: llamaPolicy,
            value: 0,
            data: data
        });
        ILlamaCore(llamaCore).castApproval(stakingModuleRole, actionInfo, "");
        ILlamaCore(llamaCore).executeAction(actionInfo);
    }

    /**
    * @notice Downscale a uint256
    * @param amount Amount to downscale
    */
    function _downscale(uint256 amount) internal pure returns (uint256) {
        return amount / SCALE; 
    }
}
