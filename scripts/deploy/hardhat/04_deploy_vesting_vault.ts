import { ethers } from "hardhat";
import { DeployLocal } from "../../types/deploy";

async function main({ deployed }: { deployed: DeployLocal }) {

  ////////////////////////////////
  //       DEPLOY VESTING       //
  ////////////////////////////////
  const VestingVaultFactory = await ethers.getContractFactory("VestingVault");
  const vestingVault = await VestingVaultFactory.deploy(deployed.VIVA!);


  ////////////////////////////////
  //     Transfer Ownership     //
  ////////////////////////////////
  await vestingVault.transferOwnership(deployed.llama?.llamaExecutor!);

  return {
    vestingVault: vestingVault.address,
  }
}

export default main;