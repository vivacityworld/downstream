import { ethers } from "hardhat";
import { DeployLocal } from "../../types/deploy";
import DISTIBUTION from "../../../config/distribution.json"

import { createLlamaBootstrapHelper, getPermission } from "../../_utils/llama";

async function main({ deployed }: { deployed: DeployLocal }) {

  ////////////////////////////////
  //        SETTING Llama       //
  ////////////////////////////////

  const helper = await createLlamaBootstrapHelper(deployed.llama!);

  // role
  const DEPLOY_ROLE = 1;
  const STAKING_MODULE_ROLE = 2;
  const STAKER_ROLE = 3;

  const core = await ethers.getContractAt("LlamaCore", deployed.llama!.llamaCore);
  const policy = await ethers.getContractAt("LlamaPolicy", deployed.llama!.llamaPolicy);
  const vivacityManageScript = await ethers.getContractAt("VivacityManageScript", deployed.llama!.vivaManageScript);
  const llamaGovScript = await ethers.getContractAt("VivacityManageScript", deployed.llama!.llamaGovScript);

  // strategy
  const bootstrapStrategy = deployed.llama!.bootstrapStrategy;
  const stakingModuleStrategy = deployed.llama!.stakingModuleStrategy;
  const stakerStrategy = deployed.llama!.stakerStrategy;

  // grant permission to deploy for initial setting
  await helper.setRolePermission(DEPLOY_ROLE, core, "setStrategyAuthorization(address,bool)", bootstrapStrategy);
  await helper.setRolePermission(DEPLOY_ROLE, core, "setScriptAuthorization(address,bool)", bootstrapStrategy);
  await helper.setRolePermission(DEPLOY_ROLE, vivacityManageScript, "multicall(bytes[])", bootstrapStrategy);
  await helper.setRolePermission(DEPLOY_ROLE, llamaGovScript, "aggregate(address[],bytes[])", bootstrapStrategy);

  // authorize for using strategy
  await helper.execute(core, "setStrategyAuthorization", [stakingModuleStrategy, true]);
  await helper.execute(core, "setStrategyAuthorization", [stakerStrategy, true]);

  // authorize for using script
  await helper.execute(core, "setScriptAuthorization", [llamaGovScript.address, true]);
  await helper.execute(core, "setScriptAuthorization", [vivacityManageScript.address, true]);

  // grant permission to staking module role
  // grant permission to staker role
  // grant role to staking module
  await helper.executeGovScript([
    // [policy, "setRolePermission", [STAKING_MODULE_ROLE, getPermission(policy, "setRoleHolder(uint8,address,uint96,uint64)", stakingModuleStrategy), true]],
    // [policy, "setRolePermission", [STAKING_MODULE_ROLE, getPermission(vivacityManageScript, "multicall(bytes[])", stakerStrategy), true]],
    // [policy, "setRolePermission", [STAKING_MODULE_ROLE, getPermission(llamaGovScript, "aggregate(address[],bytes[])", stakerStrategy), true]],
    // [policy, "setRolePermission", [STAKER_ROLE, getPermission(vivacityManageScript, "multicall(bytes[])", stakerStrategy), true]],
    // [policy, "setRolePermission", [STAKER_ROLE, getPermission(llamaGovScript, "aggregate(address[],bytes[])", stakerStrategy), true]],
    [policy, "setRoleHolder", [STAKING_MODULE_ROLE, deployed.staking!, 1, ethers.BigNumber.from(2).pow(64).sub(1)]],
  ]);

  const _account = DISTIBUTION.distribution.vesting.accounts.map(item => item.address);
  const _start = DISTIBUTION.distribution.vesting.accounts.map(item => DISTIBUTION.distribution.vesting.start);
  const _duration = DISTIBUTION.distribution.vesting.accounts.map(item => DISTIBUTION.distribution.vesting.duration);
  const _amount = DISTIBUTION.distribution.vesting.accounts.map(item => item.amount);

  await helper.executeVivaScript([
    // accept ownership
    ["acceptAdmin", [deployed.comptroller]],
    // add vesting
    ["addVestings", [deployed.vestingVault, _account, _start, _duration, _amount]],
    // set comptroller parameters
    ["setLiquidationIncentive", [deployed.comptroller, ethers.utils.parseUnits("1.05", 18)]],
    ["setCloseFactor", [deployed.comptroller, ethers.utils.parseUnits("1", 18)]],
    ["setBorrowCapGuardian", [deployed.comptroller, deployed.llama?.llamaExecutor]],
    ["setPauseGuardian", [deployed.comptroller, deployed.llama?.llamaExecutor]],
    ["setComptrollerPriceOracle", [deployed.comptroller, deployed.oracle?.priceOracleRouter]],
    // set vcnote parameters
    ["setLendingLedger", [deployed.vcNote, deployed.lendingLedger]],
    ["setReserveFactor", [deployed.vcNote, ethers.utils.parseUnits("0.2", 18)]],
    ["setCollateralFactor", [deployed.comptroller, deployed.vcNote, 0]],
    ["setBorrowCap", [deployed.comptroller, deployed.vcNote, 0]],
    // set oracle
    ["setPriceOracle", [deployed.oracle?.priceOracleRouter, deployed.vcNote, deployed.oracle?.vcNotePriceOracle]],
    // support market
    ["supportMarket", [deployed.comptroller, deployed.vcNote]],
  ]);

  // revoke deployer strategy 
  await helper.execute(core, "setStrategyAuthorization", [bootstrapStrategy, false]);

  return {}
}

export default main;