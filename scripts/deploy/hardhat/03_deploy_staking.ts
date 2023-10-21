import { ethers } from "hardhat";
import { DeployLocal } from "../../types/deploy";

async function main({ deployed }: { deployed: DeployLocal }) {

  ////////////////////////////////
  //       DEPLOY STAKING       //
  ////////////////////////////////
  const proxyFactory = await ethers.getContractFactory("ERC1967Proxy");
  const stakingFactory = await ethers.getContractFactory("Staking");

  const impl = await stakingFactory.deploy();
  const proxy = await proxyFactory.deploy(impl.address, []);

  const staking = await ethers.getContractAt("Staking", proxy.address);

  await staking.initialize(deployed.VIVA!,
    deployed.llama?.llamaCore!,
    deployed.llama?.llamaPolicy!,
    deployed.llama?.llamaExecutor!,
    "0x0000000000000000000000000000000000000000",
    deployed.llama?.stakingModuleStrategy!,
    deployed.llama?.stakerStrategy!,
    2,
    3
  );

  ////////////////////////////////
  //     Transfer Ownership     //
  ////////////////////////////////
  await staking.setAdmin(deployed.llama?.llamaExecutor!);

  return { staking: staking.address }
}

export default main;