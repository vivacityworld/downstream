import { ethers } from "hardhat";


export async function deploy(contract: string, args: any[]) {
    const Factory = await ethers.getContractFactory(contract);
    const deployed = await (await Factory.deploy(...args)).deployed();
    logDeployed(contract, deployed.address)
    return deployed;
}

export function logDeployed(contract: string, address: string) {
    console.log(`[Deployed] ${contract}${" ".repeat(35 - contract.length)}: `, address);
}