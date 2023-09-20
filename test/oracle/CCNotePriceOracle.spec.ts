import { expect } from "chai";
import { ethers } from "hardhat";
import { CCNotePriceOracle } from "../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { mine, time } from "@nomicfoundation/hardhat-network-helpers";
import mockFixture, { Contracts } from "../_fixture/mockFixture";
import { loadFixture } from "ethereum-waffle";

describe("CCNotePriceOracle", function () {
  let contracts: Contracts;
  let signer: SignerWithAddress;
  let users: SignerWithAddress[];
  let ccNotePriceOracle: CCNotePriceOracle;

  before('load fixture', async () => {
    contracts = await loadFixture(mockFixture);
    [signer, ...users] = await ethers.getSigners();
  })

  it("deploy", async function () {
    const CCNotePriceOracleFactory = await ethers.getContractFactory("CCNotePriceOracle");
    ccNotePriceOracle = await CCNotePriceOracleFactory.deploy(contracts.cNote.address);

    expect(await ccNotePriceOracle.cnote()).eq(contracts.cNote.address);
  });

  it("get underlying price error", async function () {
    await expect(ccNotePriceOracle.getUnderlyingPrice(contracts.cRwa1.address)).revertedWith("CCNotePriceOracle: not cnote");
  });

  it("get underlying price", async function () {
    const expectedPrice = ethers.utils.parseEther("1");
    expect(await ccNotePriceOracle.getUnderlyingPrice(contracts.ccNote.address)).eq(expectedPrice);
  });
});
