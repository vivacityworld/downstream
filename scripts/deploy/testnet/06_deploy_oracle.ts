// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";

async function main({ address }: { address: Record<string, any> }) {
  const RWAPriceOracleFactory = await ethers.getContractFactory("RWAPriceOracle");
  const rwaPriceOracle = await RWAPriceOracleFactory.deploy();

  const CCNotePriceOracleFactory = await ethers.getContractFactory("CCNotePriceOracle");
  const ccNotePriceOracle = await CCNotePriceOracleFactory.deploy(address.ctoken.cNote.proxy);

  const PriceOracleRouterFactory = await ethers.getContractFactory("PriceOracleRouter");
  const priceOracleRouter = await PriceOracleRouterFactory.deploy();

  return {
    RwaPriceOracle: rwaPriceOracle.address,
    CCNotePriceOracle: ccNotePriceOracle.address,
    PriceOracleRouter: priceOracleRouter.address
  }
}

export default main;