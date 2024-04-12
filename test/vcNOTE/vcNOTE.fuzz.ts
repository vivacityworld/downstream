import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import deployFixture, { Contracts } from "../_fixture/deployFixture";
import { MockLendingLedgerV2, VCNote, VivaPoint } from "../../typechain";
import setupVCNote from "./_setup";


describe("vcNOTE", function () {
  const WEEK = 60 * 60 * 24 * 7;
  let signer: SignerWithAddress;
  let borrower: SignerWithAddress;
  let receiver: SignerWithAddress;
  let noadmin: SignerWithAddress;
  let vcNote: VCNote;
  let lendingLedger: MockLendingLedgerV2;
  let contracts: Contracts;
  let vivaPoint: VivaPoint;

  before(async () => {
    [signer, borrower, receiver, noadmin] = await ethers.getSigners();
    contracts = await loadFixture(deployFixture);
    vcNote = contracts.vcNote;
    lendingLedger = contracts.lendingLedger;
    vivaPoint = contracts.vivaPoint;

    await setupVCNote({ signer, borrower, receiver, contracts });
  });

  async function checkEpochAndLiquidity(target: string) {
    const lendingLedgerUserInfo = await lendingLedger.userInfo(vcNote.address, target);
    const vivaPointUserInfo = await vivaPoint.userInfos(target);
    const calcLiquidity = await contracts.vcNote.callStatic.balanceOfUnderlying(target);

    expect(lendingLedgerUserInfo.amount).eq(calcLiquidity);
    expect(vivaPointUserInfo.amount).eq(calcLiquidity);
  }

  it("Fuzz test", async function () {
    this.timeout(1e8);
    await contracts.vcNote.setLendingLedger(contracts.lendingLedger.address);
    await contracts.vcNote.mint((await contracts.note.balanceOf(signer.address)).div(2));
    await contracts.vcNote.transfer(receiver.address, ethers.utils.parseEther("1"));

    let DAY = 3600 * 24;
    for (let i = 0; i < 10; i++) {
      const increaseTime = Math.floor(Math.random() * DAY * 6 + DAY); // 1day ~ 7day
      await time.increase(increaseTime);
      const currentTime = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp;

      const action = Math.floor(Math.random() * 6);
      const denom = Math.floor(Math.random() * 10) + 10;
      switch (action) {
        case 0:
          const mintAmount = (await contracts.note.balanceOf(signer.address)).div(denom);
          await contracts.vcNote.mint(mintAmount);
          await checkEpochAndLiquidity(signer.address);
          console.log(i, "[success] mint              ", mintAmount);
          break;
        case 1:
          const redeemAmount = (await contracts.vcNote.balanceOf(signer.address)).div(denom);
          await contracts.vcNote.redeem(redeemAmount);
          await checkEpochAndLiquidity(signer.address);
          console.log(i, "[success] redeem            ", redeemAmount);
          break;
        case 2:
          const redeemUnderlyingAmount = (await contracts.vcNote.callStatic.balanceOfUnderlying(signer.address)).div(denom);
          await contracts.vcNote.redeemUnderlying(redeemUnderlyingAmount);
          await checkEpochAndLiquidity(signer.address);
          console.log(i, "[success] redeemUnderlying  ", redeemUnderlyingAmount);
          break;
        case 3:
          const transferTokenAmount = (await contracts.vcNote.balanceOf(signer.address)).div(denom);
          await contracts.vcNote.transfer(receiver.address, transferTokenAmount);
          await checkEpochAndLiquidity(signer.address);
          await checkEpochAndLiquidity(receiver.address);
          console.log(i, "[success] transferTokens    ", transferTokenAmount);
          break;
        case 4:
          const cNoteAmount = await contracts.cNote.callStatic.balanceOf(signer.address);
          const shortfall = (await contracts.comptroller.getAccountLiquidity(borrower.address))[2];
          const liquidateTokenAmount = (cNoteAmount.lt(shortfall) ? cNoteAmount : shortfall).div(denom);
          if (!liquidateTokenAmount.isZero()) {
            await contracts.vcNote.liquidateBorrow(borrower.address, liquidateTokenAmount, contracts.vcNote.address);
            await checkEpochAndLiquidity(signer.address);
            await checkEpochAndLiquidity(borrower.address);
            console.log(i, "[success] liquidate         ", liquidateTokenAmount);
          }
          break;
        case 5:
          await contracts.vcNote.syncLendingLedger(signer.address);
          await checkEpochAndLiquidity(signer.address);
          await contracts.vcNote.syncLendingLedger(borrower.address);
          await checkEpochAndLiquidity(borrower.address);
          await contracts.vcNote.syncLendingLedger(receiver.address);
          await checkEpochAndLiquidity(receiver.address);
          console.log(i, "[success] syncLendingLedger ");
      }
    }
  })
});
