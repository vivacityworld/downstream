import { ethers } from "hardhat";

async function main() {
  const [signer] = await ethers.getSigners();
  const _address: Record<string, Record<string, string>> = {};


  ////////////////////////////////
  //            DEPLOY          //
  ////////////////////////////////

  const vcNotePriceOracle = await ethers.getContractAt("VCNotePriceOracle", "0xfcC352EcB42253350b0a2c0D1FF18073CB98C558");
  const result = await vcNotePriceOracle.getUnderlyingPrice("0x45D36aD3a67a29F36F06DbAB1418F2e8Fa916Eea");

  console.log(result);


}

main();