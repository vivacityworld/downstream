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
  //       DEPLOY CCNOTE        //
  ////////////////////////////////
  const CErc20DelegatorFactory = await ethers.getContractFactory("CErc20Delegator");
  const ccNoteDelegateFactory = await ethers.getContractFactory("CCNote");

  const ccNoteImpl = await ccNoteDelegateFactory.deploy();
  const ccNoteProxy = await CErc20DelegatorFactory.deploy(
    deployed.CNOTE!,
    deployed.comptroller!,
    deployed.model!.CCNoteJumpRateModelV2,
    ethers.utils.parseEther("1"),
    `ccNote`,
    `ccNote`,
    18,
    deployed.llama?.llamaExecutor!,
    ccNoteImpl.address,
    []
  );

  return {
    ccNote: ccNoteProxy.address
  }
}

export default main;