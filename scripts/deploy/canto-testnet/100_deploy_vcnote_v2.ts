import { ethers } from "hardhat";
import { DeployLocal } from "../../types/deploy";
import { deploy } from "../helper";

async function main({ deployed }: { deployed: DeployLocal }) {

  //////////////////////////////////////////
  //       DEPLOY UPGRADE CONTRACT        //
  //////////////////////////////////////////

  const vcNoteImpl = await deploy("VCNote", []);
  const vcNotePriceOracle = await deploy("VCNotePriceOracle", [deployed.NOTE]);

  return {
    vcNote_impl: vcNoteImpl.address,
    oracle: {
      ...deployed.oracle,
      vcNotePriceOracle: vcNotePriceOracle.address,
    }
  }
}

export default main;