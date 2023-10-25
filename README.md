# Vivacity Audit

## Overview

Vivacity is a contract that user who has cNote can participate in lending. Whitelisted borrowers can utilize lending fund (cNote) to invest. Interfaces support attaching multiple rwa oracle and whitelist contracts simply.

Detailed information for ccnote is documented in the [ccnote/CCNote.md](./contracts/ccnote/CCNote.md)

# Scope

Total SLoC: 246

| Contract                             | SLOC | Purpose                                                                                                                                            |
| ------------------------------------ | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| CCNote.sol                           | 42   | CCNote is a contract that enables cNote to be used as borrowing asset in the Vivacity, details in [ccnote/CCNote.md](./contracts/ccnote/CCNote.md) |
| ccnote/oracle/CCNotepPriceOracle.sol | 16   | Convert cNote price to Note price, Note price is fixed as $1                                                                                       |
| PriceOracleRouter.sol                | 11   | Integrate multiple oracle interfafces                                                                                                              |
| RWA/whitelist/\*                     | 13   | Integrate multiple whitelist interfafces                                                                                                           |
| gov/staking/\*                       | 113  | Lock contract for converting viva token to voting power                                                                                            |
| vesting/VestingVault.sol             | 55   | Token vesting for involved vivacity partners                                                                                                       |
