import { ethers } from "hardhat";
import { DeployLocal } from "../../types/deploy";
import { deploy } from "../helper";

async function main({ deployed }: { deployed: DeployLocal }) {

  const [signer] = await ethers.getSigners();

  //////////////////////////////////////////
  //       DEPLOY UPGRADE CONTRACT        //
  //////////////////////////////////////////

  // const vcNoteImpl = await deploy("VCNote", []);
  // const vcNotePriceOracle = await deploy("VCNotePriceOracle", [deployed.NOTE]);
  const vivaPoint = await deploy("VivaPoint", [deployed.llama?.llamaExecutor!, 6704940]);

  return {
    // vcNote_impl: vcNoteImpl.address,
    vivaPoint: vivaPoint.address,
    oracle: {
      ...deployed.oracle,
      // vcNotePriceOracle: vcNotePriceOracle.address,
    }
  }
}

export default main;