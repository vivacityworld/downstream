// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";

async function main({ address }: Record<string, any>) {

  const MockERC20Factory = await ethers.getContractFactory('MockERC20');
  const govToken = await MockERC20Factory.deploy("Gov", "Gov");

  const VestingVaultFactory = await ethers.getContractFactory("VestingVault");
  const vestingVault = await VestingVaultFactory.deploy(govToken.address);

  return {
    VestingVault: vestingVault.address,
    GovToken: govToken.address,
  }
}

export default main;