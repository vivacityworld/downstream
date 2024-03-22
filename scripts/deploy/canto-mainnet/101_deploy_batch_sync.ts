import { ethers } from "hardhat";
import { DeployLocal } from "../../types/deploy";
import { deploy } from "../helper";

async function main({ deployed }: { deployed: DeployLocal }) {
  const [signer] = await ethers.getSigners();

  const batchSyncLendingLedger = await deploy("BatchSyncLendingLedger", []);

  return {
    batchSyncLendingLedger: batchSyncLendingLedger.address,
  }
}

export default main;