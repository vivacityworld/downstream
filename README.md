# Vivacity Audit

## Scope

Total SLoC: 246

| Contract                             | SLOC | Purpose                                                                                                                                            |
| ------------------------------------ | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| CCNote.sol                           | 42   | CCNote is a contract that enables cNote to be used as borrowing asset in the Vivacity, details in [ccnote/CCNote.md](./contracts/ccnote/CCNote.md) |
| ccnote/oracle/CCNotepPriceOracle.sol | 16   | Convert cNote price to Note price, Note price is fixed as $1                                                                                       |
| PriceOracleRouter.sol                | 11   | Integrate multiple oracle interfafces                                                                                                              |
| RWA/whitelist/\*                     | 13   | Integrate multiple whitelist interfafces                                                                                                           |
| gov/staking/\*                       | 113  | Lock contract for converting viva token to voting power                                                                                            |
| vesting/VestingVault.sol             | 55   | Token vesting for involved vivacity partners                                                                                                       |

## Overview
Vivacity is a Compound V2 based lending protocol that enables users to borrow cNOTE against RWA assets. Generally, Vivacity will have two types of users: **1. users seeking leverage on RWA assets** and **2. users who want to lend their cNOTE** to earn yield.

User 1 will primarily supply RWA assets (represented by ERC20s) to Vivacity and borrow `cNOTE`. User 2 will supply their `cNOTE` to Vivacity so it can be borrowed by user 1. 

When `cNOTE` is supplied to Vivacity, users will receive `vcNOTE` (viva-cNOTE). When RWA tokens are supplied to Vivacity, users will receive `cRWATokens`.

#### IMPORTANT:
- `cNOTE` will have a collateral factor of 0. This means `cNOTE` cannot be used as collateral and users who supply it **cannot borrow against it**
- RWA tokens will have a borrow cap of 1. This means that RWA tokens **cannot be borrowed** by anyone. It can only be supplied and used as collateral.


## vcNOTE (viva-cNOTE)
`vcNOTE` is the [cToken](https://docs.compound.finance/v2/ctokens/) that users receive for supplying [cNOTE](https://docs.canto.io/overview/note#usdcnote). `vcNOTE` is a CErc20Delegate with added functionality to integrate with Canto's Neofinance Coordinator. 

`vcNOTE` overrides all cToken functions that lead to a balance change so that the Neofinance Coordinator can track user positions. The overriden functions are:
- `mintInternal()`
- `redeemInternal()`
- `redeemUnderlyingInternal()`
- `seizeInternal()`
- `transferTokens()`

Contracts that `vcNOTE` inherit have been modified so that the functions listed above can be overrided. 

#### cNOTE Oracle
The `cNOTE` oracle is used to determine the price of `cNOTE`. Because `cNOTE` is a repricing token based on the interest rate of supplying/borrowing NOTE in the Canto Lending Market, the price of `cNOTE` will naturally go up over time. `NOTE` is pegged to 1 dollar at all times in the Canto Lending Market. Hence, to get the USD price of `cNOTE`, the oracle looks at the exchange rate between `cNOTE` <=> `NOTE`. 

## cRWAToken
`cRWAToken` is the cToken that users receive for supplying RWA tokens. There can be multiple different types of RWA tokens supplied to Vivacity. Each one will produce a different `cRWAToken`. 

For example, let's say there are 2 RWA tokens available to collateralize in Vivacity: TBill and SME

When a user supplies and collateralizes TBill token, they will receive cTBill (which would be a token of type `cRWAToken`). If the user supplies SME token, they would receive cSME (again, a `cRWAToken`).

#### Whitelists

`cRWAToken` are different from regular cTokens in that they cannot be transfered and only whitelisted users are able to own them. Whitelists come from the RWA token issuers themselves. When a user KYCs with the RWA issuer, they will be added to the whitelist which allows them to own the RWA token. 

Vivacity looks at this whitelist to determine who can own the `cRWAToken`. This means that only other whitelisted users are able to own and liquidate `cRWATokens`. As mentioned previously, the transfer function for `cRWATokens` has been disabled.  

#### Oracles
The Vivacity comptroller must know the price of the RWA tokens in order to calculate an account's standing. Each RWA issuer will publish prices of RWA Tokens to an oracle contract on chain. 

The comptroller looks at `PriceOracleRouter.sol` to get the price of each cRWAToken. `PriceOracleRouter` will route each cRWAToken to the correct price oracle. It is expected that the price oracle for each cRWAToken will be provided and managed by the RWA issuers themselves.

## Staking

Staking plays a role in depositing tokens and receiving voting power from Llama governance. https://docs.llama.xyz/

Llama is an onchain governance and access control framework. It defines roles and permissions for executing transactions(called actions). This document describes how action is progressed and state changes depending on the result for every step. Actions are proposed, executable transactions that can be initiated by policyholders.
https://docs.llama.xyz/framework/actions#action-state

Proposer is requested to lock the amount of token decided by admin(setDeposit).  Withdrawal process is not triggered, restricted by Llama’s interface. Therefore, the proposer should handle the withdrawal process manually. The withdrawal outcome is determined by the state of progress(repo llama/src/lib/Enums.sol). If executed successfully, the amount deposited will be returned. But if canceled, failed and expired, it will be reserved in contract.

## Vesting

Vesting distributes a certain amount of token supply based on schedule. Contract has a structure for storing wheezing schedules(struct Vesting). Vivacity uses a linear vesting schedule that releases the vested tokens in a linear amount and time. 

Owner can decide related vesting parameter through
add()
remove()
transfer()

Vested account can withdraw through
release()
