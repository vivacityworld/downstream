pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract VestingVault is Ownable {
    event Add(address[] indexed account, uint64[] start, uint64[] duration, uint256[] amount);
    event Remove(uint256 indexed vestingId);
    event Released(address indexed account, uint256 amount);

    struct Vesting {
        address account;
        uint64 start;
        uint64 duration;
        uint256 allocated;
        uint256 released;
    }

    IERC20 public immutable token;
    Vesting[] public vestings;

    constructor(address _token) {
        require(_token != address(0), "VestingVault: token is zero address");
        token = IERC20(_token);
    }

    receive() external payable virtual {}

    function add(address[] memory _account, uint64[] memory _start, uint64[] memory _duration, uint256[] memory _amount) public virtual onlyOwner {
        require(_account.length == _start.length && _account.length == _duration.length && _account.length == _amount.length, "VestingVault: arrays length mismatch");
        for (uint256 i = 0; i < _account.length; i++) {
            require(_account[i] != address(0), "VestingVault: beneficiary is zero address");
            require(_amount[i] > 0, "VestingVault: amount should be greater than 0");
            require(_duration[i] > 0, "VestingVault: duration should be greater than 0");
            vestings.push(Vesting(_account[i], _start[i], _duration[i], _amount[i], 0));
            token.transferFrom(msg.sender, address(this), _amount[i]);
        }
        emit Add(_account, _start, _duration, _amount);
    }

    function remove(uint256 _vestingId) public virtual onlyOwner {
        Vesting storage vesting = vestings[_vestingId];
        require(vesting.allocated > 0, "VestingVault: vesting not found");
        token.transfer(msg.sender, vesting.allocated - vesting.released);
        delete vestings[_vestingId];
        emit Remove(_vestingId);
    }

    function release(uint256 _vestingId) public returns (uint256) {
        Vesting storage vesting = vestings[_vestingId];
        require(vesting.account == msg.sender || msg.sender == owner(), "VestingVault: not allowed");
        uint256 amount = releasable(_vestingId);
        vesting.released += amount;
        emit Released(vesting.account, amount);
        token.transfer(vesting.account, amount);
        return amount;
    }

    function releasable(uint256 _vestingId) public view virtual returns (uint256) {
        return vestedAmount(_vestingId, uint64(block.timestamp)) - vestings[_vestingId].released;
    }

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
}