import { ethers } from "hardhat";
import { deploy } from "../helper";

async function main() {

  ////////////////////////////////
  //      DEPLOY Llama Core     //
  ////////////////////////////////
  const llamaCore = await deploy("LlamaCore", []);
  const llamaAccount = await deploy("LlamaAccount", []);
  const llamaPolicy = await deploy("LlamaPolicy", []);
  const llamaPolicyMetadata = await deploy("LlamaPolicyMetadata", []);
  const llamaFactory = await deploy("LlamaFactory", [llamaCore.address, llamaPolicy.address, llamaPolicyMetadata.address]);
  const llamaLens = await deploy("LlamaLens", [llamaFactory.address]);

  ////////////////////////////////
  //    DEPLOY Llama Strategy   //
  ////////////////////////////////
  const llamaAbsolutePeerReview = await deploy("LlamaAbsolutePeerReview", []);
  const llamaAbsoluteQuorum = await deploy("LlamaAbsoluteQuorum", []);
  const llamaRelativeHolderQuorum = await deploy("LlamaRelativeHolderQuorum", []);
  const llamaRelativeQuantityQuorum = await deploy("LlamaRelativeQuantityQuorum", []);
  const llamaRelativeUniqueHolderQuorum = await deploy("LlamaRelativeUniqueHolderQuorum", []);

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