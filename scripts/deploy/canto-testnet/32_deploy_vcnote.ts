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
  // const vcNoteProxy = await deploy("CErc20Delegator", [
  //   "0x04E52476d318CdF739C38BD41A922787D441900c",
  //   "0xFf64a8Ab86b0B56c2487DB9EBF630B8863a66620",
  //   "0xC358Ffc2cef6bf77D9bBdEF3cB4769592134CFce",
  //   ethers.utils.parseEther("1"),
  //   `Vivacity Collateralized NOTE`,
  //   `vcNOTE`,
  //   18,
  //   "0x26eaf0FC0eFfF7f0246ecE3D9c80b4011d9B5D69",
  //   vcNoteImpl.address,
  //   []
  // ])


  ////////////////////////////////
  //    DEPLOY VCNOTERouter     //
  ////////////////////////////////
  // const vcNoteRouter = await deploy("VCNoteRouter", [deployed.NOTE, deployed.cNOTE, vcNoteProxy.address]);

  return {
    // vcNote: vcNoteProxy.address,
    // vcNote_impl: vcNoteImpl.address,
    // vcNoteRouter: vcNoteRouter.address,
  }
}

export default main;