import { ethers } from "hardhat";
import { LlamaAddress } from "../types/deploy";
import { defaultAbiCoder, AbiCoder } from "@ethersproject/abi";
import { BigNumber, Contract } from "ethers";

export async function createLlamaBootstrapHelper(llama: LlamaAddress) {
    return await createLlamaHelper(llama, 1, llama.bootstrapStrategy, true, true)
}

export async function createLlamaHelper(
    llama: LlamaAddress,
    createRole: number,
    createStrategy: string,
    doVote?: boolean,
    doExecute?: boolean
) {
    const core = await ethers.getContractAt("LlamaCore", llama.llamaCore);
    const executor = await ethers.getContractAt("LlamaExecutor", llama.llamaExecutor);
    const policy = await ethers.getContractAt("LlamaPolicy", llama.llamaPolicy);
    const lens = await ethers.getContractAt("LlamaLens", llama.llamaLens);
    const vivaMS = await ethers.getContractAt("VivacityManageScript", llama.vivaManageScript) as Contract;
    const vivaGS = await ethers.getContractAt("LlamaGovernanceScript", llama.llamaGovScript) as Contract;

    const setRolePermission = async (role: number, target: Contract, functionName: string, strategy: string) => {
        const selector = target.interface.getSighash(target.interface.functions[functionName]);
        return await execute(policy, "setRolePermission", [role, {
            target: target.address,
            selector: selector,
            strategy: strategy
        }, true])
    }

    const executeVivaScript = async (datas: [string, any[]][]) => {
        const calldatas: string[] = [];
        for (const data of datas) {
            calldatas.push(vivaMS.interface.encodeFunctionData(data[0], data[1]));
        }
        return await execute(vivaMS, "multicall", [calldatas])
    }

    const executeGovScript = async (datas: [Contract, string, any[]][]) => {
        const targets = datas.map(item => item[0].address);
        const calldatas: string[] = [];
        for (const data of datas) {
            calldatas.push(data[0].interface.encodeFunctionData(data[1], data[2]));
        }
        return await execute(vivaGS, "aggregate", [targets, calldatas])
    }

    async function execute(target: Contract, functionName: string, args: any[]) {
        const calldata = target.interface.encodeFunctionData(functionName, args);
        let tx = await core.createAction(createRole, createStrategy, target.address, 0, calldata, "");
        let result = await tx.wait();
        const actionInfo = {
            id: result.events?.[0].args?.id,
            creator: result.events?.[0].args?.creator,
            creatorRole: createRole,
            strategy: createStrategy,
            target: target.address,
            value: 0,
            data: calldata
        };
        if (doVote) {
            tx = await core.castApproval(1, actionInfo, "");
            await tx.wait();
        }
        if (doVote && doExecute) {
            tx = await core.executeAction(actionInfo);
            await tx.wait();
        }
    }


    return {
        setRolePermission,
        executeVivaScript,
        executeGovScript,
        execute,
    }
}



export function getSelector(contract: Contract, functionName: string) {
    return contract.interface.getSighash(contract.interface.functions[functionName]);;
}


export function getPermission(contract: Contract, functionName: string, strategy: string) {
    return {
        target: contract.address,
        selector: getSelector(contract, functionName),
        strategy: strategy
    }
}

export function encodeRelativeStratigyConfig(config: any) {
    return defaultAbiCoder.encode(["tuple(uint64, uint64, uint64, uint16, uint16, bool, uint8, uint8, uint8[], uint8[])"], [
        [config.approvalPeriod,
        config.queuingPeriod,
        config.expirationPeriod,
        config.minApprovalPct,
        config.minDisapprovalPct,
        config.isFixedLengthApprovalPeriod,
        config.approvalRole,
        config.disapprovalRole,
        config.forceApprovalRoles,
        config.forceDisapprovalRoles]
    ])
}

export function encodeAccountConfig(config: any) {
    return defaultAbiCoder.encode(["tuple(string)"], [
        [config.name]
    ])
}

export function encodeBytes32(value: string) {
    return ethers.utils.formatBytes32String(value);
}