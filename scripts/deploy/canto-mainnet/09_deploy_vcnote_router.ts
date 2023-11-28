import { ethers } from "hardhat";
import { DeployLocal } from "../../types/deploy";
import { deploy } from "../helper";

async function main({ deployed }: { deployed: DeployLocal }) {

  if (!deployed.NOTE) throw "not found NOTE";
  if (!deployed.cNOTE) throw "not found cNOTE";
  if (!deployed.comptroller) throw "not found comptroller";
  if (!deployed.model?.VCNoteJumpRateModelV2) throw "not found VCNoteJumpRateModelV2";

  ////////////////////////////////
  //    DEPLOY VCNOTERouter     //
  ////////////////////////////////
  const vcNoteRouter = await deploy("VCNoteRouter", [deployed.NOTE, deployed.cNOTE, deployed.vcNote]);

  return {
    vcNoteRouter: vcNoteRouter.address,
  }
}

export default main;