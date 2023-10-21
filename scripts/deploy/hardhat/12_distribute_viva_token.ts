import { ethers } from "hardhat";
import { DeployLocal } from "../../types/deploy";
import DISTIBUTION from "../../../config/distribution.json"

import { BigNumber } from "ethers";

async function main({ deployed }: { deployed: DeployLocal }) {
  const [signer] = await ethers.getSigners();

  const viva = await ethers.getContractAt("VivaToken", deployed.VIVA!);

  // onLaunch distribute
  const onLaunch = DISTIBUTION.distribution.onLaunch;
  for (const dist of onLaunch) {
    await viva.transfer(dist.address, ethers.utils.parseUnits(dist.amount, 18));
  }

  // transfer to vestingVault
  const vestingVault = await ethers.getContractAt("VestingVault", deployed.vestingVault!);
  const vesting = DISTIBUTION.distribution.vesting;
  let totalVestingAmount = BigNumber.from(0);
  for (const dist of vesting.accounts) {
    totalVestingAmount = totalVestingAmount.add(ethers.utils.parseUnits(dist.amount, 18));
  }
  await viva.transfer(vestingVault.address, totalVestingAmount);

  // liquidity Mining
  const WEEK = 60 * 60 * 24 * 7;
  const lendingLedger = await ethers.getContractAt("ILendingLedger", deployed.lendingLedger!);
  const lm = DISTIBUTION.distribution.liquidityMining;
  const numWeeks = Math.floor(lm.duration / WEEK) + 1;
  const totalIncentive = ethers.utils.parseUnits(lm.amount, 18);
  const amountPerEpoch = totalIncentive.div(numWeeks);

  await viva.approve(lendingLedger.address, totalIncentive);
  await lendingLedger.setSecondaryRewards(deployed.vcNote!, viva.address, lm.start, lm.start + lm.duration, amountPerEpoch);

  await viva.transfer(deployed.llama?.vivacityTreasury!, await viva.balanceOf(signer.address));

  return {}
}

export default main;