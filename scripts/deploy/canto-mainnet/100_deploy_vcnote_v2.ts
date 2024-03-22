import { ethers } from "hardhat";
import { DeployLocal } from "../../types/deploy";
import { deploy } from "../helper";

async function main({ deployed }: { deployed: DeployLocal }) {

  const [signer] = await ethers.getSigners();

  //////////////////////////////////////////
  //       DEPLOY UPGRADE CONTRACT        //
  //////////////////////////////////////////
  // console.log("signer.getTransactionCount()", await signer.getTransactionCount());

  const vcNoteImpl = await deploy("VCNote", []);
  const vcNotePriceOracle = await deploy("VCNotePriceOracle", [deployed.NOTE]);
  // block 8792114,  Thu, 21 Mar 2024 00:00:00 GMT
  const vivaPoint = await deploy("VivaPoint", [deployed.llama?.llamaExecutor!, 8792114]);

  return {
    vcNote_impl: vcNoteImpl.address,
    vivaPoint: vivaPoint.address,
    oracle: {
      ...deployed.oracle,
      vcNotePriceOracle: vcNotePriceOracle.address,
    }
  }
}

export default main;