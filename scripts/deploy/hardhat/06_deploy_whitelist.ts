import { ethers } from "hardhat";
import { DeployLocal } from "../../types/deploy";

async function main({ deployed }: { deployed: DeployLocal }) {

  ////////////////////////////////
  //            DEPLOY          //
  ////////////////////////////////
  const WhitelistRouterFactory = await ethers.getContractFactory("WhitelistRouter");
  const whitelistRouter = await WhitelistRouterFactory.deploy();


  ////////////////////////////////
  //     Transfer Ownership     //
  ////////////////////////////////
  await whitelistRouter.transferOwnership(deployed.llama?.llamaExecutor!);

  return {
    whitelistRouter: whitelistRouter.address
  }
}

export default main;