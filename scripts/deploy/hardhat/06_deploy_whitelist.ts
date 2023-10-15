// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
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