"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getContractByName = exports.getAddress = exports.getComptrollerImplData = exports.getCTokenDelegateData = exports.getCTokenData = exports.getErc20Data = exports.getInterestRateModelData = exports.getInterestRateModel = exports.getGovernorData = exports.getCompData = exports.getComp = exports.getPriceOracle = exports.getAnchoredView = exports.getPriceOracleProxy = exports.getGovernorBravo = exports.getGovernorAddress = exports.getErc20Address = exports.getCTokenDelegateAddress = exports.getCTokenAddress = exports.getComptrollerImpl = exports.getComptroller = exports.getMaximillion = exports.getUnitroller = exports.getTimelock = exports.getWorldContractByAddress = exports.getWorldContract = void 0;
const Utils_1 = require("./Utils");
function getContractData(world, indices) {
    return indices.reduce((value, index) => {
        if (value) {
            return value;
        }
        else {
            return index.reduce((data, el) => {
                let lowerEl = el.toLowerCase();
                if (!data) {
                    return;
                }
                else if (typeof data === 'string') {
                    return data;
                }
                else {
                    return data.find((_v, key) => key.toLowerCase().trim() === lowerEl.trim());
                }
            }, world.contractData);
        }
    }, undefined);
}
function getContractDataString(world, indices) {
    const value = getContractData(world, indices);
    if (!value || typeof value !== 'string') {
        throw new Error(`Failed to find string value by index (got ${value}): ${JSON.stringify(indices)}, index contains: ${JSON.stringify(world.contractData.toJSON())}`);
    }
    return value;
}
function getWorldContract(world, indices) {
    const address = getContractDataString(world, indices);
    return getWorldContractByAddress(world, address);
}
exports.getWorldContract = getWorldContract;
function getWorldContractByAddress(world, address) {
    const contract = world.contractIndex[address.toLowerCase()];
    if (!contract) {
        throw new Error(`Failed to find world contract by address: ${address}, index contains: ${JSON.stringify(Object.keys(world.contractIndex))}`);
    }
    return contract;
}
exports.getWorldContractByAddress = getWorldContractByAddress;
async function getTimelock(world) {
    return getWorldContract(world, [['Contracts', 'Timelock']]);
}
exports.getTimelock = getTimelock;
async function getUnitroller(world) {
    return getWorldContract(world, [['Contracts', 'Unitroller']]);
}
exports.getUnitroller = getUnitroller;
async function getMaximillion(world) {
    return getWorldContract(world, [['Contracts', 'Maximillion']]);
}
exports.getMaximillion = getMaximillion;
async function getComptroller(world) {
    return getWorldContract(world, [['Contracts', 'Comptroller']]);
}
exports.getComptroller = getComptroller;
async function getComptrollerImpl(world, comptrollerImplArg) {
    return getWorldContract(world, [['Comptroller', Utils_1.mustString(comptrollerImplArg), 'address']]);
}
exports.getComptrollerImpl = getComptrollerImpl;
function getCTokenAddress(world, cTokenArg) {
    return getContractDataString(world, [['cTokens', cTokenArg, 'address']]);
}
exports.getCTokenAddress = getCTokenAddress;
function getCTokenDelegateAddress(world, cTokenDelegateArg) {
    return getContractDataString(world, [['CTokenDelegate', cTokenDelegateArg, 'address']]);
}
exports.getCTokenDelegateAddress = getCTokenDelegateAddress;
function getErc20Address(world, erc20Arg) {
    return getContractDataString(world, [['Tokens', erc20Arg, 'address']]);
}
exports.getErc20Address = getErc20Address;
function getGovernorAddress(world, governorArg) {
    return getContractDataString(world, [['Contracts', governorArg]]);
}
exports.getGovernorAddress = getGovernorAddress;
function getGovernorBravo(world, governoBravoArg) {
    return getWorldContract(world, [['Contracts', 'GovernorBravo']]);
}
exports.getGovernorBravo = getGovernorBravo;
async function getPriceOracleProxy(world) {
    return getWorldContract(world, [['Contracts', 'PriceOracleProxy']]);
}
exports.getPriceOracleProxy = getPriceOracleProxy;
async function getAnchoredView(world) {
    return getWorldContract(world, [['Contracts', 'AnchoredView']]);
}
exports.getAnchoredView = getAnchoredView;
async function getPriceOracle(world) {
    return getWorldContract(world, [['Contracts', 'PriceOracle']]);
}
exports.getPriceOracle = getPriceOracle;
async function getComp(world, compArg) {
    return getWorldContract(world, [['COMP', 'address']]);
}
exports.getComp = getComp;
async function getCompData(world, compArg) {
    let contract = await getComp(world, compArg);
    let data = getContractData(world, [['Comp', compArg]]);
    return [contract, compArg, data];
}
exports.getCompData = getCompData;
async function getGovernorData(world, governorArg) {
    let contract = getWorldContract(world, [['Governor', governorArg, 'address']]);
    let data = getContractData(world, [['Governor', governorArg]]);
    return [contract, governorArg, data];
}
exports.getGovernorData = getGovernorData;
async function getInterestRateModel(world, interestRateModelArg) {
    return getWorldContract(world, [['InterestRateModel', Utils_1.mustString(interestRateModelArg), 'address']]);
}
exports.getInterestRateModel = getInterestRateModel;
async function getInterestRateModelData(world, interestRateModelArg) {
    let contract = await getInterestRateModel(world, interestRateModelArg);
    let data = getContractData(world, [['InterestRateModel', interestRateModelArg]]);
    return [contract, interestRateModelArg, data];
}
exports.getInterestRateModelData = getInterestRateModelData;
async function getErc20Data(world, erc20Arg) {
    let contract = getWorldContract(world, [['Tokens', erc20Arg, 'address']]);
    let data = getContractData(world, [['Tokens', erc20Arg]]);
    return [contract, erc20Arg, data];
}
exports.getErc20Data = getErc20Data;
async function getCTokenData(world, cTokenArg) {
    let contract = getWorldContract(world, [['cTokens', cTokenArg, 'address']]);
    let data = getContractData(world, [['CTokens', cTokenArg]]);
    return [contract, cTokenArg, data];
}
exports.getCTokenData = getCTokenData;
async function getCTokenDelegateData(world, cTokenDelegateArg) {
    let contract = getWorldContract(world, [['CTokenDelegate', cTokenDelegateArg, 'address']]);
    let data = getContractData(world, [['CTokenDelegate', cTokenDelegateArg]]);
    return [contract, cTokenDelegateArg, data];
}
exports.getCTokenDelegateData = getCTokenDelegateData;
async function getComptrollerImplData(world, comptrollerImplArg) {
    let contract = await getComptrollerImpl(world, comptrollerImplArg);
    let data = getContractData(world, [['Comptroller', comptrollerImplArg]]);
    return [contract, comptrollerImplArg, data];
}
exports.getComptrollerImplData = getComptrollerImplData;
function getAddress(world, addressArg) {
    if (addressArg.toLowerCase() === 'zero') {
        return '0x0000000000000000000000000000000000000000';
    }
    if (addressArg.startsWith('0x')) {
        return addressArg;
    }
    let alias = Object.entries(world.settings.aliases).find(([alias, addr]) => alias.toLowerCase() === addressArg.toLowerCase());
    if (alias) {
        return alias[1];
    }
    let account = world.accounts.find(account => account.name.toLowerCase() === addressArg.toLowerCase());
    if (account) {
        return account.address;
    }
    return getContractDataString(world, [
        ['Contracts', addressArg],
        ['cTokens', addressArg, 'address'],
        ['CTokenDelegate', addressArg, 'address'],
        ['Tokens', addressArg, 'address'],
        ['Comptroller', addressArg, 'address']
    ]);
}
exports.getAddress = getAddress;
function getContractByName(world, name) {
    return getWorldContract(world, [['Contracts', name]]);
}
exports.getContractByName = getContractByName;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29udHJhY3RMb29rdXAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvQ29udHJhY3RMb29rdXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBS0EsbUNBQXFDO0FBaUJyQyxTQUFTLGVBQWUsQ0FBQyxLQUFZLEVBQUUsT0FBbUI7SUFDeEQsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsS0FBcUIsRUFBRSxLQUFLLEVBQUUsRUFBRTtRQUNyRCxJQUFJLEtBQUssRUFBRTtZQUNULE9BQU8sS0FBSyxDQUFDO1NBQ2Q7YUFBTTtZQUNMLE9BQU8sS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQW9CLEVBQUUsRUFBRSxFQUFFLEVBQUU7Z0JBQy9DLElBQUksT0FBTyxHQUFHLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFFL0IsSUFBSSxDQUFDLElBQUksRUFBRTtvQkFDVCxPQUFPO2lCQUNSO3FCQUFNLElBQUksT0FBTyxJQUFJLEtBQUssUUFBUSxFQUFFO29CQUNuQyxPQUFPLElBQUksQ0FBQztpQkFDYjtxQkFBTTtvQkFDTCxPQUFRLElBQW9DLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxFQUFFLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxDQUFDLElBQUksRUFBRSxLQUFLLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO2lCQUM3RztZQUNILENBQUMsRUFBRSxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUM7U0FDeEI7SUFDSCxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7QUFDaEIsQ0FBQztBQUVELFNBQVMscUJBQXFCLENBQUMsS0FBWSxFQUFFLE9BQW1CO0lBQzlELE1BQU0sS0FBSyxHQUFtQixlQUFlLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBRTlELElBQUksQ0FBQyxLQUFLLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFFO1FBQ3ZDLE1BQU0sSUFBSSxL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QU8sQ0FBQyxPQUFPLENBQUM7S0FDeEI7SUFFRCxPQUFPLHFCQUFxQixDQUFDLEtBQUssRUFBRTtRQUNsQyxDQUFDLFdBQVcsRUFBRSxVQUFVLENBQUM7UUFDekIsQ0FBQyxTQUFTLEVBQUUsVUFBVSxFQUFFLFNBQVMsQ0FBQztRQUNsQyxDQUFDLGdCQUFnQixFQUFFLFVBQVUsRUFBRSxTQUFTLENBQUM7UUFDekMsQ0FBQyxRQUFRLEVBQUUsVUFBVSxFQUFFLFNBQVMsQ0FBQztRQUNqQyxDQUFDLGFBQWEsRUFBRSxVQUFVLEVBQUUsU0FBUyxDQUFDO0tBQ3ZDLENBQUMsQ0FBQztBQUNMLENBQUM7QUE1QkQsZ0NBNEJDO0FBRUQsU0FBZ0IsaUJBQWlCLENBQUMsS0FBWSxFQUFFLElBQVk7SUFDMUQsT0FBTyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDeEQsQ0FBQztBQUZELDhDQUVDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTWFwIH0gZnJvbSAnaW1tdXRhYmxlJztcblxuaW1wb3J0IHsgRXZlbnQgfSBmcm9tICcuL0V2ZW50JztcbmltcG9ydCB7IFdvcmxkIH0gZnJvbSAnLi9Xb3JsZCc7XG5pbXBvcnQgeyBDb250cmFjdCB9IGZyb20gJy4vQ29udHJhY3QnO1xuaW1wb3J0IHsgbXVzdFN0cmluZyB9IGZyb20gJy4vVXRpbHMnO1xuXG5pbXBvcnQgeyBDRXJjMjBEZWxlZ2F0ZSB9IGZyb20gJy4vQ29udHJhY3QvQ0VyYzIwRGVsZWdhdGUnO1xuaW1wb3J0IHsgQ29tcCB9IGZyb20gJy4vQ29udHJhY3QvQ29tcCc7XG5pbXBvcnQgeyBDb21wdHJvbGxlciB9IGZyb20gJy4vQ29udHJhY3QvQ29tcHRyb2xsZXInO1xuaW1wb3J0IHsgQ29tcHRyb2xsZXJJbXBsIH0gZnJvbSAnLi9Db250cmFjdC9Db21wdHJvbGxlckltcGwnO1xuaW1wb3J0IHsgQ1Rva2VuIH0gZnJvbSAnLi9Db250cmFjdC9DVG9rZW4nO1xuaW1wb3J0IHsgR292ZXJub3IgfSBmcm9tICcuL0NvbnRyYWN0L0dvdmVybm9yJztcbmltcG9ydCB7IEdvdmVybm9yQnJhdm8gfSBmcm9tICcuL0NvbnRyYWN0L0dvdmVybm9yQnJhdm8nXG5pbXBvcnQgeyBFcmMyMCB9IGZyb20gJy4vQ29udHJhY3QvRXJjMjAnO1xuaW1wb3J0IHsgSW50ZXJlc3RSYXRlTW9kZWwgfSBmcm9tICcuL0NvbnRyYWN0L0ludGVyZXN0UmF0ZU1vZGVsJztcbmltcG9ydCB7IFByaWNlT3JhY2xlIH0gZnJvbSAnLi9Db250cmFjdC9QcmljZU9yYWNsZSc7XG5pbXBvcnQgeyBUaW1lbG9jayB9IGZyb20gJy4vQ29udHJhY3QvVGltZWxvY2snO1xuaW1wb3J0IHsgQW5jaG9yZWRWaWV3IH0gZnJvbSAnLi9Db250cmFjdC9BbmNob3JlZFZpZXcnO1xuXG50eXBlIENvbnRyYWN0RGF0YUVsID0gc3RyaW5nIHwgTWFwPHN0cmluZywgb2JqZWN0PiB8IHVuZGVmaW5lZDtcblxuZnVuY3Rpb24gZ2V0Q29udHJhY3REYXRhKHdvcmxkOiBXb3JsZCwgaW5kaWNlczogc3RyaW5nW11bXSk6IENvbnRyYWN0RGF0YUVsIHtcbiAgcmV0dXJuIGluZGljZXMucmVkdWNlKCh2YWx1ZTogQ29udHJhY3REYXRhRWwsIGluZGV4KSA9PiB7XG4gICAgaWYgKHZhbHVlKSB7XG4gICAgICByZXR1cm4gdmFsdWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBpbmRleC5yZWR1Y2UoKGRhdGE6IENvbnRyYWN0RGF0YUVsLCBlbCkgPT4ge1xuICAgICAgICBsZXQgbG93ZXJFbCA9IGVsLnRvTG93ZXJDYXNlKCk7XG5cbiAgICAgICAgaWYgKCFkYXRhKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBkYXRhID09PSAnc3RyaW5nJykge1xuICAgICAgICAgIHJldHVybiBkYXRhO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiAoZGF0YSBhcyBNYXA8c3RyaW5nLCBDb250cmFjdERhdGFFbD4pLmZpbmQoKF92LCBrZXkpID0+IGtleS50b0xvd2VyQ2FzZSgpLnRyaW0oKSA9PT0gbG93ZXJFbC50cmltKCkpO1xuICAgICAgICB9XG4gICAgICB9LCB3b3JsZC5jb250cmFjdERhdGEpO1xuICAgIH1cbiAgfSwgdW5kZWZpbmVkKTtcbn1cblxuZnVuY3Rpb24gZ2V0Q29udHJhY3REYXRhU3RyaW5nKHdvcmxkOiBXb3JsZCwgaW5kaWNlczogc3RyaW5nW11bXSk6IHN0cmluZyB7XG4gIGNvbnN0IHZhbHVlOiBDb250cmFjdERhdGFFbCA9IGdldENvbnRyYWN0RGF0YSh3b3JsZCwgaW5kaWNlcyk7XG5cbiAgaWYgKCF2YWx1ZSB8fCB0eXBlb2YgdmFsdWUgIT09ICdzdHJpbmcnKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgYEZhaWxlZCB0byBmaW5kIHN0cmluZyB2YWx1ZSBieSBpbmRleCAoZ290ICR7dmFsdWV9KTogJHtKU09OLnN0cmluZ2lmeShcbiAgICAgICAgaW5kaWNlc1xuICAgICAgKX0sIGluZGV4IGNvbnRhaW5zOiAke0pTT04uc3RyaW5naWZ5KHdvcmxkLmNvbnRyYWN0RGF0YS50b0pTT04oKSl9YFxuICAgICk7XG4gIH1cblxuICByZXR1cm4gdmFsdWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRXb3JsZENvbnRyYWN0PFQ+KHdvcmxkOiBXb3JsZCwgaW5kaWNlczogc3RyaW5nW11bXSk6IFQge1xuICBjb25zdCBhZGRyZXNzID0gZ2V0Q29udHJhY3REYXRhU3RyaW5nKHdvcmxkLCBpbmRpY2VzKTtcblxuICByZXR1cm4gZ2V0V29ybGRDb250cmFjdEJ5QWRkcmVzczxUPih3b3JsZCwgYWRkcmVzcyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRXb3JsZENvbnRyYWN0QnlBZGRyZXNzPFQ+KHdvcmxkOiBXb3JsZCwgYWRkcmVzczogc3RyaW5nKTogVCB7XG4gIGNvbnN0IGNvbnRyYWN0ID0gd29ybGQuY29udHJhY3RJbmRleFthZGRyZXNzLnRvTG93ZXJDYXNlKCldO1xuXG4gIGlmICghY29udHJhY3QpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICBgRmFpbGVkIHRvIGZpbmQgd29ybGQgY29udHJhY3QgYnkgYWRkcmVzczogJHthZGRyZXNzfSwgaW5kZXggY29udGFpbnM6ICR7SlNPTi5zdHJpbmdpZnkoXG4gICAgICAgIE9iamVjdC5rZXlzKHdvcmxkLmNvbnRyYWN0SW5kZXgpXG4gICAgICApfWBcbiAgICApO1xuICB9XG5cbiAgcmV0dXJuIDxUPig8dW5rbm93bj5jb250cmFjdCk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRUaW1lbG9jayh3b3JsZDogV29ybGQpOiBQcm9taXNlPFRpbWVsb2NrPiB7XG4gIHJldHVybiBnZXRXb3JsZENvbnRyYWN0KHdvcmxkLCBbWydDb250cmFjdHMnLCAnVGltZWxvY2snXV0pO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0VW5pdHJvbGxlcih3b3JsZDogV29ybGQpOiBQcm9taXNlPENvbXB0cm9sbGVyPiB7XG4gIHJldHVybiBnZXRXb3JsZENvbnRyYWN0KHdvcmxkLCBbWydDb250cmFjdHMnLCAnVW5pdHJvbGxlciddXSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRNYXhpbWlsbGlvbih3b3JsZDogV29ybGQpOiBQcm9taXNlPENvbXB0cm9sbGVyPiB7XG4gIHJldHVybiBnZXRXb3JsZENvbnRyYWN0KHdvcmxkLCBbWydDb250cmFjdHMnLCAnTWF4aW1pbGxpb24nXV0pO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0Q29tcHRyb2xsZXIod29ybGQ6IFdvcmxkKTogUHJvbWlzZTxDb21wdHJvbGxlcj4ge1xuICByZXR1cm4gZ2V0V29ybGRDb250cmFjdCh3b3JsZCwgW1snQ29udHJhY3RzJywgJ0NvbXB0cm9sbGVyJ11dKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldENvbXB0cm9sbGVySW1wbCh3b3JsZDogV29ybGQsIGNvbXB0cm9sbGVySW1wbEFyZzogRXZlbnQpOiBQcm9taXNlPENvbXB0cm9sbGVySW1wbD4ge1xuICByZXR1cm4gZ2V0V29ybGRDb250cmFjdCh3b3JsZCwgW1snQ29tcHRyb2xsZXInLCBtdXN0U3RyaW5nKGNvbXB0cm9sbGVySW1wbEFyZyksICdhZGRyZXNzJ11dKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldENUb2tlbkFkZHJlc3Mod29ybGQ6IFdvcmxkLCBjVG9rZW5Bcmc6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBnZXRDb250cmFjdERhdGFTdHJpbmcod29ybGQsIFtbJ2NUb2tlbnMnLCBjVG9rZW5BcmcsICdhZGRyZXNzJ11dKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldENUb2tlbkRlbGVnYXRlQWRkcmVzcyh3b3JsZDogV29ybGQsIGNUb2tlbkRlbGVnYXRlQXJnOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gZ2V0Q29udHJhY3REYXRhU3RyaW5nKHdvcmxkLCBbWydDVG9rZW5EZWxlZ2F0ZScsIGNUb2tlbkRlbGVnYXRlQXJnLCAnYWRkcmVzcyddXSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRFcmMyMEFkZHJlc3Mod29ybGQ6IFdvcmxkLCBlcmMyMEFyZzogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGdldENvbnRyYWN0RGF0YVN0cmluZyh3b3JsZCwgW1snVG9rZW5zJywgZXJjMjBBcmcsICdhZGRyZXNzJ11dKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEdvdmVybm9yQWRkcmVzcyh3b3JsZDogV29ybGQsIGdvdmVybm9yQXJnOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gZ2V0Q29udHJhY3REYXRhU3RyaW5nKHdvcmxkLCBbWydDb250cmFjdHMnLCBnb3Zlcm5vckFyZ11dKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEdvdmVybm9yQnJhdm8od29ybGQ6IFdvcmxkLCBnb3Zlcm5vQnJhdm9Bcmc6IHN0cmluZyk6IFByb21pc2U8R292ZXJub3JCcmF2bz4ge1xuICByZXR1cm4gZ2V0V29ybGRDb250cmFjdCh3b3JsZCwgW1snQ29udHJhY3RzJywgJ0dvdmVybm9yQnJhdm8nXV0pXG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRQcmljZU9yYWNsZVByb3h5KHdvcmxkOiBXb3JsZCk6IFByb21pc2U8UHJpY2VPcmFjbGU+IHtcbiAgcmV0dXJuIGdldFdvcmxkQ29udHJhY3Qod29ybGQsIFtbJ0NvbnRyYWN0cycsICdQcmljZU9yYWNsZVByb3h5J11dKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEFuY2hvcmVkVmlldyh3b3JsZDogV29ybGQpOiBQcm9taXNlPEFuY2hvcmVkVmlldz4ge1xuICByZXR1cm4gZ2V0V29ybGRDb250cmFjdCh3b3JsZCwgW1snQ29udHJhY3RzJywgJ0FuY2hvcmVkVmlldyddXSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRQcmljZU9yYWNsZSh3b3JsZDogV29ybGQpOiBQcm9taXNlPFByaWNlT3JhY2xlPiB7XG4gIHJldHVybiBnZXRXb3JsZENvbnRyYWN0KHdvcmxkLCBbWydDb250cmFjdHMnLCAnUHJpY2VPcmFjbGUnXV0pO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0Q29tcChcbiAgd29ybGQ6IFdvcmxkLFxuICBjb21wQXJnOiBFdmVudFxuKTogUHJvbWlzZTxDb21wPiB7XG4gIHJldHVybiBnZXRXb3JsZENvbnRyYWN0KHdvcmxkLCBbWydDT01QJywgJ2FkZHJlc3MnXV0pO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0Q29tcERhdGEoXG4gIHdvcmxkOiBXb3JsZCxcbiAgY29tcEFyZzogc3RyaW5nXG4pOiBQcm9taXNlPFtDb21wLCBzdHJpbmcsIE1hcDxzdHJpbmcsIHN0cmluZz5dPiB7XG4gIGxldCBjb250cmFjdCA9IGF3YWl0IGdldENvbXAod29ybGQsIDxFdmVudD4oPGFueT5jb21wQXJnKSk7XG4gIGxldCBkYXRhID0gZ2V0Q29udHJhY3REYXRhKHdvcmxkLCBbWydDb21wJywgY29tcEFyZ11dKTtcblxuICByZXR1cm4gW2NvbnRyYWN0LCBjb21wQXJnLCA8TWFwPHN0cmluZywgc3RyaW5nPj4oPGFueT5kYXRhKV07XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRHb3Zlcm5vckRhdGEoXG4gIHdvcmxkOiBXb3JsZCxcbiAgZ292ZXJub3JBcmc6IHN0cmluZ1xuKTogUHJvbWlzZTxbR292ZXJub3IsIHN0cmluZywgTWFwPHN0cmluZywgc3RyaW5nPl0+IHtcbiAgbGV0IGNvbnRyYWN0ID0gZ2V0V29ybGRDb250cmFjdDxHb3Zlcm5vcj4od29ybGQsIFtbJ0dvdmVybm9yJywgZ292ZXJub3JBcmcsICdhZGRyZXNzJ11dKTtcbiAgbGV0IGRhdGEgPSBnZXRDb250cmFjdERhdGEod29ybGQsIFtbJ0dvdmVybm9yJywgZ292ZXJub3JBcmddXSk7XG5cbiAgcmV0dXJuIFtjb250cmFjdCwgZ292ZXJub3JBcmcsIDxNYXA8c3RyaW5nLCBzdHJpbmc+Pig8YW55PmRhdGEpXTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEludGVyZXN0UmF0ZU1vZGVsKFxuICB3b3JsZDogV29ybGQsXG4gIGludGVyZXN0UmF0ZU1vZGVsQXJnOiBFdmVudFxuKTogUHJvbWlzZTxJbnRlcmVzdFJhdGVNb2RlbD4ge1xuICByZXR1cm4gZ2V0V29ybGRDb250cmFjdCh3b3JsZCwgW1snSW50ZXJlc3RSYXRlTW9kZWwnLCBtdXN0U3RyaW5nKGludGVyZXN0UmF0ZU1vZGVsQXJnKSwgJ2FkZHJlc3MnXV0pO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0SW50ZXJlc3RSYXRlTW9kZWxEYXRhKFxuICB3b3JsZDogV29ybGQsXG4gIGludGVyZXN0UmF0ZU1vZGVsQXJnOiBzdHJpbmdcbik6IFByb21pc2U8W0ludGVyZXN0UmF0ZU1vZGVsLCBzdHJpbmcsIE1hcDxzdHJpbmcsIHN0cmluZz5dPiB7XG4gIGxldCBjb250cmFjdCA9IGF3YWl0IGdldEludGVyZXN0UmF0ZU1vZGVsKHdvcmxkLCA8RXZlbnQ+KDxhbnk+aW50ZXJlc3RSYXRlTW9kZWxBcmcpKTtcbiAgbGV0IGRhdGEgPSBnZXRDb250cmFjdERhdGEod29ybGQsIFtbJ0ludGVyZXN0UmF0ZU1vZGVsJywgaW50ZXJlc3RSYXRlTW9kZWxBcmddXSk7XG5cbiAgcmV0dXJuIFtjb250cmFjdCwgaW50ZXJlc3RSYXRlTW9kZWxBcmcsIDxNYXA8c3RyaW5nLCBzdHJpbmc+Pig8YW55PmRhdGEpXTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEVyYzIwRGF0YShcbiAgd29ybGQ6IFdvcmxkLFxuICBlcmMyMEFyZzogc3RyaW5nXG4pOiBQcm9taXNlPFtFcmMyMCwgc3RyaW5nLCBNYXA8c3RyaW5nLCBzdHJpbmc+XT4ge1xuICBsZXQgY29udHJhY3QgPSBnZXRXb3JsZENvbnRyYWN0PEVyYzIwPih3b3JsZCwgW1snVG9rZW5zJywgZXJjMjBBcmcsICdhZGRyZXNzJ11dKTtcbiAgbGV0IGRhdGEgPSBnZXRDb250cmFjdERhdGEod29ybGQsIFtbJ1Rva2VucycsIGVyYzIwQXJnXV0pO1xuXG4gIHJldHVybiBbY29udHJhY3QsIGVyYzIwQXJnLCA8TWFwPHN0cmluZywgc3RyaW5nPj4oPGFueT5kYXRhKV07XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRDVG9rZW5EYXRhKFxuICB3b3JsZDogV29ybGQsXG4gIGNUb2tlbkFyZzogc3RyaW5nXG4pOiBQcm9taXNlPFtDVG9rZW4sIHN0cmluZywgTWFwPHN0cmluZywgc3RyaW5nPl0+IHtcbiAgbGV0IGNvbnRyYWN0ID0gZ2V0V29ybGRDb250cmFjdDxDVG9rZW4+KHdvcmxkLCBbWydjVG9rZW5zJywgY1Rva2VuQXJnLCAnYWRkcmVzcyddXSk7XG4gIGxldCBkYXRhID0gZ2V0Q29udHJhY3REYXRhKHdvcmxkLCBbWydDVG9rZW5zJywgY1Rva2VuQXJnXV0pO1xuXG4gIHJldHVybiBbY29udHJhY3QsIGNUb2tlbkFyZywgPE1hcDxzdHJpbmcsIHN0cmluZz4+KDxhbnk+ZGF0YSldO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0Q1Rva2VuRGVsZWdhdGVEYXRhKFxuICB3b3JsZDogV29ybGQsXG4gIGNUb2tlbkRlbGVnYXRlQXJnOiBzdHJpbmdcbik6IFByb21pc2U8W0NFcmMyMERlbGVnYXRlLCBzdHJpbmcsIE1hcDxzdHJpbmcsIHN0cmluZz5dPiB7XG4gIGxldCBjb250cmFjdCA9IGdldFdvcmxkQ29udHJhY3Q8Q0VyYzIwRGVsZWdhdGU+KHdvcmxkLCBbWydDVG9rZW5EZWxlZ2F0ZScsIGNUb2tlbkRlbGVnYXRlQXJnLCAnYWRkcmVzcyddXSk7XG4gIGxldCBkYXRhID0gZ2V0Q29udHJhY3REYXRhKHdvcmxkLCBbWydDVG9rZW5EZWxlZ2F0ZScsIGNUb2tlbkRlbGVnYXRlQXJnXV0pO1xuXG4gIHJldHVybiBbY29udHJhY3QsIGNUb2tlbkRlbGVnYXRlQXJnLCA8TWFwPHN0cmluZywgc3RyaW5nPj4oPGFueT5kYXRhKV07XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRDb21wdHJvbGxlckltcGxEYXRhKFxuICB3b3JsZDogV29ybGQsXG4gIGNvbXB0cm9sbGVySW1wbEFyZzogc3RyaW5nXG4pOiBQcm9taXNlPFtDb21wdHJvbGxlckltcGwsIHN0cmluZywgTWFwPHN0cmluZywgc3RyaW5nPl0+IHtcbiAgbGV0IGNvbnRyYWN0ID0gYXdhaXQgZ2V0Q29tcHRyb2xsZXJJbXBsKHdvcmxkLCA8RXZlbnQ+KDxhbnk+Y29tcHRyb2xsZXJJbXBsQXJnKSk7XG4gIGxldCBkYXRhID0gZ2V0Q29udHJhY3REYXRhKHdvcmxkLCBbWydDb21wdHJvbGxlcicsIGNvbXB0cm9sbGVySW1wbEFyZ11dKTtcblxuICByZXR1cm4gW2NvbnRyYWN0LCBjb21wdHJvbGxlckltcGxBcmcsIDxNYXA8c3RyaW5nLCBzdHJpbmc+Pig8YW55PmRhdGEpXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEFkZHJlc3Mod29ybGQ6IFdvcmxkLCBhZGRyZXNzQXJnOiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAoYWRkcmVzc0FyZy50b0xvd2VyQ2FzZSgpID09PSAnemVybycpIHtcbiAgICByZXR1cm4gJzB4MDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMCc7XG4gIH1cblxuICBpZiAoYWRkcmVzc0FyZy5zdGFydHNXaXRoKCcweCcpKSB7XG4gICAgcmV0dXJuIGFkZHJlc3NBcmc7XG4gIH1cblxuICBsZXQgYWxpYXMgPSBPYmplY3QuZW50cmllcyh3b3JsZC5zZXR0aW5ncy5hbGlhc2VzKS5maW5kKFxuICAgIChbYWxpYXMsIGFkZHJdKSA9PiBhbGlhcy50b0xvd2VyQ2FzZSgpID09PSBhZGRyZXNzQXJnLnRvTG93ZXJDYXNlKClcbiAgKTtcbiAgaWYgKGFsaWFzKSB7XG4gICAgcmV0dXJuIGFsaWFzWzFdO1xuICB9XG5cbiAgbGV0IGFjY291bnQgPSB3b3JsZC5hY2NvdW50cy5maW5kKGFjY291bnQgPT4gYWNjb3VudC5uYW1lLnRvTG93ZXJDYXNlKCkgPT09IGFkZHJlc3NBcmcudG9Mb3dlckNhc2UoKSk7XG4gIGlmIChhY2NvdW50KSB7XG4gICAgcmV0dXJuIGFjY291bnQuYWRkcmVzcztcbiAgfVxuXG4gIHJldHVybiBnZXRDb250cmFjdERhdGFTdHJpbmcod29ybGQsIFtcbiAgICBbJ0NvbnRyYWN0cycsIGFkZHJlc3NBcmddLFxuICAgIFsnY1Rva2VucycsIGFkZHJlc3NBcmcsICdhZGRyZXNzJ10sXG4gICAgWydDVG9rZW5EZWxlZ2F0ZScsIGFkZHJlc3NBcmcsICdhZGRyZXNzJ10sXG4gICAgWydUb2tlbnMnLCBhZGRyZXNzQXJnLCAnYWRkcmVzcyddLFxuICAgIFsnQ29tcHRyb2xsZXInLCBhZGRyZXNzQXJnLCAnYWRkcmVzcyddXG4gIF0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29udHJhY3RCeU5hbWUod29ybGQ6IFdvcmxkLCBuYW1lOiBzdHJpbmcpOiBDb250cmFjdCB7XG4gIHJldHVybiBnZXRXb3JsZENvbnRyYWN0KHdvcmxkLCBbWydDb250cmFjdHMnLCBuYW1lXV0pO1xufVxuIl19