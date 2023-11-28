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

  const DEPLOY_ROLE = 1;
  const CORE_TEAM_ROLE = 2;

  ////////////////////////////////
  //    DEPLOY Llama Script     //
  ////////////////////////////////

  const llamaGovernanceScript = await deploy("LlamaGovernanceScript", []);
  const vivacitiyManageScript = await deploy("VivacityManageScript", []);

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
      rolePermissions: [],
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
  const coreTeamStrategy100 = await llamaLens.computeLlamaStrategyAddress(deployed.llamaFramework.llamaRelativeHolderQuorum, encodeRelativeStratigyConfig(LLAMA_CONFIG.initialStrategies[1]), core.address);
  const coreTeamStrategy50 = await llamaLens.computeLlamaStrategyAddress(deployed.llamaFramework.llamaRelativeHolderQuorum, encodeRelativeStratigyConfig(LLAMA_CONFIG.initialStrategies[2]), core.address);
  const vivacityTreasury = await llamaLens.computeLlamaAccountAddress(deployed.llamaFramework.llamaAccount, encodeAccountConfig(LLAMA_CONFIG.initialAccounts[0]), core.address);

  logDeployed("llamaCore", core.address);
  logDeployed("llamaExecutor", executor.address);
  logDeployed("llamaPolicy", policy.address);
  logDeployed("deployerStrategy", deployerStrategy);
  logDeployed("coreTeamStrategy100", coreTeamStrategy100);
  logDeployed("coreTeamStrategy50", coreTeamStrategy50);
  logDeployed("vivacityTreasury", vivacityTreasury);

  ////////////////////////////////
  //      Initialize Llama      //
  ////////////////////////////////

  const llama = {
    llamaCore: core.address,
    llamaExecutor: executor.address,
    llamaPolicy: policy.address,
    llamaLens: deployed.llamaFramework.llamaLens,
    bootstrapStrategy: deployerStrategy,
    coreTeamStrategy100: coreTeamStrategy100,
    coreTeamStrategy50: coreTeamStrategy50,
    llamaGovScript: llamaGovernanceScript.address,
    vivaManageScript: vivacitiyManageScript.address,
    vivacityTreasury: vivacityTreasury,
  }

  return {
    llama
  }
}

export default main;