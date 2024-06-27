import { ethers } from "hardhat";
import { DeployLocal } from "../../types/deploy";
import { deploy } from "../helper";
import { setBalance } from "@nomicfoundation/hardhat-network-helpers";
import { DataServiceWrapper } from "@redstone-finance/evm-connector";
import { increaseTo } from "@nomicfoundation/hardhat-network-helpers/dist/src/helpers/time";

async function main({ deployed }: { deployed: DeployLocal }) {

  const [signer] = await ethers.getSigners();

  //////////////////////////////////////////
  //       DEPLOY UPGRADE CONTRACT        //
  //////////////////////////////////////////

  const CRWATokenImpl = await deploy("CRWAToken", []);
  const vcNOTEImpl = await deploy("VCNote", []);

  const ETH = "0x5FD55A1B9FC24967C4dB09C513C3BA0DFa7FF687";
  const ATOM = "0xecEEEfCEE421D8062EF8d6b4D814efe4dc898265";
  const WCANTO = "0x826551890Dc65655a0Aceca109aB11AbDbD7a07B";

  const redstoneOracle = await deploy("RedstoneOracle", []);

  await redstoneOracle.setAssetInfo(ethers.utils.formatBytes32String("ETH"), ETH, 18);
  await redstoneOracle.setAssetInfo(ethers.utils.formatBytes32String("ATOM"), ATOM, 6);
  await redstoneOracle.setAssetInfo(ethers.utils.formatBytes32String("CANTO"), WCANTO, 18);

  const crypto: any = {};

  {
    console.log("ETH >");
    const cErc20Impl = await deploy("CErc20Delegate", []);
    const cErc20Proxy = await deploy("CErc20Delegator", [
      ETH,
      deployed.comptroller,
      deployed.model!.VCNoteJumpRateModelV2,
      ethers.utils.parseEther("1"),
      `Vivacity Collateralized ETH`,
      `vcETH`,
      18,
      deployed.llama?.llamaExecutor,
      cErc20Impl.address,
      []
    ]);
    crypto["vcETH"] = cErc20Proxy.address;
    crypto["vcETH_Impl"] = cErc20Impl.address;
  }

  {
    console.log("ATOM >");
    const cErc20Impl = await deploy("CErc20Delegate", []);
    const cErc20Proxy = await deploy("CErc20Delegator", [
      ATOM,
      deployed.comptroller,
      deployed.model!.VCNoteJumpRateModelV2,
      ethers.utils.parseEther("1"),
      `Vivacity Collateralized ATOM`,
      `vcATOM`,
      6,
      deployed.llama?.llamaExecutor,
      cErc20Impl.address,
      []
    ]);
    crypto["vcATOM"] = cErc20Proxy.address;
    crypto["vcATOM_Impl"] = cErc20Impl.address;
  }

  {
    console.log("WCANTO >");
    const cErc20Impl = await deploy("CErc20Delegate", []);
    const cErc20Proxy = await deploy("CErc20Delegator", [
      WCANTO,
      deployed.comptroller,
      deployed.model!.VCNoteJumpRateModelV2,
      ethers.utils.parseEther("1"),
      `Vivacity Collateralized WCANTO`,
      `vcCANTO`,
      18,
      deployed.llama?.llamaExecutor,
      cErc20Impl.address,
      []
    ]);
    crypto["vcCANTO"] = cErc20Proxy.address;
    crypto["vcCANTO_Impl"] = cErc20Impl.address;
  }

  await redstoneOracle.transferOwnership(deployed.llama!.llamaExecutor);

  return {
    vcNote_impl: vcNOTEImpl.address,
    oracle: {
      ...deployed.oracle,
      redstoneOracle: redstoneOracle.address
    },
    crypto: crypto
  }
}

export default main;