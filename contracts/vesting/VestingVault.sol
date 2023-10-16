// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title VestingVault
 * @notice A smart contract for managing token vesting schedules.
 */
contract VestingVault is Ownable {


    // ==============================
    // ======== Structs =============
    // ==============================

    // Struct to store vesting schedule information.
    struct Vesting {
        address account;    // beneficiary of the vesting schedule.
        uint64 start;       // start timestamp.
        uint64 duration;    // duration of the vesting schedule.
        uint256 allocated;  // total amount of tokens allocated.
        uint256 released;   // total amount of tokens released.
    }

    // ==============================
    // ======== Variables ===========
    // ==============================

    IERC20 public immutable token;
    Vesting[] public vestings;

    // ==============================
    // ======== Events ==============
    // ==============================

    event Add(address[] indexed account, uint64[] start, uint64[] duration, uint256[] amount);
    event Remove(uint256 indexed vestingId, uint256 rest);
    event Released(address indexed account, uint256 amount);
    event Transfer(address indexed to, uint256 amount);

    /**
     * @notice Constructor to initialize the contract with the specified ERC20 token.
     * @param _token The address of the ERC20 token contract to be used for vesting.
     */
    constructor(address _token) Ownable(msg.sender) {
        require(_token != address(0), "VestingVault: token is zero address");
        token = IERC20(_token);
    }

    /**
     * @notice Adds vesting schedules for multiple accounts.
     * @param _account An array of beneficiary addresses.
     * @param _start An array of vesting start timestamps (Unix timestamp).
     * @param _duration An array of vesting durations (in seconds).
     * @param _amount An array of token amounts to be vested.
     */
    function add(address[] memory _account, uint64[] memory _start, uint64[] memory _duration, uint256[] memory _amount) public virtual onlyOwner {
        require(_account.length == _start.length && _account.length == _duration.length && _account.length == _amount.length, "VestingVault: arrays length mismatch");
        for (uint256 i = 0; i < _account.length; i++) {
            require(_account[i] != address(0), "VestingVault: beneficiary is zero address");
            require(_amount[i] > 0, "VestingVault: amount should be greater than 0");
            require(_duration[i] > 0, "VestingVault: duration should be greater than 0");
            vestings.push(Vesting(_account[i], _start[i], _duration[i], _amount[i], 0));
        }
        emit Add(_account, _start, _duration, _amount);
    }

    /**
     * @notice Removes a vesting schedule.
     * @param _vestingId The index of the vesting schedule to be removed.
     */
    function remove(uint256 _vestingId, bool doRelease) public virtual onlyOwner returns (uint256 rest) {
        Vesting storage vesting = vestings[_vestingId];
        require(vesting.allocated > 0, "VestingVault: vesting not found");
        if (doRelease) {
            release(_vestingId);
        }
        rest = vesting.allocated - vesting.released;
        delete vestings[_vestingId];
        emit Remove(_vestingId, rest);
    }

    /**
     * @notice Releases vested tokens for a specific vesting schedule.
     * @param _vestingId The index of the vesting schedule to release tokens for.
     * @return released The amount of tokens released.
     */
    function release(uint256 _vestingId) public returns (uint256 released) {
        Vesting storage vesting = vestings[_vestingId];
        require(vesting.account == msg.sender || msg.sender == owner(), "VestingVault: not allowed");
        released = Math.min(token.balanceOf(address(this)), releasable(_vestingId));
        vesting.released += released;
        
        token.transfer(vesting.account, released);
        emit Released(vesting.account, released);
    }

    /**
     * @notice Calculates the amount of tokens that can be released for a specific vesting schedule.
     * @param _vestingId The index of the vesting schedule to check.
     * @return uint256 The amount of tokens that can be released.
     */
    function releasable(uint256 _vestingId) public view virtual returns (uint256) {
        return vestedAmount(_vestingId, uint64(block.timestamp)) - vestings[_vestingId].released;
    }

    /**
     * @notice Calculates the vested amount of tokens at a specific timestamp for a vesting schedule.
     * @param _vestingId The index of the vesting schedule to check.
     * @param _timestamp The timestamp at which to check the vested amount.
     * @return uint256 The vested amount of tokens.
     */
    function vestedAmount(uint256 _vestingId, uint64 _timestamp) public view virtual returns (uint256) {
        Vesting memory vesting = vestings[_vestingId];
        if (_timestamp < vesting.start) {
            return 0;
        } else if (_timestamp > vesting.start + vesting.duration) {
            return vesting.allocated;
        } else {
            return (vesting.allocated * (_timestamp - vesting.start)) / vesting.duration;
        }
    }

    /**
     * @notice Transfers tokens to a specified address.
     * @param _to The address to transfer tokens to.
     * @param _amount The amount of tokens to transfer.
     */
    function transfer(address _to, uint256 _amount) public virtual onlyOwner {
        token.transfer(_to, _amount);
        emit Transfer(_to, _amount);
    }
}