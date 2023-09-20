// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";

async function main({ address }: { address: Record<string, any> }) {
  const [signer] = await ethers.getSigners();
  const _address: Record<string, Record<string, string>> = {};

  const CErc20DelegateFactory = await ethers.getContractFactory('CErc20Delegate');
  const CErc20DelegatorFactory = await ethers.getContractFactory("CErc20Delegator");


  const cNoteImpl = await CErc20DelegateFactory.deploy();
  const cNoteProxy = await CErc20DelegatorFactory.deploy(
    address.tokens.note, // market.address
    address.Unitroller,
    address.interestRateModel.DefaultJumpRateModelV2,
    ethers.utils.parseEther("1"),
    "cNote",
    "cNote",
    18,
    signer.address,
    cNoteImpl.address,
    []
  );
  _address["cNote"] = {
    proxy: cNoteProxy.address,
    impl: cNoteImpl.address
  }

  const ccNoteImpl = await CErc20DelegateFactory.deploy();
  const ccNoteProxy = await CErc20DelegatorFactory.deploy(
    cNoteProxy.address, // market.address
    address.Unitroller,
    address.interestRateModel.DefaultJumpRateModelV2,
    ethers.utils.parseEther("1"),
    "cNote",
    "cNote",
    18,
    signer.address,
    ccNoteImpl.address,
    []
  );
  _address["ccNote"] = {
    proxy: ccNoteProxy.address,
    impl: ccNoteImpl.address
  }

  return { ctoken: _address }
}

export default main;