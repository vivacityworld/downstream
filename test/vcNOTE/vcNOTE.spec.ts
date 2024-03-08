import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { loadFixture, mine } from "@nomicfoundation/hardhat-network-helpers";
import deployFixture, { Contracts } from "../_fixture/deployFixture";
import { MockLendingLedgerV2, VCNote, VivaPoint } from "../../typechain";
import setupVCNote from "./_setup";


describe("vcNOTE", function () {
  const WEEK = 60 * 60 * 24 * 7;
  let signer: SignerWithAddress;
  let borrower: SignerWithAddress;
  let receiver: SignerWithAddress;
  let noadmin: SignerWithAddress;
  let contracts: Contracts;
  let vcNote: VCNote;
  let lendingLedger: MockLendingLedgerV2;
  let vivaPoint: VivaPoint;

  before(async () => {
    [signer, borrower, receiver, noadmin] = await ethers.getSigners();
    contracts = await loadFixture(deployFixture);
    vcNote = contracts.vcNote;
    lendingLedger = contracts.lendingLedger;
    vivaPoint = contracts.vivaPoint;
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
    expect(await vcNote.getLendingLedger()).eq(lendingLedger.address);
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
    const lendingLedgerUserInfo = await lendingLedger.userInfo(vcNote.address, signer.address);
    const vivaPointUserInfo = await vivaPoint.userInfos(signer.address);

    // ============== validation ==============
    expect(lendingLedgerUserInfo.amount).eq(0);
    expect(vivaPointUserInfo.amount).eq(0);
  });

  it("mint test", async function () {
    // ================ params ================
    const mintAmount = ethers.utils.parseEther("1000");

    const balanceVCNoteBefore = await vcNote.balanceOf(signer.address);
    const balanceNoteBefore = await contracts.note.balanceOf(signer.address);

    const balanceCNoteBeforeViva = await contracts.cNote.balanceOf(contracts.vcNote.address);
    const balanceNoteBeforeViva = await contracts.note.balanceOf(contracts.vcNote.address);

    // ================ action ================
    await vcNote.mint(mintAmount);

    // ============== validation ==============
    const lendingLedgerUserInfo = await lendingLedger.userInfo(vcNote.address, signer.address);
    const vivaPointUserInfo = await vivaPoint.userInfos(signer.address);

    const currentLiquidity = await vcNote.callStatic.balanceOfUnderlying(signer.address);

    expect(lendingLedgerUserInfo.amount).eq(currentLiquidity);
    expect(vivaPointUserInfo.amount).eq(currentLiquidity);

    const balanceVCNoteAfter = await vcNote.balanceOf(signer.address);
    const balanceNoteAfter = await contracts.note.balanceOf(signer.address);

    const balanceCNoteAfterViva = await contracts.cNote.balanceOf(contracts.vcNote.address);
    const balanceNoteAfterViva = await contracts.note.balanceOf(contracts.vcNote.address);

    expect(balanceNoteBefore.sub(mintAmount)).eq(balanceNoteAfter);
    expect(balanceVCNoteAfter).gt(balanceVCNoteBefore);

    expect(balanceNoteBeforeViva).eq(0);
    expect(balanceNoteAfterViva).eq(0);

    expect(balanceCNoteAfterViva).gt(balanceCNoteBeforeViva);
  })


  it("borrow receiver", async function () {
    const balanceOfSignerBefore = await contracts.note.balanceOf(signer.address);
    const balanceOfReceiverBefore = await contracts.note.balanceOf(receiver.address);
    const borrowedSignerBefore = await vcNote.borrowBalanceStored(signer.address);
    const borrowedReceiverBefore = await vcNote.borrowBalanceStored(receiver.address);

    const balanceCNoteBeforeViva = await contracts.cNote.balanceOf(contracts.vcNote.address);

    expect(await contracts.note.balanceOf(contracts.vcNote.address)).eq(0);

    // ================ params ================
    const borrowAmount = ethers.utils.parseEther("10");

    // ================ action ================
    await vcNote["borrow(uint256,address)"](borrowAmount, receiver.address);

    // ============== validation ==============
    const balanceOfSignerAfter = await contracts.note.balanceOf(signer.address);
    const balanceOfReceiverAfter = await contracts.note.balanceOf(receiver.address);
    const borrowedSignerAfter = await vcNote.borrowBalanceStored(signer.address);
    const borrowedReceiverAfter = await vcNote.borrowBalanceStored(receiver.address);

    const balanceCNoteAfterViva = await contracts.cNote.balanceOf(contracts.vcNote.address);

    expect(balanceOfSignerBefore).eq(balanceOfSignerAfter);
    expect(borrowedSignerAfter.sub(borrowedSignerBefore)).eq(borrowAmount);

    expect(balanceOfReceiverAfter.sub(balanceOfReceiverBefore)).eq(borrowAmount);
    expect(borrowedReceiverBefore).eq(borrowedReceiverAfter);

    expect(balanceCNoteAfterViva).lt(balanceCNoteBeforeViva);

    expect(await contracts.note.balanceOf(contracts.vcNote.address)).eq(0);
  })

  it("borrowPermit", async function () {
    // ================ params ================
    const borrowAmount = ethers.utils.parseEther("1");

    expect(await contracts.note.balanceOf(contracts.vcNote.address)).eq(0);

    const balanceOfSignerBefore = await contracts.note.balanceOf(signer.address);
    const balanceOfReceiverBefore = await contracts.note.balanceOf(receiver.address);
    const borrowedSignerBefore = await vcNote.borrowBalanceStored(signer.address);
    const borrowedReceiverBefore = await vcNote.borrowBalanceStored(receiver.address);

    const balanceCNoteBeforeViva = await contracts.cNote.balanceOf(contracts.vcNote.address);

    expect(await contracts.note.balanceOf(contracts.vcNote.address)).eq(0);

    const chainId = (await ethers.provider.getNetwork()).chainId;
    const nonce = await contracts.vcNote.getNonce(signer.address);
    const deadline = Math.floor(Date.now() / 1000) + 3600;

    const domain = {
      name: "Vivacity Borrow Permit",
      version: "1",
      chainId: chainId,
      verifyingContract: contracts.vcNote.address,
    };

    const types = {
      "Vivacity Borrow Permit": [
        { name: "executor", type: "address" },
        { name: "borrower", type: "address" },
        { name: "borrowCNote", type: "uint256" },
        { name: "deadline", type: "uint256" },
        { name: "nonce", type: "uint256" },
      ],
    };

    const signature = await signer._signTypedData(
      domain,
      types,
      {
        executor: receiver.address,
        borrower: signer.address,
        borrowCNote: borrowAmount,
        deadline: deadline,
        nonce: nonce,
      });

    // ================ action ================
    await vcNote.connect(receiver).borrowPermit({
      executor: receiver.address,
      borrower: signer.address,
      borrowCNote: borrowAmount,
      deadline: deadline,
      signature: signature,
    });

    // ============== validation ==============
    const balanceOfSignerAfter = await contracts.note.balanceOf(signer.address);
    const balanceOfReceiverAfter = await contracts.note.balanceOf(receiver.address);
    const borrowedSignerAfter = await vcNote.borrowBalanceStored(signer.address);
    const borrowedReceiverAfter = await vcNote.borrowBalanceStored(receiver.address);

    const balanceCNoteAfterViva = await contracts.cNote.balanceOf(contracts.vcNote.address);
    expect(balanceCNoteAfterViva).lt(balanceCNoteBeforeViva);

    expect(balanceOfSignerBefore).eq(balanceOfSignerAfter);
    expect(borrowedSignerBefore.add(borrowAmount)).lt(borrowedSignerAfter);
    expect(balanceOfReceiverBefore.add(borrowAmount)).eq(balanceOfReceiverAfter);
    expect(borrowedReceiverBefore).eq(borrowedReceiverAfter);


    expect(await contracts.note.balanceOf(contracts.vcNote.address)).eq(0);
  })

  it("redeem test", async function () {
    expect(await contracts.note.balanceOf(contracts.vcNote.address)).eq(0);
    // ================ params ================
    const balanceVCNoteBefore = await vcNote.balanceOf(signer.address);
    const balanceNoteBefore = await contracts.note.balanceOf(signer.address);

    const balanceCNoteBeforeViva = await contracts.cNote.balanceOf(contracts.vcNote.address);
    const balanceNoteBeforeViva = await contracts.note.balanceOf(contracts.vcNote.address);

    const redeemAmount = ethers.utils.parseEther("500");

    // ================ action ================
    await mine(100);
    await vcNote.redeem(redeemAmount);

    // ============== validation ==============
    const lendingLedgerUserInfo = await lendingLedger.userInfo(vcNote.address, signer.address);
    const vivaPointUserInfo = await vivaPoint.userInfos(signer.address);
    const currentLiquidity = await vcNote.callStatic.balanceOfUnderlying(signer.address);

    // ============== validation ==============
    expect(lendingLedgerUserInfo.amount).eq(currentLiquidity);
    expect(vivaPointUserInfo.amount).eq(currentLiquidity);
    expect(await contracts.note.balanceOf(contracts.vcNote.address)).eq(0);


    const balanceVCNoteAfter = await vcNote.balanceOf(signer.address);
    const balanceNoteAfter = await contracts.note.balanceOf(signer.address);

    const balanceCNoteAfterViva = await contracts.cNote.balanceOf(contracts.vcNote.address);
    const balanceNoteAfterViva = await contracts.note.balanceOf(contracts.vcNote.address);

    expect(balanceVCNoteBefore.sub(redeemAmount)).eq(balanceVCNoteAfter);
    expect(balanceNoteAfter).gt(balanceNoteBefore);

    expect(balanceNoteBeforeViva).eq(0);
    expect(balanceNoteAfterViva).eq(0);

    expect(balanceCNoteAfterViva).lt(balanceCNoteBeforeViva);
  })

  it("redeemUnderlying test", async function () {
    expect(await contracts.note.balanceOf(contracts.vcNote.address)).eq(0);
    // ================ params ================
    const redeemUnderlyingAmount = ethers.utils.parseEther("100");

    const balanceVCNoteBefore = await vcNote.balanceOf(signer.address);
    const balanceNoteBefore = await contracts.note.balanceOf(signer.address);

    const balanceCNoteBeforeViva = await contracts.cNote.balanceOf(contracts.vcNote.address);
    const balanceNoteBeforeViva = await contracts.note.balanceOf(contracts.vcNote.address);


    // ================ action ================
    await mine(100);
    await vcNote.redeemUnderlying(redeemUnderlyingAmount);

    // ============== validation ==============
    const lendingLedgerUserInfo = await lendingLedger.userInfo(vcNote.address, signer.address);
    const vivaPointUserInfo = await vivaPoint.userInfos(signer.address);
    const currentLiquidity = await vcNote.callStatic.balanceOfUnderlying(signer.address);

    expect(lendingLedgerUserInfo.amount).eq(currentLiquidity);
    expect(vivaPointUserInfo.amount).eq(currentLiquidity);
    expect(await contracts.note.balanceOf(contracts.vcNote.address)).eq(0);

    const balanceVCNoteAfter = await vcNote.balanceOf(signer.address);
    const balanceNoteAfter = await contracts.note.balanceOf(signer.address);

    const balanceCNoteAfterViva = await contracts.cNote.balanceOf(contracts.vcNote.address);
    const balanceNoteAfterViva = await contracts.note.balanceOf(contracts.vcNote.address);

    expect(balanceVCNoteBefore).gt(balanceVCNoteAfter);
    expect(balanceNoteBefore.add(redeemUnderlyingAmount)).eq(balanceNoteAfter);

    expect(balanceNoteBeforeViva).eq(0);
    expect(balanceNoteAfterViva).eq(0);

    expect(balanceCNoteAfterViva).lt(balanceCNoteBeforeViva);
  })

  it("transferTokens test", async function () {
    expect(await contracts.note.balanceOf(contracts.vcNote.address)).eq(0);
    // ================ action ================
    await mine(100);

    const transferTokenAmount = ethers.utils.parseEther("100");
    await vcNote.transfer(receiver.address, transferTokenAmount);

    // ============== validation ==============
    // sender
    const lendingLedgerUserInfo = await lendingLedger.userInfo(vcNote.address, signer.address);
    const vivaPointUserInfo = await vivaPoint.userInfos(signer.address);
    const currentEpoch = Math.floor(Date.now() / 1000 / WEEK) * WEEK;
    const currentLiquidity = await vcNote.callStatic.balanceOfUnderlying(signer.address);

    expect(lendingLedgerUserInfo.amount).eq(currentLiquidity);
    expect(vivaPointUserInfo.amount).eq(currentLiquidity);

    // receiver
    const receiverLendingLedgerUserInfo = await lendingLedger.userInfo(vcNote.address, receiver.address);
    const receiverVivaPointUserInfo = await vivaPoint.userInfos(receiver.address);
    const receiverCurrentLiquidity = await vcNote.callStatic.balanceOfUnderlying(receiver.address);

    expect(receiverLendingLedgerUserInfo.amount).eq(receiverCurrentLiquidity);
    expect(receiverVivaPointUserInfo.amount).eq(receiverCurrentLiquidity);

    expect(await contracts.note.balanceOf(contracts.vcNote.address)).eq(0);
  })

  it("seize test", async function () {
    expect(await contracts.note.balanceOf(contracts.vcNote.address)).eq(0);
    // ================ action ================
    await mine(100);
    const liquidateTokenAmount = ethers.utils.parseEther("100");
    await vcNote.liquidateBorrow(borrower.address, liquidateTokenAmount, vcNote.address);


    // ============== validation ==============
    // liquidator
    const lendingLedgerUserInfo = await lendingLedger.userInfo(vcNote.address, signer.address);
    const vivaPointUserInfo = await vivaPoint.userInfos(signer.address);
    const currentLiquidity = await vcNote.callStatic.balanceOfUnderlying(signer.address);
    expect(lendingLedgerUserInfo.amount).eq(currentLiquidity);
    expect(vivaPointUserInfo.amount).eq(currentLiquidity);

    // borrower
    const borrowerLendingLedgerUserInfo = await lendingLedger.userInfo(vcNote.address, borrower.address);
    const borrowerVivaPointUserInfo = await vivaPoint.userInfos(borrower.address);
    const borrowerCurrentLiquidity = await vcNote.callStatic.balanceOfUnderlying(borrower.address);
    expect(borrowerLendingLedgerUserInfo.amount).eq(borrowerCurrentLiquidity);
    expect(borrowerVivaPointUserInfo.amount).eq(borrowerCurrentLiquidity);

    expect(await contracts.note.balanceOf(contracts.vcNote.address)).eq(0);
  })

  it("syncLendingLedger/updateVivaPoint test", async function () {
    // ================ action ================
    await mine(100);
    await vcNote.syncLendingLedger(signer.address);

    // ============== validation ==============
    const lendingLedgerUserInfo = await lendingLedger.userInfo(vcNote.address, signer.address);
    const vivaPointUserInfo = await vivaPoint.userInfos(signer.address);
    const calcLiquidity = await vcNote.callStatic.balanceOfUnderlying(signer.address);

    expect(lendingLedgerUserInfo.amount).eq(calcLiquidity);
    expect(vivaPointUserInfo.amount).eq(calcLiquidity);
  })

  it("interestModal update parameter", async function () {

    const baseRatePerYear = "2500000000000000";
    const multiplierPerYear = "2500000000000000";
    const jumpMultiplierPerYear = "1225000000000000000";
    const kink_ = "800000000000000000";

    const BORROW_RATE_AT_KINK = 0.005;
    const BORROW_RATE_AT_MAX = 0.25;

    await contracts.vcNoteInterestModel.updateJumpRateModel(
      baseRatePerYear,
      multiplierPerYear,
      jumpMultiplierPerYear,
      kink_,	  // kink_
    );

    const blockPerYear = await contracts.vcNoteInterestModel.blocksPerYear();
    const baseRatePerBlock = await contracts.vcNoteInterestModel.baseRatePerBlock();
    const multRate = await contracts.vcNoteInterestModel.multiplierPerBlock();
    const jumpRate = await contracts.vcNoteInterestModel.jumpMultiplierPerBlock();

    const borrowRate80 = await contracts.vcNoteInterestModel.getBorrowRate(20, 80, 0);
    const borrowRate100 = await contracts.vcNoteInterestModel.getBorrowRate(0, 100, 0);

    expect(parseFloat(parseFloat(ethers.utils.formatEther(baseRatePerBlock.mul(blockPerYear))).toFixed(6))).eq(parseFloat(ethers.utils.formatEther(baseRatePerYear)));
    expect(parseFloat(parseFloat(ethers.utils.formatEther(borrowRate80.mul(blockPerYear))).toFixed(6))).eq(BORROW_RATE_AT_KINK);
    expect(parseFloat(parseFloat(ethers.utils.formatEther(borrowRate100.mul(blockPerYear))).toFixed(6))).eq(BORROW_RATE_AT_MAX);
  });

  it("interestModel test util 80", async function () {

    // SETUP - utilizationRatio 80%
    {
      const totalCashBefore = await contracts.vcNote.getCash();
      const totalBorrowsBefore = await contracts.vcNote.totalBorrows();
      const totalReservesBefore = await contracts.vcNote.totalReserves();

      const u_ratio = totalBorrowsBefore.mul(10000).div(totalCashBefore.add(totalBorrowsBefore).sub(totalReservesBefore));
      const ratio80 = totalCashBefore.add(totalBorrowsBefore).sub(totalReservesBefore).mul(80).div(100);

      await vcNote["borrow(uint256,address)"](ratio80.sub(totalBorrowsBefore), receiver.address);
    }

    const totalCashBefore = await contracts.vcNote.getCash();
    const totalBorrowsBefore = await contracts.vcNote.totalBorrows();
    const totalReservesBefore = await contracts.vcNote.totalReserves();
    const exchangeRateBefore = await contracts.vcNote.exchangeRateStored();

    const u_ratio = totalBorrowsBefore.mul(100).div(totalCashBefore.add(totalBorrowsBefore).sub(totalReservesBefore));
    expect(u_ratio).eq(80);

    const blockPerYear = await contracts.vcNoteInterestModel.blocksPerYear();
    const reserveFactor = await contracts.vcNote.reserveFactorMantissa();
    const baseRatePerBlock = await contracts.vcNoteInterestModel.baseRatePerBlock();
    const baseInterestRatePerYear = baseRatePerBlock.mul(blockPerYear);

    const borrowRate = await contracts.vcNote.borrowRatePerBlock();
    const supplyRate = await contracts.vcNote.supplyRatePerBlock();

    const borrowRatePerYear = ethers.utils.formatEther(borrowRate.mul(blockPerYear));
    const supplyRatePerYear = ethers.utils.formatEther(supplyRate.mul(blockPerYear));
    expect(parseFloat(borrowRatePerYear)).gt(0.005);
    expect(parseFloat(supplyRatePerYear)).gt(0.0018);

    await mine(blockPerYear);
    await contracts.vcNote.accrueInterest();

    const totalBorrowsAfter = await contracts.vcNote.totalBorrows();
    const totalReservesAfter = await contracts.vcNote.totalReserves();
    const exchangeRateAfter = await contracts.vcNote.exchangeRateStored();

    const accrueReserves = totalReservesAfter.sub(totalReservesBefore);
    const accrueBorrows = totalBorrowsAfter.sub(totalBorrowsBefore);

    const baseAccrueInterest = totalBorrowsBefore.mul(baseInterestRatePerYear).div(ethers.constants.WeiPerEther);
    const accrueInterestWithoutBase = accrueBorrows.sub(baseAccrueInterest);
    const reserveInterest = accrueInterestWithoutBase.mul(reserveFactor).div(ethers.constants.WeiPerEther);

    const lenderInterest = accrueInterestWithoutBase.sub(reserveInterest);
    const protocolInterest = baseAccrueInterest.add(reserveInterest);

    const interestOneYear = ethers.utils.formatEther(accrueBorrows.mul(ethers.constants.WeiPerEther).div(totalBorrowsBefore));
    const reservesOneYear = ethers.utils.formatEther(accrueReserves.mul(ethers.constants.WeiPerEther).div(totalBorrowsBefore));

    expect(Math.abs(parseFloat(interestOneYear) - 0.005)).lt(0.00000001);
    expect(Math.abs(parseFloat(reservesOneYear) - 0.00275)).lt(0.00000001);
  })

  it("interestModel test util 100", async function () {

    // SETUP - utilizationRatio 100%
    {
      const totalCashBefore = await contracts.vcNote.getCash();
      const totalBorrowsBefore = await contracts.vcNote.totalBorrows();
      const totalReservesBefore = await contracts.vcNote.totalReserves();

      const u_ratio = totalBorrowsBefore.mul(10000).div(totalCashBefore.add(totalBorrowsBefore).sub(totalReservesBefore));
      const ratio100 = totalCashBefore.add(totalBorrowsBefore).sub(totalReservesBefore).mul(999).div(1000);;

      const mintAmount = ethers.utils.parseEther("2000");

      await contracts.of.mint(signer.address, mintAmount);
      await contracts.of.approve(contracts.cOF.address, mintAmount);
      await contracts.cOF.mint(mintAmount);

      await vcNote["borrow(uint256,address)"](totalCashBefore.sub(ethers.constants.WeiPerEther), receiver.address);
    }

    const totalCashBefore = await contracts.vcNote.getCash();
    const totalBorrowsBefore = await contracts.vcNote.totalBorrows();
    const totalReservesBefore = await contracts.vcNote.totalReserves();
    const exchangeRateBefore = await contracts.vcNote.exchangeRateStored();

    const u_ratio = totalBorrowsBefore.mul(100).div(totalCashBefore.add(totalBorrowsBefore).sub(totalReservesBefore));
    expect(u_ratio).eq(100);

    const blockPerYear = await contracts.vcNoteInterestModel.blocksPerYear();
    const reserveFactor = await contracts.vcNote.reserveFactorMantissa();
    const baseRatePerBlock = await contracts.vcNoteInterestModel.baseRatePerBlock();
    const baseInterestRatePerYear = baseRatePerBlock.mul(blockPerYear);

    const borrowRate = await contracts.vcNote.borrowRatePerBlock();
    const supplyRate = await contracts.vcNote.supplyRatePerBlock();


    const borrowRatePerYear = ethers.utils.formatEther(borrowRate.mul(blockPerYear));
    const supplyRatePerYear = ethers.utils.formatEther(supplyRate.mul(blockPerYear));

    expect(parseFloat(borrowRatePerYear)).gt(0.25);
    expect(parseFloat(supplyRatePerYear)).gt(0.22275);

    await mine(blockPerYear);
    await contracts.vcNote.accrueInterest();

    const totalCashAfter = await contracts.vcNote.getCash();
    const totalBorrowsAfter = await contracts.vcNote.totalBorrows();
    const totalReservesAfter = await contracts.vcNote.totalReserves();
    const exchangeRateAfter = await contracts.vcNote.exchangeRateStored();

    const accrueReserves = totalReservesAfter.sub(totalReservesBefore);
    const accrueBorrows = totalBorrowsAfter.sub(totalBorrowsBefore);

    const baseAccrueInterest = totalBorrowsBefore.mul(baseInterestRatePerYear).div(ethers.constants.WeiPerEther);
    const accrueInterestWithoutBase = accrueBorrows.sub(baseAccrueInterest);
    const reserveInterest = accrueInterestWithoutBase.mul(reserveFactor).div(ethers.constants.WeiPerEther);

    const lenderInterest = accrueInterestWithoutBase.sub(reserveInterest);
    const protocolInterest = baseAccrueInterest.add(reserveInterest);

    const interestOneYear = ethers.utils.formatEther(accrueBorrows.mul(ethers.constants.WeiPerEther).div(totalBorrowsBefore));
    const reservesOneYear = ethers.utils.formatEther(accrueReserves.mul(ethers.constants.WeiPerEther).div(totalBorrowsBefore));

    expect(Math.abs(parseFloat(interestOneYear) - 0.25)).lt(0.01);
    expect(Math.abs(parseFloat(reservesOneYear) - 0.0275)).lt(0.0001);
  })
});
