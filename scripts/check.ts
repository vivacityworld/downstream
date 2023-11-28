import { ethers } from "hardhat";

async function main() {
  const [signer] = await ethers.getSigners();
  const _address: Record<string, Record<string, string>> = {};


  ////////////////////////////////
  //            DEPLOY          //
  ////////////////////////////////

  // const vcNotePriceOracle = await ethers.getContractAt("VCNotePriceOracle", "0xfcC352EcB42253350b0a2c0D1FF18073CB98C558");


  // const result = await vcNotePriceOracle.getUnderlyingPrice("0x45D36aD3a67a29F36F06DbAB1418F2e8Fa916Eea");

  // console.log(result);

  // const comp = await ethers.getContractAt("Comptroller", "0x9514c07bC6e80B652e4264E64f589C59065C231f");
  // const ceth = await ethers.getContractAt("CEther", "0x260fCD909ab9dfF97B03591F83BEd5bBfc89A571");
  // console.log(await comp.getAllMarkets());
  // console.log(await comp.markets(ceth.address));
  // console.log(await ceth.comptroller());


  const comp = await ethers.getContractAt("Unitroller", "0xFf64a8Ab86b0B56c2487DB9EBF630B8863a66620");
  const vcnote = await ethers.getContractAt("CToken", "0x45D36aD3a67a29F36F06DbAB1418F2e8Fa916Eea");


  console.log("comptroller:      ", await comp.comptrollerImplementation());
  console.log("interestRateModel ", await vcnote.interestRateModel());


}

main();