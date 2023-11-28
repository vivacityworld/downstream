import { ethers } from "hardhat";
import { DeployLocal } from "../../types/deploy";
import { deploy } from "../helper";

async function main({ deployed }: { deployed: DeployLocal }) {

  ////////////////////////////////
  //       DEPLOY VCNOTE        //
  ////////////////////////////////

  const SPCT = "0x4fb69A7a1037C49452E0704F3EA333A337996789";
  const wSPCTAddr = "0x5609402de47B5E043a15D23351F9D02652643863";
  const wSPCT = await ethers.getContractAt("ERC20", wSPCTAddr);

  const cRWAImpl = await deploy("CRWAToken", []);
  const cRWAProxy = await deploy("CErc20Delegator", [
    wSPCTAddr,
    deployed.comptroller!,
    deployed.model!.VCNoteJumpRateModelV2,
    ethers.utils.parseEther("1"),
    `cSPCT`,
    `cSPCT`,
    18,
    deployed.llama?.llamaExecutor!,
    cRWAImpl.address,
    []
  ]);
  const priceOracleRouter = await deploy("SPCTPriceOracleRouter", []);
  const whitelistRouter = await deploy("SPCTWhitelistRouter", [])

  await priceOracleRouter.transferOwnership(deployed.llama?.llamaExecutor!);
  await whitelistRouter.transferOwnership(deployed.llama?.llamaExecutor!);

  return {
    // SPCT: wSPCT,
    // cSPCT: cRWAProxy.address,
    // SPCTOracleRouter: oracleRouter.address,
    // SPCTWhitelistRouter: whitelistRouter.address,
  }
}

export default main;