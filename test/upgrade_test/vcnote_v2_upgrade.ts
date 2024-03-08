import { expect } from "chai";
import { ethers } from "hardhat";
import { CErc20, Comptroller, MockERC20, VCNote, VCNoteRouter, VCNoteV1, VivaPoint } from "../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { mine } from "@nomicfoundation/hardhat-network-helpers";

const logging = false;

describe("vcNOTE v2 Upgrade", function () {
  let vcNoteRouter: VCNoteRouter;
  let note: MockERC20;
  let vcNote: VCNote | VCNoteV1;
  let cNote: CErc20;
  let comp: Comptroller;
  let rwa: MockERC20;
  let vcRwa: CErc20;
  let vivaPoint: VivaPoint;
  let signer: SignerWithAddress;
  let minter: SignerWithAddress;
  let suppliers: SignerWithAddress[];

  it("upgrade test", async function () {
    [signer, minter, ...suppliers] = await ethers.getSigners();

    /////////////////////////////////////////////////
    ////////////////// DEPLOY MOCK //////////////////
    /////////////////////////////////////////////////

    ////////////////////////////////
    //      DEPLOY RWA , NOTE     //
    ////////////////////////////////
    const MockERC20Factory = await ethers.getContractFactory('MockERC20');
    note = await MockERC20Factory.deploy("NOTE", "NOTE");
    rwa = await MockERC20Factory.deploy("RWA", "RWA");

    const OracleFactory = await ethers.getContractFactory("PriceOracleRouter");
    const oracle = await OracleFactory.deploy();

    //////////////////////////////////////
    //      DEPLOY CLM Comptroller      //
    //////////////////////////////////////
    const ComptrollerFactory = await ethers.getContractFactory("Comptroller");
    const UnitrollerFactory = await ethers.getContractFactory("Unitroller");

    const comptroller_clm = await ComptrollerFactory.deploy();
    const unitroller_clm = await UnitrollerFactory.deploy();

    await unitroller_clm._setPendingImplementation(comptroller_clm.address);
    await comptroller_clm._become(unitroller_clm.address);

    const comp_clm = await ethers.getContractAt("Comptroller", unitroller_clm.address);

    ////////////////////////////////
    //      DEPLOY CLM CNOTE      //
    ////////////////////////////////
    const CErc20DelegateFactory = await ethers.getContractFactory('CErc20Delegate');
    const CErc20DelegatorFactory = await ethers.getContractFactory("CErc20Delegator");


    const InterestRateModelFactory = await ethers.getContractFactory("JumpRateModelV2");
    const cNoteInterestRateModel = await InterestRateModelFactory.deploy(
      "0",
      "50000000000000000",
      "50000000000000000",
      "700000000000000000",
      "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
    );

    const cNoteImpl = await CErc20DelegateFactory.deploy();
    const cNoteProxy = await CErc20DelegatorFactory.deploy(
      note.address,
      unitroller_clm.address,
      cNoteInterestRateModel.address,
      ethers.utils.parseEther("1"),
      `cNOTE`,
      `cNOTE`,
      18,
      signer.address,
      cNoteImpl.address,
      []
    );

    const cRwaImpl = await CErc20DelegateFactory.deploy();
    const cRwaProxy = await CErc20DelegatorFactory.deploy(
      rwa.address,
      unitroller_clm.address,
      cNoteInterestRateModel.address,
      ethers.utils.parseEther("1"),
      `cVIVA`,
      `cVIVA`,
      18,
      signer.address,
      cRwaImpl.address,
      []
    );

    const cRwa = await ethers.getContractAt("CErc20Delegate", cRwaProxy.address);
    cNote = await ethers.getContractAt("CErc20Delegate", cNoteProxy.address);

    ////////////////////////////////////
    //            SETUP CLM           //
    ////////////////////////////////////

    await comp_clm._supportMarket(cNoteProxy.address);
    await comp_clm._supportMarket(cRwaProxy.address);
    // await comp.

    const Oracle1e18Factory = await ethers.getContractFactory("VCNotePriceOracle");
    const rwaOracle1e18 = await Oracle1e18Factory.deploy(rwa.address);
    const noteOracle1e18 = await Oracle1e18Factory.deploy(note.address);

    await oracle.setOracle(cRwaProxy.address, rwaOracle1e18.address)
    await oracle.setOracle(cNoteProxy.address, noteOracle1e18.address)

    await comp_clm._setPriceOracle(oracle.address)

    await comp_clm._setMarketBorrowCaps([cNoteProxy.address], [0]);
    await comp_clm._setCollateralFactor(cRwaProxy.address, BigInt(9) * BigInt(10) ** BigInt(17));


    await rwa.mint(signer.address, BigInt(100_000_000_000) * BigInt(10) ** BigInt(18));
    await note.mint(signer.address, BigInt(100_000_000_000) * BigInt(10) ** BigInt(18));
    await note.mint(signer.address, BigInt(100_000) * BigInt(10) ** BigInt(18));

    const mintAmount = BigInt(100_000_000) * BigInt(10) ** BigInt(18);
    await note.connect(signer).approve(cNote.address, mintAmount);
    await cNote.connect(signer).mint(mintAmount);


    const _mintAmount2 = BigInt(100_000_000) * BigInt(10) ** BigInt(18);
    const _borrowAmount = BigInt(89_000_000) * BigInt(10) ** BigInt(18);
    await rwa.approve(cRwa.address, _mintAmount2);
    await cRwa.mint(_mintAmount2);
    await comp_clm.enterMarkets([cRwa.address])

    await cNote.exchangeRateCurrent()

    await cNote.borrow(_borrowAmount);
    await mine(Math.floor(5437040 / 5)); // 1 years = 5437040

    await cNote.exchangeRateCurrent()


    /////////////////////////////////////////////////
    ////////////////// DEPLOY VIVA //////////////////
    /////////////////////////////////////////////////

    const PriceOracleRouterFactory = await ethers.getContractFactory("PriceOracleRouter");
    const priceOracleRouter = await PriceOracleRouterFactory.deploy();

    const VCNotePriceOracleV1Factory = await ethers.getContractFactory("VCNotePriceOracleV1");
    const vcNotePriceOracleV1 = await VCNotePriceOracleV1Factory.deploy(cNote.address);

    const VCNotePriceOracleFactory = await ethers.getContractFactory("VCNotePriceOracle");
    const vcNotePriceOracle = await VCNotePriceOracleFactory.deploy(note.address);

    const WhitelistRouterFactory = await ethers.getContractFactory("WhitelistRouter");
    const whitelistRouter = await WhitelistRouterFactory.deploy();

    const interestRateModel = await InterestRateModelFactory.deploy(
      "10000000000000000",
      "20000000000000000",
      "1600000000000000000",
      "800000000000000000",
      signer.address
    );

    const comptroller = await ComptrollerFactory.deploy();
    const unitroller = await UnitrollerFactory.deploy();

    await unitroller._setPendingImplementation(comptroller.address);
    await comptroller._become(unitroller.address);

    comp = await ethers.getContractAt("Comptroller", unitroller.address);

    const vcNoteV1DelegateFactory = await ethers.getContractFactory("VCNoteV1");

    const vcNoteV1Impl = await vcNoteV1DelegateFactory.deploy();
    const vcNoteProxy = await CErc20DelegatorFactory.deploy(
      cNote.address,
      comp.address,
      interestRateModel.address,
      ethers.utils.parseEther("1"),
      `vcNOTE`,
      `vcNOTE`,
      18,
      signer.address,
      vcNoteV1Impl.address,
      []
    );


    const vcRwaImpl = await CErc20DelegateFactory.deploy();
    const vcRwaProxy = await CErc20DelegatorFactory.deploy(
      rwa.address,
      comp.address,
      cNoteInterestRateModel.address,
      ethers.utils.parseEther("1"),
      `vcRWA`,
      `vcRWA`,
      18,
      signer.address,
      vcRwaImpl.address,
      []
    );

    vcRwa = await ethers.getContractAt("CErc20Delegate", vcRwaProxy.address);
    vcNote = await ethers.getContractAt("VCNoteV1", vcNoteProxy.address);

    const vcNoteRouterFactory = await ethers.getContractFactory("VCNoteRouter");
    vcNoteRouter = await vcNoteRouterFactory.deploy(note.address, cNote.address, vcNoteProxy.address);

    const vivaPointFactory = await ethers.getContractFactory("VivaPoint");

    const blockNumber = await ethers.provider.getBlockNumber();
    vivaPoint = await vivaPointFactory.deploy(signer.address, blockNumber + 10);

    ////////////////////////////////////
    //            SETUP VIVA          //
    ////////////////////////////////////
    await oracle.setOracle(vcNote.address, vcNotePriceOracleV1.address);
    await oracle.setOracle(vcRwa.address, rwaOracle1e18.address);

    await comptroller._setCloseFactor(BigInt(10) ** BigInt(18));
    await comp._setLiquidationIncentive(BigInt(110) * BigInt(10) ** BigInt(16));
    await comp._setPriceOracle(oracle.address);

    await comp._supportMarket(vcNote.address);
    await comp._supportMarket(vcRwa.address);

    await comp._setCollateralFactor(vcNote.address, 0);
    await comp._setCollateralFactor(vcRwa.address, ethers.utils.parseUnits("0.9", 18));

    await vcNote._setReserveFactor(ethers.utils.parseUnits("0.2", 18));
    await vcRwa._setReserveFactor(0);

    await comp._setMarketBorrowCaps([vcNote.address], [0]);
    await comp._setMarketBorrowCaps([vcRwa.address], [1]);

    const mintAmountCol = ethers.utils.parseEther("500000");
    await note.mint(signer.address, mintAmountCol);
    await rwa.mint(signer.address, mintAmountCol);
    await rwa.approve(vcRwa.address, mintAmountCol.mul(10000));
    await vcRwa.mint(mintAmountCol);
    await comp.enterMarkets([vcRwa.address]);

    const mintAmount1 = ethers.utils.parseEther("100000");
    await note.mint(suppliers[1].address, mintAmount1);
    await note.connect(suppliers[1]).approve(vcNoteRouter.address, mintAmount1);
    await vcNoteRouter.connect(suppliers[1]).mint(mintAmount1);

    const mintAmount2 = ethers.utils.parseEther("200000");
    await note.mint(suppliers[2].address, mintAmount2);
    await note.connect(suppliers[2]).approve(vcNoteRouter.address, mintAmount2);
    await vcNoteRouter.connect(suppliers[2]).mint(mintAmount2);

    const mintAmount3 = ethers.utils.parseEther("300000");
    await note.mint(suppliers[3].address, mintAmount3);
    await note.connect(suppliers[3]).approve(vcNoteRouter.address, mintAmount3);
    await vcNoteRouter.connect(suppliers[3]).mint(mintAmount3);

    await vcNote["borrow(uint256)"](ethers.utils.parseEther("400000"));
    await mine(1000);
    await note.connect(signer).approve(vcNoteRouter.address, ethers.constants.MaxUint256);
    // check repay or not
    await vcNoteRouter.connect(signer).repayBorrow(ethers.constants.MaxUint256);
    await mine(20000);

    await vcNote.accrueInterest();
    await cNote.accrueInterest();
    await cNote.exchangeRateCurrent()
    await vcNote.exchangeRateCurrent()
    const cNoteExchangeRate = await cNote.exchangeRateStored();
    const vcNoteExchangeRate = await vcNote.exchangeRateStored();

    const totalShareBefore = ethers.utils.formatEther(await vcNote.totalSupply()).padEnd(30, " ");
    const totalShareToNoteBefore = ethers.utils.formatUnits((await vcNote.totalSupply()).mul(vcNoteExchangeRate).mul(cNoteExchangeRate), 54);
    const totalCashBefore = ethers.utils.formatEther(await vcNote.getCash()).padEnd(30, " ");
    const totalCashToNoteBefore = ethers.utils.formatUnits((await vcNote.getCash()).mul(cNoteExchangeRate), 36);
    const totalBorrowBefore = ethers.utils.formatEther(await vcNote.totalBorrows()).padEnd(30, " ");
    const totalBorrowToNoteBefore = ethers.utils.formatUnits((await vcNote.totalBorrows()).mul(cNoteExchangeRate), 36);
    const totalReserveBefore = ethers.utils.formatEther(await vcNote.totalReserves()).padEnd(30, " ");
    const totalReserveToNoteBefore = ethers.utils.formatUnits((await vcNote.totalReserves()).mul(cNoteExchangeRate), 36);


    const supplier1Balance = await vcNote.balanceOf(suppliers[1].address);
    const supplier1BalanceUnder = await vcNote.callStatic.balanceOfUnderlying(suppliers[1].address);
    const supplier2Balance = await vcNote.balanceOf(suppliers[2].address);
    const supplier2BalanceUnder = await vcNote.callStatic.balanceOfUnderlying(suppliers[2].address);
    const supplier3Balance = await vcNote.balanceOf(suppliers[3].address);
    const supplier3BalanceUnder = await vcNote.callStatic.balanceOfUnderlying(suppliers[3].address);

    let supplier1ShareBefore = ethers.utils.formatEther(supplier1Balance);
    let supplier1ShareToNoteBefore = ethers.utils.formatUnits((supplier1Balance).mul(vcNoteExchangeRate).mul(cNoteExchangeRate), 54);
    let supplier1UnderlyingBefore = ethers.utils.formatEther(supplier1BalanceUnder);
    let supplier1UnderlyingToNoteBefore = ethers.utils.formatUnits((supplier1BalanceUnder).mul(cNoteExchangeRate), 36);

    let supplier2ShareBefore = ethers.utils.formatEther(supplier2Balance);
    let supplier2ShareToNoteBefore = ethers.utils.formatUnits((supplier2Balance).mul(vcNoteExchangeRate).mul(cNoteExchangeRate), 54);
    let supplier2UnderlyingBefore = ethers.utils.formatEther(supplier2BalanceUnder);
    let supplier2UnderlyingToNoteBefore = ethers.utils.formatUnits((supplier2BalanceUnder).mul(cNoteExchangeRate), 36);

    let supplier3ShareBefore = ethers.utils.formatEther(supplier3Balance);
    let supplier3ShareToNoteBefore = ethers.utils.formatUnits((supplier3Balance).mul(vcNoteExchangeRate).mul(cNoteExchangeRate), 54);
    let supplier3UnderlyingBefore = ethers.utils.formatEther(supplier3BalanceUnder);
    let supplier3UnderlyingToNoteBefore = ethers.utils.formatUnits((supplier3BalanceUnder).mul(cNoteExchangeRate), 36);

    print("\n\n")
    print("///////////////////////////////////////////////")
    print("/////////////////// UPGRADE ///////////////////")
    print("///////////////////////////////////////////////")
    print("\n\n")

    const VCNoteV2Factory = await ethers.getContractFactory("VCNote");
    const vcNoteV2Impl = await VCNoteV2Factory.deploy();
    vcNote = await ethers.getContractAt("VCNote", vcNoteProxy.address);

    await vcNoteProxy._setImplementation(vcNoteV2Impl.address, false, []);
    await (vcNote as VCNote).reinitialize(note.address, cNote.address, vcNoteRouter.address, vivaPoint.address);
    await oracle.setOracle(vcNoteProxy.address, vcNotePriceOracle.address);

    await vivaPoint.setWhitelist(vcNote.address, true);

    let totalShareAfter;
    let totalShareToNoteAfter;
    let totalCashAfter;
    let totalCashToNoteAfter;
    let totalBorrowAfter;
    let totalBorrowToNoteAfter;
    let totalReserveAfter;
    let totalReserveToNoteAfter;

    let supplier1ShareAfter;
    let supplier1ShareToNoteAfter;
    let supplier1UnderlyingAfter;
    let supplier1UnderlyingToNoteAfter;
    let supplier2ShareAfter;
    let supplier2ShareToNoteAfter;
    let supplier2UnderlyingAfter;
    let supplier2UnderlyingToNoteAfter;
    let supplier3ShareAfter;
    let supplier3ShareToNoteAfter;
    let supplier3UnderlyingAfter;
    let supplier3UnderlyingToNoteAfter;


    {
      await vcNote.accrueInterest();
      await cNote.accrueInterest();
      await cNote.exchangeRateCurrent()
      await vcNote.exchangeRateCurrent()
      const cNoteExchangeRate = await cNote.exchangeRateStored();
      const vcNoteExchangeRate = await vcNote.exchangeRateStored();

      const supplier1Balance = await vcNote.balanceOf(suppliers[1].address);
      const supplier1BalanceUnder = await vcNote.callStatic.balanceOfUnderlying(suppliers[1].address);

      const supplier2Balance = await vcNote.balanceOf(suppliers[2].address);
      const supplier2BalanceUnder = await vcNote.callStatic.balanceOfUnderlying(suppliers[2].address);

      const supplier3Balance = await vcNote.balanceOf(suppliers[3].address);
      const supplier3BalanceUnder = await vcNote.callStatic.balanceOfUnderlying(suppliers[3].address);


      totalShareAfter = ethers.utils.formatEther(await vcNote.totalSupply()).padEnd(30, " ");
      totalShareToNoteAfter = ethers.utils.formatUnits((await vcNote.totalSupply()).mul(vcNoteExchangeRate), 36);
      totalCashAfter = ethers.utils.formatEther(await vcNote.getCash()).padEnd(30, " ");
      totalCashToNoteAfter = ethers.utils.formatEther(await vcNote.getCash());
      totalBorrowAfter = ethers.utils.formatEther(await vcNote.totalBorrows()).padEnd(30, " ");
      totalBorrowToNoteAfter = ethers.utils.formatEther(await vcNote.totalBorrows());
      totalReserveAfter = ethers.utils.formatEther(await vcNote.totalReserves()).padEnd(30, " ");
      totalReserveToNoteAfter = ethers.utils.formatEther(await vcNote.totalReserves());

      supplier1ShareAfter = ethers.utils.formatEther(supplier1Balance);
      supplier1ShareToNoteAfter = ethers.utils.formatUnits((supplier1Balance).mul(vcNoteExchangeRate), 36);
      supplier1UnderlyingAfter = ethers.utils.formatEther(supplier1BalanceUnder);
      supplier1UnderlyingToNoteAfter = ethers.utils.formatUnits(supplier1BalanceUnder, 18);

      supplier2ShareAfter = ethers.utils.formatEther(supplier2Balance);
      supplier2ShareToNoteAfter = ethers.utils.formatUnits((supplier2Balance).mul(vcNoteExchangeRate), 36);
      supplier2UnderlyingAfter = ethers.utils.formatEther(supplier2BalanceUnder);
      supplier2UnderlyingToNoteAfter = ethers.utils.formatUnits(supplier2BalanceUnder, 18);

      supplier3ShareAfter = ethers.utils.formatEther(supplier3Balance);
      supplier3ShareToNoteAfter = ethers.utils.formatUnits((supplier3Balance).mul(vcNoteExchangeRate), 36);
      supplier3UnderlyingAfter = ethers.utils.formatEther(supplier3BalanceUnder);
      supplier3UnderlyingToNoteAfter = ethers.utils.formatUnits(supplier3BalanceUnder, 18);
    }

    print([name("TOTAL"), pad("Upgrade Before"), pad("Upgrade After")]);
    printDiv();
    print([name("totalShare"), pad(totalShareBefore), pad(totalShareAfter)]);
    print([name(""), pad(`(${totalShareToNoteBefore})`), pad(`(${totalShareToNoteAfter})`)]);
    printDiv();
    print([name("totalCash"), pad(totalCashBefore), pad(totalCashAfter)]);
    print([name(""), pad(`(${totalCashToNoteBefore})`), pad(`(${totalCashToNoteAfter})`)]);
    printDiv();
    print([name("totalBorrow"), pad(totalBorrowBefore), pad(totalBorrowAfter)]);
    print([name(""), pad(`(${totalBorrowToNoteBefore})`), pad(`(${totalBorrowToNoteAfter})`)]);
    printDiv();
    print([name("totalReserve"), pad(totalReserveBefore), pad(totalReserveAfter)]);
    print([name(""), pad(`(${totalReserveToNoteBefore})`), pad(`(${totalReserveToNoteAfter})`)]);
    printDiv();
    // await vcNoteProxy
    print("\n")

    print([name("USER 1"), pad("Upgrade Before"), pad("Upgrade After")]);
    printDiv();
    print([name("Share"), pad(supplier1ShareBefore), pad(supplier1ShareAfter)]);
    print([name(""), pad(`(${supplier1ShareToNoteBefore})`), pad(`(${supplier1ShareToNoteAfter})`)]);
    printDiv();
    print([name("Underlying"), pad(supplier1UnderlyingBefore), pad(supplier1UnderlyingAfter)]);
    print([name(""), pad(`(${supplier1UnderlyingToNoteBefore})`), pad(`(${supplier1UnderlyingToNoteAfter})`)]);
    printDiv();
    print("\n")

    print([name("USER 2"), pad("Upgrade Before"), pad("Upgrade After")]);
    printDiv();
    print([name("Share"), pad(supplier2ShareBefore), pad(supplier2ShareAfter)]);
    print([name(""), pad(`(${supplier2ShareToNoteBefore})`), pad(`(${supplier2ShareToNoteAfter})`)]);
    printDiv();
    print([name("Underlying"), pad(supplier2UnderlyingBefore), pad(supplier2UnderlyingAfter)]);
    print([name(""), pad(`(${supplier2UnderlyingToNoteBefore})`), pad(`(${supplier2UnderlyingToNoteAfter})`)]);
    printDiv();
    print("\n")

    print([name("USER 3"), pad("Upgrade Before"), pad("Upgrade After")]);
    printDiv();
    print([name("Share"), pad(supplier3ShareBefore), pad(supplier3ShareAfter)]);
    print([name(""), pad(`(${supplier3ShareToNoteBefore})`), pad(`(${supplier3ShareToNoteAfter})`)]);
    printDiv();
    print([name("Underlying"), pad(supplier3UnderlyingBefore), pad(supplier3UnderlyingAfter)]);
    print([name(""), pad(`(${supplier3UnderlyingToNoteBefore})`), pad(`(${supplier3UnderlyingToNoteAfter})`)]);
    printDiv();

    /////////////////////////////////
    ///////////   vcNote State
    /////////////////////////////////
    expect(parseFloat(totalShareAfter)).eq(parseFloat(totalShareBefore));
    expect(parseFloat(totalShareToNoteAfter)).gt(parseFloat(totalShareToNoteBefore));

    expect(parseFloat(totalCashAfter)).gt(parseFloat(totalCashBefore));
    expect(parseFloat(totalCashToNoteAfter)).gt(parseFloat(totalCashToNoteBefore));

    expect(parseFloat(totalBorrowAfter)).eq(parseFloat(totalBorrowBefore));
    expect(parseFloat(totalBorrowToNoteAfter)).lte(parseFloat(totalBorrowToNoteBefore));

    expect(parseFloat(totalReserveAfter)).eq(parseFloat(totalReserveBefore));
    expect(parseFloat(totalReserveToNoteAfter)).lt(parseFloat(totalReserveToNoteBefore));

    /////////////////////////////////
    ///////////   User State
    /////////////////////////////////
    expect(parseFloat(supplier1ShareAfter)).eq(parseFloat(supplier1ShareBefore));
    expect(parseFloat(supplier1ShareToNoteAfter)).gt(parseFloat(supplier1ShareToNoteBefore));
    expect(parseFloat(supplier1UnderlyingAfter)).gt(parseFloat(supplier1UnderlyingBefore));
    expect(parseFloat(supplier1UnderlyingToNoteAfter)).gt(parseFloat(supplier1UnderlyingToNoteBefore));

    expect(parseFloat(supplier2ShareAfter)).eq(parseFloat(supplier2ShareBefore));
    expect(parseFloat(supplier2ShareToNoteAfter)).gt(parseFloat(supplier2ShareToNoteBefore));
    expect(parseFloat(supplier2UnderlyingAfter)).gt(parseFloat(supplier2UnderlyingBefore));
    expect(parseFloat(supplier2UnderlyingToNoteAfter)).gt(parseFloat(supplier2UnderlyingToNoteBefore));

    expect(parseFloat(supplier3ShareAfter)).eq(parseFloat(supplier3ShareBefore));
    expect(parseFloat(supplier3ShareToNoteAfter)).gt(parseFloat(supplier3ShareToNoteBefore));
    expect(parseFloat(supplier3UnderlyingAfter)).gt(parseFloat(supplier3UnderlyingBefore));
    expect(parseFloat(supplier3UnderlyingToNoteAfter)).gt(parseFloat(supplier3UnderlyingToNoteBefore));
  });

  it("[error] vcNoteRouter is blacklisted", async function () {
    await expect(vcNoteRouter.mint(1)).revertedWith("VCNote::doTransferIn: blacklisted")
  });

  it("mint", async function () {
    const mintAmount = ethers.utils.parseEther("100000");
    await note.mint(suppliers[4].address, mintAmount);

    const noteAmountOfVCNoteBefore = await note.balanceOf(vcNote.address);
    const cNoteAmountOfVCNoteBefore = await cNote.balanceOf(vcNote.address);
    const noteAmountOfAccountBefore = await note.balanceOf(suppliers[4].address);
    const vcNoteAmountOfAccountBefore = await vcNote.balanceOf(suppliers[4].address);

    await note.connect(suppliers[4]).approve(vcNote.address, mintAmount);
    await vcNote.connect(suppliers[4]).mint(mintAmount)

    const noteAmountOfVCNoteAfter = await note.balanceOf(vcNote.address);
    const cNoteAmountOfVCNoteAfter = await cNote.balanceOf(vcNote.address);
    const noteAmountOfAccountAfter = await note.balanceOf(suppliers[4].address);
    const vcNoteAmountOfAccountAfter = await vcNote.balanceOf(suppliers[4].address);

    printDiv();
    print([name("Mint"), pad("Before"), pad("After")]);
    printDiv();
    print([name("   NoteAmount Of VCNote"), pad(noteAmountOfVCNoteBefore.toString()), pad(noteAmountOfVCNoteAfter.toString())]);
    print([name("  cNoteAmount Of VCNote"), pad(cNoteAmountOfVCNoteBefore.toString()), pad(cNoteAmountOfVCNoteAfter.toString())]);
    print([name("  NoteAmount Of Account"), pad(noteAmountOfAccountBefore.toString()), pad(noteAmountOfAccountAfter.toString())]);
    print([name("vcNoteAmount Of Account"), pad(vcNoteAmountOfAccountBefore.toString()), pad(vcNoteAmountOfAccountAfter.toString())]);

    expect(noteAmountOfVCNoteBefore).eq(noteAmountOfVCNoteAfter);
    expect(cNoteAmountOfVCNoteBefore).lt(cNoteAmountOfVCNoteAfter);
    expect(noteAmountOfAccountBefore).eq(noteAmountOfAccountAfter.add(mintAmount));
    expect(vcNoteAmountOfAccountBefore).lt(vcNoteAmountOfAccountAfter);
  });

  it("redeem", async function () {
    const redeemAmount = await vcNote.balanceOf(suppliers[4].address);

    const noteAmountOfVCNoteBefore = await note.balanceOf(vcNote.address);
    const cNoteAmountOfVCNoteBefore = await cNote.balanceOf(vcNote.address);
    const noteAmountOfAccountBefore = await note.balanceOf(suppliers[4].address);
    const vcNoteAmountOfAccountBefore = await vcNote.balanceOf(suppliers[4].address);

    await vcNote.connect(suppliers[4]).redeem(redeemAmount);

    const noteAmountOfVCNoteAfter = await note.balanceOf(vcNote.address);
    const cNoteAmountOfVCNoteAfter = await cNote.balanceOf(vcNote.address);
    const noteAmountOfAccountAfter = await note.balanceOf(suppliers[4].address);
    const vcNoteAmountOfAccountAfter = await vcNote.balanceOf(suppliers[4].address);

    printDiv();
    print([name("Redeem"), pad("Before"), pad("After")]);
    printDiv();
    print([name("   NoteAmount Of VCNote"), pad(noteAmountOfVCNoteBefore.toString()), pad(noteAmountOfVCNoteAfter.toString())]);
    print([name("  cNoteAmount Of VCNote"), pad(cNoteAmountOfVCNoteBefore.toString()), pad(cNoteAmountOfVCNoteAfter.toString())]);
    print([name("  NoteAmount Of Account"), pad(noteAmountOfAccountBefore.toString()), pad(noteAmountOfAccountAfter.toString())]);
    print([name("vcNoteAmount Of Account"), pad(vcNoteAmountOfAccountBefore.toString()), pad(vcNoteAmountOfAccountAfter.toString())]);

    expect(noteAmountOfVCNoteBefore).eq(noteAmountOfVCNoteAfter);
    expect(cNoteAmountOfVCNoteBefore).gt(cNoteAmountOfVCNoteAfter);
    expect(noteAmountOfAccountBefore).lt(noteAmountOfAccountAfter);
    expect(vcNoteAmountOfAccountBefore).gt(vcNoteAmountOfAccountAfter);
  });

  it("borrow", async function () {
    const noteAmountOfVCNoteBefore = await note.balanceOf(vcNote.address);
    const cNoteAmountOfVCNoteBefore = await cNote.balanceOf(vcNote.address);
    const noteAmountOfAccountBefore = await note.balanceOf(suppliers[4].address);
    const vcNoteAmountOfAccountBefore = await vcNote.balanceOf(suppliers[4].address);
    const borrowAmountOfAccountBefore = await vcNote.callStatic.borrowBalanceCurrent(suppliers[4].address);

    const mintAmountCol = ethers.utils.parseEther("500000");
    await rwa.mint(suppliers[4].address, mintAmountCol);
    await rwa.connect(suppliers[4]).approve(vcRwa.address, mintAmountCol);
    await vcRwa.connect(suppliers[4]).mint(mintAmountCol);

    await comp.connect(suppliers[4]).enterMarkets([vcRwa.address]);
    const borrowAmount = ethers.utils.parseEther("100000");
    await vcNote.connect(suppliers[4])["borrow(uint256)"](borrowAmount);

    const noteAmountOfVCNoteAfter = await note.balanceOf(vcNote.address);
    const cNoteAmountOfVCNoteAfter = await cNote.balanceOf(vcNote.address);
    const noteAmountOfAccountAfter = await note.balanceOf(suppliers[4].address);
    const vcNoteAmountOfAccountAfter = await vcNote.balanceOf(suppliers[4].address);
    const borrowAmountOfAccountAfter = await vcNote.callStatic.borrowBalanceCurrent(suppliers[4].address);

    printDiv();
    print([name("Borrow"), pad("Before"), pad("After")]);
    printDiv();
    print([name("   NoteAmount Of VCNote"), pad(noteAmountOfVCNoteBefore.toString()), pad(noteAmountOfVCNoteAfter.toString())]);
    print([name("  cNoteAmount Of VCNote"), pad(cNoteAmountOfVCNoteBefore.toString()), pad(cNoteAmountOfVCNoteAfter.toString())]);
    print([name("  NoteAmount Of Account"), pad(noteAmountOfAccountBefore.toString()), pad(noteAmountOfAccountAfter.toString())]);
    print([name("vcNoteAmount Of Account"), pad(vcNoteAmountOfAccountBefore.toString()), pad(vcNoteAmountOfAccountAfter.toString())]);
    print([name("borrowAmount Of Account"), pad(borrowAmountOfAccountBefore.toString()), pad(borrowAmountOfAccountAfter.toString())]);

    expect(noteAmountOfVCNoteBefore).eq(noteAmountOfVCNoteAfter);
    expect(cNoteAmountOfVCNoteBefore).gt(cNoteAmountOfVCNoteAfter);
    expect(noteAmountOfAccountBefore).lt(noteAmountOfAccountAfter);
    expect(vcNoteAmountOfAccountBefore).eq(vcNoteAmountOfAccountAfter);
    expect(borrowAmountOfAccountBefore).eq(borrowAmountOfAccountAfter.sub(borrowAmount));
  });

  it("repay", async function () {
    const noteAmountOfVCNoteBefore = await note.balanceOf(vcNote.address);
    const cNoteAmountOfVCNoteBefore = await cNote.balanceOf(vcNote.address);
    const noteAmountOfAccountBefore = await note.balanceOf(suppliers[4].address);
    const vcNoteAmountOfAccountBefore = await vcNote.balanceOf(suppliers[4].address);
    const borrowAmountOfAccountBefore = await vcNote.callStatic.borrowBalanceCurrent(suppliers[4].address);

    await note.connect(suppliers[4]).approve(vcNote.address, ethers.constants.MaxUint256);
    await vcNote.connect(suppliers[4]).repayBorrow(ethers.constants.MaxUint256);

    const noteAmountOfVCNoteAfter = await note.balanceOf(vcNote.address);
    const cNoteAmountOfVCNoteAfter = await cNote.balanceOf(vcNote.address);
    const noteAmountOfAccountAfter = await note.balanceOf(suppliers[4].address);
    const vcNoteAmountOfAccountAfter = await vcNote.balanceOf(suppliers[4].address);
    const borrowAmountOfAccountAfter = await vcNote.callStatic.borrowBalanceCurrent(suppliers[4].address);

    printDiv();
    print([name("Repay"), pad("Before"), pad("After")]);
    printDiv();
    print([name("   NoteAmount Of VCNote"), pad(noteAmountOfVCNoteBefore.toString()), pad(noteAmountOfVCNoteAfter.toString())]);
    print([name("  cNoteAmount Of VCNote"), pad(cNoteAmountOfVCNoteBefore.toString()), pad(cNoteAmountOfVCNoteAfter.toString())]);
    print([name("  NoteAmount Of Account"), pad(noteAmountOfAccountBefore.toString()), pad(noteAmountOfAccountAfter.toString())]);
    print([name("vcNoteAmount Of Account"), pad(vcNoteAmountOfAccountBefore.toString()), pad(vcNoteAmountOfAccountAfter.toString())]);
    print([name("borrowAmount Of Account"), pad(borrowAmountOfAccountBefore.toString()), pad(borrowAmountOfAccountAfter.toString())]);

    expect(noteAmountOfVCNoteBefore).eq(noteAmountOfVCNoteAfter);
    expect(cNoteAmountOfVCNoteBefore).lt(cNoteAmountOfVCNoteAfter);
    expect(noteAmountOfAccountBefore).gt(noteAmountOfAccountAfter);
    expect(vcNoteAmountOfAccountBefore).eq(vcNoteAmountOfAccountAfter);
    expect(borrowAmountOfAccountAfter).eq(0);
  });
});

function name(value: string) {
  return value.padEnd(30, " ");
}

function pad(value: string) {
  return value.slice(0, 50).padEnd(60, " ");
}

function print(value: string[] | string) {
  if (logging) {
    if (Array.isArray(value)) {
      console.log(value.join(" | "));
    } else {
      console.log(value);
    }
  }
}

function printDiv() {
  if (logging) {
    console.log("------------------------------------------------------------------------------------------------------------------------")
  }
}