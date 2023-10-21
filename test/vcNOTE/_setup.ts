import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contracts } from "../_fixture/deployFixture";
import { VCNote } from "../../typechain";

interface VCNoteTestSetupParam {
  signer: SignerWithAddress;
  borrower: SignerWithAddress;
  receiver: SignerWithAddress;
  contracts: Contracts;
}

export default async function setupVCNoteTest({ signer, borrower, receiver, contracts }: VCNoteTestSetupParam) {

  ///////////////////////////////////////////////////
  ///////         SETUP ORACLE PARAMS         ///////
  ///////////////////////////////////////////////////

  // mock OffchainFund
  await contracts.priceOracleRouter.setOracle(contracts.cOF.address, contracts.ofPriceOracleRouter.address);
  await contracts.ofPriceOracleRouter.setOracle(contracts.cOF.address, contracts.ofPriceOracle.address);
  await contracts.ofPriceOracle.setPrice(1.1e8);

  // vcNote
  await contracts.priceOracleRouter.setOracle(contracts.vcNote.address, contracts.vcNotePriceOracle.address);

  ///////////////////////////////////////////////////
  ///////         SETUP MARKET PARAMS         ///////
  ///////////////////////////////////////////////////

  await contracts.comptroller._setPriceOracle(contracts.priceOracleRouter.address);

  await contracts.comptroller._supportMarket(contracts.vcNote.address);
  await contracts.comptroller._supportMarket(contracts.cOF.address);

  await contracts.comptroller._setLiquidationIncentive(ethers.utils.parseEther("1.08"));
  await contracts.comptroller._setCloseFactor(ethers.utils.parseEther("1"));

  await contracts.comptroller._setCollateralFactor(contracts.cOF.address, ethers.utils.parseEther("0.8"));


  ///////////////////////////////////////////////////
  ///////            APPROVE TOKEN            ///////
  ///////////////////////////////////////////////////

  await contracts.note.approve(contracts.cNote.address, ethers.constants.MaxUint256);
  await contracts.cNote.approve(contracts.vcNote.address, ethers.constants.MaxUint256);
  await contracts.note.connect(borrower).approve(contracts.cNote.address, ethers.constants.MaxUint256);
  await contracts.cNote.connect(borrower).approve(contracts.vcNote.address, ethers.constants.MaxUint256);
  await contracts.of.connect(borrower).approve(contracts.cOF.address, ethers.constants.MaxUint256);

  ///////////////////////////////////////////////////
  ///////            SETUP ACCOUNTS           ///////
  ///////////////////////////////////////////////////

  const mintAmount = ethers.utils.parseEther("1000");
  const borrowAmount = ethers.utils.parseEther("850");

  // signer - mint cNOTE
  await contracts.note.mint(signer.address, mintAmount.mul(2));
  await contracts.note.approve(contracts.cNote.address, mintAmount);
  await contracts.cNote.mint(mintAmount);

  // borrower - mint cNOTE
  await contracts.note.mint(borrower.address, mintAmount);
  await contracts.cNote.connect(borrower).mint(mintAmount);
  // borrower - mint vcNOTE
  await contracts.vcNote.connect(borrower).mint(mintAmount);
  // borrower - mint mock offchain fund (rwa)
  await contracts.of.mint(borrower.address, mintAmount);
  await contracts.cOF.connect(borrower).mint(mintAmount);

  // enter markets for using collateral;
  await contracts.comptroller.connect(borrower).enterMarkets([contracts.cOF.address, contracts.vcNote.address]);

  // borrow
  await contracts.vcNote.connect(borrower).borrow(borrowAmount);

  // set price for liquidation
  await contracts.ofPriceOracle.setPrice(0.5e8);
}