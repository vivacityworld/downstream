import { ethers } from "hardhat";
import { DeployLocal } from "../../types/deploy";
import { deploy } from "../helper";

async function main({ deployed }: { deployed: DeployLocal }) {

  if (!deployed.NOTE) throw "not found NOTE";
  if (!deployed.cNOTE) throw "not found cNOTE";
  if (!deployed.comptroller) throw "not found comptroller";
  if (!deployed.model?.VCNoteJumpRateModelV2) throw "not found VCNoteJumpRateModelV2";

  ////////////////////////////////
  //       DEPLOY VCNOTE        //
  ////////////////////////////////
  const vcNoteImpl = await deploy("VCNote", []);

  const vcNoteProxy = await deploy("CErc20Delegator", [
    deployed.cNOTE,
    deployed.comptroller,
    deployed.model.VCNoteJumpRateModelV2,
    ethers.utils.parseEther("1"),
    `Vivacity Collateralized NOTE`,
    `vcNOTE`,
    18,
    deployed.llama?.llamaExecutor!,
    vcNoteImpl.address,
    []
  ])

  return {
    vcNote: vcNoteProxy.address,
    vcNote_impl: vcNoteImpl.address,
  }
}

export default main;