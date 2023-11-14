import { ethers } from "hardhat";
import { createLlamaBootstrapHelper, getPermission } from "../../_utils/llama";
import { DeployLocal } from "../../types/deploy";

async function main({ deployed }: { deployed: DeployLocal }) {

  if (!deployed.llama) throw "not found llama";
  if (!deployed.llamaFramework?.llamaRelativeHolderQuorum) throw "not found llamaRelativeHolderQuorum";
  if (!deployed.llamaFramework?.llamaAccount) throw "not found llamaAccount";
  if (!deployed.llamaFramework?.llamaLens) throw "not found llamaLens";

  const DEPLOY_ROLE = 1;
  const CORE_TEAM_ROLE = 1;

  const core = await ethers.getContractAt("LlamaCore", deployed.llama.llamaCore);
  const policy = await ethers.getContractAt("LlamaPolicy", deployed.llama.llamaPolicy);
  const vivacityManageScript = await ethers.getContractAt("VivacityManageScript", deployed.llama.vivaManageScript);
  const llamaGovScript = await ethers.getContractAt("VivacityManageScript", deployed.llama.llamaGovScript);

  const bootstrapStrategy = deployed.llama.bootstrapStrategy;
  const coreTeamStrategy = deployed.llama.coreTeamStrategy;

  const helper = await createLlamaBootstrapHelper(deployed.llama);

  await helper.setRolePermission(DEPLOY_ROLE, core, "setScriptAuthorization(address,bool)", bootstrapStrategy);
  await helper.execute(core, "setScriptAuthorization", [llamaGovScript.address, true]);
  await helper.setRolePermission(DEPLOY_ROLE, llamaGovScript, "aggregate(address[],bytes[])", bootstrapStrategy);

  await helper.executeGovScript([
    [policy, "setRolePermission", [CORE_TEAM_ROLE, getPermission(vivacityManageScript, "multicall(bytes[])", coreTeamStrategy), true]],
    [policy, "setRolePermission", [CORE_TEAM_ROLE, getPermission(vivacityManageScript, "aggregate(address[],bytes[])", coreTeamStrategy), true]],
    [policy, "setRolePermission", [CORE_TEAM_ROLE, getPermission(llamaGovScript, "aggregate(address[],bytes[])", coreTeamStrategy), true]],
    [core, "setStrategyAuthorization", [coreTeamStrategy, true]],
    [core, "setScriptAuthorization", [vivacityManageScript.address, true]],
    [core, "setStrategyAuthorization", [bootstrapStrategy, false]],
  ]);

  return {}
}

export default main;