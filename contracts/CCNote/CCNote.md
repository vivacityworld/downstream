# CCNote Audit

# Overview

CCNote is a contract that enables cNote to be used as collateral in the Vivacity (compound v2). CCNote inherits from the Compound v2 CToken contract (with slight changes to certain visibilities to allow for overrides).

### About CCNote (CRWAToken):

CCNote with cNote (erc20) as underlying asset

### Requirements for RWA CTokens:

- CCNote must use cNote as underlying asset
- If there are any changes to the cNote Lender's supply, CCNote must synchronize the changes with LendingLedger.

About LendingLedger:

- this interface can be found in ILendingLedger.sol (not in scope) (https://github.com/code-423n4/2023-08-verwa)

### Specific changes include:
