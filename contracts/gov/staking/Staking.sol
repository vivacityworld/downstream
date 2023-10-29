// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.10;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";

import {ITurnstile} from "../../_interfaces/ITurnstile.sol";
import {ILlamaCore} from "../interfaces/ILlamaCore.sol";
import {ILlamaPolicy} from "../interfaces/ILlamaPolicy.sol";
import {StakingStorageLib, StakingStorage, Proposal} from "./storages/StakingStorage.sol";
import {LlamaStorageLib, LlamaStorage} from "./storages/LlamaStorage.sol";
import {Upgradeable} from "../../_proxy/Upgradeable.sol";

/**
 * @title Staking
 * @notice Staking contract for VIVA holders
 * @dev This contract is used to stake VIVA tokens and receive voting power in Llama Governance
 */
contract Staking is Upgradeable {
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
    event Propose(address indexed proposer, uint256 indexed actionId, address indexed target, bytes data, string description);
    event RegisterTurnstile(address indexed turnstile, uint256 indexed nftId);

    // ==============================
    // ========== Errors ============
    // ==============================

    error InsufficientBalance(uint256 balance, uint256 amount);
    error ActiveProposal(uint256 actionId);
    error ExceedMaxLocked(uint256 locked, uint256 maxLocked);
    // error Unauthorized(address account);

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
    function initialize(address _viva, address _llamaCore, address _llamaPolicy, address _llamaExecutor, address _turnstile, address _stakingModuleStrategy, address _stakerStrategy, uint8 _stakingModuleRole, uint8 _stakerRole) public {
        StakingStorage storage ss = StakingStorageLib.get();
        ss.viva = _viva;

        LlamaStorage storage ls = LlamaStorageLib.get();

        ls.llamaCore = _llamaCore;
        ls.llamaPolicy = _llamaPolicy;
        ls.stakingModuleStrategy = _stakingModuleStrategy;
        ls.stakerStrategy = _stakerStrategy;
        ls.stakingModuleRole = _stakingModuleRole;
        ls.stakerRole = _stakerRole;

        if (_turnstile != address(0)) {
            uint256 nftId = ITurnstile(_turnstile).register(_llamaExecutor);
            emit RegisterTurnstile(_turnstile, nftId);
        }
    }

    // =================================
    // ======== Admin Functions ========
    // =================================

    function setLlama(address llamaCore, address llamaPolicy, address stakingModuleStrategy, uint8 stakingModuleRole, uint8 stakerRole) external {
        if (msg.sender != getAdmin()) revert Unauthorized(msg.sender);
        LlamaStorage storage ls = LlamaStorageLib.get();
        ls.llamaCore = llamaCore;
        ls.llamaPolicy = llamaPolicy;
        ls.stakingModuleStrategy = stakingModuleStrategy;
        ls.stakingModuleRole = stakingModuleRole;
        ls.stakerRole = stakerRole;
    }

    function setDeposit(uint96 amount) external {
        if (msg.sender != getAdmin()) revert Unauthorized(msg.sender);
        StakingStorage storage ss = StakingStorageLib.get();
        ss.deposit = amount;
    }

    function transferReserve(address to, uint256 amount) external {
        if (msg.sender != getAdmin()) revert Unauthorized(msg.sender);
        StakingStorage storage ss = StakingStorageLib.get();
        ss.reserve -= amount;
        IERC20(ss.viva).transfer(to, amount);
    }

    // ==================================
    // ============ External ============
    // ==================================

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

        address currentDelegatee = ss.delegates[msg.sender];
        uint256 currentBalance = ss.balances[msg.sender];

        uint256 availableBalance = ss.balances[msg.sender] - ss.lockedBalances[msg.sender];
        if (availableBalance < amount) revert InsufficientBalance(availableBalance, amount);

        ss.balances[msg.sender] -= amount;
        IERC20(ss.viva).transfer(msg.sender, amount);

        _moveDelegates(currentDelegatee, currentBalance, currentDelegatee, ss.balances[msg.sender]);
    }

    /**
    * @notice propose a new action
    * @param target Target of the proposal
    * @param data Data of the proposal
    * @param description Description of the proposal
    */
    function propose(address target, bytes calldata data, string memory description, uint256 maxLocked) external returns (uint256 actionId) {
        StakingStorage storage ss = StakingStorageLib.get();
        if (maxLocked != 0 && ss.deposit > maxLocked) {
            revert ExceedMaxLocked(ss.deposit, maxLocked);
        }

        uint256 availableBalance = ss.balances[msg.sender] - ss.lockedBalances[msg.sender];
        if (availableBalance < ss.deposit) revert InsufficientBalance(availableBalance, ss.deposit);

        ss.lockedBalances[msg.sender] += ss.deposit;

        LlamaStorage storage ls = LlamaStorageLib.get();
        actionId = ILlamaCore(ls.llamaCore).createAction(ls.stakingModuleRole, ls.stakerStrategy, target, 0, data, description);
        ss.proposals[actionId] = Proposal(msg.sender, ss.deposit, ls.stakingModuleRole, ls.stakerStrategy);

        emit Propose(msg.sender, actionId, target, data, description);
    }

    /**
    * @notice Withdraw VIVA tokens from a proposal
    * @param actionId Action id of the proposal
    * @param target Address of the proposal
    * @param data Data of the proposal
    */
    function withdraw(uint256 actionId, address target, bytes calldata data) external {
        StakingStorage storage ss = StakingStorageLib.get();
        Proposal memory proposal = ss.proposals[actionId];

        LlamaStorage storage ls = LlamaStorageLib.get();
        ILlamaCore.ActionInfo memory actionInfo = ILlamaCore.ActionInfo({
            id: actionId,
            creator: address(this),
            creatorRole: proposal.stakingModuleRole,
            strategy: proposal.stakerStrategy,
            target: target,
            value: 0,
            data: data
        });
        ILlamaCore.ActionState state = ILlamaCore(ls.llamaCore).getActionState(actionInfo);

        if (state == ILlamaCore.ActionState.Executed) {
            ss.lockedBalances[proposal.proposer] -= proposal.deposit;
        } else if (state == ILlamaCore.ActionState.Canceled || state == ILlamaCore.ActionState.Failed || state == ILlamaCore.ActionState.Expired) {
            uint256 currentBalance = ss.balances[proposal.proposer];
            address currentDelegatee = ss.delegates[proposal.proposer];

            ss.lockedBalances[proposal.proposer] -= proposal.deposit;
            ss.balances[proposal.proposer] -= proposal.deposit;
            ss.reserve += proposal.deposit;
            
            _moveDelegates(currentDelegatee, currentBalance, currentDelegatee, ss.balances[proposal.proposer]);
        } else {
            revert ActiveProposal(actionId);
        }
        delete ss.proposals[actionId];
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
        int256 previousPower = _downscale(previousAmount).toInt256();
        int256 newPower = _downscale(newAmount).toInt256();

        if (previousDelegatee != newDelegatee) {
            if (previousDelegatee != address(0) && previousPower != 0) {
                _applyDeltaRoleHolder(previousDelegatee, -previousPower);
            }
            if (newDelegatee != address(0) && newPower != 0) {
                _applyDeltaRoleHolder(newDelegatee, newPower);
            }
        } else {
            if (previousPower != newPower) {
                _applyDeltaRoleHolder(previousDelegatee, newPower - previousPower);
            }
        }
        emit MoveDelegates(previousDelegatee, newDelegatee, previousAmount, newAmount);
    }

    /**
    * @notice Apply delta to role holder in llamaPolicy
    * @param holder Address of role holders to apply Delta
    * @param delta Amount of delta to apply
    */
    function _applyDeltaRoleHolder(address holder, int256 delta) internal {
        LlamaStorage storage ls = LlamaStorageLib.get();
        uint96 quantity = ILlamaPolicy(ls.llamaPolicy).getQuantity(holder, ls.stakerRole);
        uint96 newQuantity = (uint256(quantity).toInt256() + delta).toUint256().toUint96();
        uint64 expiration = newQuantity == 0 ? 0 : type(uint64).max;
        bytes memory data = abi.encodeWithSelector(SELECTOR, ls.stakerRole, holder, newQuantity, expiration);

        uint256 actionId = ILlamaCore(ls.llamaCore).createAction(ls.stakingModuleRole, ls.stakingModuleStrategy, ls.llamaPolicy, 0, data, "");
        ILlamaCore.ActionInfo memory actionInfo = ILlamaCore.ActionInfo({
            id: actionId,
            creator: address(this),
            creatorRole: ls.stakingModuleRole,
            strategy: ls.stakingModuleStrategy,
            target: ls.llamaPolicy,
            value: 0,
            data: data
        });
        ILlamaCore(ls.llamaCore).castApproval(ls.stakingModuleRole, actionInfo, "");
        ILlamaCore(ls.llamaCore).executeAction(actionInfo);
    }

    /**
    * @notice Downscale a uint256
    * @param amount Amount to downscale
    */
    function _downscale(uint256 amount) internal pure returns (uint256) {
        return amount / SCALE; 
    }

    // ==============================
    // ======== VIEW ================
    // ==============================

    function balanceOf(address account) external view returns (uint256) {
        StakingStorage storage ss = StakingStorageLib.get();
        return ss.balances[account];
    }

    function lockedBalanceOf(address account) external view returns (uint256) {
        StakingStorage storage ss = StakingStorageLib.get();
        return ss.lockedBalances[account];
    }

    function delegates(address account) external view returns (address) {
        StakingStorage storage ss = StakingStorageLib.get();
        return ss.delegates[account];
    }

    function getProposer(uint256 actionId) external view returns (address) {
        StakingStorage storage ss = StakingStorageLib.get();
        return ss.proposals[actionId].proposer;
    }

    function getDeposit(uint256 actionId) external view returns (uint96) {
        StakingStorage storage ss = StakingStorageLib.get();
        return ss.proposals[actionId].deposit;
    }

    function getDeposit() external view returns (uint96) {
        StakingStorage storage ss = StakingStorageLib.get();
        return ss.deposit;
    }

    function getReserve() external view returns (uint256) {
        StakingStorage storage ss = StakingStorageLib.get();
        return ss.reserve;
    }

    function getVotingPower(address account) external view returns (uint256) {
        LlamaStorage storage ls = LlamaStorageLib.get();
        return ILlamaPolicy(ls.llamaPolicy).getQuantity(account, ls.stakerRole);
    }
}
