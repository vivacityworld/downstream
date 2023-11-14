import { ethers } from "hardhat";
import { DeployLocal } from "../../types/deploy";
import MODELS from "./config/interestModels.json";
import { deploy } from "../helper";

async function main({ deployed }: { deployed: DeployLocal }) {
  const address: Record<string, string> = {};

  if (!deployed.llama?.llamaExecutor) throw "not found llamaExecutor";

  ////////////////////////////////
  //            DEPLOY          //
  ////////////////////////////////
  for (const model of MODELS) {
    if (model.contract === "JumpRateModelV2") {
      const interestRateModel = await deploy(model.contract, [...model.args, deployed.llama.llamaExecutor]);
      address[model.name] = interestRateModel.address;
    }
  }
  return { model: address }
}

export default main;