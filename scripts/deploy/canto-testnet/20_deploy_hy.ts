import { ethers } from "hardhat";
import { DeployLocal } from "../../types/deploy";
import { deploy } from "../helper";
import { PriceOracleRouter } from "../../../typechain";

async function main({ deployed }: { deployed: DeployLocal }) {

  ////////////////////////////////
  //       DEPLOY VCNOTE        //
  ////////////////////////////////

  const compliance = "0x5544D84EAFC977a7eF00852B65B30f877A3eb338";
  const hyVWEAX = "0x97aD76f823ACc6BF171e314e3B51733661Abea43";

  const cRWAImpl = await deploy("CRWAToken", []);
  const cRWAProxy = await deploy("CErc20Delegator", [
    hyVWEAX,
    deployed.comptroller,
    deployed.model!.VCNoteJumpRateModelV2,
    ethers.utils.parseEther("1"),
    `cHyVWEAX`,
    `cHyVWEAX`,
    18,
    deployed.llama?.llamaExecutor,
    cRWAImpl.address,
    []
  ]);
  const priceOracleRouter = await deploy("HYPriceOracleRouter", []);
  const whitelistRouter = await deploy("HYWhitelistRouter", []);

  let tx = await priceOracleRouter.transferOwnership(deployed.llama!.llamaExecutor);
  await tx.wait();

  tx = await whitelistRouter.transferOwnership(deployed.llama!.llamaExecutor);
  await tx.wait();

  console.log(await (priceOracleRouter as PriceOracleRouter).owner())
  console.log(await (whitelistRouter as PriceOracleRouter).owner())

  return {
    // SPCT: wSPCT,
    // cSPCT: cRWAProxy.address,
    // SPCTOracleRouter: oracleRouter.address,
    // SPCTWhitelistRouter: whitelistRouter.address,
  }
}

export default main;