// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";

async function main() {
  const address: Record<string, string> = {};

  const MockERC20Factory = await ethers.getContractFactory('MockERC20');
  const note = await MockERC20Factory.deploy(`NOTE`, `NOTE`);

  address["note"] = note.address;

  return { tokens: address }
}

export default main;