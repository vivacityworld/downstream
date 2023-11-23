import { ethers } from "hardhat";
import { encodeRelativeStratigyConfig, encodeAccountConfig, encodeBytes32 } from "../../_utils/llama";
import LLAMA from "../../../config/llama.json";

import { DeployLocal } from "../../types/deploy";
async function main({ deployed }: { deployed: DeployLocal }) {
  const [signer] = await ethers.getSigners();
  let calldata;

  ////////////////////////////////
  //    DEPLOY Llama Instance   //
  ////////////////////////////////

  const llamaFactory = await ethers.getContractAt("LlamaFactory", deployed.llamaFramework?.llamaFactory!);

  const tx = await llamaFactory.deploy({
    name: LLAMA.instanceName,
    strategyLogic: deployed.llamaFramework?.llamaRelativeHolderQuorum!,
    accountLogic: deployed.llamaFramework?.llamaAccount!,
    initialStrategies: LLAMA.initialStrategies.map(encodeRelativeStratigyConfig),
    initialAccounts: LLAMA.initialAccounts.map(encodeAccountConfig),
    policyConfig: {
      roleDescriptions: LLAMA.initialRoleDescriptions.map(encodeBytes32),
      roleHolders: LLAMA.initialRoleHolders,
      rolePermissions: LLAMA.initialRolePermissions,
      color: LLAMA.instanceColor,
      logo: LLAMA.instanceLogo
    }
  });
  const result = await tx.wait();
  const data = result.events?.[result.events?.length - 1]?.args;
  if (!data) return;

  const core = await ethers.getContractAt("LlamaCore", data[2]);
  const executor = await ethers.getContractAt("LlamaExecutor", data[3]);
  const policy = await ethers.getContractAt("LlamaPolicy", data[4]);

  const llamaLens = await ethers.getContractAt("LlamaLens", deployed.llamaFramework?.llamaLens!);
  const deployerStrategy = await llamaLens.computeLlamaStrategyAddress(deployed.llamaFramework?.llamaRelativeHolderQuorum!, encodeRelativeStratigyConfig(LLAMA.initialStrategies[0]), core.address);
  const stakingModuleStrategy = await llamaLens.computeLlamaStrategyAddress(deployed.llamaFramework?.llamaRelativeHolderQuorum!, encodeRelativeStratigyConfig(LLAMA.initialStrategies[1]), core.address);
  const stakerStrategy = await llamaLens.computeLlamaStrategyAddress(deployed.llamaFramework?.llamaRelativeHolderQuorum!, encodeRelativeStratigyConfig(LLAMA.initialStrategies[2]), core.address);
  const vivacityTreasury = await llamaLens.computeLlamaAccountAddress(deployed.llamaFramework!.llamaAccount, encodeAccountConfig(LLAMA.initialAccounts[0]), core.address);

  ////////////////////////////////
  //    DEPLOY Llama Script     //
  ////////////////////////////////
  const llamaGovernanceScriptFactory = await ethers.getContractFactory("LlamaGovernanceScript");
  const llamaGovernanceScript = await llamaGovernanceScriptFactory.deploy();

  const vivacitiyManageScriptFactory = await ethers.getContractFactory("VivacityManageScript");
  const vivacitiyManageScript = await vivacitiyManageScriptFactory.deploy();


  return {
    llama: {
      llamaCore: core.address,
      llamaExecutor: executor.address,
      llamaPolicy: policy.address,
      llamaLens: deployed.llamaFramework?.llamaLens!,
      bootstrapStrategy: deployerStrategy,
      stakingModuleStrategy: stakingModuleStrategy,
      stakerStrategy: stakerStrategy,
      llamaGovScript: llamaGovernanceScript.address,
      vivaManageScript: vivacitiyManageScript.address,
      vivacityTreasury: vivacityTreasury,
    }
  }
}

export default main;