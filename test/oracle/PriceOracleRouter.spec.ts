import { expect } from "chai";
import { ethers } from "hardhat";
import { MockRWAPriceOracle, RWAPriceOracle, CCNotePriceOracle, PriceOracleRouter } from "../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import mockFixture, { Contracts } from "../_fixture/mockFixture";
import { loadFixture } from "ethereum-waffle";

describe("PriceOracleRouter", function () {
  let contracts: Contracts;
  let signer: SignerWithAddress;
  let users: SignerWithAddress[];
  let mockRWAPriceOracle: MockRWAPriceOracle;
  let ccNotePriceOracle: CCNotePriceOracle;
  let rwaPriceOracle: RWAPriceOracle
  let priceOracleRouter: PriceOracleRouter;

  before('load fixture', async () => {
    contracts = await loadFixture(mockFixture);
    [signer, ...users] = await ethers.getSigners();

    const MockRWAPriceOracleFactory = await ethers.getContractFactory("MockRWAPriceOracle");
    mockRWAPriceOracle = await MockRWAPriceOracleFactory.deploy(8, 2e12);

    const RWAPriceOracleFactory = await ethers.getContractFactory("RWAPriceOracle");
    rwaPriceOracle = await RWAPriceOracleFactory.deploy();
    await rwaPriceOracle.setOracle(contracts.cRwa1.address, mockRWAPriceOracle.address);

    const CCNotePriceOracleFactory = await ethers.getContractFactory("CCNotePriceOracle");
    ccNotePriceOracle = await CCNotePriceOracleFactory.deploy(contracts.cNote.address);
  })

  it("deploy", async function () {
    const PriceOracleRouterFactory = await ethers.getContractFactory("PriceOracleRouter");
    priceOracleRouter = await PriceOracleRouterFactory.deploy();
  });

  it("set oracle error", async function () {
    await expect(priceOracleRouter.connect(users[0]).setOracle(contracts.cRwa1.address, rwaPriceOracle.address))
      .revertedWith("Ownable: caller is not the owner")
  });

  it("set oracle", async function () {
    await priceOracleRouter.setOracle(contracts.cRwa1.address, rwaPriceOracle.address);
    await priceOracleRouter.setOracle(contracts.ccNote.address, ccNotePriceOracle.address);

    expect(await priceOracleRouter.getOracle(contracts.cRwa1.address)).eq(rwaPriceOracle.address);
    expect(await priceOracleRouter.getOracle(contracts.ccNote.address)).eq(ccNotePriceOracle.address);
  });

  it("get underlying price", async function () {
    const mockDecimals = await mockRWAPriceOracle.mockDecimals();
    const mockPrice = await mockRWAPriceOracle.mockPrice();
    const standardPrecision = ethers.BigNumber.from(10).pow(18);

    const expectedPrice = mockPrice.mul(standardPrecision).div(ethers.BigNumber.from(10).pow(mockDecimals));
    expect(await priceOracleRouter.getUnderlyingPrice(contracts.cRwa1.address)).eq(expectedPrice);

    const ccNoteExpectedPrice = ethers.utils.parseEther("1");
    expect(await priceOracleRouter.getUnderlyingPrice(contracts.ccNote.address)).eq(ccNoteExpectedPrice);
    // unregistered token 
    expect(await priceOracleRouter.getUnderlyingPrice(contracts.cNote.address)).eq(0);
  });
});
