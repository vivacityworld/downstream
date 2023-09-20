// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import ORACLE from "./config/oracle.json";

async function main({ address }: { address: Record<string, any> }) {
  const [signer] = await ethers.getSigners();
  const _address: Record<string, Record<string, string>> = {};

  const MockERC20Factory = await ethers.getContractFactory('MockERC20');
  const mockToken = await MockERC20Factory.deploy("RWA1", "RWA1");

  const RWAPriceOracleFactory = await ethers.getContractFactory("RWAPriceOracle");
  const rwaPriceOracle = await RWAPriceOracleFactory.deploy();

  const CCNotePriceOracleFactory = await ethers.getContractFactory("CCNotePriceOracle");
  const ccNotePriceOracle = await CCNotePriceOracleFactory.deploy(mockToken.address);

  const PriceOracleRouterFactory = await ethers.getContractFactory("PriceOracleRouter");
  const priceOracleRouter = await PriceOracleRouterFactory.deploy();

  return {
    RwaPriceOracle: rwaPriceOracle.address,
    CCNotePriceOracle: ccNotePriceOracle.address,
    PriceOracleRouter: priceOracleRouter.address
  }
}

export default main;