import { ethers } from "hardhat";
import { DeployLocal } from "../../types/deploy";

async function main({ deployed }: { deployed: DeployLocal }) {

  ////////////////////////////////
  //            DEPLOY          //
  ////////////////////////////////
  const VivacityLensFactory = await ethers.getContractFactory("VivacityLens");
  const vivacityLens = await VivacityLensFactory.deploy();

  return {
    vivaLens: vivacityLens.address,
  }
}

export default main;