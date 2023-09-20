import { expect } from "chai";
import { ethers } from "hardhat";
import { MockRWAPriceOracle, RWAPriceOracle, CErc20Delegate } from "../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import mockFixture, { Contracts } from "../_fixture/mockFixture";
import { loadFixture } from "ethereum-waffle";

describe("RWAPriceOracle", function () {
  const zeroAddress = "0x0000000000000000000000000000000000000000";
  let contracts: Contracts;
  let signer: SignerWithAddress;
  let users: SignerWithAddress[];
  let mockRWAPriceOracle: MockRWAPriceOracle;
  let rwaPriceOracle: RWAPriceOracle;
  let cToken: CErc20Delegate;

  before('load fixture', async () => {
    contracts = await loadFixture(mockFixture);
    [signer, ...users] = await ethers.getSigners();

    const MockRWAPriceOracleFactory = await ethers.getContractFactory("MockRWAPriceOracle");
    mockRWAPriceOracle = await MockRWAPriceOracleFactory.deploy(8, 1e12);
  })

  it("deploy", async function () {
    const RWAPriceOracleFactory = await ethers.getContractFactory("RWAPriceOracle");
    rwaPriceOracle = await RWAPriceOracleFactory.deploy();
  });

  it("set oracle error", async function () {
    await expect(rwaPriceOracle.connect(users[0]).setOracle(contracts.cRwa1.address, mockRWAPriceOracle.address))
      .revertedWith("Ownable: caller is not the owner");
  });

  it("set oracle", async function () {
    await rwaPriceOracle.setOracle(contracts.cRwa1.address, mockRWAPriceOracle.address);
    expect(await rwaPriceOracle.getOracle(contracts.cRwa1.address)).eq(mockRWAPriceOracle.address);
  });

  it("get underlying price", async function () {
    const mockDecimals = await mockRWAPriceOracle.mockDecimals();
    const mockPrice = await mockRWAPriceOracle.mockPrice();
    const standardPrecision = ethers.BigNumber.from(10).pow(18);

    const expectedPrice = mockPrice.mul(standardPrecision).div(ethers.BigNumber.from(10).pow(mockDecimals));
    expect(await rwaPriceOracle.getUnderlyingPrice(contracts.cRwa1.address)).eq(expectedPrice);
  });
});
