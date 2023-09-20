// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";
import INTEREST_MODEL from "./config/interestModels.json";

async function main() {
  const address: Record<string, string> = {};

  for (const model of INTEREST_MODEL) {
    const InterestRateModelFactory = await ethers.getContractFactory(model.contract);
    const interestRateModel = await InterestRateModelFactory.deploy(
      ...model.args
    );
    address[model.name] = interestRateModel.address;
  }
  return { interestRateModel: address }
}

export default main;