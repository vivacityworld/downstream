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

  const helper = await createLlamaBootstrapHelper(deployed.llama!);

  const core = await ethers.getContractAt("LlamaCore", deployed.llama!.llamaCore);
  const executor = await ethers.getContractAt("LlamaExecutor", deployed.llama!.llamaExecutor);
  const policy = await ethers.getContractAt("LlamaPolicy", deployed.llama!.llamaPolicy);
  const llamaGov = await ethers.getContractAt("LlamaGovernanceScript", deployed.llama!.llamaGovScript);
  const vivaManage = await ethers.getContractAt("VivacityManageScript", deployed.llama!.vivaManageScript);

  await helper.setRolePermission(DEPLOY_ROLE, core, "setScriptAuthorization(address,bool)", deployed.llama!.bootstrapStrategy);
  await helper.setRolePermission(DEPLOY_ROLE, llamaGov, "aggregate(address[],bytes[])", deployed.llama!.bootstrapStrategy);
  console.log("setRolePermission");
  await helper.execute(core, "setScriptAuthorization", [deployed.llama!.llamaGovScript, true]);
  console.log("setScriptAuthorization");

  await helper.executeGovScript([
    [policy, "setRolePermission", [CORE_TEAM_ROLE, getPermission(vivaManage, "multicall(bytes[])", deployed.llama!.coreTeamStrategy100), true]],
    [policy, "setRolePermission", [CORE_TEAM_ROLE, getPermission(vivaManage, "aggregate(address[],bytes[])", deployed.llama!.coreTeamStrategy100), true]],
    [policy, "setRolePermission", [CORE_TEAM_ROLE, getPermission(llamaGov, "aggregate(address[],bytes[])", deployed.llama!.coreTeamStrategy100), true]],
    [policy, "setRolePermission", [CORE_TEAM_ROLE, getPermission(vivaManage, "multicall(bytes[])", deployed.llama!.coreTeamStrategy50), true]],
    [policy, "setRolePermission", [CORE_TEAM_ROLE, getPermission(vivaManage, "aggregate(address[],bytes[])", deployed.llama!.coreTeamStrategy50), true]],
    [policy, "setRolePermission", [CORE_TEAM_ROLE, getPermission(llamaGov, "aggregate(address[],bytes[])", deployed.llama!.coreTeamStrategy50), true]],
    [core, "setStrategyAuthorization", [deployed.llama!.coreTeamStrategy100, true]],
    [core, "setStrategyAuthorization", [deployed.llama!.coreTeamStrategy50, true]],
    [core, "setScriptAuthorization", [vivaManage.address, true]],
    [core, "setStrategyAuthorization", [deployed.llama!.bootstrapStrategy, false]],
  ]);
  console.log("setLlama");

  return {}
}

export default main;