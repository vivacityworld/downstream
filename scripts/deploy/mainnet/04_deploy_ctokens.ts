// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import MARKETS from "./config/markets.json";

async function main({ address }: { address: Record<string, any> }) {
  const [signer] = await ethers.getSigners();
  const _address: Record<string, Record<string, string>> = {};

  const CErc20DelegateFactory = await ethers.getContractFactory('CErc20Delegate');
  const CErc20DelegatorFactory = await ethers.getContractFactory("CErc20Delegator");

  for (const market of MARKETS) {
    const cTokenImpl = await CErc20DelegateFactory.deploy();

    const MockERC20Factory = await ethers.getContractFactory('MockERC20');
    const mockToken = await MockERC20Factory.deploy("RWA1", "RWA1");

    const cTokenProxy = await CErc20DelegatorFactory.deploy(
      mockToken.address, // market.address
      address.Unitroller,
      address.interestRateModel[market.interestRateModel],
      market.initialExchangeRateMantissa,
      market.name,
      market.symbol,
      market.decimals,
      market.admin,
      cTokenImpl.address,
      []
    );
    _address[market.name] = {
      proxy: cTokenProxy.address,
      impl: cTokenImpl.address
    }
  }
  return { markets: _address }
}

export default main;