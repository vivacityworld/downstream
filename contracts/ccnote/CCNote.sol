// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import "./CErc20Delegate_CCNote.sol";
import "./interfaces/ILendingLedger.sol";

/**
 * @title CCNote Contracts
 * @notice CTokens which wrap an cNOTE underlying and are delegated to
 * @dev This contract override multiple functions in CToken for cNote liquidity tracking and underlying token check
 */
contract CCNote is CErc20Delegate_CCNote {

    // ==============================
    // ======== Variables ===========
    // ==============================

    // address of Neofinance Coodinator's lending ledger 
    address public lendingLedger;

    // ==============================
    // ======== Admin Functions =====
    // ==============================

    /**
     * @notice Sets the lending ledger address
     * @param _lendingLedger Address of the lending ledger
     */
    function setLendingLedger(address _lendingLedger) external {
        require(msg.sender == admin, "CCNote::setLendingLedger: only admin can set lendingLedger");
        lendingLedger = _lendingLedger;
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
        if (lendingLedger == address(0)) return;
        
        uint lastLiquidity = getLastLiquidity(target);
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
    function getLastLiquidity(address account) internal view returns (uint256) {
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
