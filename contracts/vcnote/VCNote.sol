// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {VCNoteStorage, VCNoteStorageLib} from "./storages/VCNoteStorage.sol";
import {BorrowPermitParams} from "./libraries/BorrowPermitParams.sol";

import {CErc20Delegate_VCNote} from "./CErc20Delegate_VCNote.sol";
import {ILendingLedger} from "./interfaces/ILendingLedger.sol";
import {ITurnstile} from "../_interfaces/ITurnstile.sol";

/**
 * @title VCNote Contracts
 * @notice CTokens which wrap an cNOTE underlying and are delegated to
 * @dev This contract override multiple functions in CToken for cNote liquidity tracking and underlying token check
 */
contract VCNote is CErc20Delegate_VCNote {

    // ==============================
    // ======== Admin Functions =====
    // ==============================

    /**
     * @notice Sets the lending ledger address
     * @param _lendingLedger Address of the lending ledger
     */
    function setLendingLedger(address _lendingLedger) external {
        require(msg.sender == admin, "VCNote::setLendingLedger: only admin can set lendingLedger");
        VCNoteStorageLib.setLendingLedger(_lendingLedger);
    }

    /**
     * @notice  Assign for CSR
     * @param   turnstile  Address of turnstile contract
     * @param   tokenId    tokenId which will collect fees
     */
    function assignForCSR(address turnstile, uint256 tokenId) external {
        require(admin == msg.sender, "VCNote::assignForCSR: only admin");
        ITurnstile(turnstile).assign(tokenId);
    }

    // ==============================
    // ======== View Functions ======
    // ==============================

    function getLendingLedger() external view returns (address) {
        return VCNoteStorageLib.getLendingLedger();
    }

    function getNonce(address account) external view returns (uint256) {
        return VCNoteStorageLib.getNonce(account);
    }


    // ==============================
    // ====== Borrow Functions ======
    // ==============================

    /**
     * @notice borrow function
     * @param borrowAmount The amount of cNOTE to borrow
     * @param receiver The address to receive the borrowed cNOTE
     */
    function borrow(uint borrowAmount, address payable receiver) external returns (uint) {
        borrowInternal(borrowAmount, receiver);
        return NO_ERROR;
    }

    function borrowInternal(uint borrowAmount, address payable receiver) internal nonReentrant {
        accrueInterest();
        // borrowFresh emits borrow-specific logs on errors, so we don't need to
        borrowFresh(payable(msg.sender), borrowAmount, receiver);
    }

    function borrowFresh(address payable borrower, uint borrowAmount, address payable receiver) internal {
        /* Fail if borrow not allowed */
        uint allowed = comptroller.borrowAllowed(address(this), borrower, borrowAmount);
        if (allowed != 0) {
            revert BorrowComptrollerRejection(allowed);
        }

        /* Verify market's block number equals current block number */
        if (accrualBlockNumber != getBlockNumber()) {
            revert BorrowFreshnessCheck();
        }

        /* Fail gracefully if protocol has insufficient underlying cash */
        if (getCashPrior() < borrowAmount) {
            revert BorrowCashNotAvailable();
        }

        /*
         * We calculate the new borrower and total borrow balances, failing on overflow:
         *  accountBorrowNew = accountBorrow + borrowAmount
         *  totalBorrowsNew = totalBorrows + borrowAmount
         */
        uint accountBorrowsPrev = borrowBalanceStoredInternal(borrower);
        uint accountBorrowsNew = accountBorrowsPrev + borrowAmount;
        uint totalBorrowsNew = totalBorrows + borrowAmount;

        /////////////////////////
        // EFFECTS & INTERACTIONS
        // (No safe failures beyond this point)

        /*
         * We write the previously calculated values into storage.
         *  Note: Avoid token reentrancy attacks by writing increased borrow before external transfer.
        `*/
        accountBorrows[borrower].principal = accountBorrowsNew;
        accountBorrows[borrower].interestIndex = borrowIndex;
        totalBorrows = totalBorrowsNew;

        /*
         * We invoke doTransferOut for the borrower and the borrowAmount.
         *  Note: The cToken must handle variations between ERC-20 and ETH underlying.
         *  On success, the cToken borrowAmount less of cash.
         *  doTransferOut reverts if anything goes wrong, since we can't be sure if side effects occurred.
         */
        doTransferOut(receiver, borrowAmount);

        /* We emit a Borrow event */
        emit Borrow(borrower, borrowAmount, accountBorrowsNew, totalBorrowsNew);
    }

    /**
     * @notice borrow function by permit
     * @param params The params of borrow permit
     */
    function borrowPermit(BorrowPermitParams memory params) external returns (uint) {
        borrowPermitInternal(params);
        return NO_ERROR;
    }

    function borrowPermitInternal(BorrowPermitParams memory params) internal nonReentrant {
        params.validate();
        accrueInterest();
        // borrowFresh emits borrow-specific logs on errors, so we don't need to
        borrowFresh(params.borrower, params.borrowCNote, params.executor);
    }

    // ==============================
    // ======== Overrides ===========
    // ==============================

    function mintInternal(uint mintAmount) override internal {
        super.mintInternal(mintAmount);
        syncLendingLedger(msg.sender);
    }

    function redeemInternal(uint redeemTokens) override internal {
        super.redeemInternal(redeemTokens);
        syncLendingLedger(msg.sender);
    }

    function redeemUnderlyingInternal(uint redeemAmount) override internal {
        super.redeemUnderlyingInternal(redeemAmount);
        syncLendingLedger(msg.sender);
    }

    function seizeInternal(address seizerToken, address liquidator, address borrower, uint seizeTokens) internal override {
        super.seizeInternal(seizerToken, liquidator, borrower, seizeTokens);
        syncLendingLedger(borrower);
        syncLendingLedger(liquidator);
    }

    function transferTokens(address spender, address src, address dst, uint tokens) override internal returns (uint value) {
        value = super.transferTokens(spender, src, dst, tokens);
        syncLendingLedger(src);
        syncLendingLedger(dst);
    }

    /**
     * @notice Syncs the lending ledger with the current liquidity of the account
     * @param target Address of the account to sync
     */
    function syncLendingLedger(address target) public {
        address lendingLedger  = VCNoteStorageLib.getLendingLedger();
        if (lendingLedger == address(0)) return;
        accrueInterest();
        
        uint lastLiquidity = getLastLiquidity(lendingLedger, target);
        uint currentLiquidity = getStoredBalanceOfUnderlying(target);

        if (lastLiquidity == currentLiquidity) return; 
        if (currentLiquidity > lastLiquidity)
            ILendingLedger(lendingLedger).sync_ledger(target, int(currentLiquidity - lastLiquidity));
        else
            ILendingLedger(lendingLedger).sync_ledger(target, -int(lastLiquidity - currentLiquidity));
    }

    // ==============================
    // ======== Internal ============
    // ==============================

    /**
     * @notice Gets the last liquidity in the lending ledger.
     * @param account Address of the account
     * @return liquidity liquidity of the account
     */
    function getLastLiquidity(address lendingLedger, address account) internal view returns (uint256) {
        uint256 lastEpoch = ILendingLedger(lendingLedger).lendingMarketBalancesEpoch(address(this), account);
        return ILendingLedger(lendingLedger).lendingMarketBalances(address(this), account, lastEpoch);
    }

    /**
     * @notice Gets the current underlying balance of the account
     * @param account Address of the account
     * @return amount Amount of underlying
     */
    function getStoredBalanceOfUnderlying(address account) internal view returns (uint) {
        Exp memory exchangeRate = Exp({mantissa: exchangeRateStoredInternal()});
        return mul_ScalarTruncate(exchangeRate, accountTokens[account]);
    }
}
