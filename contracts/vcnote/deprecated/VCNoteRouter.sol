// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {BorrowPermitParams} from "../libraries/BorrowPermitParams.sol";
import {IVCNote} from "../interfaces/IVCNote.sol";
import {ICERC20} from "../interfaces/ICERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ITurnstile} from "../../_interfaces/ITurnstile.sol";

/**
 * @title VCNote Router
 * @notice Contract for users to interact with NOTE instead of cNOTE
 * @dev This contract converts Note to cNOTE and do all the action on behalf of user.
 */
contract VCNoteRouter is ReentrancyGuard {
    using Math for uint256;

    event Mint(address minter, uint mintAmount, uint mintTokens);
    event Redeem(address redeemer, uint redeemAmount, uint redeemTokens);
    event Borrow(address borrower, uint256 borrowAmount);
    event RepayBorrow(address payer, uint repayAmount);

    IVCNote public immutable vcNOTE;
    ICERC20 public immutable cNOTE;
    IERC20 public immutable NOTE;

    constructor (address _NOTE, address _cNOTE, address _vcNOTE) {
        NOTE = IERC20(_NOTE);
        cNOTE = ICERC20(_cNOTE);
        vcNOTE = IVCNote(_vcNOTE);

        IERC20(_NOTE).approve(_cNOTE, type(uint256).max);
        IERC20(_cNOTE).approve(_vcNOTE, type(uint256).max);

        ITurnstile(0xEcf044C5B4b867CFda001101c617eCd347095B44).assign(754);
    }

    /**
     * @notice mint vcNOTE from NOTE
     * @param amount Amount of NOTE to mint
     */
    function mint(uint256 amount) external nonReentrant {
        // transfer NOTE from the user to router contract
        NOTE.transferFrom(msg.sender, address(this), amount);

        // convert NOTE to cNOTE
        uint256 balanceCNoteBefore = cNOTE.balanceOf(address(this));
        cNOTE.mint(amount);
        uint256 mintedCNote = cNOTE.balanceOf(address(this)) - balanceCNoteBefore;

        // convert cNOTE to vcNOTE
        uint256 balanceVCNoteBefore = vcNOTE.balanceOf(address(this));
        vcNOTE.mint(mintedCNote);
        uint256 mintedVCNote = vcNOTE.balanceOf(address(this)) - balanceVCNoteBefore;

        // transfer vcNOTE to user
        vcNOTE.transfer(msg.sender, mintedVCNote);

        emit Mint(msg.sender, amount, mintedVCNote);
    }
    
    /**
     * @notice redeem vcNOTE, receive NOTE
     * @param amount Amount of vcNOTE to redeem
     */
    function redeem(uint256 amount) external nonReentrant {
        // transfer vcNOTE from the user to router contract
        vcNOTE.transferFrom(msg.sender, address(this), amount);

        // convert vcNOTE to cNOTE
        uint256 balanceCNoteBefore = cNOTE.balanceOf(address(this));
        vcNOTE.redeem(amount);
        uint256 redeemedCNote = cNOTE.balanceOf(address(this)) - balanceCNoteBefore;
        
        // convert cNOTE to NOTE
        uint256 balanceNoteBefore = NOTE.balanceOf(address(this));
        cNOTE.redeem(redeemedCNote);
        uint256 redeemedNote = NOTE.balanceOf(address(this)) - balanceNoteBefore;

        // transfer NOTE to the user
        NOTE.transfer(msg.sender, redeemedNote);

        emit Redeem(msg.sender, amount, redeemedNote);
    }

    /**
     * @notice repay NOTE
     * @param amount Amount of NOTE to repayBorrow
     */
     function repayBorrow(uint256 amount) external nonReentrant {

        // if amount is max, repay min (balanceNote, borrowsNote)
        if (amount == type(uint).max) {
            uint256 balanceNote = NOTE.balanceOf(msg.sender);
            
            uint256 borrows = vcNOTE.borrowBalanceCurrent(msg.sender);
            uint256 exchangeRateCNote = cNOTE.exchangeRateCurrent();

            uint256 borrowsNote = borrows.mulDiv(exchangeRateCNote, 1e18, Math.Rounding.Ceil);
            if (balanceNote >= borrowsNote) {
                amount = borrowsNote;
            } else {
                amount = balanceNote;
            }
        }

        // transfer NOTE from the user to router contract
        NOTE.transferFrom(msg.sender, address(this), amount);

        // convert NOTE to cNOTE
        uint256 balanceCNoteBefore = cNOTE.balanceOf(address(this));
        cNOTE.mint(amount);
        uint256 mintedCNote = cNOTE.balanceOf(address(this)) - balanceCNoteBefore;

        // repayBorrow
        vcNOTE.repayBorrowBehalf(msg.sender, mintedCNote);

        emit RepayBorrow(msg.sender, amount);
    }

    /**
     * @notice borrow cNOTE, receive NOTE
     * @param params BorrowPermitParams
     */
    function borrow(BorrowPermitParams memory params) external nonReentrant {
        require(params.executor == address(this), "VCNoteRouter: invalid executor");

        // borrow cNote in vcNote
        uint256 balanceCNoteBefore = cNOTE.balanceOf(address(this));
        vcNOTE.borrowPermit(params);
        uint256 borrowedCNote = cNOTE.balanceOf(address(this)) - balanceCNoteBefore;
        
        // convert cNote to Note
        uint256 balanceNoteBefore = NOTE.balanceOf(address(this));
        cNOTE.redeem(borrowedCNote);
        uint256 redeemedNote = NOTE.balanceOf(address(this)) - balanceNoteBefore;
        
        // transfer Note to receiver
        NOTE.transfer(msg.sender, redeemedNote);

        emit Borrow(msg.sender, redeemedNote);
    }
}