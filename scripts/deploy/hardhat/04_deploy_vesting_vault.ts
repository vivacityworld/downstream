// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
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