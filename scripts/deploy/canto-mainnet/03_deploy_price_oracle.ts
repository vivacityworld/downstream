import { ethers } from "hardhat";
import { DeployLocal } from "../../types/deploy";
import { deploy } from "../helper";

async function main({ deployed }: { deployed: DeployLocal }) {
  const [signer] = await ethers.getSigners();

  if (!deployed.cNOTE) throw "not found cNOTE";
  if (!deployed.llama?.llamaExecutor) throw "not found llamaExecutor";


  ////////////////////////////////
  //            DEPLOY          //
  ////////////////////////////////
  const priceOracleRouter = await deploy("PriceOracleRouter", []);
  const vcNotePriceOracle = await deploy("VCNotePriceOracle", [deployed.cNOTE]);

  ////////////////////////////////
  //     Transfer Ownership     //
  ////////////////////////////////
  await priceOracleRouter.transferOwnership(deployed.llama.llamaExecutor);

  return {
    oracle: {
      priceOracleRouter: priceOracleRouter.address,
      vcNotePriceOracle: vcNotePriceOracle.address,
    }
  }
}

export default main;