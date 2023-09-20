// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";

async function main({ address }: { address: Record<string, any> }) {

  const priceOracleRouter = await ethers.getContractAt("PriceOracleRouter", address.PriceOracleRouter);
  const rwaPriceOracle = await ethers.getContractAt("RWAPriceOracle", address.RwaPriceOracle);
  const ccNotePriceOracle = await ethers.getContractAt("CCNotePriceOracle", address.CCNotePriceOracle);

  await priceOracleRouter.setOracle(address.crwa.cRWA1.proxy, address.RwaPriceOracle);

  const MockRWAPriceOracleFactory = await ethers.getContractFactory("MockRWAPriceOracle");
  const mockRWAPriceOracle = await MockRWAPriceOracleFactory.deploy(8, 1e12);

  await rwaPriceOracle.setOracle(address.crwa.cRWA1.proxy, mockRWAPriceOracle.address);
  await priceOracleRouter.setOracle(address.ctoken.ccNote.proxy, ccNotePriceOracle.address);
}

export default main;