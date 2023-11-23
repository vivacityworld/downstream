import { expect } from "chai";
import { ethers } from "hardhat";
import { IERC20, VestingVault } from "../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import deployFixture, { Contracts } from "../_fixture/deployFixture";

describe("VestingVault", function () {
  const zeroAddress = "0x0000000000000000000000000000000000000000";
  let signer: SignerWithAddress;
  let users: SignerWithAddress[];
  let viva: IERC20;
  let vestingVault: VestingVault;
  let contracts: Contracts;

  before(async () => {
    [signer, ...users] = await ethers.getSigners();
    contracts = await loadFixture(deployFixture);
    viva = contracts.viva;
    vestingVault = contracts.vestingVault;
  });


  it("[error] add", async function () {
    // ========== action & validation =========
    const max = ethers.BigNumber.from(2).pow(64).sub(1);
    await expect(vestingVault.add([signer.address], [10], [10], [10])).revertedWith("VestingVault: start should be greater than current timestamp");
    await expect(vestingVault.add([signer.address], [max], [10], [10, 10])).revertedWith("VestingVault: arrays length mismatch");
    await expect(vestingVault.add([zeroAddress], [max], [10], [10])).revertedWith("VestingVault: beneficiary is zero address");
    await expect(vestingVault.add([signer.address], [max], [10], [0])).revertedWith("VestingVault: amount should be greater than 0");
    await expect(vestingVault.add([signer.address], [max], [0], [10])).revertedWith("VestingVault: duration should be greater than 0");
  });

  it("add", async function () {
    // ================ params ================
    const vestingAmount = ethers.utils.parseEther("200");

    let start1 = (await ethers.provider.getBlock((await ethers.provider.getBlockNumber()))).timestamp + 3600;
    let start2 = start1 + 7200;
    let duration = 3600;

    const _account = [users[0].address, users[1].address];
    const _start = [start1, start2];
    const _duration = [duration, duration];
    const _amount = [vestingAmount.div(2), vestingAmount.div(2)];

    // ================ action ================
    await vestingVault.add(_account, _start, _duration, _amount);

    // ============== validation ==============
    const vesting1 = await vestingVault.vestings(0);
    expect(vesting1.account).eq(users[0].address);
    expect(vesting1.start).eq(start1);
    expect(vesting1.duration).eq(duration);
    expect(vesting1.allocated).eq(vestingAmount.div(2));

    const vesting2 = await vestingVault.vestings(1);
    expect(vesting2.account).eq(users[1].address);
    expect(vesting2.start).eq(start2);
    expect(vesting2.duration).eq(duration);
    expect(vesting2.allocated).eq(vestingAmount.div(2));
  });

  it("releasable", async function () {
    // ================ params ================
    const amount = ethers.utils.parseEther("200");
    const startTime = (await ethers.provider.getBlock((await ethers.provider.getBlockNumber()))).timestamp + 10;
    const duration = 3600;
    const gap = duration / 4;

    // ================ before ================
    await vestingVault.add([signer.address], [startTime], [duration], [amount]);
    const vestingId = (await vestingVault.nextVestingId()).sub(1);

    // ========== action & validation =========
    expect(await vestingVault.releasable(vestingId)).eq(0);
    await time.increaseTo(startTime + gap)
    expect(await vestingVault.releasable(vestingId)).eq(amount.div(4));
    await time.increaseTo(startTime + gap * 2)
    expect(await vestingVault.releasable(vestingId)).eq(amount.div(4).mul(2));
    await time.increaseTo(startTime + gap * 3)
    expect(await vestingVault.releasable(vestingId)).eq(amount.div(4).mul(3));
    await time.increaseTo(startTime + gap * 4)
    expect(await vestingVault.releasable(vestingId)).eq(amount);
    await time.increaseTo(startTime + gap * 5)
    expect(await vestingVault.releasable(vestingId)).eq(amount);
  });

  it("[error] release", async function () {
    // ================ params ================
    const vestingId = (await vestingVault.nextVestingId()).sub(1);

    // ========== action & validation =========
    await expect(vestingVault.connect(users[1]).release(vestingId)).revertedWith("VestingVault: not allowed");
  });

  it("release when insufficient viva", async function () {
    // ================ params ================
    const amount = ethers.utils.parseEther("200");
    const startTime = (await ethers.provider.getBlock((await ethers.provider.getBlockNumber()))).timestamp + 10;
    const duration = 3600;
    const gap = duration / 2;

    // ================ before ================
    await vestingVault.add([signer.address], [startTime], [duration], [amount]);
    const vestingId = (await vestingVault.nextVestingId()).sub(1);
    const balance = await viva.balanceOf(signer.address);
    await time.increaseTo(startTime + gap)

    // ================ action ================
    await vestingVault.release(vestingId);

    // ============== validation ==============
    const vesting = await vestingVault.vestings(vestingId);
    expect(await viva.balanceOf(signer.address)).eq(balance);
    expect(vesting.released).eq(0);
  })

  it("release when sufficient viva", async function () {
    // ================ params ================
    const amount = ethers.utils.parseEther("200");
    const startTime = (await ethers.provider.getBlock((await ethers.provider.getBlockNumber()))).timestamp + 10;
    const duration = 3600;
    const gap = duration / 2;

    // ================ before ================
    // send viva
    await viva.transfer(vestingVault.address, ethers.utils.parseEther("500"));
    await vestingVault.add([signer.address], [startTime], [duration], [amount]);
    const vestingId = (await vestingVault.nextVestingId()).sub(1);
    const balance = await viva.balanceOf(signer.address);
    await time.increaseTo(startTime + gap)

    // ================ action ================
    await vestingVault.release(vestingId);

    // ============== validation ==============
    const vesting = await vestingVault.vestings(vestingId);
    expect(await viva.balanceOf(signer.address)).eq(balance.add(vesting.released));
  })

  it("[error] remove", async function () {
    // ================ params ================
    const vestingId = (await vestingVault.nextVestingId()).sub(1);

    // ========== action & validation =========
    await expect(vestingVault.connect(users[1]).remove(vestingId, false)).revertedWith("OwnableUnauthorizedAccount");
  });

  it("remove doRelease false", async function () {
    // ================ params ================
    const amount = ethers.utils.parseEther("200");
    const startTime = (await ethers.provider.getBlock((await ethers.provider.getBlockNumber()))).timestamp + 10;
    const duration = 3600;
    const gap = duration / 2;

    // ================ before ================
    await vestingVault.add([signer.address], [startTime], [duration], [amount]);
    const vestingId = (await vestingVault.nextVestingId()).sub(1);
    const balance = await viva.balanceOf(signer.address);
    const balanceOfVault = await viva.balanceOf(vestingVault.address);
    await time.increaseTo(startTime + gap)

    // ================ action ================
    await vestingVault.remove(vestingId, false);

    // ============== validation ==============
    expect(await viva.balanceOf(signer.address)).eq(balance);
    expect(await viva.balanceOf(vestingVault.address)).eq(balanceOfVault);

    const vesting = await vestingVault.vestings(vestingId);
    expect(vesting.allocated).eq(0);
    expect(vesting.released).eq(0);
    expect(vesting.duration).eq(0);
    expect(vesting.account).eq(zeroAddress);
  });

  it("remove doRelease true", async function () {
    // ================ params ================
    const amount = ethers.utils.parseEther("200");
    const startTime = (await ethers.provider.getBlock((await ethers.provider.getBlockNumber()))).timestamp + 10;
    const duration = 3600;
    const gap = duration / 2;

    // ================ before ================
    await vestingVault.add([signer.address], [startTime], [duration], [amount]);
    const vestingId = (await vestingVault.nextVestingId()).sub(1);
    const balance = await viva.balanceOf(signer.address);
    const balanceOfVault = await viva.balanceOf(vestingVault.address);
    await time.increaseTo(startTime + gap)

    // ================ action ================
    await vestingVault.remove(vestingId, true);

    // ============== validation ==============
    expect(await viva.balanceOf(signer.address)).gt(balance);
    expect(await viva.balanceOf(vestingVault.address)).lt(balanceOfVault);

    const vesting = await vestingVault.vestings(vestingId);
    expect(vesting.allocated).eq(0);
    expect(vesting.released).eq(0);
    expect(vesting.duration).eq(0);
    expect(vesting.account).eq(zeroAddress);
  });

  it("[error] tranfer", async function () {
    // ================ params ================
    const transferAmount = ethers.utils.parseEther("1");

    // ========== action & validation =========
    await expect(vestingVault.connect(users[0]).transfer(users[0].address, transferAmount))
      .revertedWith("OwnableUnauthorizedAccount")
  });

  it("tranfer", async function () {
    // ================ params ================
    const transferAmount = ethers.utils.parseEther("1");

    // ================ before ================
    const balance = await viva.balanceOf(users[0].address);
    const balanceOfVault = await viva.balanceOf(vestingVault.address);

    // ================ action ================
    await vestingVault.transfer(users[0].address, transferAmount);

    // ============== validation ==============
    expect(await viva.balanceOf(users[0].address)).eq(balance.add(transferAmount));
    expect(await viva.balanceOf(vestingVault.address)).eq(balanceOfVault.sub(transferAmount));
  });
});
