import { ethers } from "hardhat";
import { DeployLocal } from "./types/deploy";

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