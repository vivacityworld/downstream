import { expect } from "chai";
import { ethers } from "hardhat";
import { IERC20, Staking, VivacityManageScript } from "../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import deployFixture, { Contracts } from "../_fixture/deployFixture";
import { BigNumber } from "ethers";

describe("Staking", function () {
  let signer: SignerWithAddress;
  let delegatee: SignerWithAddress;
  let users: SignerWithAddress[];
  let contracts: Contracts;
  let staking: Staking;
  let vivaScript: VivacityManageScript;
  let viva: IERC20;
  let calldata: string;
  let stakerStrategy: string;

  function downscale(value: BigNumber) {
    return value.div(ethers.utils.parseEther("1"));
  }

  before(async () => {
    [signer, delegatee, ...users] = await ethers.getSigners();
    contracts = await loadFixture(deployFixture);
    staking = contracts.staking;
    viva = contracts.viva;
    vivaScript = contracts.vivaScript;
    stakerStrategy = contracts.stakerStrategy;
    calldata = vivaScript.interface.encodeFunctionData("multicall", [[]]);

    await viva.approve(staking.address, ethers.constants.MaxUint256);
  });

  it("[error] setDeposit", async function () {
    // ================ params ================
    const proposeDeposit = ethers.utils.parseEther("10");

    // ========== action & validation =========
    await expect(staking.connect(delegatee).setDeposit(proposeDeposit))
      .revertedWith("Unauthorized")
  });

  it("setDeposit", async function () {
    // ================ params ================
    const proposeDeposit = ethers.utils.parseEther("10");

    // ================ action ================
    await staking.setDeposit(proposeDeposit);

    // ============== validation ==============
    expect(await staking["getDeposit()"]()).eq(proposeDeposit);
  });


  it("[error] delegate", async function () {
    // ================ params ================
    const delegateAmount = ethers.utils.parseEther("100000000000000000000000");

    // ========== action & validation =========
    await expect(staking.delegate(signer.address, delegateAmount))
      .revertedWith("ERC20InsufficientBalance")
  });

  it("delegate", async function () {
    // ================ params ================
    const amount = ethers.utils.parseEther("100");

    // ================ before ================
    const balance = await viva.balanceOf(signer.address);
    const balanceInStaking = await staking.balanceOf(signer.address);
    const votingPower = await staking.getVotingPower(signer.address);

    // ================ action ================
    await staking.delegate(signer.address, amount);
    await staking.delegate(signer.address, amount);

    // ============== validation ==============
    expect(await viva.balanceOf(signer.address)).eq(balance.sub(amount.mul(2)));
    expect(await staking.balanceOf(signer.address)).eq(balanceInStaking.add(amount.mul(2)));
    expect(await staking.getVotingPower(signer.address)).eq(votingPower.add(downscale(amount.mul(2))));
  });

  it("redelegate", async function () {
    // ================ before ================
    const balance = await viva.balanceOf(signer.address);
    const balanceInStaking = await staking.balanceOf(signer.address);
    const votingPower = await staking.getVotingPower(signer.address);
    const votingPowerOfDelegatee = await staking.getVotingPower(delegatee.address);

    // ================ action ================
    await staking.delegate(delegatee.address, 0);

    // ============== validation ==============
    expect(await viva.balanceOf(signer.address)).eq(balance);
    expect(await staking.balanceOf(signer.address)).eq(balanceInStaking);
    expect(await staking.getVotingPower(signer.address)).eq(0);
    expect(await staking.getVotingPower(delegatee.address)).eq(votingPowerOfDelegatee.add(votingPower));
  });

  it("[error] undelegate", async function () {
    // ================ params ================
    const undelegateAmount = ethers.utils.parseEther("201");

    // ========== action & validation =========
    await expect(staking.undelegate(undelegateAmount))
      .revertedWith("InsufficientBalance")
  });

  it("undelegate", async function () {
    // ================ params ================
    const amount = ethers.utils.parseEther("50");
    const delegatee = await staking.delegates(signer.address);

    // ================ before ================
    const balance = await viva.balanceOf(signer.address);
    const balanceInStaking = await staking.balanceOf(signer.address);
    const votingPowerOfDelegatee = await staking.getVotingPower(delegatee);

    // ================ action ================
    await staking.undelegate(amount);

    // ============== validation ==============
    expect(await viva.balanceOf(signer.address)).eq(balance.add(amount));
    expect(await staking.balanceOf(signer.address)).eq(balanceInStaking.sub(amount));
    expect(await staking.getVotingPower(delegatee)).eq(votingPowerOfDelegatee.sub(downscale(amount)));
  });

  it("[error] propose", async function () {
    // ========== action & validation =========
    await expect(staking.connect(delegatee).propose(vivaScript.address, calldata, "Governance Proposal 1"))
      .revertedWith("InsufficientBalance")
  });

  it("propose", async function () {
    // ================ params ================
    const deposit = await staking["getDeposit()"]();

    // ================ before ================
    await staking.delegate(signer.address, 0);
    const lockedBalance = await staking.lockedBalanceOf(signer.address);

    // ================ action ================
    await staking.propose(vivaScript.address, calldata, "Governance Proposal 1");

    // ========== action & validation =========
    await expect(staking.undelegate(await staking.balanceOf(signer.address))).revertedWith("InsufficientBalance");
    const actionId = (await contracts.llamaCore.actionsCount()).sub(1);
    expect(await staking.getProposer(actionId)).eq(signer.address);
    expect(await staking["getDeposit(uint256)"](actionId)).eq(deposit);
    expect(await staking.lockedBalanceOf(signer.address)).eq(lockedBalance.add(deposit));
  });

  it("[error] withdraw", async function () {
    // ================ params ================
    const actionId = (await contracts.llamaCore.actionsCount()).sub(1);

    // ========== action & validation =========
    await expect(staking.withdraw(actionId, vivaScript.address, calldata)).revertedWith("ActiveProposal")
  });

  it("withdraw when proposal passed", async function () {
    // ================ params ================
    await staking.propose(vivaScript.address, calldata, "Governance Proposal 1");
    const actionId = (await contracts.llamaCore.actionsCount()).sub(1);
    const actionInfo = { id: actionId, creator: staking.address, creatorRole: 2, strategy: stakerStrategy, target: vivaScript.address, value: 0, data: calldata };
    const deposit = await staking["getDeposit(uint256)"](actionId);

    // ================ before ================
    const balance = await staking.balanceOf(signer.address);
    const lockedBalance = await staking.lockedBalanceOf(signer.address);

    // ================ action ================
    // pass proposal
    await contracts.llamaCore.castApproval(3, actionInfo, "");
    await contracts.llamaCore.executeAction(actionInfo);

    await staking.withdraw(actionId, vivaScript.address, calldata);

    // ============== validation ==============
    expect(await staking.lockedBalanceOf(signer.address)).eq(lockedBalance.sub(deposit));
    expect(await staking.balanceOf(signer.address)).eq(balance)
  });

  it("withdraw when proposal rejected", async function () {
    // ================ params ================
    await staking.propose(vivaScript.address, calldata, "Governance Proposal 1");
    const actionId = (await contracts.llamaCore.actionsCount()).sub(1);
    const deposit = await staking["getDeposit(uint256)"](actionId);

    // ================ before ================
    const balance = await staking.balanceOf(signer.address);
    const lockedBalance = await staking.lockedBalanceOf(signer.address);
    const reserve = await staking.getReserve();

    // ================ action ================
    // reject proposal (expired)
    await time.increase(86400);

    await staking.withdraw(actionId, vivaScript.address, calldata);

    // ============== validation ==============
    expect(await staking.lockedBalanceOf(signer.address)).eq(lockedBalance.sub(deposit));
    expect(await staking.balanceOf(signer.address)).eq(balance.sub(deposit))
    expect(await staking.getReserve()).eq(reserve.add(deposit));
  });
});
