import { ethers } from "hardhat";
import { DeployLocal } from "../../types/deploy";
import { deploy } from "../helper";

async function main({ deployed }: { deployed: DeployLocal }) {

  ////////////////////////////////
  //    DEPLOY VCNOTERouter     //
  ////////////////////////////////
  const vcNoteRouter = await deploy("VCNoteRouter", [deployed.NOTE, deployed.cNOTE, "0x45D36aD3a67a29F36F06DbAB1418F2e8Fa916Eea"]);

}

export default main;