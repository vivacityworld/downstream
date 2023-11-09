// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {BorrowPermitParams} from "../libraries/BorrowPermitParams.sol";
import {CTokenInterface} from "../../CTokenInterfaces.sol";

interface IVCNote {
    function setLendingLedger(address _lendingLedger) external;
    function assignForCSR(address turnstile, uint256 tokenId) external;
    function getLendingLedger() external view returns (address);
    function getNonce(address account) external view returns (uint256);
    function mint(uint256 mintAmount) external returns (uint256);
    function redeem(uint256 redeemTokens) external returns (uint256);
    function redeemUnderlying(uint256 redeemAmount) external returns (uint256);
    function borrow(uint256 borrowAmount) external returns (uint256);
    function repayBorrow(uint256 repayAmount) external returns (uint256);
    function repayBorrowBehalf(address borrower, uint256 repayAmount) external returns (uint256);
    function liquidateBorrow(address borrower, uint256 repayAmount, CTokenInterface cTokenCollateral) external returns (uint256);
    function borrow(uint borrowAmount, address payable receiver) external returns (uint256);
    function borrowPermit(BorrowPermitParams memory params) external returns (uint256);
    function syncLendingLedger(address target) external;
    function transfer(address dst, uint amount) external returns (bool);
    function transferFrom(address src, address dst, uint amount) external returns (bool);
    function approve(address spender, uint amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint);
    function balanceOf(address owner) external view returns (uint);
}