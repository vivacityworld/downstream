import { ethers } from "hardhat";
import { DeployLocal } from "../../types/deploy";
import { deploy } from "../helper";
import { PriceOracleRouter } from "../../../typechain";

async function main({ deployed }: { deployed: DeployLocal }) {

  ////////////////////////////////
  //       DEPLOY VCNOTE        //
  ////////////////////////////////

  // const compliance = "0x5544D84EAFC977a7eF00852B65B30f877A3eb338";
  const hyVWEAX = "0x0E4289a95207CA653b60B0eB0b5848f29F4C3f72";

  const cRWAImpl = await deploy("CRWAToken", []);
  const cRWAProxy = await deploy("CErc20Delegator", [
    hyVWEAX,
    deployed.comptroller,
    deployed.model!.VCNoteJumpRateModelV2,
    ethers.utils.parseEther("1"),
    `Vivacity Collateralized hyVWEAX`,
    `chyVWEAX`,
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

  return {
    hyVWEAX: {
      hyVWEAX: hyVWEAX,
      chyVWEAX: cRWAProxy.address,
      hyPriceOracleRouter: priceOracleRouter.address,
      hyWhitelistRouter: whitelistRouter.address,
    }
  }
}

export default main;