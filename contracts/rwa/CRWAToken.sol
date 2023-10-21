// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import "./CErc20Delegate_RWA.sol";
import "../PriceOracle.sol";
import "./whitelist/interfaces/IWhitelistRouter.sol";
import "../_interfaces/ITurnstile.sol";

contract CRWAToken is CErc20Delegate_RWA {
    error NoCRWATransfer();
    error NotWhitelisted(address account);

    IWhitelistRouter whitelistRouter;

    /**
     * @notice  Admin function to set the whitelist for RWA token transfers
     * @param   _whitelistRouter  New address of whitelist contract
     */
    function setWhitelistRouter(address _whitelistRouter) external {
        require(msg.sender == admin, "CRWAToken::setWhitelist: only admin can set whitelist");
        whitelistRouter = IWhitelistRouter(_whitelistRouter);
    }

    /**
     * @notice  Assign for CSR
     * @param   turnstile  Address of turnstile contract
     * @param   tokenId    tokenId which will collect fees
     */
    function assignForCSR(address turnstile, uint256 tokenId) external {
        require(admin == msg.sender, "CRWAToken::assignForCSR: only admin");
        ITurnstile(turnstile).assign(tokenId);
    }

    /**
     * @notice  No token transfers can take place for CRWATokens
     * @dev     Any type of transfer (except liquidations) will revert
     * @return  uint  For legacy reasons, will always revert
     */
    function transferTokens(
        address /*spender*/,
        address /*src*/,
        address /*dst*/,
        uint /*tokens*/
    ) internal pure override returns (uint) {
        revert NoCRWATransfer();
    }

    /**
     * @notice  Internal function to seize tokens from a borrower
     * @dev     Must check whitelist and value of seizeTokens before liquidation
     * @param   seizerToken  Address of borrowed token calling this internal function
     * @param   liquidator  Address of liquidator
     * @param   borrower  Address of borrower
     * @param   seizeTokens  Amount of tokens to seize
     */
    function seizeInternal(
        address seizerToken,
        address liquidator,
        address borrower,
        uint seizeTokens
    ) internal override {
        // check whitelist
        require(address(whitelistRouter) != address(0), "CRWAToken::seizeInternal: whitelist not set");
        if (!whitelistRouter.isWhitelisted(underlying, liquidator)) {
            revert NotWhitelisted(liquidator);
        }

        // continue and call normal seizeInternal function
        super.seizeInternal(seizerToken, liquidator, borrower, seizeTokens);
    }
}
