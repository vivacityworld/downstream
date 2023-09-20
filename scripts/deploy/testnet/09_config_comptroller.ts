// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";

async function main({ address }: { address: Record<string, any> }) {

  const comptroller = await ethers.getContractAt("Comptroller", address.Unitroller);

  await comptroller._supportMarket(address.crwa.cRWA1.proxy);
  await comptroller._supportMarket(address.crwa.cRWA2.proxy);
  await comptroller._supportMarket(address.crwa.cRWA3.proxy);
  await comptroller._supportMarket(address.ctoken.cNote.proxy);
  await comptroller._supportMarket(address.ctoken.ccNote.proxy);

  await comptroller._setPriceOracle(address.PriceOracleRouter);

  await comptroller._setCollateralFactor(address.crwa.cRWA1.proxy, ethers.BigNumber.from(10).pow(17).mul(5));
  // await comptroller._setCollateralFactor(address.markets.cRWA2.proxy, ethers.BigNumber.from(10).pow(17).mul(5));
  // await comptroller._setCollateralFactor(address.markets.cRWA3.proxy, ethers.BigNumber.from(10).pow(17).mul(5));
  // await comptroller._setCollateralFactor(address.markets.cNote.proxy, ethers.BigNumber.from(10).pow(17).mul(5));
}

export default main;