// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";

async function main({ address }: { address: Record<string, any> }) {
  const CompoundLensFactory = await ethers.getContractFactory("CompoundLens");
  const compoundLens = await CompoundLensFactory.deploy();

  return {
    CompoundLens: compoundLens.address,
  }
}

export default main;