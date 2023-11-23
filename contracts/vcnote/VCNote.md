# Overview

VCNote is a contract that enables cNote to be used as borrowing asset in the Vivacity (compound v2). VCNote inherits from the Compound v2 CToken contract (with slight changes to certain visibilities to allow for overrides).

### About VCNote:

cNote (erc20) is underlying asset for vcNote

### Requirements for VCNote:

- If there are any changes to the cNote Lender's supply, VCNote must synchronize the changes with LendingLedger.

About LendingLedger:

- this interface can be found in LendingLedger.sol (not in scope) (https://github.com/code-423n4/2023-08-verwa)

### Specific changes include:

**Changes to CToken contracts**

- Synchronize changes in underlying (cNOTE) with LendingLedger.
  - This will be checked in the `mintInternal()`, `redeemInternal()`, `redeemUnderlyingInternal()`, `seizeInternal()`, `transferTokens()` override function

**Visibility Changes for overriding**

- CToken
  - `mintInternal()` changed to virtual
    - allows for override to perform underlying supply sync with LendingLedger.
    - calls `super.mintInternal()` before underlying supply sync
  - `redeemInternal()` changed to virtual
    - allows for override to perform underlying supply sync with LendingLedger.
    - calls `super.redeemInternal()` before underlying supply sync
  - `redeemUnderlyingInternal()` changed to virtual
    - allows for override to perform underlying supply sync with LendingLedger.
    - calls `super.redeemUnderlyingInternal()` before underlying supply sync
  - `seizeInternal()` changed to virtual
    - allows for override to perform underlying supply sync with LendingLedger.
    - calls `super.seizeInternal()` before underlying supply sync
  - `transferTokens()` changed to virtual
    - allows for override to perform underlying supply sync with LendingLedger.
    - calls `super.transferTokens()` before underlying supply sync
