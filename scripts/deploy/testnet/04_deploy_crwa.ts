// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";
import MARKETS from "./config/markets.json";

async function main({ address }: { address: Record<string, any> }) {
  const [signer] = await ethers.getSigners();
  const _address: Record<string, any> = {};

  const cRWADelegateFactory = await ethers.getContractFactory("CRWAToken");
  const cRWADelegatorFactory = await ethers.getContractFactory("CErc20Delegator");

  for (const market of MARKETS) {
    const MockERC20Factory = await ethers.getContractFactory('MockERC20');
    const mockToken = await MockERC20Factory.deploy(`u${market.name}`, `u${market.symbol}`);

    // const cRWAFactory = await ethers.getContractFactory("CRWAToken");
    // const cRWAProxy = await cRWAFactory.deploy();

    const cRWAImpl = await cRWADelegateFactory.deploy();
    const cRWAProxy = await cRWADelegatorFactory.deploy(
      mockToken.address, // market.address
      address.Unitroller,
      address.interestRateModel.DefaultJumpRateModelV2,
      ethers.utils.parseEther("1"),
      "cNote",
      "cNote",
      18,
      signer.address,
      cRWAImpl.address,
      []
    );

    _address[market.name] = {
      proxy: cRWAProxy.address,
      impl: cRWAImpl.address
    };
  }

  return { crwa: _address }
}

export default main;