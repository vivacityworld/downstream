// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";
import { DeployLocal } from "../../types/deploy";
import DISTRIBUTION from "../../../config/distribution.json"

async function main({ deployed }: { deployed: DeployLocal }) {
  const [signer] = await ethers.getSigners();

  const hre = await import("hardhat");
  ////////////////////////////////
  //      DEPLOY VIVA , NOTE    //
  ////////////////////////////////
  const MockERC20Factory = await ethers.getContractFactory('MockERC20');
  const note = await MockERC20Factory.deploy("NOTE", "NOTE");


  const VivaTokenFactory = await ethers.getContractFactory('VivaToken');
  const viva = await VivaTokenFactory.deploy("VIVA", "VIVA", ethers.utils.parseUnits(DISTRIBUTION.totalSupply, 18));

  //////////////////////////////////////
  //      DEPLOY CLM Comptroller      //
  //////////////////////////////////////
  const ComptrollerFactory = await ethers.getContractFactory("Comptroller");
  const UnitrollerFactory = await ethers.getContractFactory("Unitroller");

  const comptroller = await ComptrollerFactory.deploy();
  const unitroller = await UnitrollerFactory.deploy();

  await unitroller._setPendingImplementation(comptroller.address);
  await comptroller._become(unitroller.address);

  ////////////////////////////////
  //      DEPLOY CLM CNOTE      //
  ////////////////////////////////
  const CErc20DelegateFactory = await ethers.getContractFactory('CErc20Delegate');
  const CErc20DelegatorFactory = await ethers.getContractFactory("CErc20Delegator");


  const InterestRateModelFactory = await ethers.getContractFactory("JumpRateModelV2");
  const interestRateModel = await InterestRateModelFactory.deploy(
    "0",
    "1000000000000000000",
    "4000000000000000000",
    "700000000000000000",
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
  );

  const cNoteImpl = await CErc20DelegateFactory.deploy();
  const cNoteProxy = await CErc20DelegatorFactory.deploy(
    note.address,
    unitroller.address,
    interestRateModel.address,
    ethers.utils.parseEther("1"),
    `cNOTE`,
    `cNOTE`,
    18,
    signer.address,
    cNoteImpl.address,
    []
  );

  ////////////////////////////////////
  //      DEPLOY LendingLedger      //
  ////////////////////////////////////
  const MockLendingLedgerFactory = await ethers.getContractFactory("MockLendingLedger");

  const lendingLedger = await MockLendingLedgerFactory.deploy();

  await comptroller._supportMarket(cNoteProxy.address);

  return {
    VIVA: viva.address,
    CNOTE: cNoteProxy.address,
    lendingLedger: lendingLedger.address
  }
}

export default main;