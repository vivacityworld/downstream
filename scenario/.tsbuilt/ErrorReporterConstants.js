"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenErr = exports.ComptrollerErr = void 0;
const ethers = __importStar(require("ethers"));
const ComptrollerErrorReporter = {
    Error: [
        'NO_ERROR',
        'UNAUTHORIZED',
        'COMPTROLLER_MISMATCH',
        'INSUFFICIENT_SHORTFALL',
        'INSUFFICIENT_LIQUIDITY',
        'INVALID_CLOSE_FACTOR',
        'INVALID_COLLATERAL_FACTOR',
        'INVALID_LIQUIDATION_INCENTIVE',
        'MARKET_NOT_ENTERED',
        'MARKET_NOT_LISTED',
        'MARKET_ALREADY_LISTED',
        'MATH_ERROR',
        'NONZERO_BORROW_BALANCE',
        'PRICE_ERROR',
        'REJECTION',
        'SNAPSHOT_ERROR',
        'TOO_MANY_ASSETS',
        'TOO_MUCH_REPAY'
    ],
    FailureInfo: [
        'ACCEPT_ADMIN_PENDING_ADMIN_CHECK',
        'ACCEPT_PENDING_IMPLEMENTATION_ADDRESS_CHECK',
        'EXIT_MARKET_BALANCE_OWED',
        'EXIT_MARKET_REJECTION',
        'SET_CLOSE_FACTOR_OWNER_CHECK',
        'SET_CLOSE_FACTOR_VALIDATION',
        'SET_COLLATERAL_FACTOR_OWNER_CHECK',
        'SET_COLLATERAL_FACTOR_NO_EXISTS',
        'SET_COLLATERAL_FACTOR_VALIDATION',
        'SET_COLLATERAL_FACTOR_WITHOUT_PRICE',
        'SET_IMPLEMENTATION_OWNER_CHECK',
        'SET_LIQUIDATION_INCENTIVE_OWNER_CHECK',
        'SET_LIQUIDATION_INCENTIVE_VALIDATION',
        'SET_MAX_ASSETS_OWNER_CHECK',
        'SET_PENDING_ADMIN_OWNER_CHECK',
        'SET_PENDING_IMPLEMENTATION_OWNER_CHECK',
        'SET_PRICE_ORACLE_OWNER_CHECK',
        'SUPPORT_MARKET_EXISTS',
        'SUPPORT_MARKET_OWNER_CHECK',
        'SET_PAUSE_GUARDIAN_OWNER_CHECK',
    ]
};
const TokenErrorReporter = {
    Error: [
        'NO_ERROR',
        'UNAUTHORIZED',
        'BAD_INPUT',
        'COMPTROLLER_REJECTION',
        'COMPTROLLER_CALCULATION_ERROR',
        'INTEREST_RATE_MODEL_ERROR',
        'INVALID_ACCOUNT_PAIR',
        'INVALID_CLOSE_AMOUNT_REQUESTED',
        'INVALID_COLLATERAL_FACTOR',
        'MATH_ERROR',
        'MARKET_NOT_FRESH',
        'MARKET_NOT_LISTED',
        'TOKEN_INSUFFICIENT_ALLOWANCE',
        'TOKEN_INSUFFICIENT_BALANCE',
        'TOKEN_INSUFFICIENT_CASH',
        'TOKEN_TRANSFER_IN_FAILED',
        'TOKEN_TRANSFER_OUT_FAILED'
    ],
    FailureInfo: [
        'ACCEPT_ADMIN_PENDING_ADMIN_CHECK',
        'ACCRUE_INTEREST_ACCUMULATED_INTEREST_CALCULATION_FAILED',
        'ACCRUE_INTEREST_BORROW_RATE_CALCULATION_FAILED',
        'ACCRUE_INTEREST_NEW_BORROW_INDEX_CALCULATION_FAILED',
        'ACCRUE_INTEREST_NEW_TOTAL_BORROWS_CALCULATION_FAILED',
        'ACCRUE_INTEREST_NEW_TOTAL_RESERVES_CALCULATION_FAILED',
        'ACCRUE_INTEREST_SIMPLE_INTEREST_FACTOR_CALCULATION_FAILED',
        'BORROW_ACCUMULATED_BALANCE_CALCULATION_FAILED',
        'BORROW_ACCRUE_INTEREST_FAILED',
        'BORROW_CASH_NOT_AVAILABLE',
        'BORROW_FRESHNESS_CHECK',
        'BORROW_NEW_TOTAL_BALANCE_CALCULATION_FAILED',
        'BORROW_NEW_ACCOUNT_BORROW_BALANCE_CALCULATION_FAILED',
        'BORROW_MARKET_NOT_LISTED',
        'BORROW_COMPTROLLER_REJECTION',
        'LIQUIDATE_ACCRUE_BORROW_INTEREST_FAILED',
        'LIQUIDATE_ACCRUE_COLLATERAL_INTEREST_FAILED',
        'LIQUIDATE_COLLATERAL_FRESHNESS_CHECK',
        'LIQUIDATE_COMPTROLLER_REJECTION',
        'LIQUIDATE_COMPTROLLER_CALCULATE_AMOUNT_SEIZE_FAILED',
        'LIQUIDATE_CLOSE_AMOUNT_IS_UINT_MAX',
        'LIQUIDATE_CLOSE_AMOUNT_IS_ZERO',
        'LIQUIDATE_FRESHNESS_CHECK',
        'LIQUIDATE_LIQUIDATOR_IS_BORROWER',
        'LIQUIDATE_REPAY_BORROW_FRESH_FAILED',
        'LIQUIDATE_SEIZE_BALANCE_INCREMENT_FAILED',
        'LIQUIDATE_SEIZE_BALANCE_DECREMENT_FAILED',
        'LIQUIDATE_SEIZE_COMPTROLLER_REJECTION',
        'LIQUIDATE_SEIZE_LIQUIDATOR_IS_BORROWER',
        'LIQUIDATE_SEIZE_TOO_MUCH',
        'MINT_ACCRUE_INTEREST_FAILED',
        'MINT_COMPTROLLER_REJECTION',
        'MINT_EXCHANGE_CALCULATION_FAILED',
        'MINT_EXCHANGE_RATE_READ_FAILED',
        'MINT_FRESHNESS_CHECK',
        'MINT_NEW_ACCOUNT_BALANCE_CALCULATION_FAILED',
        'MINT_NEW_TOTAL_SUPPLY_CALCULATION_FAILED',
        'MINT_TRANSFER_IN_FAILED',
        'MINT_TRANSFER_IN_NOT_POSSIBLE',
        'REDEEM_ACCRUE_INTEREST_FAILED',
        'REDEEM_COMPTROLLER_REJECTION',
        'REDEEM_EXCHANGE_TOKENS_CALCULATION_FAILED',
        'REDEEM_EXCHANGE_AMOUNT_CALCULATION_FAILED',
        'REDEEM_EXCHANGE_RATE_READ_FAILED',
        'REDEEM_FRESHNESS_CHECK',
        'REDEEM_NEW_ACCOUNT_BALANCE_CALCULATION_FAILED',
        'REDEEM_NEW_TOTAL_SUPPLY_CALCULATION_FAILED',
        'REDEEM_TRANSFER_OUT_NOT_POSSIBLE',
        'REDUCE_RESERVES_ACCRUE_INTEREST_FAILED',
        'REDUCE_RESERVES_ADMIN_CHECK',
        'REDUCE_RESERVES_CASH_NOT_AVAILABLE',
        'REDUCE_RESERVES_FRESH_CHECK',
        'REDUCE_RESERVES_VALIDATION',
        'REPAY_BEHALF_ACCRUE_INTEREST_FAILED',
        'REPAY_BORROW_ACCRUE_INTEREST_FAILED',
        'REPAY_BORROW_ACCUMULATED_BALANCE_CALCULATION_FAILED',
        'REPAY_BORROW_COMPTROLLER_REJECTION',
        'REPAY_BORROW_FRESHNESS_CHECK',
        'REPAY_BORROW_NEW_ACCOUNT_BORROW_BALANCE_CALCULATION_FAILED',
        'REPAY_BORROW_NEW_TOTAL_BALANCE_CALCULATION_FAILED',
        'REPAY_BORROW_TRANSFER_IN_NOT_POSSIBLE',
        'SET_COLLATERAL_FACTOR_OWNER_CHECK',
        'SET_COLLATERAL_FACTOR_VALIDATION',
        'SET_COMPTROLLER_OWNER_CHECK',
        'SET_INTEREST_RATE_MODEL_ACCRUE_INTEREST_FAILED',
        'SET_INTEREST_RATE_MODEL_FRESH_CHECK',
        'SET_INTEREST_RATE_MODEL_OWNER_CHECK',
        'SET_MAX_ASSETS_OWNER_CHECK',
        'SET_ORACLE_MARKET_NOT_LISTED',
        'SET_PENDING_ADMIN_OWNER_CHECK',
        'SET_RESERVE_FACTOR_ACCRUE_INTEREST_FAILED',
        'SET_RESERVE_FACTOR_ADMIN_CHECK',
        'SET_RESERVE_FACTOR_FRESH_CHECK',
        'SET_RESERVE_FACTOR_BOUNDS_CHECK',
        'TRANSFER_COMPTROLLER_REJECTION',
        'TRANSFER_NOT_ALLOWED',
        'TRANSFER_NOT_ENOUGH',
        'TRANSFER_TOO_MUCH',
        'ADD_RESERVES_ACCRUE_INTEREST_FAILED',
        'ADD_RESERVES_FRESH_CHECK',
        'ADD_RESERVES_TRANSFER_IN_NOT_POSSIBLE'
    ],
    CustomErrors: [
        "error TransferComptrollerRejection(uint256 errorCode)",
        "error TransferNotAllowed()",
        "error TransferNotEnough()",
        "error TransferTooMuch()",
        "error MintComptrollerRejection(uint256 errorCode)",
        "error MintFreshnessCheck()",
        "error RedeemComptrollerRejection(uint256 errorCode)",
        "error RedeemFreshnessCheck()",
        "error RedeemTransferOutNotPossible()",
        "error BorrowComptrollerRejection(uint256 errorCode)",
        "error BorrowFreshnessCheck()",
        "error BorrowCashNotAvailable()",
        "error RepayBorrowComptrollerRejection(uint256 errorCode)",
        "error RepayBorrowFreshnessCheck()",
        "error LiquidateComptrollerRejection(uint256 errorCode)",
        "error LiquidateFreshnessCheck()",
        "error LiquidateCollateralFreshnessCheck()",
        "error LiquidateAccrueBorrowInterestFailed(uint256 errorCode)",
        "error LiquidateAccrueCollateralInterestFailed(uint256 errorCode)",
        "error LiquidateLiquidatorIsBorrower()",
        "error LiquidateCloseAmountIsZero()",
        "error LiquidateCloseAmountIsUintMax()",
        "error LiquidateRepayBorrowFreshFailed(uint256 errorCode)",
        "error LiquidateSeizeComptrollerRejection(uint256 errorCode)",
        "error LiquidateSeizeLiquidatorIsBorrower()",
        "error AcceptAdminPendingAdminCheck()",
        "error SetComptrollerOwnerCheck()",
        "error SetPendingAdminOwnerCheck()",
        "error SetReserveFactorAdminCheck()",
        "error SetReserveFactorFreshCheck()",
        "error SetReserveFactorBoundsCheck()",
        "error AddReservesFactorFreshCheck(uint256 actualAddAmount)",
        "error ReduceReservesAdminCheck()",
        "error ReduceReservesFreshCheck()",
        "error ReduceReservesCashNotAvailable()",
        "error ReduceReservesCashValidation()",
        "error SetInterestRateModelOwnerCheck()",
        "error SetInterestRateModelFreshCheck();",
    ]
};
function parseEnum(reporterEnum) {
    const Error = {};
    const ErrorInv = {};
    const FailureInfo = {};
    const FailureInfoInv = {};
    reporterEnum.Error.forEach((entry, i) => {
        Error[entry] = i;
        ErrorInv[i] = entry;
    });
    reporterEnum.FailureInfo.forEach((entry, i) => {
        FailureInfo[entry] = i;
        FailureInfoInv[i] = entry;
    });
    const CustomErrors = new ethers.utils.Interface(reporterEnum.CustomErrors || []);
    return { Error, ErrorInv, FailureInfo, FailureInfoInv, CustomErrors };
}
exports.ComptrollerErr = parseEnum(ComptrollerErrorReporter);
exports.TokenErr = parseEnum(TokenErrorReporter);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRXJyb3JSZXBvcnRlckNvbnN0YW50cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9FcnJvclJlcG9ydGVyQ29uc3RhbnRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwrQ0FBZ0M7QUFlaEMsTUFBTSx3QkFBd0IsR0FBRztJQUMvQixLQUFLLEVBQUU7UUFDTCxVQUFVO1FBQ1YsY0FBYztRQUNkLHNCQUFzQjtRQUN0Qix3QkFBd0I7UUFDeEIsd0JBQXdCO1FBQ3hCLHNCQUFzQjtRQUN0QiwyQkFBMkI7UUFDM0IsK0JBQStCO1FBQy9CLG9CQUFvQjtRQUNwQixtQkFBbUI7UUFDbkIsdUJBQXVCO1FBQ3ZCLFlBQVk7UUFDWix3QkFBd0I7UUFDeEIsYUFBYTtRQUNiLFdBQVc7UUFDWCxnQkFBZ0I7UUFDaEIsaUJBQWlCO1FBQ2pCLGdCQUFnQjtLQUNqQjtJQUVELFdBQVcsRUFBRTtRQUNYLGtDQUFrQztRQUNsQyw2Q0FBNkM7UUFDN0MsMEJBQTBCO1FBQzFCLHVCQUF1QjtRQUN2Qiw4QkFBOEI7UUFDOUIsNkJBQTZCO1FBQzdCLG1DQUFtQztRQUNuQyxpQ0FBaUM7UUFDakMsa0NBQWtDO1FBQ2xDLHFDQUFxQztRQUNyQyxnQ0FBZ0M7UUFDaEMsdUNBQXVDO1FBQ3ZDLHNDQUFzQztRQUN0Qyw0QkFBNEI7UUFDNUIsK0JBQStCO1FBQy9CLHdDQUF3QztRQUN4Qyw4QkFBOEI7UUFDOUIsdUJBQXVCO1FBQ3ZCLDRCQUE0QjtRQUM1QixnQ0FBZ0M7S0FDakM7Q0FDRixDQUFDO0FBRUYsTUFBTSxrQkFBa0IsR0FBRztJQUN6QixLQUFLLEVBQUU7UUFDTCxVQUFVO1FBQ1YsY0FBYztRQUNkLFdBQVc7UUFDWCx1QkFBdUI7UUFDdkIsK0JBQStCO1FBQy9CLDJCQUEyQjtRQUMzQixzQkFBc0I7UUFDdEIsZ0NBQWdDO1FBQ2hDLDJCQUEyQjtRQUMzQixZQUFZO1FBQ1osa0JBQWtCO1FBQ2xCLG1CQUFt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QU0sY0FBYyxHQUE2QixFQUFFLENBQUM7SUFFcEQsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDdEMsS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNqQixRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDO0lBQ3RCLENBQUMsQ0FBQyxDQUFDO0lBRUgsWUFBWSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDNUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN2QixjQUFjLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDO0lBQzVCLENBQUMsQ0FBQyxDQUFDO0lBRUgsTUFBTSxZQUFZLEdBQUcsSUFBSSxNQUFNLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsWUFBWSxJQUFJLEVBQUUsQ0FBQyxDQUFBO0lBRWhGLE9BQU8sRUFBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSxjQUFjLEVBQUUsWUFBWSxFQUFDLENBQUM7QUFDdEUsQ0FBQztBQUVZLFFBQUEsY0FBYyxHQUFHLFNBQVMsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO0FBQ3JELFFBQUEsUUFBUSxHQUFHLFNBQVMsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgZXRoZXJzIGZyb20gJ2V0aGVycydcbmludGVyZmFjZSBFcnJvclJlcG9ydGVyRW51bSB7XG4gIEVycm9yOiBzdHJpbmdbXVxuICBGYWlsdXJlSW5mbzogc3RyaW5nW11cbiAgQ3VzdG9tRXJyb3JzPzogc3RyaW5nW11cbn1cblxuaW50ZXJmYWNlIEVycm9yVHlwZXMge1xuICBFcnJvcjoge1tuYW1lOiBzdHJpbmddOiBudW1iZXJ9XG4gIEZhaWx1cmVJbmZvOiB7W25hbWU6IHN0cmluZ106IG51bWJlcn1cbiAgRXJyb3JJbnY6IHtbY29kZTogbnVtYmVyXTogc3RyaW5nfVxuICBGYWlsdXJlSW5mb0ludjoge1tjb2RlOiBudW1iZXJdOiBzdHJpbmd9XG4gIEN1c3RvbUVycm9yczogZXRoZXJzLnV0aWxzLkludGVyZmFjZVxufVxuXG5jb25zdCBDb21wdHJvbGxlckVycm9yUmVwb3J0ZXIgPSB7XG4gIEVycm9yOiBbXG4gICAgJ05PX0VSUk9SJyxcbiAgICAnVU5BVVRIT1JJWkVEJyxcbiAgICAnQ09NUFRST0xMRVJfTUlTTUFUQ0gnLFxuICAgICdJTlNVRkZJQ0lFTlRfU0hPUlRGQUxMJyxcbiAgICAnSU5TVUZGSUNJRU5UX0xJUVVJRElUWScsXG4gICAgJ0lOVkFMSURfQ0xPU0VfRkFDVE9SJyxcbiAgICAnSU5WQUxJRF9DT0xMQVRFUkFMX0ZBQ1RPUicsXG4gICAgJ0lOVkFMSURfTElRVUlEQVRJT05fSU5DRU5USVZFJyxcbiAgICAnTUFSS0VUX05PVF9FTlRFUkVEJyxcbiAgICAnTUFSS0VUX05PVF9MSVNURUQnLFxuICAgICdNQVJLRVRfQUxSRUFEWV9MSVNURUQnLFxuICAgICdNQVRIX0VSUk9SJyxcbiAgICAnTk9OWkVST19CT1JST1dfQkFMQU5DRScsXG4gICAgJ1BSSUNFX0VSUk9SJyxcbiAgICAnUkVKRUNUSU9OJyxcbiAgICAnU05BUFNIT1RfRVJST1InLFxuICAgICdUT09fTUFOWV9BU1NFVFMnLFxuICAgICdUT09fTVVDSF9SRVBBWSdcbiAgXSxcblxuICBGYWlsdXJlSW5mbzogW1xuICAgICdBQ0NFUFRfQURNSU5fUEVORElOR19BRE1JTl9DSEVDSycsXG4gICAgJ0FDQ0VQVF9QRU5ESU5HX0lNUExFTUVOVEFUSU9OX0FERFJFU1NfQ0hFQ0snLFxuICAgICdFWElUX01BUktFVF9CQUxBTkNFX09XRUQnLFxuICAgICdFWElUX01BUktFVF9SRUpFQ1RJT04nLFxuICAgICdTRVRfQ0xPU0VfRkFDVE9SX09XTkVSX0NIRUNLJyxcbiAgICAnU0VUX0NMT1NFX0ZBQ1RPUl9WQUxJREFUSU9OJyxcbiAgICAnU0VUX0NPTExBVEVSQUxfRkFDVE9SX09XTkVSX0NIRUNLJyxcbiAgICAnU0VUX0NPTExBVEVSQUxfRkFDVE9SX05PX0VYSVNUUycsXG4gICAgJ1NFVF9DT0xMQVRFUkFMX0ZBQ1RPUl9WQUxJREFUSU9OJyxcbiAgICAnU0VUX0NPTExBVEVSQUxfRkFDVE9SX1dJVEhPVVRfUFJJQ0UnLFxuICAgICdTRVRfSU1QTEVNRU5UQVRJT05fT1dORVJfQ0hFQ0snLFxuICAgICdTRVRfTElRVUlEQVRJT05fSU5DRU5USVZFX09XTkVSX0NIRUNLJyxcbiAgICAnU0VUX0xJUVVJREFUSU9OX0lOQ0VOVElWRV9WQUxJREFUSU9OJyxcbiAgICAnU0VUX01BWF9BU1NFVFNfT1dORVJfQ0hFQ0snLFxuICAgICdTRVRfUEVORElOR19BRE1JTl9PV05FUl9DSEVDSycsXG4gICAgJ1NFVF9QRU5ESU5HX0lNUExFTUVOVEFUSU9OX09XTkVSX0NIRUNLJyxcbiAgICAnU0VUX1BSSUNFX09SQUNMRV9PV05FUl9DSEVDSycsXG4gICAgJ1NVUFBPUlRfTUFSS0VUX0VYSVNUUycsXG4gICAgJ1NVUFBPUlRfTUFSS0VUX09XTkVSX0NIRUNLJyxcbiAgICAnU0VUX1BBVVNFX0dVQVJESUFOX09XTkVSX0NIRUNLJyxcbiAgXVxufTtcblxuY29uc3QgVG9rZW5FcnJvclJlcG9ydGVyID0ge1xuICBFcnJvcjogW1xuICAgICdOT19FUlJPUicsXG4gICAgJ1VOQVVUSE9SSVpFRCcsXG4gICAgJ0JBRF9JTlBVVCcsXG4gICAgJ0NPTVBUUk9MTEVSX1JFSkVDVElPTicsXG4gICAgJ0NPTVBUUk9MTEVSX0NBTENVTEFUSU9OX0VSUk9SJyxcbiAgICAnSU5URVJFU1RfUkFURV9NT0RFTF9FUlJPUicsXG4gICAgJ0lOVkFMSURfQUNDT1VOVF9QQUlSJyxcbiAgICAnSU5WQUxJRF9DTE9TRV9BTU9VTlRfUkVRVUVTVEVEJyxcbiAgICAnSU5WQUxJRF9DT0xMQVRFUkFMX0ZBQ1RPUicsXG4gICAgJ01BVEhfRVJST1InLFxuICAgICdNQVJLRVRfTk9UX0ZSRVNIJyxcbiAgICAnTUFSS0VUX05PVF9MSVNURUQnLFxuICAgICdUT0tFTl9JTlNVRkZJQ0lFTlRfQUxMT1dBTkNFJyxcbiAgICAnVE9LRU5fSU5TVUZGSUNJRU5UX0JBTEFOQ0UnLFxuICAgICdUT0tFTl9JTlNVRkZJQ0lFTlRfQ0FTSCcsXG4gICAgJ1RPS0VOX1RSQU5TRkVSX0lOX0ZBSUxFRCcsXG4gICAgJ1RPS0VOX1RSQU5TRkVSX09VVF9GQUlMRUQnXG4gIF0sXG5cbiAgRmFpbHVyZUluZm86IFtcbiAgICAnQUNDRVBUX0FETUlOX1BFTkRJTkdfQURNSU5fQ0hFQ0snLFxuICAgICdBQ0NSVUVfSU5URVJFU1RfQUNDVU1VTEFURURfSU5URVJFU1RfQ0FMQ1VMQVRJT05fRkFJTEVEJyxcbiAgICAnQUNDUlVFX0lOVEVSRVNUX0JPUlJPV19SQVRFX0NBTENVTEFUSU9OX0ZBSUxFRCcsXG4gICAgJ0FDQ1JVRV9JTlRFUkVTVF9ORVdfQk9SUk9XX0lOREVYX0NBTENVTEFUSU9OX0ZBSUxFRCcsXG4gICAgJ0FDQ1JVRV9JTlRFUkVTVF9ORVdfVE9UQUxfQk9SUk9XU19DQUxDVUxBVElPTl9GQUlMRUQnLFxuICAgICdBQ0NSVUVfSU5URVJFU1RfTkVXX1RPVEFMX1JFU0VSVkVTX0NBTENVTEFUSU9OX0ZBSUxFRCcsXG4gICAgJ0FDQ1JVRV9JTlRFUkVTVF9TSU1QTEVfSU5URVJFU1RfRkFDVE9SX0NBTENVTEFUSU9OX0ZBSUxFRCcsXG4gICAgJ0JPUlJPV19BQ0NVTVVMQVRFRF9CQUxBTkNFX0NBTENVTEFUSU9OX0ZBSUxFRCcsXG4gICAgJ0JPUlJPV19BQ0NSVUVfSU5URVJFU1RfRkFJTEVEJyxcbiAgICAnQk9SUk9XX0NBU0hfTk9UX0FWQUlMQUJMRScsXG4gICAgJ0JPUlJPV19GUkVTSE5FU1NfQ0hFQ0snLFxuICAgICdCT1JST1dfTkVXX1RPVEFMX0JBTEFOQ0VfQ0FMQ1VMQVRJT05fRkFJTEVEJyxcbiAgICAnQk9SUk9XX05FV19BQ0NPVU5UX0JPUlJPV19CQUxBTkNFX0NBTENVTEFUSU9OX0ZBSUxFRCcsXG4gICAgJ0JPUlJPV19NQVJLRVRfTk9UX0xJU1RFRCcsXG4gICAgJ0JPUlJPV19DT01QVFJPTExFUl9SRUpFQ1RJT04nLFxuICAgICdMSVFVSURBVEVfQUNDUlVFX0JPUlJPV19JTlRFUkVTVF9GQUlMRUQnLFxuICAgICdMSVFVSURBVEVfQUNDUlVFX0NPTExBVEVSQUxfSU5URVJFU1RfRkFJTEVEJyxcbiAgICAnTElRVUlEQVRFX0NPTExBVEVSQUxfRlJFU0hORVNTX0NIRUNLJyxcbiAgICAnTElRVUlEQVRFX0NPTVBUUk9MTEVSX1JFSkVDVElPTicsXG4gICAgJ0xJUVVJREFURV9DT01QVFJPTExFUl9DQUxDVUxBVEVfQU1PVU5UX1NFSVpFX0ZBSUxFRCcsXG4gICAgJ0xJUVVJREFURV9DTE9TRV9BTU9VTlRfSVNfVUlOVF9NQVgnLFxuICAgICdMSVFVSURBVEVfQ0xPU0VfQU1PVU5UX0lTX1pFUk8nLFxuICAgICdMSVFVSURBVEVfRlJFU0hORVNTX0NIRUNLJyxcbiAgICAnTElRVUlEQVRFX0xJUVVJREFUT1JfSVNfQk9SUk9XRVInLFxuICAgICdMSVFVSURBVEVfUkVQQVlfQk9SUk9XX0ZSRVNIX0ZBSUxFRCcsXG4gICAgJ0xJUVVJREFURV9TRUlaRV9CQUxBTkNFX0lOQ1JFTUVOVF9GQUlMRUQnLFxuICAgICdMSVFVSURBVEVfU0VJWkVfQkFMQU5DRV9ERUNSRU1FTlRfRkFJTEVEJyxcbiAgICAnTElRVUlEQVRFX1NFSVpFX0NPTVBUUk9MTEVSX1JFSkVDVElPTicsXG4gICAgJ0xJUVVJREFURV9TRUlaRV9MSVFVSURBVE9SX0lTX0JPUlJPV0VSJyxcbiAgICAnTElRVUlEQVRFX1NFSVpFX1RPT19NVUNIJyxcbiAgICAnTUlOVF9BQ0NSVUVfSU5URVJFU1RfRkFJTEVEJyxcbiAgICAnTUlOVF9DT01QVFJPTExFUl9SRUpFQ1RJT04nLFxuICAgICdNSU5UX0VYQ0hBTkdFX0NBTENVTEFUSU9OX0ZBSUxFRCcsXG4gICAgJ01JTlRfRVhDSEFOR0VfUkFURV9SRUFEX0ZBSUxFRCcsXG4gICAgJ01JTlRfRlJFU0hORVNTX0NIRUNLJyxcbiAgICAnTUlOVF9ORVdfQUNDT1VOVF9CQUxBTkNFX0NBTENVTEFUSU9OX0ZBSUxFRCcsXG4gICAgJ01JTlRfTkVXX1RPVEFMX1NVUFBMWV9DQUxDVUxBVElPTl9GQUlMRUQnLFxuICAgICdNSU5UX1RSQU5TRkVSX0lOX0ZBSUxFRCcsXG4gICAgJ01JTlRfVFJBTlNGRVJfSU5fTk9UX1BPU1NJQkxFJyxcbiAgICAnUkVERUVNX0FDQ1JVRV9JTlRFUkVTVF9GQUlMRUQnLFxuICAgICdSRURFRU1fQ09NUFRST0xMRVJfUkVKRUNUSU9OJyxcbiAgICAnUkVERUVNX0VYQ0hBTkdFX1RPS0VOU19DQUxDVUxBVElPTl9GQUlMRUQnLFxuICAgICdSRURFRU1fRVhDSEFOR0VfQU1PVU5UX0NBTENVTEFUSU9OX0ZBSUxFRCcsXG4gICAgJ1JFREVFTV9FWENIQU5HRV9SQVRFX1JFQURfRkFJTEVEJyxcbiAgICAnUkVERUVNX0ZSRVNITkVTU19DSEVDSycsXG4gICAgJ1JFREVFTV9ORVdfQUNDT1VOVF9CQUxBTkNFX0NBTENVTEFUSU9OX0ZBSUxFRCcsXG4gICAgJ1JFREVFTV9ORVdfVE9UQUxfU1VQUExZX0NBTENVTEFUSU9OX0ZBSUxFRCcsXG4gICAgJ1JFREVFTV9UUkFOU0ZFUl9PVVRfTk9UX1BPU1NJQkxFJyxcbiAgICAnUkVEVUNFX1JFU0VSVkVTX0FDQ1JVRV9JTlRFUkVTVF9GQUlMRUQnLFxuICAgICdSRURVQ0VfUkVTRVJWRVNfQURNSU5fQ0hFQ0snLFxuICAgICdSRURVQ0VfUkVTRVJWRVNfQ0FTSF9OT1RfQVZBSUxBQkxFJyxcbiAgICAnUkVEVUNFX1JFU0VSVkVTX0ZSRVNIX0NIRUNLJyxcbiAgICAnUkVEVUNFX1JFU0VSVkVTX1ZBTElEQVRJT04nLFxuICAgICdSRVBBWV9CRUhBTEZfQUNDUlVFX0lOVEVSRVNUX0ZBSUxFRCcsXG4gICAgJ1JFUEFZX0JPUlJPV19BQ0NSVUVfSU5URVJFU1RfRkFJTEVEJyxcbiAgICAnUkVQQVlfQk9SUk9XX0FDQ1VNVUxBVEVEX0JBTEFOQ0VfQ0FMQ1VMQVRJT05fRkFJTEVEJyxcbiAgICAnUkVQQVlfQk9SUk9XX0NPTVBUUk9MTEVSX1JFSkVDVElPTicsXG4gICAgJ1JFUEFZX0JPUlJPV19GUkVTSE5FU1NfQ0hFQ0snLFxuICAgICdSRVBBWV9CT1JST1dfTkVXX0FDQ09VTlRfQk9SUk9XX0JBTEFOQ0VfQ0FMQ1VMQVRJT05fRkFJTEVEJyxcbiAgICAnUkVQQVlfQk9SUk9XX05FV19UT1RBTF9CQUxBTkNFX0NBTENVTEFUSU9OX0ZBSUxFRCcsXG4gICAgJ1JFUEFZX0JPUlJPV19UUkFOU0ZFUl9JTl9OT1RfUE9TU0lCTEUnLFxuICAgICdTRVRfQ09MTEFURVJBTF9GQUNUT1JfT1dORVJfQ0hFQ0snLFxuICAgICdTRVRfQ09MTEFURVJBTF9GQUNUT1JfVkFMSURBVElPTicsXG4gICAgJ1NFVF9DT01QVFJPTExFUl9PV05FUl9DSEVDSycsXG4gICAgJ1NFVF9JTlRFUkVTVF9SQVRFX01PREVMX0FDQ1JVRV9JTlRFUkVTVF9GQUlMRUQnLFxuICAgICdTRVRfSU5URVJFU1RfUkFURV9NT0RFTF9GUkVTSF9DSEVDSycsXG4gICAgJ1NFVF9JTlRFUkVTVF9SQVRFX01PREVMX09XTkVSX0NIRUNLJyxcbiAgICAnU0VUX01BWF9BU1NFVFNfT1dORVJfQ0hFQ0snLFxuICAgICdTRVRfT1JBQ0xFX01BUktFVF9OT1RfTElTVEVEJyxcbiAgICAnU0VUX1BFTkRJTkdfQURNSU5fT1dORVJfQ0hFQ0snLFxuICAgICdTRVRfUkVTRVJWRV9GQUNUT1JfQUNDUlVFX0lOVEVSRVNUX0ZBSUxFRCcsXG4gICAgJ1NFVF9SRVNFUlZFX0ZBQ1RPUl9BRE1JTl9DSEVDSycsXG4gICAgJ1NFVF9SRVNFUlZFX0ZBQ1RPUl9GUkVTSF9DSEVDSycsXG4gICAgJ1NFVF9SRVNFUlZFX0ZBQ1RPUl9CT1VORFNfQ0hFQ0snLFxuICAgICdUUkFOU0ZFUl9DT01QVFJPTExFUl9SRUpFQ1RJT04nLFxuICAgICdUUkFOU0ZFUl9OT1RfQUxMT1dFRCcsXG4gICAgJ1RSQU5TRkVSX05PVF9FTk9VR0gnLFxuICAgICdUUkFOU0ZFUl9UT09fTVVDSCcsXG4gICAgJ0FERF9SRVNFUlZFU19BQ0NSVUVfSU5URVJFU1RfRkFJTEVEJyxcbiAgICAnQUREX1JFU0VSVkVTX0ZSRVNIX0NIRUNLJyxcbiAgICAnQUREX1JFU0VSVkVTX1RSQU5TRkVSX0lOX05PVF9QT1NTSUJMRSdcbiAgXSxcblxuICBDdXN0b21FcnJvcnM6IFtcbiAgICBcImVycm9yIFRyYW5zZmVyQ29tcHRyb2xsZXJSZWplY3Rpb24odWludDI1NiBlcnJvckNvZGUpXCIsXG4gICAgXCJlcnJvciBUcmFuc2Zlck5vdEFsbG93ZWQoKVwiLFxuICAgIFwiZXJyb3IgVHJhbnNmZXJOb3RFbm91Z2goKVwiLFxuICAgIFwiZXJyb3IgVHJhbnNmZXJUb29NdWNoKClcIixcblxuICAgIFwiZXJyb3IgTWludENvbXB0cm9sbGVyUmVqZWN0aW9uKHVpbnQyNTYgZXJyb3JDb2RlKVwiLFxuICAgIFwiZXJyb3IgTWludEZyZXNobmVzc0NoZWNrKClcIixcblxuICAgIFwiZXJyb3IgUmVkZWVtQ29tcHRyb2xsZXJSZWplY3Rpb24odWludDI1NiBlcnJvckNvZGUpXCIsXG4gICAgXCJlcnJvciBSZWRlZW1GcmVzaG5lc3NDaGVjaygpXCIsXG4gICAgXCJlcnJvciBSZWRlZW1UcmFuc2Zlck91dE5vdFBvc3NpYmxlKClcIixcblxuICAgIFwiZXJyb3IgQm9ycm93Q29tcHRyb2xsZXJSZWplY3Rpb24odWludDI1NiBlcnJvckNvZGUpXCIsXG4gICAgXCJlcnJvciBCb3Jyb3dGcmVzaG5lc3NDaGVjaygpXCIsXG4gICAgXCJlcnJvciBCb3Jyb3dDYXNoTm90QXZhaWxhYmxlKClcIixcblxuICAgIFwiZXJyb3IgUmVwYXlCb3Jyb3dDb21wdHJvbGxlclJlamVjdGlvbih1aW50MjU2IGVycm9yQ29kZSlcIixcbiAgICBcImVycm9yIFJlcGF5Qm9ycm93RnJlc2huZXNzQ2hlY2soKVwiLFxuXG4gICAgXCJlcnJvciBMaXF1aWRhdGVDb21wdHJvbGxlclJlamVjdGlvbih1aW50MjU2IGVycm9yQ29kZSlcIixcbiAgICBcImVycm9yIExpcXVpZGF0ZUZyZXNobmVzc0NoZWNrKClcIixcbiAgICBcImVycm9yIExpcXVpZGF0ZUNvbGxhdGVyYWxGcmVzaG5lc3NDaGVjaygpXCIsXG4gICAgXCJlcnJvciBMaXF1aWRhdGVBY2NydWVCb3Jyb3dJbnRlcmVzdEZhaWxlZCh1aW50MjU2IGVycm9yQ29kZSlcIixcbiAgICBcImVycm9yIExpcXVpZGF0ZUFjY3J1ZUNvbGxhdGVyYWxJbnRlcmVzdEZhaWxlZCh1aW50MjU2IGVycm9yQ29kZSlcIixcbiAgICBcImVycm9yIExpcXVpZGF0ZUxpcXVpZGF0b3JJc0JvcnJvd2VyKClcIixcbiAgICBcImVycm9yIExpcXVpZGF0ZUNsb3NlQW1vdW50SXNaZXJvKClcIixcbiAgICBcImVycm9yIExpcXVpZGF0ZUNsb3NlQW1vdW50SXNVaW50TWF4KClcIixcbiAgICBcImVycm9yIExpcXVpZGF0ZVJlcGF5Qm9ycm93RnJlc2hGYWlsZWQodWludDI1NiBlcnJvckNvZGUpXCIsXG5cbiAgICBcImVycm9yIExpcXVpZGF0ZVNlaXplQ29tcHRyb2xsZXJSZWplY3Rpb24odWludDI1NiBlcnJvckNvZGUpXCIsXG4gICAgXCJlcnJvciBMaXF1aWRhdGVTZWl6ZUxpcXVpZGF0b3JJc0JvcnJvd2VyKClcIixcblxuICAgIFwiZXJyb3IgQWNjZXB0QWRtaW5QZW5kaW5nQWRtaW5DaGVjaygpXCIsXG5cbiAgICBcImVycm9yIFNldENvbXB0cm9sbGVyT3duZXJDaGVjaygpXCIsXG4gICAgXCJlcnJvciBTZXRQZW5kaW5nQWRtaW5Pd25lckNoZWNrKClcIixcblxuICAgIFwiZXJyb3IgU2V0UmVzZXJ2ZUZhY3RvckFkbWluQ2hlY2soKVwiLFxuICAgIFwiZXJyb3IgU2V0UmVzZXJ2ZUZhY3RvckZyZXNoQ2hlY2soKVwiLFxuICAgIFwiZXJyb3IgU2V0UmVzZXJ2ZUZhY3RvckJvdW5kc0NoZWNrKClcIixcblxuICAgIFwiZXJyb3IgQWRkUmVzZXJ2ZXNGYWN0b3JGcmVzaENoZWNrKHVpbnQyNTYgYWN0dWFsQWRkQW1vdW50KVwiLFxuXG4gICAgXCJlcnJvciBSZWR1Y2VSZXNlcnZlc0FkbWluQ2hlY2soKVwiLFxuICAgIFwiZXJyb3IgUmVkdWNlUmVzZXJ2ZXNGcmVzaENoZWNrKClcIixcbiAgICBcImVycm9yIFJlZHVjZVJlc2VydmVzQ2FzaE5vdEF2YWlsYWJsZSgpXCIsXG4gICAgXCJlcnJvciBSZWR1Y2VSZXNlcnZlc0Nhc2hWYWxpZGF0aW9uKClcIixcblxuICAgIFwiZXJyb3IgU2V0SW50ZXJlc3RSYXRlTW9kZWxPd25lckNoZWNrKClcIixcbiAgICBcImVycm9yIFNldEludGVyZXN0UmF0ZU1vZGVsRnJlc2hDaGVjaygpO1wiLFxuICBdXG59O1xuXG5mdW5jdGlvbiBwYXJzZUVudW0ocmVwb3J0ZXJFbnVtOiBFcnJvclJlcG9ydGVyRW51bSk6IEVycm9yVHlwZXMge1xuICBjb25zdCBFcnJvcjoge1tuYW1lOiBzdHJpbmddOiBudW1iZXJ9ID0ge307XG4gIGNvbnN0IEVycm9ySW52OiB7W2NvZGU6IG51bWJlcl06IHN0cmluZ30gPSB7fTtcbiAgY29uc3QgRmFpbHVyZUluZm86IHtbbmFtZTogc3RyaW5nXTogbnVtYmVyfSA9IHt9O1xuICBjb25zdCBGYWlsdXJlSW5mb0ludjoge1tjb2RlOiBudW1iZXJdOiBzdHJpbmd9ID0ge307XG5cbiAgcmVwb3J0ZXJFbnVtLkVycm9yLmZvckVhY2goKGVudHJ5LCBpKSA9PiB7XG4gICAgRXJyb3JbZW50cnldID0gaTtcbiAgICBFcnJvckludltpXSA9IGVudHJ5O1xuICB9KTtcblxuICByZXBvcnRlckVudW0uRmFpbHVyZUluZm8uZm9yRWFjaCgoZW50cnksIGkpID0+IHtcbiAgICBGYWlsdXJlSW5mb1tlbnRyeV0gPSBpO1xuICAgIEZhaWx1cmVJbmZvSW52W2ldID0gZW50cnk7XG4gIH0pO1xuXG4gIGNvbnN0IEN1c3RvbUVycm9ycyA9IG5ldyBldGhlcnMudXRpbHMuSW50ZXJmYWNlKHJlcG9ydGVyRW51bS5DdXN0b21FcnJvcnMgfHwgW10pXG5cbiAgcmV0dXJuIHtFcnJvciwgRXJyb3JJbnYsIEZhaWx1cmVJbmZvLCBGYWlsdXJlSW5mb0ludiwgQ3VzdG9tRXJyb3JzfTtcbn1cblxuZXhwb3J0IGNvbnN0IENvbXB0cm9sbGVyRXJyID0gcGFyc2VFbnVtKENvbXB0cm9sbGVyRXJyb3JSZXBvcnRlcik7XG5leHBvcnQgY29uc3QgVG9rZW5FcnIgPSBwYXJzZUVudW0oVG9rZW5FcnJvclJlcG9ydGVyKTtcbiJdfQ==