import { ethers } from "hardhat";
import { DeployLocal } from "../../types/deploy";

async function main({ deployed }: { deployed: DeployLocal }) {

  ////////////////////////////////
  //       DEPLOY VCNOTE        //
  ////////////////////////////////
  const CErc20DelegatorFactory = await ethers.getContractFactory("CErc20Delegator");
  const vcNoteDelegateFactory = await ethers.getContractFactory("VCNote");

  const vcNoteImpl = await vcNoteDelegateFactory.deploy();
  const vcNoteProxy = await CErc20DelegatorFactory.deploy(
    deployed.cNOTE!,
    deployed.comptroller!,
    deployed.model!.CCNoteJumpRateModelV2,
    ethers.utils.parseEther("1"),
    `vcNOTE`,
    `vcNOTE`,
    18,
    deployed.llama?.llamaExecutor!,
    vcNoteImpl.address,
    []
  );

  return {
    vcNote: vcNoteProxy.address
  }
}

export default main;