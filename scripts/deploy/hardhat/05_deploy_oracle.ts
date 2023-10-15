// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployLocal } from "../../types/deploy";

async function main({ deployed }: { deployed: DeployLocal }) {
  const [signer] = await ethers.getSigners();
  const _address: Record<string, Record<string, string>> = {};


  ////////////////////////////////
  //            DEPLOY          //
  ////////////////////////////////
  const PriceOracleRouterFactory = await ethers.getContractFactory("PriceOracleRouter");
  const priceOracleRouter = await PriceOracleRouterFactory.deploy();

  const CCNotePriceOracleFactory = await ethers.getContractFactory("CCNotePriceOracle");
  const ccNotePriceOracle = await CCNotePriceOracleFactory.deploy(deployed.CNOTE!);


  ////////////////////////////////
  //     Transfer Ownership     //
  ////////////////////////////////
  await priceOracleRouter.transferOwnership(deployed.llama?.llamaExecutor!);

  return {
    oracle: {
      priceOracleRouter: priceOracleRouter.address,
      ccNotePriceOracle: ccNotePriceOracle.address,
    }
  }
}

export default main;