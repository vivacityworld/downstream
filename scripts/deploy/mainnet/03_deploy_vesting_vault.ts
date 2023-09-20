// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import TOKENS from "./config/tokens.json";

async function main() {
  const VestingVaultFactory = await ethers.getContractFactory("VestingVault");
  const vestingVault = await VestingVaultFactory.deploy(TOKENS.CNote);

  return {
    VestingVault: vestingVault.address,
  }
}

export default main;