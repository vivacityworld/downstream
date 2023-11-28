import { ethers } from "hardhat";
import { DeployLocal } from "../../types/deploy";
import { deploy } from "../helper";

async function main({ deployed }: { deployed: DeployLocal }) {

  if (!deployed.cNOTE) throw "not found cNOTE";
  if (!deployed.llama?.llamaExecutor) throw "not found llamaExecutor";

  ////////////////////////////////
  //            DEPLOY          //
  ////////////////////////////////

  const whitelistRouter = await deploy("WhitelistRouter", []);

  ////////////////////////////////
  //     Transfer Ownership     //
  ////////////////////////////////
  await whitelistRouter.transferOwnership(deployed.llama.llamaExecutor);

  return {
    whitelistRouter: whitelistRouter.address
  }
}

export default main;