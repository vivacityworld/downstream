import { ethers } from "hardhat";
import { createLlamaBootstrapHelper, getPermission, encodeRelativeStratigyConfig, encodeAccountConfig, encodeBytes32 } from "../../_utils/llama";
import { DeployLocal } from "../../types/deploy";
import { deploy, logDeployed } from "../helper";
import LLAMA_CONFIG from "./config/llama.json";


async function main({ deployed }: { deployed: DeployLocal }) {

  if (!deployed.llamaFramework?.llamaFactory) throw "not found llamaFactory";
  if (!deployed.llamaFramework?.llamaRelativeHolderQuorum) throw "not found llamaRelativeHolderQuorum";
  if (!deployed.llamaFramework?.llamaAccount) throw "not found llamaAccount";
  if (!deployed.llamaFramework?.llamaLens) throw "not found llamaLens";

  ////////////////////////////////
  //    DEPLOY Llama Instance   //
  ////////////////////////////////

  const llamaFactory = await ethers.getContractAt("LlamaFactory", deployed.llamaFramework.llamaFactory);
  const tx = await llamaFactory.deploy({
    name: LLAMA_CONFIG.instanceName,
    strategyLogic: deployed.llamaFramework.llamaRelativeHolderQuorum,
    accountLogic: deployed.llamaFramework.llamaAccount,
    initialStrategies: LLAMA_CONFIG.initialStrategies.map(encodeRelativeStratigyConfig),
    initialAccounts: LLAMA_CONFIG.initialAccounts.map(encodeAccountConfig),
    policyConfig: {
      roleDescriptions: LLAMA_CONFIG.initialRoleDescriptions.map(encodeBytes32),
      roleHolders: LLAMA_CONFIG.initialRoleHolders,
      rolePermissions: LLAMA_CONFIG.initialRolePermissions,
      color: LLAMA_CONFIG.instanceColor,
      logo: LLAMA_CONFIG.instanceLogo
    }
  });
  const result = await tx.wait();
  const data = result.events?.[result.events?.length - 1]?.args;
  if (!data) return;
  const core = await ethers.getContractAt("LlamaCore", data[2]);
  const executor = await ethers.getContractAt("LlamaExecutor", data[3]);
  const policy = await ethers.getContractAt("LlamaPolicy", data[4]);

  const llamaLens = await ethers.getContractAt("LlamaLens", deployed.llamaFramework?.llamaLens!);
  const deployerStrategy = await llamaLens.computeLlamaStrategyAddress(deployed.llamaFramework.llamaRelativeHolderQuorum, encodeRelativeStratigyConfig(LLAMA_CONFIG.initialStrategies[0]), core.address);
  const coreTeamStrategy = await llamaLens.computeLlamaStrategyAddress(deployed.llamaFramework.llamaRelativeHolderQuorum, encodeRelativeStratigyConfig(LLAMA_CONFIG.initialStrategies[1]), core.address);
  const vivacityTreasury = await llamaLens.computeLlamaAccountAddress(deployed.llamaFramework.llamaAccount, encodeAccountConfig(LLAMA_CONFIG.initialAccounts[0]), core.address);

  logDeployed("llamaCore", core.address);
  logDeployed("llamaExecutor", executor.address);
  logDeployed("llamaPolicy", policy.address);
  logDeployed("deployerStrategy", deployerStrategy);
  logDeployed("coreTeamStrategy", coreTeamStrategy);
  logDeployed("vivacityTreasury", vivacityTreasury);

  ////////////////////////////////
  //    DEPLOY Llama Script     //
  ////////////////////////////////

  const llamaGovernanceScript = await deploy("LlamaGovernanceScript", []);
  const vivacitiyManageScript = await deploy("VivacityManageScript", []);

  ////////////////////////////////
  //      Initialize Llama      //
  ////////////////////////////////

  const DEPLOY_ROLE = 1;
  const CORE_TEAM_ROLE = 2;

  const llama = {
    llamaCore: core.address,
    llamaExecutor: executor.address,
    llamaPolicy: policy.address,
    llamaLens: deployed.llamaFramework.llamaLens,
    bootstrapStrategy: deployerStrategy,
    coreTeamStrategy: coreTeamStrategy,
    llamaGovScript: llamaGovernanceScript.address,
    vivaManageScript: vivacitiyManageScript.address,
    vivacityTreasury: vivacityTreasury,
  }

  const helper = await createLlamaBootstrapHelper(llama);

  await helper.setRolePermission(DEPLOY_ROLE, core, "setScriptAuthorization(address,bool)", deployerStrategy);
  await helper.execute(core, "setScriptAuthorization", [llamaGovernanceScript.address, true]);
  await helper.setRolePermission(DEPLOY_ROLE, llamaGovernanceScript, "aggregate(address[],bytes[])", deployerStrategy);

  await helper.executeGovScript([
    [policy, "setRolePermission", [CORE_TEAM_ROLE, getPermission(vivacitiyManageScript, "multicall(bytes[])", coreTeamStrategy), true]],
    [policy, "setRolePermission", [CORE_TEAM_ROLE, getPermission(vivacitiyManageScript, "aggregate(address[],bytes[])", coreTeamStrategy), true]],
    [policy, "setRolePermission", [CORE_TEAM_ROLE, getPermission(llamaGovernanceScript, "aggregate(address[],bytes[])", coreTeamStrategy), true]],
    [core, "setStrategyAuthorization", [coreTeamStrategy, true]],
    [core, "setScriptAuthorization", [vivacitiyManageScript.address, true]],
    [core, "setStrategyAuthorization", [deployerStrategy, false]],
  ]);

  return {
    llama
  }
}

export default main;