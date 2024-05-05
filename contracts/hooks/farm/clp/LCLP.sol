pragma solidity ^0.8.20;

import "hardhat/console.sol";
import {BorrowPermitParams} from "../../../vcnote/libraries/BorrowPermitParams.sol";
import {IVCNote} from "../../../vcnote/interfaces/IVCNote.sol";
import {CErc20, CToken} from "../../../CErc20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {RedstoneOracle} from "../../../RedstoneOracle.sol";
import {PriceOracleRouter} from "../../../PriceOracleRouter.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {IVivacityBorrower} from "../../../vcnote/interfaces/IVivacityBorrower.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { Math } from "@openzeppelin/contracts/utils/math/Math.sol";

import {ClpFarmToken} from "./ClpFarmToken.sol";

import {PriceOracle} from "../../../PriceOracle.sol";

import {IBaseV1Factory} from "../../interfaces/IBaseV1Factory.sol";
import {IBaseV1Pair} from "../../interfaces/IBaseV1Pair.sol";

contract LCLP is IVivacityBorrower, ERC20 {
    IVCNote public immutable vcNOTE;
    address public immutable cNOTE;
    address public immutable NOTE;
    address public immutable WCANTO;
    CErc20 public vcFarmToken;

    // temp
    address public user;
    
    constructor(IVCNote _vcNOTE, address _cNOTE, address _NOTE, address _WCANTO, CErc20 _vcFarmToken) ERC20("LF", "LF") {
        vcNOTE = _vcNOTE;
        NOTE = _NOTE;
        cNOTE = _cNOTE;
        WCANTO = _WCANTO;
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

    function mint(
        address _token,
        uint256 _amount,
        uint256 _minUsdg,
        uint256 _minClp, 
        BorrowPermitParams memory params
    ) public returns (uint256) {
        require(params.executor == address(this), "LCLP: invalid executor");
        require(user == address(0), "LCLP: already in process");

        IERC20(_token).transferFrom(msg.sender, address(this), _amount);
        address underlying = CErc20(vcFarmToken).underlying();
        ClpFarmToken clpFarm = ClpFarmToken(underlying);

        IERC20(_token).approve(address(clpFarm), _amount);
        clpFarm.deposit(_token, _amount, _minUsdg, _minClp);

        user = msg.sender;
        vcNOTE.borrowPermit(params);

        require(user == address(0), "LCLP: invalid state");
    }

    function borrowCallback(address borrower, uint256 borrowAmount) override external returns (uint256) {
        address underlying = CErc20(vcFarmToken).underlying();
        ClpFarmToken clpFarm = ClpFarmToken(underlying);

        IERC20(NOTE).approve(cNOTE, borrowAmount);
        CErc20(cNOTE).mint(borrowAmount);

        IERC20(cNOTE).approve(address(clpFarm), borrowAmount);
        clpFarm.deposit(cNOTE, IERC20(cNOTE).balanceOf(address(this)), 0, 0);

        uint256 mintAmount = clpFarm.balanceOf(address(this));
        clpFarm.approve(address(vcFarmToken), mintAmount);
        vcFarmToken.mint(mintAmount);

        vcFarmToken.transfer(borrower, vcFarmToken.balanceOf(address(this)));

        user = address(0);
    }

}