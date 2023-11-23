import { expect } from "chai";
import { ethers } from "hardhat";
import { VCNotePriceOracle, PriceOracleRouter, VCNote, CErc20Delegate } from "../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import deployFixture, { Contracts } from "../_fixture/deployFixture";
import { loadFixture } from "ethereum-waffle";

describe("PriceOracleRouter", function () {
  let contracts: Contracts;
  let signer: SignerWithAddress;
  let users: SignerWithAddress[];
  let cNote: CErc20Delegate
  let vcNote: VCNote;
  let vcNotePriceOracle: VCNotePriceOracle;
  let priceOracleRouter: PriceOracleRouter;

  before('load fixture', async () => {
    [signer, ...users] = await ethers.getSigners();
    contracts = await loadFixture(deployFixture);
    cNote = contracts.cNote;
    vcNote = contracts.vcNote;
    vcNotePriceOracle = contracts.vcNotePriceOracle;
    priceOracleRouter = contracts.priceOracleRouter;
  })

  it("[error] setOracle", async function () {
    // ========== action & validation =========
    await expect(priceOracleRouter.connect(users[0]).setOracle(vcNote.address, vcNotePriceOracle.address))
      .revertedWith("OwnableUnauthorizedAccount")
  });

  it("setOracle", async function () {
    // ================ action ================
    await priceOracleRouter.setOracle(vcNote.address, vcNotePriceOracle.address);

    // ============== validation ==============
    expect(await priceOracleRouter.getOracle(vcNote.address)).eq(vcNotePriceOracle.address);
  });

  it("getUnderlyingPrice", async function () {
    // ================ action ================
    const price = await priceOracleRouter.getUnderlyingPrice(vcNote.address);

    // ============== validation ==============
    expect(price).eq(await cNote.exchangeRateStored());
  });
});
