import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { loadFixture, mine } from "@nomicfoundation/hardhat-network-helpers";
import deployFixture, { Contracts } from "../_fixture/deployFixture";
import { MockLendingLedger, VCNote } from "../../typechain";
import setupVCNote from "./_setup";


describe("vcNOTE", function () {
  const WEEK = 60 * 60 * 24 * 7;
  let signer: SignerWithAddress;
  let borrower: SignerWithAddress;
  let receiver: SignerWithAddress;
  let noadmin: SignerWithAddress;
  let contracts: Contracts;
  let vcNote: VCNote;
  let lendingLedger: MockLendingLedger;

  before(async () => {
    [signer, borrower, receiver, noadmin] = await ethers.getSigners();
    contracts = await loadFixture(deployFixture);
    vcNote = contracts.vcNote;
    lendingLedger = contracts.lendingLedger;

    await setupVCNote({ signer, borrower, receiver, contracts });
  });

  it("[error] setLendingLedger", async function () {
    // ========== action & validation =========
    await expect(vcNote.connect(noadmin).setLendingLedger(lendingLedger.address))
      .revertedWith("VCNote::setLendingLedger: only admin can set lendingLedger")
  });

  it("setLendingLedger", async function () {
    // ================ action ================
    await vcNote.setLendingLedger(lendingLedger.address);

    // ============== validation ==============
    expect(await vcNote.lendingLedger()).eq(lendingLedger.address);
  });

  it("[error] assignForCSR", async function () {
    // ========== action & validation =========
    await expect(vcNote.connect(noadmin).assignForCSR(contracts.turnstile.address, 1))
      .revertedWith("VCNote::assignForCSR: only admin")
  });

  it("assignForCSR", async function () {
    // ================ params ================
    const nftId = 1;

    // ================ action ================
    await vcNote.assignForCSR(contracts.turnstile.address, nftId);

    // ============== validation ==============
    const nftData = await contracts.turnstile.feeRecipient(vcNote.address);
    expect(nftData.registered).eq(true);
    expect(nftData.tokenId).eq(nftId);
  });

  it("check lendingLedger if first", async function () {
    // ================ params ================
    const epoch = await lendingLedger.lendingMarketBalancesEpoch(vcNote.address, signer.address);
    const liquidity = await lendingLedger.lendingMarketBalances(vcNote.address, signer.address, epoch);

    // ============== validation ==============
    expect(epoch).eq(0);
    expect(liquidity).eq(0);
  });

  it("mint test", async function () {
    // ================ params ================
    const mintAmount = ethers.utils.parseEther("1000");

    // ================ action ================
    await vcNote.mint(mintAmount);

    // ============== validation ==============
    const epoch = await lendingLedger.lendingMarketBalancesEpoch(vcNote.address, signer.address);
    const liquidity = await lendingLedger.lendingMarketBalances(vcNote.address, signer.address, epoch);

    const currentEpoch = Math.floor(Date.now() / 1000 / WEEK) * WEEK;
    const currentLiquidity = await vcNote.callStatic.balanceOfUnderlying(signer.address);


    expect(epoch).eq(currentEpoch);
    expect(liquidity).eq(currentLiquidity);
  })

  it("redeem test", async function () {
    // ================ params ================
    const redeemAmount = ethers.utils.parseEther("500");

    // ================ action ================
    await mine(100);
    await vcNote.redeem(redeemAmount);

    // ============== validation ==============
    const epoch = await lendingLedger.lendingMarketBalancesEpoch(vcNote.address, signer.address);
    const liquidity = await lendingLedger.lendingMarketBalances(vcNote.address, signer.address, epoch);
    const currentEpoch = Math.floor(Date.now() / 1000 / WEEK) * WEEK;
    const currentLiquidity = await vcNote.callStatic.balanceOfUnderlying(signer.address);

    // ============== validation ==============
    expect(epoch).eq(currentEpoch);
    expect(liquidity).eq(currentLiquidity);
  })

  it("redeemUnderlying test", async function () {
    // ================ params ================
    const redeemUnderlyingAmount = ethers.utils.parseEther("100");

    // ================ action ================
    await mine(100);
    await vcNote.redeemUnderlying(redeemUnderlyingAmount);

    // ============== validation ==============
    const epoch = await lendingLedger.lendingMarketBalancesEpoch(vcNote.address, signer.address);
    const liquidity = await lendingLedger.lendingMarketBalances(vcNote.address, signer.address, epoch);
    const currentEpoch = Math.floor(Date.now() / 1000 / WEEK) * WEEK;
    const currentLiquidity = await vcNote.callStatic.balanceOfUnderlying(signer.address);

    expect(epoch).eq(currentEpoch);
    expect(liquidity).eq(currentLiquidity);
  })

  it("transferTokens test", async function () {
    // ================ action ================
    await mine(100);

    const transferTokenAmount = ethers.utils.parseEther("100");
    await vcNote.transfer(receiver.address, transferTokenAmount);

    // ============== validation ==============
    // sender
    const epoch = await lendingLedger.lendingMarketBalancesEpoch(vcNote.address, signer.address);
    const liquidity = await lendingLedger.lendingMarketBalances(vcNote.address, signer.address, epoch);
    const currentEpoch = Math.floor(Date.now() / 1000 / WEEK) * WEEK;
    const currentLiquidity = await vcNote.callStatic.balanceOfUnderlying(signer.address);

    expect(epoch).eq(currentEpoch);
    expect(liquidity).eq(currentLiquidity);

    // receiver
    const receiverEpoch = await lendingLedger.lendingMarketBalancesEpoch(vcNote.address, receiver.address);
    const receiverLiquidity = await lendingLedger.lendingMarketBalances(vcNote.address, receiver.address, epoch);
    const receiverCurrentEpoch = Math.floor(Date.now() / 1000 / WEEK) * WEEK;
    const receiverCurrentLiquidity = await vcNote.callStatic.balanceOfUnderlying(receiver.address);

    expect(receiverEpoch).eq(receiverCurrentEpoch);
    expect(receiverLiquidity).eq(receiverCurrentLiquidity);
  })

  it("seize test", async function () {
    // ================ action ================
    await mine(100);
    const liquidateTokenAmount = ethers.utils.parseEther("100");
    await vcNote.liquidateBorrow(borrower.address, liquidateTokenAmount, vcNote.address);


    // ============== validation ==============
    // liquidator
    const epoch = await lendingLedger.lendingMarketBalancesEpoch(vcNote.address, signer.address);
    const liquidity = await lendingLedger.lendingMarketBalances(vcNote.address, signer.address, epoch);

    const currentEpoch = Math.floor(Date.now() / 1000 / WEEK) * WEEK;
    const currentLiquidity = await vcNote.callStatic.balanceOfUnderlying(signer.address);

    expect(epoch).eq(currentEpoch);
    expect(liquidity).eq(currentLiquidity);

    // borrower
    const receiverEpoch = await lendingLedger.lendingMarketBalancesEpoch(vcNote.address, borrower.address);
    const receiverLiquidity = await lendingLedger.lendingMarketBalances(vcNote.address, borrower.address, epoch);

    const receiverCurrentEpoch = Math.floor(Date.now() / 1000 / WEEK) * WEEK;
    const receiverCurrentLiquidity = await vcNote.callStatic.balanceOfUnderlying(borrower.address);

    expect(receiverEpoch).eq(receiverCurrentEpoch);
    expect(receiverLiquidity).eq(receiverCurrentLiquidity);
  })

  it("syncLendingLedger test", async function () {
    // ================ action ================
    await mine(100);
    await vcNote.syncLendingLedger(signer.address);

    // ============== validation ==============
    const calcEpoch = Math.floor(Date.now() / 1000 / WEEK) * WEEK;
    const calcLiquidity = await vcNote.callStatic.balanceOfUnderlying(signer.address);

    const epoch = await lendingLedger.lendingMarketBalancesEpoch(vcNote.address, signer.address);
    const liquidity = await lendingLedger.lendingMarketBalances(vcNote.address, signer.address, epoch);

    expect(calcEpoch).eq(epoch);
    expect(calcLiquidity).eq(liquidity);
  })
});
