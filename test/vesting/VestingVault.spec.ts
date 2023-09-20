import { expect } from "chai";
import { ethers } from "hardhat";
import { MockERC20, VestingVault } from "../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { mine, time } from "@nomicfoundation/hardhat-network-helpers";

describe("VestingVault", function () {
  const zeroAddress = "0x0000000000000000000000000000000000000000";
  let signer: SignerWithAddress;
  let users: SignerWithAddress[];
  let token: MockERC20;
  let vestingVault: VestingVault;

  before(async () => {
    [signer, ...users] = await ethers.getSigners();
    const ERC20Factory = await ethers.getContractFactory("MockERC20");
    token = await ERC20Factory.deploy("GOV", "GOV");
    await token.mint(signer.address, ethers.utils.parseEther("1000"));
  });

  it("deploy", async function () {
    const VestingVaultFactory = await ethers.getContractFactory("VestingVault");
    vestingVault = await VestingVaultFactory.deploy(token.address);
  });

  it("add vesting error", async function () {
    await expect(vestingVault.add([signer.address], [10], [10], [10, 10])).revertedWith("VestingVault: arrays length mismatch");
    await expect(vestingVault.add([zeroAddress], [10], [10], [10])).revertedWith("VestingVault: beneficiary is zero address");
    await expect(vestingVault.add([signer.address], [10], [10], [0])).revertedWith("VestingVault: amount should be greater than 0");
    await expect(vestingVault.add([signer.address], [10], [0], [10])).revertedWith("VestingVault: duration should be greater than 0");
    await expect(vestingVault.add([signer.address], [10], [10], [10])).revertedWith("ERC20: insufficient allowance");
  });

  it("add vesting", async function () {
    const vestingAmount = ethers.utils.parseEther("200");
    await token.approve(vestingVault.address, vestingAmount);

    let start1 = (await ethers.provider.getBlock((await ethers.provider.getBlockNumber()))).timestamp + 3600;
    let start2 = start1 + 7200;
    let duration = 3600;

    await vestingVault.add(
      [users[0].address, users[1].address],
      [start1, start2],
      [duration, duration],
      [vestingAmount.div(2), vestingAmount.div(2)]
    );
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

    expect(await token.balanceOf(vestingVault.address)).eq(vestingAmount);
  });

  it("release error", async function () {
    await expect(vestingVault.connect(users[1]).release(0)).revertedWith("VestingVault: not allowed");
  });

  it("releasable", async function () {
    const vesting = await vestingVault.vestings(0);
    const gap = vesting.duration.div(4);

    expect(await vestingVault.releasable(0)).eq(0);

    await time.increaseTo(vesting.start.add(gap))
    expect(await vestingVault.releasable(0)).eq(vesting.allocated.div(4));

    await time.increaseTo(vesting.start.add(gap.mul(2)))
    expect(await vestingVault.releasable(0)).eq(vesting.allocated.div(4).mul(2));

    await time.increaseTo(vesting.start.add(gap.mul(3)))
    expect(await vestingVault.releasable(0)).eq(vesting.allocated.div(4).mul(3));

    await time.increaseTo(vesting.start.add(gap.mul(4)))
    expect(await vestingVault.releasable(0)).eq(vesting.allocated.div(4).mul(4));
  });

  it("release", async function () {
    let vesting = await vestingVault.vestings(1);
    const gap = vesting.duration.div(4);

    expect(await vestingVault.releasable(1)).eq(0);

    await time.increaseTo(vesting.start.add(gap))
    expect(await vestingVault.releasable(1)).eq(vesting.allocated.div(4));
    await vestingVault.release(1);

    vesting = await vestingVault.vestings(1);
    expect(await token.balanceOf(vesting.account)).eq(vesting.released);

    await time.increaseTo(vesting.start.add(gap.mul(2)))
    expect(await vestingVault.releasable(1)).eq(vesting.allocated.div(4).mul(2).sub(vesting.released));
  })

  it("remove error", async function () {
    await expect(vestingVault.connect(users[1]).remove(0)).revertedWith("Ownable: caller is not the owner");
  });

  it("remove", async function () {
    let vesting = await vestingVault.vestings(1);

    await time.increaseTo(vesting.start.add(vesting.duration));
    const releasableAmount = await vestingVault.releasable(1);

    const beforeBalance = await token.balanceOf(signer.address);
    await vestingVault.remove(1);

    expect(await token.balanceOf(signer.address)).eq(beforeBalance.add(releasableAmount));

    vesting = await vestingVault.vestings(1);
    expect(vesting.allocated).eq(0);
    expect(vesting.released).eq(0);
    expect(vesting.duration).eq(0);
    expect(vesting.account).eq(zeroAddress);
  });
});
