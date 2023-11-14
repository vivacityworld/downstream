import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { loadFixture, mine } from "@nomicfoundation/hardhat-network-helpers";
import deployFixture, { Contracts } from "../_fixture/deployFixture";
import { MockLendingLedger, VCNote, VCNoteRouter } from "../../typechain";
import setupVCNote from "./_setup";
import { solidityKeccak256, solidityPack } from "ethers/lib/utils";

describe("vcNOTERouter", function () {
  const WEEK = 60 * 60 * 24 * 7;
  let signer: SignerWithAddress;
  let borrower: SignerWithAddress;
  let receiver: SignerWithAddress;
  let noadmin: SignerWithAddress;
  let contracts: Contracts;
  let vcNote: VCNote;
  let vcNoteRouter: VCNoteRouter;
  let lendingLedger: MockLendingLedger;

  before(async () => {
    [signer, borrower, receiver, noadmin] = await ethers.getSigners();
    contracts = await loadFixture(deployFixture);
    vcNote = contracts.vcNote;
    lendingLedger = contracts.lendingLedger;
    vcNoteRouter = contracts.vcNoteRouter;

    await setupVCNote({ signer, borrower, receiver, contracts });

    await contracts.note.approve(vcNoteRouter.address, ethers.constants.MaxUint256);
    await contracts.cNote.approve(vcNoteRouter.address, ethers.constants.MaxUint256);
    await contracts.vcNote.approve(vcNoteRouter.address, ethers.constants.MaxUint256);
  });

  it("setLendingLedger", async function () {
    // ================ action ================
    await vcNote.setLendingLedger(lendingLedger.address);

    // ============== validation ==============
    expect(await vcNote.getLendingLedger()).eq(lendingLedger.address);
  });

  it("mint test", async function () {
    // ================ params ================
    const mintAmount = ethers.utils.parseEther("1000");

    const balanceVCNoteBefore = await vcNote.balanceOf(signer.address);
    const balanceNoteBefore = await contracts.note.balanceOf(signer.address);

    // ================ action ================

    await vcNoteRouter.mint(mintAmount);

    // ============== validation ==============
    const balanceVCNoteAfter = await vcNote.balanceOf(signer.address);
    const balanceNoteAfter = await contracts.note.balanceOf(signer.address);

    expect(balanceNoteBefore.sub(mintAmount)).eq(balanceNoteAfter);
    expect(balanceVCNoteAfter).gt(balanceVCNoteBefore);

    const epoch = await lendingLedger.lendingMarketBalancesEpoch(vcNote.address, signer.address);
    const liquidity = await lendingLedger.lendingMarketBalances(vcNote.address, signer.address, epoch);

    const currentEpoch = Math.floor(Date.now() / 1000 / WEEK) * WEEK;
    const currentLiquidity = await vcNote.callStatic.balanceOfUnderlying(signer.address);

    expect(epoch).eq(currentEpoch);
    expect(liquidity).eq(currentLiquidity);
  })

  it("borrowPermit", async function () {
    // ================ params ================
    const borrowAmount = ethers.utils.parseEther("10");

    const balanceNoteBefore = await contracts.note.balanceOf(signer.address);
    const borrowedBefore = await vcNote.borrowBalanceStored(signer.address);

    const chainId = (await ethers.provider.getNetwork()).chainId;
    const nonce = await contracts.vcNote.getNonce(signer.address);
    const deadline = Math.floor(Date.now() / 1000) + 3600;

    const hash = ethers.utils.arrayify(solidityKeccak256(
      ["uint256", "uint256", "address", "address", "address", "uint256", "uint256"],
      [chainId, nonce, vcNoteRouter.address, signer.address, vcNoteRouter.address, borrowAmount, deadline]
    ));

    const signature = await signer.signMessage(hash);

    // ================ action ================
    await vcNoteRouter.borrow({
      executor: vcNoteRouter.address,
      borrower: signer.address,
      receiver: vcNoteRouter.address,
      borrowAmount: borrowAmount,
      deadline: deadline,
      signature: signature,
    });

    // ============== validation ==============
    const balanceNoteAfter = await contracts.note.balanceOf(signer.address);
    const borrowedAfter = await vcNote.borrowBalanceStored(signer.address);

    expect(balanceNoteAfter).gt(balanceNoteBefore);
    expect(borrowedAfter).gt(borrowedBefore);

  })

  it("redeem test", async function () {
    // ================ params ================
    const redeemAmount = ethers.utils.parseEther("50");

    const balanceVCNoteBefore = await vcNote.balanceOf(signer.address);
    const balanceNoteBefore = await contracts.note.balanceOf(signer.address);

    // ================ action ================
    await mine(100);
    await vcNoteRouter.redeem(redeemAmount);

    const balanceVCNoteAfter = await vcNote.balanceOf(signer.address);
    const balanceNoteAfter = await contracts.note.balanceOf(signer.address);

    expect(balanceNoteBefore.add(redeemAmount)).lt(balanceNoteAfter);
    expect(balanceVCNoteBefore.sub(balanceVCNoteAfter)).eq(redeemAmount);

    // ============== validation ==============
    const epoch = await lendingLedger.lendingMarketBalancesEpoch(vcNote.address, signer.address);
    const liquidity = await lendingLedger.lendingMarketBalances(vcNote.address, signer.address, epoch);
    const currentEpoch = Math.floor(Date.now() / 1000 / WEEK) * WEEK;
    const currentLiquidity = await vcNote.callStatic.balanceOfUnderlying(signer.address);

    // ============== validation ==============
    expect(epoch).eq(currentEpoch);
    expect(liquidity).eq(currentLiquidity);
  })

  it("repay test", async function () {
    // ================ params ================
    const repayAmount = ethers.utils.parseEther("10");

    const balanceNoteBefore = await contracts.note.balanceOf(signer.address);
    const borrowedBefore = await vcNote.borrowBalanceStored(signer.address);

    // ================ action ================
    await mine(100);
    await vcNoteRouter.repayBorrow(repayAmount);

    // ============== validation ==============
    const balanceNoteAfter = await contracts.note.balanceOf(signer.address);
    const borrowedAfter = await vcNote.borrowBalanceStored(signer.address);

    expect(balanceNoteBefore.sub(balanceNoteAfter)).eq(repayAmount);
    expect(borrowedAfter).lt(borrowedBefore);

  })
});
