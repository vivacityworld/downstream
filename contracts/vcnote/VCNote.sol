// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {VCNoteStorage, VCNoteStorageLib} from "./storages/VCNoteStorage.sol";
import {BorrowPermitParams} from "./libraries/BorrowPermitParams.sol";

import {CErc20} from "../CErc20.sol";
import {CErc20Delegate_VCNote} from "./CErc20Delegate_VCNote.sol";
import {ILendingLedgerV2} from "./interfaces/ILendingLedgerV2.sol";
import {ITurnstile} from "../_interfaces/ITurnstile.sol";
import {IVivaPoint} from "./interfaces/IVivaPoint.sol";

/**
 * @title VCNote Contracts
 * @notice CTokens which wrap an cNOTE underlying and are delegated to
 * @dev This contract override multiple functions in CToken for cNote liquidity tracking and underlying token check
 */
contract VCNote is CErc20Delegate_VCNote {

    event SyncLendingLedger(address account, uint beforeLiquidity, uint afterLiquidity);

    // ==============================
    // ======== Admin Functions =====
    // ==============================

    function reinitialize(address note, address cnote, address vcNoteRouter, address _vivaPoint) public {
        require(msg.sender == admin, "VCNote::reinitialize: only admin");
        
        // update underlying
        underlying = note;

        // update cnote
        VCNoteStorageLib.setCNote(cnote);
        VCNoteStorageLib.setBlacklist(vcNoteRouter, true);
        VCNoteStorageLib.setVivaPoint(_vivaPoint);
        CErc20(underlying).approve(VCNoteStorageLib.getCNote(), type(uint256).max);
    }

    /**
     * @notice Sets the vivaPoint address
     * @param _vivaPoint Address of the vivaPoint
     */
    function setVivaPoint(address _vivaPoint) external {
        require(msg.sender == admin, "VCNote::setVivaPoint: only admin can set vivaPoint");
        VCNoteStorageLib.setVivaPoint(_vivaPoint);
    }

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

    function setCNote(address _cNote) external {
        require(msg.sender == admin, "VCNote::setCNote: only admin can set cNote");
        VCNoteStorageLib.setCNote(_cNote);
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

    //////////////////////
    ////////////// V2
    function mintCNote(uint noteAmount) public {
        require(admin == msg.sender, "VCNote::mintCNote: only admin");
        _mintCNote(noteAmount);
    }

    function _mintCNote(uint noteAmount) internal {
        CErc20(VCNoteStorageLib.getCNote()).mint(noteAmount);
    }

    function doTransferIn(address from, uint amount) virtual override internal returns (uint result) {
        require(!VCNoteStorageLib.isBlacklist(msg.sender), "VCNote::doTransferIn: blacklisted");
        result = super.doTransferIn(from, amount);
        _mintCNote(amount);
    }

    function doTransferOut(address payable to, uint amount) virtual override internal {
        require(!VCNoteStorageLib.isBlacklist(msg.sender), "VCNote::doTransferOut: blacklisted");
        CErc20(VCNoteStorageLib.getCNote()).redeemUnderlying(amount);
        super.doTransferOut(to, amount);
    }

    function accrueInterest() virtual override public returns (uint result) {
        CErc20(VCNoteStorageLib.getCNote()).accrueInterest();
        result = super.accrueInterest();
    }

    function getCashPrior() virtual override internal view returns (uint) {
        uint tokens = CErc20Delegate_VCNote(VCNoteStorageLib.getCNote()).balanceOf(address(this));
        Exp memory exchangeRate = Exp({mantissa: CErc20Delegate_VCNote(VCNoteStorageLib.getCNote()).exchangeRateStored()});
        return mul_ScalarTruncate(exchangeRate, tokens);
    }

    function supplyRatePerBlock() override external view returns (uint) {
        if (totalBorrows == 0) {
            return 0;
        }

        // Utilization rate is defined as outstanding borrows over the sum of cash and borrows
        uint util = totalBorrows * 1e18 / (getCashPrior() + totalBorrows - totalReserves);
        uint oneMinusUtil = util > 1e18 ? 0 : uint(1e18) - util;
        
        uint baseRatePerBlock = interestRateModel.baseRatePerBlock();
        uint _borrowRatePerBlock = interestRateModel.getBorrowRate(getCashPrior(), totalBorrows, totalReserves);
        
        uint borrowRatePerBlockWithoutBase = _borrowRatePerBlock - baseRatePerBlock;
        uint reserveRatePerBlock = borrowRatePerBlockWithoutBase * reserveFactorMantissa / 1e18;

        uint _supplyRatePerBlock = borrowRatePerBlockWithoutBase - reserveRatePerBlock;

        uint vcNoteRatePerBlock = _supplyRatePerBlock * util / 1e18;
        uint cNoteRatePerBlock = CErc20(VCNoteStorageLib.getCNote()).supplyRatePerBlock() * oneMinusUtil / 1e18;

        return vcNoteRatePerBlock + cNoteRatePerBlock;
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
        int liquidityDelta = (currentLiquidity > lastLiquidity) ? int(currentLiquidity - lastLiquidity) : -int(lastLiquidity - currentLiquidity);
        ILendingLedgerV2(lendingLedger).sync_ledger(target, liquidityDelta);
        IVivaPoint(VCNoteStorageLib.getVivaPoint()).update(target, currentLiquidity);
        
        emit SyncLendingLedger(target, lastLiquidity, currentLiquidity);
    }

    // ==============================
    // ======== Internal ============
    // ==============================

    /**
     * @notice Gets the last liquidity in the lending ledger.
     * @param lendingLedger Address of the lendingLedger
     * @param account Address of the account
     * @return liquidity liquidity of the account
     */
    function getLastLiquidity(address lendingLedger, address account) internal view returns (uint256) {
        return ILendingLedgerV2(lendingLedger).userInfo(address(this), account).amount;
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
