// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";
import { DeployLocal } from "../../types/deploy";

async function main({ deployed }: { deployed: DeployLocal }) {

  ////////////////////////////////
  //       DEPLOY STAKING       //
  ////////////////////////////////
  const proxyFactory = await ethers.getContractFactory("VivaProxy");
  const stakingFactory = await ethers.getContractFactory("Staking");

  const impl = await stakingFactory.deploy();
  const proxy = await proxyFactory.deploy(impl.address);

  const staking = await ethers.getContractAt("Staking", proxy.address);

  await staking.initialize(deployed.VIVA!,
    deployed.llama?.llamaCore!,
    deployed.llama?.llamaPolicy!,
    deployed.llama?.stakingModuleStrategy!,
    2,
    3
  );

  ////////////////////////////////
  //     Transfer Ownership     //
  ////////////////////////////////
  await staking.transferOwnership(deployed.llama?.llamaExecutor!);

  return { staking: staking.address }
}

export default main;