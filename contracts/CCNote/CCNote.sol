// SPDX-License-Identifier: BSD-3-Clause
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

    // CNOTE address
    address public constant CNOTE = 0x09635F643e140090A9A8Dcd712eD6285858ceBef;
    // address of Neofinance Coodinator's lending ledger 
    address public lendingLedger;


    // ==============================
    // ======== Overrides ===========
    // ==============================

    function initialize(address underlying_,
                        ComptrollerInterface comptroller_,
                        InterestRateModel interestRateModel_,
                        uint initialExchangeRateMantissa_,
                        string memory name_,
                        string memory symbol_,
                        uint8 decimals_) public override {
        // check that the underlying is CNOTE
        require(CNOTE == underlying_, "underlying is not CNOTE");
        super.initialize(underlying_, comptroller_, interestRateModel_, initialExchangeRateMantissa_, name_, symbol_, decimals_);
    }

    function mintInternal(uint mintAmount) override internal nonReentrant {
        super.mintInternal(mintAmount);
        syncLendingLedger(msg.sender);
    }

    function redeemInternal(uint redeemTokens) override internal nonReentrant {
        super.redeemInternal(redeemTokens);
        syncLendingLedger(msg.sender);
    }

    function redeemUnderlyingInternal(uint redeemAmount) override internal nonReentrant {
        super.redeemUnderlyingInternal(redeemAmount);
        syncLendingLedger(msg.sender);
    }

    function transferTokens(address spender, address src, address dst, uint tokens) override internal returns (uint value) {
        value = super.transferTokens(spender, src, dst, tokens);
        syncLendingLedger(src);
        syncLendingLedger(dst);
    }

    // ==============================
    // ======== Internal ============
    // ==============================

    /**
     * @notice Syncs the lending ledger with the current liquidity of the account
     * @param target Address of the account to sync
     */
    function syncLendingLedger(address target) private {
        if (lendingLedger == address(0)) return;
        
        uint lastLiquidity = getLastLiquidity(target);
        uint currentLiquidity = getStoredBalanceOfUnderlying(target);

        if (lastLiquidity == currentLiquidity) return; 
        if (currentLiquidity > lastLiquidity)
            ILendingLedger(lendingLedger).sync_ledger(target, int(currentLiquidity - lastLiquidity));
        else
            ILendingLedger(lendingLedger).sync_ledger(target, -int(lastLiquidity - currentLiquidity));
    }

    /**
     * @notice Gets the last liquidity in the loan ledger.
     * @param account Address of the account
     * @return liquidity liquidity of the account
     */
    function getLastLiquidity(address account) public view returns (uint256) {
        uint256 lastEpoch = ILendingLedger(lendingLedger).lendingMarketBalancesEpoch(address(this), account);
        return ILendingLedger(lendingLedger).lendingMarketBalances(address(this), account, lastEpoch);
    }

    /**
     * @notice Gets the current underlying balance of the account
     * @param account Address of the account
     * @return amount Amount of underlying
     */
    function getStoredBalanceOfUnderlying(address account) private view returns (uint) {
        Exp memory exchangeRate = Exp({mantissa: exchangeRateStoredInternal()});
        return mul_ScalarTruncate(exchangeRate, accountTokens[account]);
    }

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
}
