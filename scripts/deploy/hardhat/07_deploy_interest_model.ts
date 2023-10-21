import { ethers } from "hardhat";
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