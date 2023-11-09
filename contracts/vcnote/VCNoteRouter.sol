// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {BorrowPermitParams} from "./libraries/BorrowPermitParams.sol";
import {CErc20, CTokenInterface} from "../CErc20.sol";
import {VCNote} from "./VCNote.sol";
import {Upgradeable} from "../_proxy/Upgradeable.sol";
import {VCNoteRouterStorageLib, VCNoteRouterStorage} from "./storages/VCNoteRouterStorage.sol";

contract VivaRouter is Upgradeable {

    function initialize(address _note, address _cNOTE, address _vcNOTE) external initializer {
        VCNoteRouterStorageLib.set(_note, _cNOTE, _vcNOTE);

        IERC20(_note).approve(_cNOTE, type(uint256).max);
        IERC20(_cNOTE).approve(_vcNOTE, type(uint256).max);
    }

    function mint(uint256 amount) external {
        VCNoteRouterStorage memory s = VCNoteRouterStorageLib.get();

        uint256 balanceCNoteBefore = IERC20(s.cNOTE).balanceOf(address(this));
        uint256 balanceVCNoteBefore = IERC20(s.vcNOTE).balanceOf(address(this));

        // tansfer NOTE from the user to router contract
        IERC20(s.NOTE).transferFrom(msg.sender, address(this), amount);
        // mint cNOTE in clm
        CErc20(s.cNOTE).mint(amount);

        // mint vcNOTE in vivacity
        uint256 mintedCNote = IERC20(s.cNOTE).balanceOf(address(this)) - balanceCNoteBefore;
        CErc20(s.vcNOTE).mint(mintedCNote);

        // transfer vcNOTE to the user
        uint256 mintedVCNote = IERC20(s.vcNOTE).balanceOf(address(this)) - balanceVCNoteBefore;
        IERC20(s.vcNOTE).transfer(msg.sender, mintedVCNote);
    }
    
    function redeem(uint256 amount) external {
        VCNoteRouterStorage memory s = VCNoteRouterStorageLib.get();

        uint256 balanceNoteBefore = IERC20(s.cNOTE).balanceOf(address(this));
        uint256 balanceCNoteBefore = IERC20(s.cNOTE).balanceOf(address(this));

        // transfer vcNOTE from the user to router contract
        IERC20(s.vcNOTE).transferFrom(msg.sender, address(this), amount);

        // redeem vcNOTE in vivacity, get cNOTE
        CErc20(s.vcNOTE).redeem(amount);

        // redeem cNOTE in clm, get NOTE
        uint256 redeemedCNote = IERC20(s.cNOTE).balanceOf(address(this)) - balanceCNoteBefore;
        CErc20(s.cNOTE).redeem(redeemedCNote);

        // transfer NOTE to the user
        uint256 redeemedNote = IERC20(s.NOTE).balanceOf(address(this)) - balanceNoteBefore;
        IERC20(s.NOTE).transfer(msg.sender, redeemedNote);
    }

    function repayBorrow(uint256 amount) external {
        VCNoteRouterStorage memory s = VCNoteRouterStorageLib.get();

        uint256 balanceCNoteBefore = IERC20(s.cNOTE).balanceOf(address(this));
        // transfer NOTE from the user to router contract
        IERC20(s.NOTE).transferFrom(msg.sender, address(this), amount);

        // mint cNOTE in clm
        CErc20(s.cNOTE).mint(amount);

        // repayBorrow in clm
        uint256 mintedCNote = IERC20(s.cNOTE).balanceOf(address(this)) - balanceCNoteBefore;
        CErc20(s.vcNOTE).repayBorrowBehalf(msg.sender, mintedCNote);
    }

    function borrow(BorrowPermitParams memory params) external {
        VCNoteRouterStorage memory s = VCNoteRouterStorageLib.get();

        uint256 balanceBefore = IERC20(s.cNOTE).balanceOf(address(this));
        // borrow in clm
        VCNote(s.vcNOTE).borrowPermit(params);

        uint256 balanceAfter = IERC20(s.cNOTE).balanceOf(address(this));
        IERC20(s.cNOTE).transfer(msg.sender, balanceAfter - balanceBefore);
    }

    function liquidateBorrow(address borrower, uint repayAmount, CTokenInterface cTokenCollateral) external {
        VCNoteRouterStorage memory s = VCNoteRouterStorageLib.get();

        uint256 balanceCNoteBefore = IERC20(s.cNOTE).balanceOf(address(this));
        uint256 balanceCollateralBefore = IERC20(address(cTokenCollateral)).balanceOf(address(this));

        IERC20(s.NOTE).transferFrom(msg.sender, address(this), repayAmount);

        CErc20(s.cNOTE).mint(repayAmount);

        uint256 mintedCNote = IERC20(s.cNOTE).balanceOf(address(this)) - balanceCNoteBefore;

        VCNote(s.vcNOTE).liquidateBorrow(borrower, mintedCNote, cTokenCollateral);

        uint256 balanceCollateralAfter = IERC20(address(cTokenCollateral)).balanceOf(address(this));
        IERC20(address(cTokenCollateral)).transfer(msg.sender, balanceCollateralAfter - balanceCollateralBefore);
    }
}