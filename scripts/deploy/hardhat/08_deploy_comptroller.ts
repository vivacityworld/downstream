// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployLocal } from "../../types/deploy";

async function main({ deployed }: { deployed: DeployLocal }) {

  ////////////////////////////////
  //            DEPLOY          //
  ////////////////////////////////
  const ComptrollerFactory = await ethers.getContractFactory("Comptroller");
  const comptroller = await ComptrollerFactory.deploy();

  const UnitrollerFactory = await ethers.getContractFactory("Unitroller");
  const unitroller = await UnitrollerFactory.deploy();

  await unitroller._setPendingImplementation(comptroller.address);
  await comptroller._become(unitroller.address);


  ////////////////////////////////
  //     Transfer Ownership     //
  ////////////////////////////////
  await unitroller._setPendingAdmin(deployed.llama?.llamaExecutor!);

  return {
    comptroller: unitroller.address
  }
}

export default main;