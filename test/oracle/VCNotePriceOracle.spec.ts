import { expect } from "chai";
import { ethers } from "hardhat";
import { CErc20Delegate, CToken, VCNote, VCNotePriceOracle } from "../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { mine, time } from "@nomicfoundation/hardhat-network-helpers";
import deployFixture, { Contracts } from "../_fixture/deployFixture";
import { Fixture, loadFixture } from "ethereum-waffle";

describe("VCNotePriceOracle", function () {
  let contracts: Contracts;
  let signer: SignerWithAddress;
  let users: SignerWithAddress[];
  let vcNote: VCNote;
  let cNote: CErc20Delegate;
  let vcNotePriceOracle: VCNotePriceOracle;

  before(async () => {
    [signer, ...users] = await ethers.getSigners();
    contracts = await loadFixture(deployFixture);
    vcNotePriceOracle = contracts.vcNotePriceOracle;
    vcNote = contracts.vcNote;
    cNote = contracts.cNote;
  })

  it("[error] getUnderlyingPrice", async function () {
    // ========== action & validation =========
    await expect(vcNotePriceOracle.getUnderlyingPrice(contracts.cOF.address))
      .revertedWith("VCNotePriceOracle: not note");
  });

  it("getUnderlyingPrice", async function () {
    // ================ action ================
    const price = await vcNotePriceOracle.getUnderlyingPrice(vcNote.address);

    // ============== validation ==============
    expect(price).eq(ethers.utils.parseEther("1"));
  });
});
