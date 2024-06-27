import { expect } from "chai";
import { ethers } from "hardhat";
import { CErc20Delegate, CToken, RedstoneOracle, VCNote, VCNotePriceOracle } from "../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { mine, time } from "@nomicfoundation/hardhat-network-helpers";
import deployFixture, { Contracts } from "../_fixture/deployFixture";
import { Fixture, loadFixture } from "ethereum-waffle";
import { DataServiceWrapper } from "@redstone-finance/evm-connector";
import { increaseTime } from "viem/actions";
import { BigNumber } from "ethers";


describe("RedstoneOracle", function () {
  this.timeout(1e8);

  let contracts: Contracts;
  let signer: SignerWithAddress;
  let users: SignerWithAddress[];
  let redstoneOracle: RedstoneOracle;

  let dataFeeds = ["ETH", "ATOM", "CANTO"];
  let dataFeedIds = dataFeeds.map(item => ethers.utils.formatBytes32String(item));
  let dataAddresses: any[];

  before(async () => {
    [signer, ...users] = await ethers.getSigners();
    contracts = await loadFixture(deployFixture);
    redstoneOracle = contracts.redstoneOracle;
    dataAddresses = [contracts.atom.address, contracts.eth.address, contracts.wcanto.address];
  })

  it("[error] setFreshTime OwnableUnauthorizedAccount", async function () {
    await expect(redstoneOracle.connect(users[0]).setFreshTime(100))
      .revertedWith("OwnableUnauthorizedAccount");
  });

  it("setFreshTime", async function () {
    await redstoneOracle.setFreshTime(100);

    expect(await redstoneOracle.freshTime()).eq(100);
  });

  it("[error] setAsset OwnableUnauthorizedAccount", async function () {
    await expect(redstoneOracle.connect(users[0]).setAssetInfo(ethers.utils.formatBytes32String("ETH"), contracts.eth.address, 18))
      .revertedWith("OwnableUnauthorizedAccount");
  });

  it("setAsset", async function () {
    await redstoneOracle.setAssetInfo(ethers.utils.formatBytes32String("ETH"), contracts.eth.address, 18);
    await redstoneOracle.setAssetInfo(ethers.utils.formatBytes32String("ATOM"), contracts.atom.address, 6);
    await redstoneOracle.setAssetInfo(ethers.utils.formatBytes32String("CANTO"), contracts.wcanto.address, 18);

    const eth = await redstoneOracle.assets(ethers.utils.formatBytes32String("ETH"));
    const atom = await redstoneOracle.assets(ethers.utils.formatBytes32String("ATOM"));
    const canto = await redstoneOracle.assets(ethers.utils.formatBytes32String("CANTO"));

    expect(eth.id).eq(ethers.utils.formatBytes32String("ETH"));
    expect(eth.addr).eq(contracts.eth.address);
    expect(eth.decimals).eq(18);

    expect(atom.id).eq(ethers.utils.formatBytes32String("ATOM"));
    expect(atom.addr).eq(contracts.atom.address);
    expect(atom.decimals).eq(6);

    expect(canto.id).eq(ethers.utils.formatBytes32String("CANTO"));
    expect(canto.addr).eq(contracts.wcanto.address);
    expect(canto.decimals).eq(18);
  });

  it("[error] setPrice InsufficientNumberOfUniqueSigners", async function () {
    const wrapper = new DataServiceWrapper({
      dataServiceId: "redstone-primary-prod",
      dataFeeds: dataFeeds,
      uniqueSignersCount: 3
    });

    const metadataTimestamp = Math.floor(wrapper.getMetadataTimestamp() / 1000);
    await time.increaseTo(metadataTimestamp);

    const redstonePayload = "0x" + (await wrapper.prepareRedstonePayload(true));

    await expect(redstoneOracle.callStatic.setPrice(dataFeedIds, redstonePayload))
      .revertedWith("InsufficientNumberOfUniqueSigners");
  });

  it("[error] setPrice SignerNotAuthorised", async function () {
    const wrapper = new DataServiceWrapper({
      dataServiceId: "redstone-primary-demo",
      dataFeeds: dataFeeds,
      uniqueSignersCount: 1
    });

    const redstonePayload = "0x" + (await wrapper.prepareRedstonePayload(true));

    // ================ action ================
    await expect(redstoneOracle.callStatic.setPrice(dataFeedIds, redstonePayload))
      .revertedWith("SignerNotAuthorised");
  });

  it("[error] setPrice PriceIsNotFresh", async function () {
    const pastRedstonePayload = "0x455448000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000048f104c3f5018f1265e9e00000002000000165f3932c421d44ee73e7ce4ac24c0b0be01870521c1b707102f1c0d6cd79fc1f19d4c7306a4d081c758197348495282e5e7b9813e23260a0f2f4bc7c60089baa1b41544f4d000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000032004dda018f1265e9e0000000200000019532639d47791206c12c5941e15487bbfd880d6c9cbdd90e7dd27b5f70cb33447d82e6fd76cd29eb1a9002e171af718b63c1f449605db813bb91a41f61d3ab2c1b43414e544f0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000fade4b018f1265e9e00000002000000174e4f82dfcfeb9bb676d57c91a2aed155ff0762cd4175b22d47128323f96598f4ef82b0870a843006631e055f68a399aa2adf5e4979bffcfe40a12e351afa6381c00033137313430303036383536313723302e332e362372656473746f6e652d6d61696e2d64656d6f5f5f000028000002ed57011e0000";

    // ================ action ================
    await expect(redstoneOracle.callStatic.setPrice(dataFeedIds, pastRedstonePayload))
      .revertedWith("PriceIsNotFresh");
  });

  it("[error] setPrice AssetIsNotSet", async function () {
    const wrapper = new DataServiceWrapper({
      dataServiceId: "redstone-primary-prod",
      dataFeeds: ["BTC"],
      uniqueSignersCount: 5
    });

    const redstonePayload = "0x" + (await wrapper.prepareRedstonePayload(true));

    // ================ action ================
    await expect(redstoneOracle.callStatic.setPrice([ethers.utils.formatBytes32String("BTC")], redstonePayload))
      .revertedWith("AssetIsNotSet");
  });

  it("setPrice", async function () {
    const wrapper = new DataServiceWrapper({
      dataServiceId: "redstone-primary-prod",
      dataFeeds: dataFeeds,
      uniqueSignersCount: 5
    });

    const redstonePayload = "0x" + (await wrapper.prepareRedstonePayload(true));

    await redstoneOracle.setPrice(dataFeedIds, redstonePayload);
  });

  it("[error] getPrice PriceIsNotSet", async function () {
    await expect(redstoneOracle.getPrice("0x0000000000000000000000000000000000000000")).revertedWith("PriceIsNotSet");
  });

  it("getPrice", async function () {
    const expScale = ethers.utils.parseUnits("1", 18);

    const ethPrice = await redstoneOracle.getPrice(contracts.eth.address);
    const atomPrice = await redstoneOracle.getPrice(contracts.atom.address);
    const cantoPrice = await redstoneOracle.getPrice(contracts.wcanto.address);

    const ethAmount = ethers.utils.parseUnits("1", 18);
    const atomAmount = ethers.utils.parseUnits("1", 6);
    const cantoAmount = ethers.utils.parseUnits("1", 18);

    const ethValue = ethPrice.mul(ethAmount).div(expScale);
    const atomValue = atomPrice.mul(atomAmount).div(expScale);
    const cantoValue = cantoPrice.mul(cantoAmount).div(expScale);

    // $100 < 1eth < $100000   
    expect(ethValue).gt(ethers.utils.parseUnits("100", 18));
    expect(ethValue).lt(ethers.utils.parseUnits("100000", 18));

    // $0.1 < 1atom < $1000   
    expect(atomValue).gt(ethers.utils.parseUnits("0.1", 18));
    expect(atomValue).lt(ethers.utils.parseUnits("1000", 18));

    // $0.01 < 1canto < $100   
    expect(cantoValue).gt(ethers.utils.parseUnits("0.01", 18));
    expect(cantoValue).lt(ethers.utils.parseUnits("100", 18));
  });

  it("getUnderlyingPrice", async function () {
    const expScale = ethers.utils.parseUnits("1", 18);

    const ethPrice = await redstoneOracle.getUnderlyingPrice(contracts.cETH.address);
    const atomPrice = await redstoneOracle.getUnderlyingPrice(contracts.cATOM.address);
    const cantoPrice = await redstoneOracle.getUnderlyingPrice(contracts.cCANTO.address);

    const ethAmount = ethers.utils.parseUnits("1", 18);
    const atomAmount = ethers.utils.parseUnits("1", 6);
    const cantoAmount = ethers.utils.parseUnits("1", 18);

    const ethValue = ethPrice.mul(ethAmount).div(expScale);
    const atomValue = atomPrice.mul(atomAmount).div(expScale);
    const cantoValue = cantoPrice.mul(cantoAmount).div(expScale);

    // $100 < 1eth < $100000   
    expect(ethValue).gt(ethers.utils.parseUnits("100", 18));
    expect(ethValue).lt(ethers.utils.parseUnits("100000", 18));

    // $0.1 < 1atom < $1000
    expect(atomValue).gt(ethers.utils.parseUnits("0.1", 18));
    expect(atomValue).lt(ethers.utils.parseUnits("1000", 18));

    // $0.01 < 1canto < $100
    expect(cantoValue).gt(ethers.utils.parseUnits("0.01", 18));
    expect(cantoValue).lt(ethers.utils.parseUnits("100", 18));
  });


  it("[error] getPrice PriceIsNotFresh", async function () {
    const freshTime = await redstoneOracle.freshTime();
    await time.increase(freshTime.add(10));

    await expect(redstoneOracle.getPrice(contracts.atom.address)).revertedWith("PriceIsNotFresh");
  });
});
