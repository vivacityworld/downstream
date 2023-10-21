import { ethers } from "hardhat";

import { LlamaFrameworkAddress } from "../../types/deploy";

async function main(): Promise<{ llamaFramework: LlamaFrameworkAddress }> {

  ////////////////////////////////
  //      DEPLOY Llama Core     //
  ////////////////////////////////
  const LlamaCore = await ethers.getContractFactory("LlamaCore");
  const LlamaAccount = await ethers.getContractFactory("LlamaAccount");
  const LlamaPolicy = await ethers.getContractFactory("LlamaPolicy");
  const LlamaPolicyMetadata = await ethers.getContractFactory("LlamaPolicyMetadata");
  const LlamaFactory = await ethers.getContractFactory("LlamaFactory");
  const LlamaLens = await ethers.getContractFactory("LlamaLens");

  const llamaCore = await LlamaCore.deploy();
  const llamaAccount = await LlamaAccount.deploy();
  const llamaPolicy = await LlamaPolicy.deploy();
  const llamaPolicyMetadata = await LlamaPolicyMetadata.deploy();
  const llamaFactory = await LlamaFactory.deploy(llamaCore.address, llamaPolicy.address, llamaPolicyMetadata.address);
  const llamaLens = await LlamaLens.deploy(llamaFactory.address);


  ////////////////////////////////
  //    DEPLOY Llama Strategy   //
  ////////////////////////////////
  const LlamaAbsolutePeerReview = await ethers.getContractFactory("LlamaAbsolutePeerReview");
  const LlamaAbsoluteQuorum = await ethers.getContractFactory("LlamaAbsoluteQuorum");
  const LlamaRelativeHolderQuorum = await ethers.getContractFactory("LlamaRelativeHolderQuorum");
  const LlamaRelativeQuantityQuorum = await ethers.getContractFactory("LlamaRelativeQuantityQuorum");
  const LlamaRelativeUniqueHolderQuorum = await ethers.getContractFactory("LlamaRelativeUniqueHolderQuorum");

  const llamaAbsolutePeerReview = await LlamaAbsolutePeerReview.deploy();
  const llamaAbsoluteQuorum = await LlamaAbsoluteQuorum.deploy();
  const llamaRelativeHolderQuorum = await LlamaRelativeHolderQuorum.deploy();
  const llamaRelativeQuantityQuorum = await LlamaRelativeQuantityQuorum.deploy();
  const llamaRelativeUniqueHolderQuorum = await LlamaRelativeUniqueHolderQuorum.deploy();

  const address = {
    llamaCore: llamaCore.address,
    llamaAccount: llamaAccount.address,
    llamaPolicy: llamaPolicy.address,
    llamaPolicyMetadata: llamaPolicyMetadata.address,
    llamaFactory: llamaFactory.address,
    llamaLens: llamaLens.address,
    llamaAbsolutePeerReview: llamaAbsolutePeerReview.address,
    llamaAbsoluteQuorum: llamaAbsoluteQuorum.address,
    llamaRelativeHolderQuorum: llamaRelativeHolderQuorum.address,
    llamaRelativeQuantityQuorum: llamaRelativeQuantityQuorum.address,
    llamaRelativeUniqueHolderQuorum: llamaRelativeUniqueHolderQuorum.address,
  }

  return {
    llamaFramework: address
  }
}

export default main;