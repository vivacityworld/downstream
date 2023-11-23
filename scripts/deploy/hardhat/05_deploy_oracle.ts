import { ethers } from "hardhat";
import { DeployLocal } from "../../types/deploy";

async function main({ deployed }: { deployed: DeployLocal }) {
  const [signer] = await ethers.getSigners();
  const _address: Record<string, Record<string, string>> = {};


  ////////////////////////////////
  //            DEPLOY          //
  ////////////////////////////////
  const PriceOracleRouterFactory = await ethers.getContractFactory("PriceOracleRouter");
  const priceOracleRouter = await PriceOracleRouterFactory.deploy();

  const VCNotePriceOracleFactory = await ethers.getContractFactory("VCNotePriceOracle");
  const vcNotePriceOracle = await VCNotePriceOracleFactory.deploy(deployed.cNOTE!);


  ////////////////////////////////
  //     Transfer Ownership     //
  ////////////////////////////////
  await priceOracleRouter.transferOwnership(deployed.llama?.llamaExecutor!);

  return {
    oracle: {
      priceOracleRouter: priceOracleRouter.address,
      vcNotePriceOracle: vcNotePriceOracle.address,
    }
  }
}

export default main;