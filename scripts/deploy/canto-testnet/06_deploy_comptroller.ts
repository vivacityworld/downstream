import { ethers } from "hardhat";
import { DeployLocal } from "../../types/deploy";
import { deploy } from "../helper";

async function main({ deployed }: { deployed: DeployLocal }) {

  if (!deployed.llama?.llamaExecutor) throw "not found llamaExecutor";

  ////////////////////////////////
  //            DEPLOY          //
  ////////////////////////////////
  const comptroller = await deploy("Comptroller", [])
  const unitroller = await deploy("Unitroller", [])

  await unitroller._setPendingImplementation(comptroller.address);
  await comptroller._become(unitroller.address);

  ////////////////////////////////
  //     Transfer Ownership     //
  ////////////////////////////////
  await unitroller._setPendingAdmin(deployed.llama.llamaExecutor);

  return {
    comptroller: unitroller.address,
    comptroller_impl: comptroller.address
  }
}

export default main;