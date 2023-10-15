// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployLocal } from "../../types/deploy";
import MODELS from "../../../config/interestModels.json";

async function main({ deployed }: { deployed: DeployLocal }) {
  const address: Record<string, string> = {};
  ////////////////////////////////
  //            DEPLOY          //
  ////////////////////////////////
  for (const model of MODELS) {
    const InterestRateModelFactory = await ethers.getContractFactory(model.contract);

    if (model.contract === "JumpRateModelV2") {
      const interestRateModel = await InterestRateModelFactory.deploy(
        ...model.args, deployed.llama!.llamaExecutor
      );
      address[model.name] = interestRateModel.address;
    }
  }
  return { model: address }
}

export default main;