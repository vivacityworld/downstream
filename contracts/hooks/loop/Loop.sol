pragma solidity ^0.8.20;

import "hardhat/console.sol";
import {BorrowPermitParams} from "../../vcnote/libraries/BorrowPermitParams.sol";
import {IVCNote} from "../../vcnote/interfaces/IVCNote.sol";
import {CErc20} from "../../CErc20.sol";
import {Comptroller} from "../../Comptroller.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {RedstoneOracle} from "../../RedstoneOracle.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {IVivacityBorrower} from "../../vcnote/interfaces/IVivacityBorrower.sol";

import {IBaseV1Factory} from "../interfaces/IBaseV1Factory.sol";
import {IBaseV1Pair} from "../interfaces/IBaseV1Pair.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

contract Loop is IVivacityBorrower, Ownable {
    IVCNote public immutable vcNOTE;
    IERC20 public immutable NOTE;
    IERC20 public immutable WCANTO;
    IBaseV1Factory public immutable factory;

    LoopData public loopData;

    mapping(address => address) public cTokens;

    struct LoopData {
        address user;
        address token;
    }

    constructor(IVCNote _vcNOTE, IERC20 _NOTE, IERC20 _WCANTO, IBaseV1Factory _factory) Ownable(msg.sender) {
        vcNOTE = _vcNOTE;
        NOTE = _NOTE;
        WCANTO = _WCANTO;
        factory = _factory;
    }

    function setCToken(address _token, address _cToken) public onlyOwner {
        cTokens[_token] = _cToken;
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

    function loop(address _token, uint256 _amount, BorrowPermitParams memory params) public returns (uint256) {
        require(params.executor == address(this), "Loop: invalid executor");
        require(loopData.user == address(0), "Loop: already in loop");
        require(cTokens[_token] != address(0), "Loop: invalid token");

        IERC20(_token).transferFrom(msg.sender, address(this), _amount);

        loopData = LoopData({
            user: msg.sender,
            token: _token
        });
        vcNOTE.borrowPermit(params);

        require(loopData.user == address(0), "Loop: invalid state");
    }

    function _swap(address _from, address _to, bool stable, uint256 _amount) internal {
        IBaseV1Pair pair = IBaseV1Pair(factory.getPair(_from, _to, stable));

        uint amountOut = pair.getAmountOut(_amount, address(_from));
        (uint amount0Out, uint amount1Out) = pair.token0() == address(_from) ? (uint(0), amountOut) : (amountOut, uint(0));
        
        IERC20(_from).transfer(address(pair), _amount);
        pair.swap(amount0Out, amount1Out, address(this), "");
    }

    function borrowCallback(address borrower, uint256 borrowAmount) override external returns (uint256) {
        _swap(address(NOTE), address(WCANTO), false, borrowAmount);
        if (loopData.token != address(WCANTO)) _swap(address(WCANTO), loopData.token, false, WCANTO.balanceOf(address(this)));
        
        CErc20 cErc20 = CErc20(cTokens[loopData.token]);
        
        uint256 mintAmount = IERC20(loopData.token).balanceOf(address(this));
        IERC20(loopData.token).approve(address(cErc20), mintAmount);
        cErc20.mint(mintAmount);

        cErc20.transfer(borrower, cErc20.balanceOf(address(this)));

        loopData = LoopData({
            user: address(0),
            token: address(0)
        });
    }

}