"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCoreValue = exports.getFetchers = exports.getStringV = exports.getArrayV = exports.getMapV = exports.getPercentV = exports.getExpNumberV = exports.getNumberV = exports.getAddressV = exports.getBoolV = exports.mapValue = exports.getEventV = void 0;
const Value_1 = require("./Value");
const Command_1 = require("./Command");
const UserValue_1 = require("./Value/UserValue");
const ComptrollerValue_1 = require("./Value/ComptrollerValue");
const ComptrollerImplValue_1 = require("./Value/ComptrollerImplValue");
const UnitrollerValue_1 = require("./Value/UnitrollerValue");
const CTokenValue_1 = require("./Value/CTokenValue");
const CTokenDelegateValue_1 = require("./Value/CTokenDelegateValue");
const Erc20Value_1 = require("./Value/Erc20Value");
const MCDValue_1 = require("./Value/MCDValue");
const InterestRateModelValue_1 = require("./Value/InterestRateModelValue");
const PriceOracleValue_1 = require("./Value/PriceOracleValue");
const PriceOracleProxyValue_1 = require("./Value/PriceOracleProxyValue");
const AnchoredViewValue_1 = require("./Value/AnchoredViewValue");
const TimelockValue_1 = require("./Value/TimelockValue");
const MaximillionValue_1 = require("./Value/MaximillionValue");
const CompValue_1 = require("./Value/CompValue");
const GovernorValue_1 = require("./Value/GovernorValue");
const GovernorBravoValue_1 = require("./Value/GovernorBravoValue");
const ContractLookup_1 = require("./ContractLookup");
const Utils_1 = require("./Utils");
const Encoding_1 = require("./Encoding");
const bignumber_js_1 = require("bignumber.js");
const EventBuilder_1 = require("./EventBuilder");
const web3_utils_1 = require("web3-utils");
const expMantissa = new bignumber_js_1.BigNumber('1000000000000000000');
function getSigFigs(value) {
    let str = value.toString();
    str = str.replace(/e\d+/, ''); // Remove e01
    str = str.replace(/\./, ''); // Remove decimal point
    return str.length;
}
async function getEventV(world, event) {
    return new Value_1.EventV(event);
}
exports.getEventV = getEventV;
// TODO: We may want to handle simple values -> complex values at the parser level
//       This is currently trying to parse simple values as simple or complex values,
//       and this is because items like `Some` could work either way.
async function mapValue(world, event, simple, complex, type) {
    let simpleErr;
    let val;
    if (typeof event === 'string') {
        try {
            return simple(event);
        }
        catch (err) {
            // Collect the error, but fallback to a complex expression
            simpleErr = err;
        }
    }
    try {
        val = await complex(world, event);
    }
    catch (complexErr) {
        // If we had an error before and this was the fallback, now throw that one
        if (simpleErr) {
            throw simpleErr;
        }
        else {
            throw complexErr;
        }
    }
    if (!(val instanceof type)) {
        throw new Error(`Expected "${type.name}" from event "${event.toString()}", was: "${val.toString()}"`);
    }
    // We just did a typecheck above...
    return val;
}
exports.mapValue = mapValue;
async function getBoolV(world, event) {
    return mapValue(world, event, str => {
        const lower = str.trim().toLowerCase();
        if (lower == 'true' || lower == 't' || lower == '1') {
            return new Value_1.BoolV(true);
        }
        else {
            return new Value_1.BoolV(false);
        }
    }, getCoreValue, Value_1.BoolV);
}
exports.getBoolV = getBoolV;
async function getAddressV(world, event) {
    return mapValue(world, event, str => new Value_1.AddressV(ContractLookup_1.getAddress(world, str)), async (currWorld, val) => {
        const coreVal = await getCoreValue(currWorld, val);
        if (coreVal instanceof Value_1.StringV) {
            return new Value_1.AddressV(coreVal.val);
        }
        else {
            return coreVal;
        }
    }, Value_1.AddressV);
}
exports.getAddressV = getAddressV;
function strToNumberV(str) {
    if (isNaN(Number(str))) {
        throw 'not a number';
    }
    return new Value_1.NumberV(str);
}
function strToExpNumberV(str) {
    const r = new bignumber_js_1.BigNumber(str);
    return new Value_1.NumberV(r.multipliedBy(expMantissa).toFixed());
}
async function getNumberV(world, event) {
    return mapValue(world, event, strToNumberV, getCoreValue, Value_1.NumberV);
}
exports.getNumberV = getNumberV;
async function getExpNumberV(world, event) {
    let res = await mapValue(world, event, strToNumberV, getCoreValue, Value_1.NumberV);
    const r = new bignumber_js_1.BigNumber(res.val);
    return new Value_1.ExpNumberV(r.multipliedBy(expMantissa).toFixed());
}
exports.getExpNumberV = getExpNumberV;
async function getPercentV(world, event) {
    let res = await getExpNumberV(world, event);
    return new Value_1.PercentV(res.val);
}
exports.getPercentV = getPercentV;
// Note: MapV does not currently parse its contents
async function getMapV(world, event) {
    const res = {};
    await Promise.all(Utils_1.mustArray(event).map(async (e) => {
        if (Array.isArray(e) && e.length === 2 && typeof e[0] === 'string') {
            const [key, valueEvent] = e;
            let value;
            if (typeof valueEvent === 'string') {
                value = new Value_1.StringV(valueEvent);
            }
            else {
                value = await getCoreValue(world, valueEvent);
            }
            res[key] = value;
        }
        else {
            throw new Error(`Expected all string pairs for MapV from ${event.toString()}, got: ${e.toString()}`);
        }
    }));
    return new Value_1.MapV(res);
}
exports.getMapV = getMapV;
function getArrayV(fetcher) {
    return async (world, event) => {
        const res = await Promise.all(Utils_1.mustArray(event).filter((x) => x !== 'List').map(e => fetcher(world, e)));
        return new Value_1.ArrayV(res);
    };
}
exports.getArrayV = getArrayV;
async function getStringV(world, event) {
    return mapValue(world, event, str => new Value_1.StringV(str), getCoreValue, Value_1.StringV);
}
exports.getStringV = getStringV;
async function getEtherBalance(world, address) {
    let balance = await world.web3.eth.getBalance(address);
    return new Value_1.NumberV(balance);
}
const fetchers = [
    new Command_1.Fetcher(`
      #### True

      * "True" - Returns true
    `, 'True', [], async (world, {}) => new Value_1.BoolV(true)),
    new Command_1.Fetcher(`
      #### False

      * "False" - Returns false
    `, 'False', [], async (world, {}) => new Value_1.BoolV(false)),
    new Command_1.Fetcher(`
      #### Zero

      * "Zero" - Returns 0
    `, 'Zero', [], async (world, {}) => strToNumberV('0')),
    new Command_1.Fetcher(`
      #### UInt96Max

      * "UInt96Max" - Returns 2^96 - 1
    `, 'UInt96Max', [], async (world, {}) => new Value_1.NumberV('79228162514264337593543950335')),
    new Command_1.Fetcher(`
      #### UInt256Max

      * "UInt256Max" - Returns 2^256 - 1
    `, 'UInt256Max', [], async (world, {}) => new Value_1.NumberV('115792089237316195423570985008687907853269984665640564039457584007913129639935')),
    new Command_1.Fetcher(`
      #### Some

      * "Some" - Returns 100e18
    `, 'Some', [], async (world, {}) => strToNumberV('100e18')),
    new Command_1.Fetcher(`
      #### Little

      * "Little" - Returns 100e10
    `, 'Little', [], async (world, {}) => strToNumberV('100e10')),
    new Command_1.Fetcher(`
      #### Exactly

      * "Exactly <Amount>" - Returns a strict numerical value
        * E.g. "Exactly 5.0"
    `, 'Exactly', [new Command_1.Arg('amt', getEventV)], async (world, { amt }) => getNumberV(world, amt.val)),
    new Command_1.Fetcher(`
      #### Hex

      * "Hex <HexVal>" - Returns a byte string with given hex value
        * E.g. "Hex \"0xffff\""
    `, 'Hex', [new Command_1.Arg('hexVal', getEventV)], async (world, { hexVal }) => getStringV(world, hexVal.val)),
    new Command_1.Fetcher(`
      #### String

      * "String <Str>" - Returns a string literal
        * E.g. "String MyString"
    `, 'String', [new Command_1.Arg('str', getEventV)], async (world, { str }) => getStringV(world, str.val)),
    new Command_1.Fetcher(`
      #### Exp

      * "Exp <Amount>" - Returns the mantissa for a given exp
        * E.g. "Exp 5.5"
    `, 'Exp', [new Command_1.Arg('amt', getEventV)], async (world, { amt }) => getExpNumberV(world, amt.val)),
    new Command_1.Fetcher(`
      #### Neg

      * "Neg <Amount>" - Returns the amount subtracted from zero
        * E.g. "Neg amount"
    `, 'Neg', [new Command_1.Arg('amt', getEventV)], async (world, { amt }) => new Value_1.NumberV(0).sub(await getNumberV(world, amt.val))),
    new Command_1.Fetcher(`
      #### Precisely

      * "Precisely <Amount>" - Matches a number to given number of significant figures
        * E.g. "Precisely 5.1000" - Matches to 5 sig figs
    `, 'Precisely', [new Command_1.Arg('amt', getStringV)], async (world, { amt }) => new Value_1.PreciseV(Encoding_1.toEncodableNum(amt.val), getSigFigs(amt.val))),
    new Command_1.Fetcher(`
      #### Anything

      * "Anything" - Matches any value for assertions
    `, 'Anything', [], async (world, {}) => new Value_1.AnythingV()),
    new Command_1.Fetcher(`
      #### Nothing

      * "Nothing" - Matches no values and is nothing.
    `, 'Nothing', [], async (world, {}) => new Value_1.NothingV()),
    new Command_1.Fetcher(`
      #### Address

      * "Address arg:<Address>" - Returns an address
    `, 'Address', [new Command_1.Arg('addr', getAddressV)], async (world, { addr }) => addr),
    new Command_1.Fetcher(`
      #### Number

      * "Number arg:<Number>" - Returns a number
    `, 'Number', [new Command_1.Arg('num', getNumberV)], async (world, { num }) => num),
    new Command_1.Fetcher(`
    #### StorageAt

    * "StorageAt addr:<Address> slot:<Number> start:<Number>, valType:<VToCastTo>" - Returns bytes at storage slot
    `, 'StorageAt', [
        new Command_1.Arg('addr', getAddressV),
        new Command_1.Arg('slot', getNumberV),
        new Command_1.Arg('start', getNumberV),
        new Command_1.Arg('valType', getStringV)
    ], async (world, { addr, slot, start, valType }) => {
        const startVal = start.toNumber();
        const reverse = s => s.split('').reverse().join('');
        const storage = await world.web3.eth.getStorageAt(addr.val, slot.toNumber());
        const stored = reverse(storage.slice(2)); // drop leading 0x and reverse since items are packed from the back of the slot
        // Don't forget to re-reverse
        switch (valType.val) {
            case 'bool':
                return new Value_1.BoolV(!!reverse(stored.slice(startVal, startVal + 2)));
            case 'address':
                return new Value_1.AddressV('0x' + web3_utils_1.padLeft(reverse(stored.slice(startVal, startVal + 40)), 40));
            case 'number':
                return new Value_1.NumberV(web3_utils_1.toBN('0x' + reverse(stored)).toString());
            default:
                return new Value_1.NothingV();
        }
    }),
    new Command_1.Fetcher(`
    #### StorageAtNestedMapping

    * "StorageAtNestedMapping addr:<Address> slot:<Number>, key:<address>, nestedKey:<address>, valType:<VToCastTo>" - Returns bytes at storage slot
    `, 'StorageAtNestedMapping', [
        new Command_1.Arg('addr', getAddressV),
        new Command_1.Arg('slot', getNumberV),
        new Command_1.Arg('key', getAddressV),
        new Command_1.Arg('nestedKey', getAddressV),
        new Command_1.Arg('valType', getStringV)
    ], async (world, { addr, slot, key, nestedKey, valType }) => {
        const areEqual = (v, x) => web3_utils_1.toBN(v).eq(web3_utils_1.toBN(x));
        let paddedSlot = slot.toNumber().toString(16).padStart(64, '0');
        let paddedKey = web3_utils_1.padLeft(key.val, 64);
        let newKey = web3_utils_1.sha3(paddedKey + paddedSlot);
        let val = await world.web3.eth.getStorageAt(addr.val, newKey);
        switch (valType.val) {
            case 'marketStruct':
                let isListed = areEqual(val, 1);
                let collateralFactorKey = '0x' + web3_utils_1.toBN(newKey).add(web3_utils_1.toBN(1)).toString(16);
                let collateralFactorStr = await world.web3.eth.getStorageAt(addr.val, collateralFactorKey);
                let collateralFactor = web3_utils_1.toBN(collateralFactorStr);
                let userMarketBaseKey = web3_utils_1.padLeft(web3_utils_1.toBN(newKey).add(web3_utils_1.toBN(2)).toString(16), 64);
                let paddedSlot = web3_utils_1.padLeft(userMarketBaseKey, 64);
                let paddedKey = web3_utils_1.padLeft(nestedKey.val, 64);
                let newKeyTwo = web3_utils_1.sha3(paddedKey + paddedSlot);
                let userInMarket = await world.web3.eth.getStorageAt(addr.val, newKeyTwo);
                let isCompKey = '0x' + web3_utils_1.toBN(newKey).add(web3_utils_1.toBN(3)).toString(16);
                let isCompStr = await world.web3.eth.getStorageAt(addr.val, isCompKey);
                return new Value_1.ListV([
                    new Value_1.BoolV(isListed),
                    new Value_1.ExpNumberV(collateralFactor.toString(), 1e18),
                    new Value_1.BoolV(areEqual(userInMarket, 1)),
                    new Value_1.BoolV(areEqual(isCompStr, 1))
                ]);
            default:
                return new Value_1.NothingV();
        }
    }),
    new Command_1.Fetcher(`
    #### StorageAtMapping

    * "StorageAtMapping addr:<Address> slot:<Number>, key:<address>, valType:<VToCastTo>" - Returns bytes at storage slot
    `, 'StorageAtMapping', [
        new Command_1.Arg('addr', getAddressV),
        new Command_1.Arg('slot', getNumberV),
        new Command_1.Arg('key', getAddressV),
        new Command_1.Arg('valType', getStringV)
    ], async (world, { addr, slot, key, valType }) => {
        let paddedSlot = slot.toNumber().toString(16).padStart(64, '0');
        let paddedKey = web3_utils_1.padLeft(key.val, 64);
        let newKey = web3_utils_1.sha3(paddedKey + paddedSlot);
        let val = await world.web3.eth.getStorageAt(addr.val, newKey);
        switch (valType.val) {
            case 'list(address)':
                let p = new Array(web3_utils_1.toDecimal(val)).fill(undefined).map(async (_v, index) => {
                    let newKeySha = web3_utils_1.sha3(newKey);
                    let itemKey = web3_utils_1.toBN(newKeySha).add(web3_utils_1.toBN(index));
                    let address = await world.web3.eth.getStorageAt(addr.val, web3_utils_1.padLeft(web3_utils_1.toHex(itemKey), 40));
                    return new Value_1.AddressV(address);
                });
                let all = await Promise.all(p);
                return new Value_1.ListV(all);
            case 'bool':
                return new Value_1.BoolV(val != '0x' && val != '0x0');
            case 'address':
                return new Value_1.AddressV(val);
            case 'number':
                return new Value_1.NumberV(web3_utils_1.toBN(val).toString());
            default:
                return new Value_1.NothingV();
        }
    }),
    new Command_1.Fetcher(`
    #### BlockNumber
    * BlockNumber
    `, 'BlockNumber', [], async (world, {}) => {
        return new Value_1.NumberV(await Utils_1.getCurrentBlockNumber(world));
    }),
    new Command_1.Fetcher(`
    #### GasCounter
    * GasCounter
    `, 'GasCounter', [], async (world, {}) => new Value_1.NumberV(world.gasCounter.value)),
    new Command_1.Fetcher(`
      #### LastContract

      * "LastContract" - The address of last constructed contract
    `, 'LastContract', [], async (world, {}) => new Value_1.AddressV(world.get('lastContract'))),
    new Command_1.Fetcher(`
      #### LastBlock

      * "LastBlock" - The block of the last transaction
    `, 'LastBlock', [], async (world, {}) => {
        let invokation = world.get('lastInvokation');
        if (!invokation) {
            throw new Error(`Expected last invokation for "lastBlock" but none found.`);
        }
        if (!invokation.receipt) {
            throw new Error(`Expected last invokation to have receipt for "lastBlock" but none found.`);
        }
        return new Value_1.NumberV(invokation.receipt.blockNumber);
    }),
    new Command_1.Fetcher(`
      #### LastGas

      * "LastGas" - The gas consumed by the last transaction
    `, 'LastGas', [], async (world, {}) => {
        let invokation = world.get('lastInvokation');
        if (!invokation) {
            throw new Error(`Expected last invokation for "lastGas" but none found.`);
        }
        if (!invokation.receipt) {
            throw new Error(`Expected last invokation to have receipt for "lastGas" but none found.`);
        }
        return new Value_1.NumberV(invokation.receipt.gasUsed);
    }),
    new Command_1.Fetcher(`
      #### List

      * "List ..." - Returns a list of given elements
    `, 'List', [new Command_1.Arg('els', getCoreValue, { variadic: true, mapped: true })], async (world, { els }) => new Value_1.ListV(els)),
    new Command_1.Fetcher(`
      #### Default

      * "Default val:<Value> def:<Value>" - Returns value if truthy, otherwise default. Note: this **does** short circuit.
    `, 'Default', [new Command_1.Arg('val', getCoreValue), new Command_1.Arg('def', getEventV)], async (world, { val, def }) => {
        if (val.truthy()) {
            return val;
        }
        else {
            return await getCoreValue(world, def.val);
        }
    }),
    new Command_1.Fetcher(`
      #### Minutes

      * "Minutes minutes:<NumberV>" - Returns number of minutes in seconds
    `, 'Minutes', [new Command_1.Arg('minutes', getNumberV)], async (world, { minutes }) => {
        const minutesBn = new bignumber_js_1.BigNumber(minutes.val);
        return new Value_1.NumberV(minutesBn.times(60).toFixed(0));
    }),
    new Command_1.Fetcher(`
      #### Hours

      * "Hours hours:<NumberV>" - Returns number of hours in seconds
    `, 'Hours', [new Command_1.Arg('hours', getNumberV)], async (world, { hours }) => {
        const hoursBn = new bignumber_js_1.BigNumber(hours.val);
        return new Value_1.NumberV(hoursBn.times(3600).toFixed(0));
    }),
    new Command_1.Fetcher(`
      #### Days

      * "Days days:<NumberV>" - Returns number of days in seconds
    `, 'Days', [new Command_1.Arg('days', getNumberV)], async (world, { days }) => {
        const daysBn = new bignumber_js_1.BigNumber(days.val);
        return new Value_1.NumberV(daysBn.times(86400).toFixed(0));
    }),
    new Command_1.Fetcher(`
      #### Weeks

      * "Weeks weeks:<NumberV>" - Returns number of weeks in seconds
    `, 'Weeks', [new Command_1.Arg('weeks', getNumberV)], async (world, { weeks }) => {
        const weeksBn = new bignumber_js_1.BigNumber(weeks.val);
        return new Value_1.NumberV(weeksBn.times(604800).toFixed(0));
    }),
    new Command_1.Fetcher(`
      #### Years

      * "Years years:<NumberV>" - Returns number of years in seconds
    `, 'Years', [new Command_1.Arg('years', getNumberV)], async (world, { years }) => {
        const yearsBn = new bignumber_js_1.BigNumber(years.val);
        return new Value_1.NumberV(yearsBn.times(31536000).toFixed(0));
    }),
    new Command_1.Fetcher(`
      #### FromNow

      * "FromNow seconds:<NumberV>" - Returns future timestamp of given seconds from now
    `, 'FromNow', [new Command_1.Arg('seconds', getNumberV)], async (world, { seconds }) => {
        const secondsBn = new bignumber_js_1.BigNumber(seconds.val);
        return new Value_1.NumberV(secondsBn.plus(Utils_1.getCurrentTimestamp()).toFixed(0));
    }),
    new Command_1.Fetcher(`
      #### Now

      * "Now seconds:<NumberV>" - Returns current timestamp
    `, 'Now', [], async (world, {}) => {
        return new Value_1.NumberV(Utils_1.getCurrentTimestamp());
    }),
    new Command_1.Fetcher(`
      #### BlockTimestamp

      * "BlockTimestamp" - Returns the current block's timestamp
        * E.g. "BlockTimestamp"
    `, 'BlockTimestamp', [], async (world, {}) => {
        const { result: blockNumber } = await Utils_1.sendRPC(world, 'eth_blockNumber', []);
        const { result: block } = await Utils_1.sendRPC(world, 'eth_getBlockByNumber', [blockNumber, false]);
        return new Value_1.NumberV(parseInt(block.timestamp, 16));
    }),
    new Command_1.Fetcher(`
      #### Network

      * "Network" - Returns the current Network
    `, 'Network', [], async (world) => new Value_1.StringV(world.network)),
    new Command_1.Fetcher(`
      #### User

      * "User ...userArgs" - Returns user value
    `, 'User', [new Command_1.Arg('res', UserValue_1.getUserValue, { variadic: true })], async (world, { res }) => res, { subExpressions: UserValue_1.userFetchers() }),
    new Command_1.Fetcher(`
      #### EtherBalance

      * "EtherBalance <Address>" - Returns given address' ether balance.
    `, 'EtherBalance', [new Command_1.Arg('address', getAddressV)], (world, { address }) => getEtherBalance(world, address.val)),
    new Command_1.Fetcher(`
      #### Equal

      * "Equal given:<Value> expected:<Value>" - Returns true if given values are equal
        * E.g. "Equal (Exactly 0) Zero"
        * E.g. "Equal (CToken cZRX TotalSupply) (Exactly 55)"
        * E.g. "Equal (CToken cZRX Comptroller) (Comptroller Address)"
    `, 'Equal', [new Command_1.Arg('given', getCoreValue), new Command_1.Arg('expected', getCoreValue)], async (world, { given, expected }) => new Value_1.BoolV(expected.compareTo(world, given))),
    new Command_1.Fetcher(`
        #### EncodeParameters

        * "EncodeParameters (...argTypes:<String>) (...args:<Anything>)
          * E.g. "EncodeParameters (\"address\" \"address\") (\"0xabc\" \"0x123\")
      `, 'EncodeParameters', [
        new Command_1.Arg('argTypes', getStringV, { mapped: true }),
        new Command_1.Arg('args', getStringV, { mapped: true })
    ], async (world, { argTypes, args }) => {
        const realArgs = args.map((a, i) => {
            if (argTypes[i].val == 'address')
                return ContractLookup_1.getAddress(world, a.val);
            return a.val;
        });
        return new Value_1.StringV(world.web3.eth.abi.encodeParameters(argTypes.map(t => t.val), realArgs));
    }),
    new Command_1.Fetcher(`
      #### Unitroller

      * "Unitroller ...unitrollerArgs" - Returns unitroller value
    `, 'Unitroller', [new Command_1.Arg('res', UnitrollerValue_1.getUnitrollerValue, { variadic: true })], async (world, { res }) => res, { subExpressions: UnitrollerValue_1.unitrollerFetchers() }),
    new Command_1.Fetcher(`
      #### Comptroller

      * "Comptroller ...comptrollerArgs" - Returns comptroller value
    `, 'Comptroller', [new Command_1.Arg('res', ComptrollerValue_1.getComptrollerValue, { variadic: true })], async (world, { res }) => res, { subExpressions: ComptrollerValue_1.comptrollerFetchers() }),
    new Command_1.Fetcher(`
      #### ComptrollerImpl

      * "ComptrollerImpl ...comptrollerImplArgs" - Returns comptroller implementation value
    `, 'ComptrollerImpl', [new Command_1.Arg('res', ComptrollerImplValue_1.getComptrollerImplValue, { variadic: true })], async (world, { res }) => res, { subExpressions: ComptrollerImplValue_1.comptrollerImplFetchers() }),
    new Command_1.Fetcher(`
      #### CToken

      * "CToken ...cTokenArgs" - Returns cToken value
    `, 'CToken', [new Command_1.Arg('res', CTokenValue_1.getCTokenValue, { variadic: true })], async (world, { res }) => res, { subExpressions: CTokenValue_1.cTokenFetchers() }),
    new Command_1.Fetcher(`
      #### CTokenDelegate

      * "CTokenDelegate ...cTokenDelegateArgs" - Returns cToken delegate value
    `, 'CTokenDelegate', [new Command_1.Arg('res', CTokenDelegateValue_1.getCTokenDelegateValue, { variadic: true })], async (world, { res }) => res, { subExpressions: CTokenDelegateValue_1.cTokenDelegateFetchers() }),
    new Command_1.Fetcher(`
      #### Erc20

      * "Erc20 ...erc20Args" - Returns Erc20 value
    `, 'Erc20', [new Command_1.Arg('res', Erc20Value_1.getErc20Value, { variadic: true })], async (world, { res }) => res, { subExpressions: Erc20Value_1.erc20Fetchers() }),
    new Command_1.Fetcher(`
      #### InterestRateModel

      * "InterestRateModel ...interestRateModelArgs" - Returns InterestRateModel value
    `, 'InterestRateModel', [new Command_1.Arg('res', InterestRateModelValue_1.getInterestRateModelValue, { variadic: true })], async (world, { res }) => res, { subExpressions: InterestRateModelValue_1.interestRateModelFetchers() }),
    new Command_1.Fetcher(`
      #### PriceOracle

      * "PriceOracle ...priceOracleArgs" - Returns PriceOracle value
    `, 'PriceOracle', [new Command_1.Arg('res', PriceOracleValue_1.getPriceOracleValue, { variadic: true })], async (world, { res }) => res, { subExpressions: PriceOracleValue_1.priceOracleFetchers() }),
    new Command_1.Fetcher(`
      #### PriceOracleProxy

      * "PriceOracleProxy ...priceOracleProxyArgs" - Returns PriceOracleProxy value
    `, 'PriceOracleProxy', [new Command_1.Arg('res', PriceOracleProxyValue_1.getPriceOracleProxyValue, { variadic: true })], async (world, { res }) => res, { subExpressions: PriceOracleProxyValue_1.priceOracleProxyFetchers() }),
    new Command_1.Fetcher(`
      #### AnchoredView

      * "AnchoredView ...anchoredViewArgs" - Returns AnchoredView value
    `, 'AnchoredView', [new Command_1.Arg('res', AnchoredViewValue_1.getAnchoredViewValue, { variadic: true })], async (world, { res }) => res, { subExpressions: AnchoredViewValue_1.anchoredViewFetchers() }),
    new Command_1.Fetcher(`
      #### Timelock

      * "Timelock ...timeLockArgs" - Returns Timelock value
    `, 'Timelock', [new Command_1.Arg('res', TimelockValue_1.getTimelockValue, { variadic: true })], async (world, { res }) => res, { subExpressions: TimelockValue_1.timelockFetchers() }),
    new Command_1.Fetcher(`
      #### Maximillion

      * "Maximillion ...maximillionArgs" - Returns Maximillion value
    `, 'Maximillion', [new Command_1.Arg('res', MaximillionValue_1.getMaximillionValue, { variadic: true })], async (world, { res }) => res, { subExpressions: MaximillionValue_1.maximillionFetchers() }),
    new Command_1.Fetcher(`
      #### MCD

      * "MCD ...mcdArgs" - Returns MCD value
    `, 'MCD', [new Command_1.Arg('res', MCDValue_1.getMCDValue, { variadic: true })], async (world, { res }) => res, { subExpressions: MCDValue_1.mcdFetchers() }),
    new Command_1.Fetcher(`
      #### Comp

      * "Comp ...compArgs" - Returns Comp value
    `, 'Comp', [new Command_1.Arg('res', CompValue_1.getCompValue, { variadic: true })], async (world, { res }) => res, { subExpressions: CompValue_1.compFetchers() }),
    new Command_1.Fetcher(`
      #### Governor

      * "Governor ...governorArgs" - Returns Governor value
    `, 'Governor', [new Command_1.Arg('res', GovernorValue_1.getGovernorValue, { variadic: true })], async (world, { res }) => res, { subExpressions: GovernorValue_1.governorFetchers() }),
    new Command_1.Fetcher(`
      #### GovernorBravo

      * "GovernorBravo ...governorArgs" - Returns GovernorBravo value
    `, 'GovernorBravo', [new Command_1.Arg('res', GovernorBravoValue_1.getGovernorBravoValue, { variadic: true })], async (world, { res }) => res, { subExpressions: GovernorBravoValue_1.governorBravoFetchers() }),
];
let contractFetchers = [
    { contract: "Counter", implicit: false },
    { contract: "CompoundLens", implicit: false },
    { contract: "Reservoir", implicit: true }
];
async function getFetchers(world) {
    if (world.fetchers) {
        return { world, fetchers: world.fetchers };
    }
    let allFetchers = fetchers.concat(await Promise.all(contractFetchers.map(({ contract, implicit }) => {
        return EventBuilder_1.buildContractFetcher(world, contract, implicit);
    })));
    return { world: world.set('fetchers', allFetchers), fetchers: allFetchers };
}
exports.getFetchers = getFetchers;
async function getCoreValue(world, event) {
    let { world: nextWorld, fetchers } = await getFetchers(world);
    return await Command_1.getFetcherValue('Core', fetchers, nextWorld, event);
}
exports.getCoreValue = getCoreValue;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29yZVZhbHVlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL0NvcmVWYWx1ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFFQSxtQ0FlaUI7QUFDakIsdUNBQTBEO0FBQzFELGlEQUErRDtBQUMvRCwrREFBb0Y7QUFDcEYsdUVBQWdHO0FBQ2hHLDZEQUFpRjtBQUNqRixxREFBcUU7QUFDckUscUVBQTZGO0FBQzdGLG1EQUFrRTtBQUNsRSwrQ0FBNEQ7QUFDNUQsMkVBQXNHO0FBQ3RHLCtEQUFvRjtBQUNwRix5RUFBbUc7QUFDbkcsaUVBQXVGO0FBQ3ZGLHlEQUErRjtBQUMvRiwrREFBb0Y7QUFDcEYsaURBQStEO0FBQy9ELHlEQUEyRTtBQUMzRSxtRUFBMEY7QUFDMUYscURBQThDO0FBQzlDLG1DQUF5RjtBQUN6Rix5Q0FBNEM7QUFDNUMsK0NBQXlDO0FBQ3pDLGlEQUFzRDtBQUV0RCwyQ0FNb0I7QUFFcEIsTUFBTSxXQUFXLEdBQUcsSUFBSSx3QkFBUyxDQUFDLHFCQUFxQixDQUFDLENBQUM7QUFFekQsU0FBUyxVQUFVLENBQUMsS0FBSztJQUN2QixJQUFJLEdBQUcsR0FBRyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7SUFFM0IsR0FBRyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsYUFBYTtJQUM1QyxHQUFHLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyx1QkFBdUI7SUFFcEQsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDO0FBQ3BCLENBQUM7QUFFTSxLQUFLLFVBQVUsU0FBUyxDQUFDLEtBQVksRUFBRSxLQUFZO0lBQ3hELE9BQU8sSUFBSSxjQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDM0IsQ0FBQztBQUZELDhCQUVDO0FBRUQsa0ZBQWtGO0FBQ2xGLHFGQUFxRjtBQUNyRixxRUFBcUU7QUFDOUQsS0FBSyxV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IEV2ZW50IH0gZnJvbSAnLi9FdmVudCc7XG5pbXBvcnQgeyBXb3JsZCB9IGZyb20gJy4vV29ybGQnO1xuaW1wb3J0IHtcbiAgQWRkcmVzc1YsXG4gIEFueXRoaW5nVixcbiAgQXJyYXlWLFxuICBCb29sVixcbiAgRXZlbnRWLFxuICBFeHBOdW1iZXJWLFxuICBMaXN0VixcbiAgTWFwVixcbiAgTm90aGluZ1YsXG4gIE51bWJlclYsXG4gIFBlcmNlbnRWLFxuICBQcmVjaXNlVixcbiAgU3RyaW5nVixcbiAgVmFsdWVcbn0gZnJvbSAnLi9WYWx1ZSc7XG5pbXBvcnQgeyBBcmcsIEZldGNoZXIsIGdldEZldGNoZXJWYWx1ZSB9IGZyb20gJy4vQ29tbWFuZCc7XG5pbXBvcnQgeyBnZXRVc2VyVmFsdWUsIHVzZXJGZXRjaGVycyB9IGZyb20gJy4vVmFsdWUvVXNlclZhbHVlJztcbmltcG9ydCB7IGNvbXB0cm9sbGVyRmV0Y2hlcnMsIGdldENvbXB0cm9sbGVyVmFsdWUgfSBmcm9tICcuL1ZhbHVlL0NvbXB0cm9sbGVyVmFsdWUnO1xuaW1wb3J0IHsgY29tcHRyb2xsZXJJbXBsRmV0Y2hlcnMsIGdldENvbXB0cm9sbGVySW1wbFZhbHVlIH0gZnJvbSAnLi9WYWx1ZS9Db21wdHJvbGxlckltcGxWYWx1ZSc7XG5pbXBvcnQgeyBnZXRVbml0cm9sbGVyVmFsdWUsIHVuaXRyb2xsZXJGZXRjaGVycyB9IGZyb20gJy4vVmFsdWUvVW5pdHJvbGxlclZhbHVlJztcbmltcG9ydCB7IGNUb2tlbkZldGNoZXJzLCBnZXRDVG9rZW5WYWx1ZSB9IGZyb20gJy4vVmFsdWUvQ1Rva2VuVmFsdWUnO1xuaW1wb3J0IHsgY1Rva2VuRGVsZWdhdGVGZXRjaGVycywgZ2V0Q1Rva2VuRGVsZWdhdGVWYWx1ZSB9IGZyb20gJy4vVmFsdWUvQ1Rva2VuRGVsZWdhdGVWYWx1ZSc7XG5pbXBvcnQgeyBlcmMyMEZldGNoZXJzLCBnZXRFcmMyMFZhbHVlIH0gZnJvbSAnLi9WYWx1ZS9FcmMyMFZhbHVlJztcbmltcG9ydCB7IG1jZEZldGNoZXJzLCBnZXRNQ0RWYWx1ZSB9IGZyb20gJy4vVmFsdWUvTUNEVmFsdWUnO1xuaW1wb3J0IHsgZ2V0SW50ZXJlc3RSYXRlTW9kZWxWYWx1ZSwgaW50ZXJlc3RSYXRlTW9kZWxGZXRjaGVycyB9IGZyb20gJy4vVmFsdWUvSW50ZXJlc3RSYXRlTW9kZWxWYWx1ZSc7XG5pbXBvcnQgeyBnZXRQcmljZU9yYWNsZVZhbHVlLCBwcmljZU9yYWNsZUZldGNoZXJzIH0gZnJvbSAnLi9WYWx1ZS9QcmljZU9yYWNsZVZhbHVlJztcbmltcG9ydCB7IGdldFByaWNlT3JhY2xlUHJveHlWYWx1ZSwgcHJpY2VPcmFjbGVQcm94eUZldGNoZXJzIH0gZnJvbSAnLi9WYWx1ZS9QcmljZU9yYWNsZVByb3h5VmFsdWUnO1xuaW1wb3J0IHsgZ2V0QW5jaG9yZWRWaWV3VmFsdWUsIGFuY2hvcmVkVmlld0ZldGNoZXJzIH0gZnJvbSAnLi9WYWx1ZS9BbmNob3JlZFZpZXdWYWx1ZSc7XG5pbXBvcnQgeyBnZXRUaW1lbG9ja1ZhbHVlLCB0aW1lbG9ja0ZldGNoZXJzLCBnZXRUaW1lbG9ja0FkZHJlc3MgfSBmcm9tICcuL1ZhbHVlL1RpbWVsb2NrVmFsdWUnO1xuaW1wb3J0IHsgZ2V0TWF4aW1pbGxpb25WYWx1ZSwgbWF4aW1pbGxpb25GZXRjaGVycyB9IGZyb20gJy4vVmFsdWUvTWF4aW1pbGxpb25WYWx1ZSc7XG5pbXBvcnQgeyBnZXRDb21wVmFsdWUsIGNvbXBGZXRjaGVycyB9IGZyb20gJy4vVmFsdWUvQ29tcFZhbHVlJztcbmltcG9ydCB7IGdldEdvdmVybm9yVmFsdWUsIGdvdmVybm9yRmV0Y2hlcnMgfSBmcm9tICcuL1ZhbHVlL0dvdmVybm9yVmFsdWUnO1xuaW1wb3J0IHsgZ2V0R292ZXJub3JCcmF2b1ZhbHVlLCBnb3Zlcm5vckJyYXZvRmV0Y2hlcnMgfSBmcm9tICcuL1ZhbHVlL0dvdmVybm9yQnJhdm9WYWx1ZSc7XG5pbXBvcnQgeyBnZXRBZGRyZXNzIH0gZnJvbSAnLi9Db250cmFjdExvb2t1cCc7XG5pbXBvcnQgeyBnZXRDdXJyZW50QmxvY2tOdW1iZXIsIGdldEN1cnJlbnRUaW1lc3RhbXAsIG11c3RBcnJheSwgc2VuZFJQQyB9IGZyb20gJy4vVXRpbHMnO1xuaW1wb3J0IHsgdG9FbmNvZGFibGVOdW0gfSBmcm9tICcuL0VuY29kaW5nJztcbmltcG9ydCB7IEJpZ051bWJlciB9IGZyb20gJ2JpZ251bWJlci5qcyc7XG5pbXBvcnQgeyBidWlsZENvbnRyYWN0RmV0Y2hlciB9IGZyb20gJy4vRXZlbnRCdWlsZGVyJztcblxuaW1wb3J0IHtcbiAgcGFkTGVmdCxcbiAgc2hhMyxcbiAgdG9CTixcbiAgdG9EZWNpbWFsLFxuICB0b0hleFxufSBmcm9tICd3ZWIzLXV0aWxzJztcblxuY29uc3QgZXhwTWFudGlzc2EgPSBuZXcgQmlnTnVtYmVyKCcxMDAwMDAwMDAwMDAwMDAwMDAwJyk7XG5cbmZ1bmN0aW9uIGdldFNpZ0ZpZ3ModmFsdWUpIHtcbiAgbGV0IHN0ciA9IHZhbHVlLnRvU3RyaW5nKCk7XG5cbiAgc3RyID0gc3RyLnJlcGxhY2UoL2VcXGQrLywgJycpOyAvLyBSZW1vdmUgZTAxXG4gIHN0ciA9IHN0ci5yZXBsYWNlKC9cXC4vLCAnJyk7IC8vIFJlbW92ZSBkZWNpbWFsIHBvaW50XG5cbiAgcmV0dXJuIHN0ci5sZW5ndGg7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRFdmVudFYod29ybGQ6IFdvcmxkLCBldmVudDogRXZlbnQpOiBQcm9taXNlPEV2ZW50Vj4ge1xuICByZXR1cm4gbmV3IEV2ZW50VihldmVudCk7XG59XG5cbi8vIFRPRE86IFdlIG1heSB3YW50IHRvIGhhbmRsZSBzaW1wbGUgdmFsdWVzIC0+IGNvbXBsZXggdmFsdWVzIGF0IHRoZSBwYXJzZXIgbGV2ZWxcbi8vICAgICAgIFRoaXMgaXMgY3VycmVudGx5IHRyeWluZyB0byBwYXJzZSBzaW1wbGUgdmFsdWVzIGFzIHNpbXBsZSBvciBjb21wbGV4IHZhbHVlcyxcbi8vICAgICAgIGFuZCB0aGlzIGlzIGJlY2F1c2UgaXRlbXMgbGlrZSBgU29tZWAgY291bGQgd29yayBlaXRoZXIgd2F5LlxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG1hcFZhbHVlPFQ+KFxuICB3b3JsZDogV29ybGQsXG4gIGV2ZW50OiBFdmVudCxcbiAgc2ltcGxlOiAoc3RyaW5nKSA9PiBULFxuICBjb21wbGV4OiAoV29ybGQsIEV2ZW50KSA9PiBQcm9taXNlPFZhbHVlPixcbiAgdHlwZTogYW55XG4pOiBQcm9taXNlPFQ+IHtcbiAgbGV0IHNpbXBsZUVycjtcbiAgbGV0IHZhbDtcblxuICBpZiAodHlwZW9mIGV2ZW50ID09PSAnc3RyaW5nJykge1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gc2ltcGxlKDxzdHJpbmc+ZXZlbnQpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgLy8gQ29sbGVjdCB0aGUgZXJyb3IsIGJ1dCBmYWxsYmFjayB0byBhIGNvbXBsZXggZXhwcmVzc2lvblxuICAgICAgc2ltcGxlRXJyID0gZXJyO1xuICAgIH1cbiAgfVxuXG4gIHRyeSB7XG4gICAgdmFsID0gYXdhaXQgY29tcGxleCh3b3JsZCwgZXZlbnQpO1xuICB9IGNhdGNoIChjb21wbGV4RXJyKSB7XG4gICAgLy8gSWYgd2UgaGFkIGFuIGVycm9yIGJlZm9yZSBhbmQgdGhpcyB3YXMgdGhlIGZhbGxiYWNrLCBub3cgdGhyb3cgdGhhdCBvbmVcbiAgICBpZiAoc2ltcGxlRXJyKSB7XG4gICAgICB0aHJvdyBzaW1wbGVFcnI7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IGNvbXBsZXhFcnI7XG4gICAgfVxuICB9XG5cbiAgaWYgKCEodmFsIGluc3RhbmNlb2YgdHlwZSkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEV4cGVjdGVkIFwiJHt0eXBlLm5hbWV9XCIgZnJvbSBldmVudCBcIiR7ZXZlbnQudG9TdHJpbmcoKX1cIiwgd2FzOiBcIiR7dmFsLnRvU3RyaW5nKCl9XCJgKTtcbiAgfVxuXG4gIC8vIFdlIGp1c3QgZGlkIGEgdHlwZWNoZWNrIGFib3ZlLi4uXG4gIHJldHVybiA8VD4oPHVua25vd24+dmFsKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEJvb2xWKHdvcmxkOiBXb3JsZCwgZXZlbnQ6IEV2ZW50KTogUHJvbWlzZTxCb29sVj4ge1xuICByZXR1cm4gbWFwVmFsdWU8Qm9vbFY+KFxuICAgIHdvcmxkLFxuICAgIGV2ZW50LFxuICAgIHN0ciA9PiB7XG4gICAgICBjb25zdCBsb3dlciA9IHN0ci50cmltKCkudG9Mb3dlckNhc2UoKTtcblxuICAgICAgaWYgKGxvd2VyID09ICd0cnVlJyB8fCBsb3dlciA9PSAndCcgfHwgbG93ZXIgPT0gJzEnKSB7XG4gICAgICAgIHJldHVybiBuZXcgQm9vbFYodHJ1ZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbmV3IEJvb2xWKGZhbHNlKTtcbiAgICAgIH1cbiAgICB9LFxuICAgIGdldENvcmVWYWx1ZSxcbiAgICBCb29sVlxuICApO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0QWRkcmVzc1Yod29ybGQ6IFdvcmxkLCBldmVudDogRXZlbnQpOiBQcm9taXNlPEFkZHJlc3NWPiB7XG4gIHJldHVybiBtYXBWYWx1ZTxBZGRyZXNzVj4oXG4gICAgd29ybGQsXG4gICAgZXZlbnQsXG4gICAgc3RyID0+IG5ldyBBZGRyZXNzVihnZXRBZGRyZXNzKHdvcmxkLCBzdHIpKSxcbiAgICBhc3luYyAoY3VycldvcmxkLCB2YWwpID0+IHtcbiAgICAgIGNvbnN0IGNvcmVWYWwgPSBhd2FpdCBnZXRDb3JlVmFsdWUoY3VycldvcmxkLCB2YWwpO1xuXG4gICAgICBpZiAoY29yZVZhbCBpbnN0YW5jZW9mIFN0cmluZ1YpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBBZGRyZXNzVihjb3JlVmFsLnZhbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gY29yZVZhbDtcbiAgICAgIH1cbiAgICB9LFxuICAgIEFkZHJlc3NWXG4gICk7XG59XG5cbmZ1bmN0aW9uIHN0clRvTnVtYmVyVihzdHI6IHN0cmluZyk6IE51bWJlclYge1xuICBpZiAoaXNOYU4oTnVtYmVyKHN0cikpKSB7XG4gICAgdGhyb3cgJ25vdCBhIG51bWJlcic7XG4gIH1cblxuICByZXR1cm4gbmV3IE51bWJlclYoc3RyKTtcbn1cblxuZnVuY3Rpb24gc3RyVG9FeHBOdW1iZXJWKHN0cjogc3RyaW5nKTogTnVtYmVyViB7XG4gIGNvbnN0IHIgPSBuZXcgQmlnTnVtYmVyKHN0cik7XG5cbiAgcmV0dXJuIG5ldyBOdW1iZXJWKHIubXVsdGlwbGllZEJ5KGV4cE1hbnRpc3NhKS50b0ZpeGVkKCkpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0TnVtYmVyVih3b3JsZDogV29ybGQsIGV2ZW50OiBFdmVudCk6IFByb21pc2U8TnVtYmVyVj4ge1xuICByZXR1cm4gbWFwVmFsdWU8TnVtYmVyVj4od29ybGQsIGV2ZW50LCBzdHJUb051bWJlclYsIGdldENvcmVWYWx1ZSwgTnVtYmVyVik7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRFeHBOdW1iZXJWKHdvcmxkOiBXb3JsZCwgZXZlbnQ6IEV2ZW50KTogUHJvbWlzZTxOdW1iZXJWPiB7XG4gIGxldCByZXMgPSBhd2FpdCBtYXBWYWx1ZTxOdW1iZXJWPih3b3JsZCwgZXZlbnQsIHN0clRvTnVtYmVyViwgZ2V0Q29yZVZhbHVlLCBOdW1iZXJWKTtcblxuICBjb25zdCByID0gbmV3IEJpZ051bWJlcihyZXMudmFsKTtcblxuICByZXR1cm4gbmV3IEV4cE51bWJlclYoci5tdWx0aXBsaWVkQnkoZXhwTWFudGlzc2EpLnRvRml4ZWQoKSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRQZXJjZW50Vih3b3JsZDogV29ybGQsIGV2ZW50OiBFdmVudCk6IFByb21pc2U8TnVtYmVyVj4ge1xuICBsZXQgcmVzID0gYXdhaXQgZ2V0RXhwTnVtYmVyVih3b3JsZCwgZXZlbnQpO1xuXG4gIHJldHVybiBuZXcgUGVyY2VudFYocmVzLnZhbCk7XG59XG5cbi8vIE5vdGU6IE1hcFYgZG9lcyBub3QgY3VycmVudGx5IHBhcnNlIGl0cyBjb250ZW50c1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldE1hcFYod29ybGQ6IFdvcmxkLCBldmVudDogRXZlbnQpOiBQcm9taXNlPE1hcFY+IHtcbiAgY29uc3QgcmVzOiBvYmplY3QgPSB7fTtcblxuICBhd2FpdCBQcm9taXNlLmFsbChcbiAgICBtdXN0QXJyYXkoZXZlbnQpLm1hcChhc3luYyBlID0+IHtcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KGUpICYmIGUubGVuZ3RoID09PSAyICYmIHR5cGVvZiBlWzBdID09PSAnc3RyaW5nJykge1xuICAgICAgICBjb25zdCBba2V5LCB2YWx1ZUV2ZW50XSA9IGU7XG4gICAgICAgIGxldCB2YWx1ZTtcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZUV2ZW50ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgIHZhbHVlID0gbmV3IFN0cmluZ1YodmFsdWVFdmVudCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFsdWUgPSBhd2FpdCBnZXRDb3JlVmFsdWUod29ybGQsIDxFdmVudD52YWx1ZUV2ZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlc1trZXldID0gdmFsdWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEV4cGVjdGVkIGFsbCBzdHJpbmcgcGFpcnMgZm9yIE1hcFYgZnJvbSAke2V2ZW50LnRvU3RyaW5nKCl9LCBnb3Q6ICR7ZS50b1N0cmluZygpfWApO1xuICAgICAgfVxuICAgIH0pXG4gICk7XG5cbiAgcmV0dXJuIG5ldyBNYXBWKHJlcyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRBcnJheVY8VCBleHRlbmRzIFZhbHVlPihmZXRjaGVyOiAoV29ybGQsIEV2ZW50KSA9PiBQcm9taXNlPFQ+KTogKFdvcmxkLCBFdmVudCkgPT4gUHJvbWlzZTxBcnJheVY8VD4+IHtcbiAgcmV0dXJuIGFzeW5jICh3b3JsZDogV29ybGQsIGV2ZW50OiBFdmVudCk6IFByb21pc2U8QXJyYXlWPFQ+PiA9PiB7XG4gICAgY29uc3QgcmVzID0gYXdhaXQgUHJvbWlzZS5hbGwoXG4gICAgICBtdXN0QXJyYXkoZXZlbnQpLmZpbHRlcigoeCkgPT4geCAhPT0gJ0xpc3QnKS5tYXAoZSA9PiBmZXRjaGVyKHdvcmxkLCBlKSlcbiAgICApO1xuICAgIHJldHVybiBuZXcgQXJyYXlWKHJlcyk7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldFN0cmluZ1Yod29ybGQ6IFdvcmxkLCBldmVudDogRXZlbnQpOiBQcm9taXNlPFN0cmluZ1Y+IHtcbiAgcmV0dXJuIG1hcFZhbHVlPFN0cmluZ1Y+KHdvcmxkLCBldmVudCwgc3RyID0+IG5ldyBTdHJpbmdWKHN0ciksIGdldENvcmVWYWx1ZSwgU3RyaW5nVik7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGdldEV0aGVyQmFsYW5jZSh3b3JsZDogV29ybGQsIGFkZHJlc3M6IHN0cmluZyk6IFByb21pc2U8TnVtYmVyVj4ge1xuICBsZXQgYmFsYW5jZSA9IGF3YWl0IHdvcmxkLndlYjMuZXRoLmdldEJhbGFuY2UoYWRkcmVzcyk7XG5cbiAgcmV0dXJuIG5ldyBOdW1iZXJWKGJhbGFuY2UpO1xufVxuXG5jb25zdCBmZXRjaGVycyA9IFtcbiAgbmV3IEZldGNoZXI8e30sIEJvb2xWPihcbiAgICBgXG4gICAgICAjIyMjIFRydWVcblxuICAgICAgKiBcIlRydWVcIiAtIFJldHVybnMgdHJ1ZVxuICAgIGAsXG4gICAgJ1RydWUnLFxuICAgIFtdLFxuICAgIGFzeW5jICh3b3JsZCwge30pID0+IG5ldyBCb29sVih0cnVlKVxuICApLFxuXG4gIG5ldyBGZXRjaGVyPHt9LCBCb29sVj4oXG4gICAgYFxuICAgICAgIyMjIyBGYWxzZVxuXG4gICAgICAqIFwiRmFsc2VcIiAtIFJldHVybnMgZmFsc2VcbiAgICBgLFxuICAgICdGYWxzZScsXG4gICAgW10sXG4gICAgYXN5bmMgKHdvcmxkLCB7fSkgPT4gbmV3IEJvb2xWKGZhbHNlKVxuICApLFxuXG4gIG5ldyBGZXRjaGVyPHt9LCBOdW1iZXJWPihcbiAgICBgXG4gICAgICAjIyMjIFplcm9cblxuICAgICAgKiBcIlplcm9cIiAtIFJldHVybnMgMFxuICAgIGAsXG4gICAgJ1plcm8nLFxuICAgIFtdLFxuICAgIGFzeW5jICh3b3JsZCwge30pID0+IHN0clRvTnVtYmVyVignMCcpXG4gICksXG5cbiAgbmV3IEZldGNoZXI8e30sIE51bWJlclY+KFxuICAgIGBcbiAgICAgICMjIyMgVUludDk2TWF4XG5cbiAgICAgICogXCJVSW50OTZNYXhcIiAtIFJldHVybnMgMl45NiAtIDFcbiAgICBgLFxuICAgICdVSW50OTZNYXgnLFxuICAgIFtdLFxuICAgIGFzeW5jICh3b3JsZCwge30pID0+XG4gICAgICBuZXcgTnVtYmVyVignNzkyMjgxNjI1MTQyNjQzMzc1OTM1NDM5NTAzMzUnKVxuICApLFxuXG4gIG5ldyBGZXRjaGVyPHt9LCBOdW1iZXJWPihcbiAgICBgXG4gICAgICAjIyMjIFVJbnQyNTZNYXhcblxuICAgICAgKiBcIlVJbnQyNTZNYXhcIiAtIFJldHVybnMgMl4yNTYgLSAxXG4gICAgYCxcbiAgICAnVUludDI1Nk1heCcsXG4gICAgW10sXG4gICAgYXN5bmMgKHdvcmxkLCB7fSkgPT5cbiAgICAgIG5ldyBOdW1iZXJWKCcxMTU3OTIwODkyMzczMTYxOTU0MjM1NzA5ODUwMDg2ODc5MDc4NTMyNjk5ODQ2NjU2NDA1NjQwMzk0NTc1ODQwMDc5MTMxMjk2Mzk5MzUnKVxuICApLFxuXG4gIG5ldyBGZXRjaGVyPHt9LCBOdW1iZXJWPihcbiAgICBgXG4gICAgICAjIyMjIFNvbWVcblxuICAgICAgKiBcIlNvbWVcIiAtIFJldHVybnMgMTAwZTE4XG4gICAgYCxcbiAgICAnU29tZScsXG4gICAgW10sXG4gICAgYXN5bmMgKHdvcmxkLCB7fSkgPT4gc3RyVG9OdW1iZXJWKCcxMDBlMTgnKVxuICApLFxuXG4gIG5ldyBGZXRjaGVyPHt9LCBOdW1iZXJWPihcbiAgICBgXG4gICAgICAjIyMjIExpdHRsZVxuXG4gICAgICAqIFwiTGl0dGxlXCIgLSBSZXR1cm5zIDEwMGUxMFxuICAgIGAsXG4gICAgJ0xpdHRsZScsXG4gICAgW10sXG4gICAgYXN5bmMgKHdvcmxkLCB7fSkgPT4gc3RyVG9OdW1iZXJWKCcxMDBlMTAnKVxuICApLFxuXG4gIG5ldyBGZXRjaGVyPHsgYW10OiBFdmVudFYgfSwgTnVtYmVyVj4oXG4gICAgYFxuICAgICAgIyMjIyBFeGFjdGx5XG5cbiAgICAgICogXCJFeGFjdGx5IDxBbW91bnQ+XCIgLSBSZXR1cm5zIGEgc3RyaWN0IG51bWVyaWNhbCB2YWx1ZVxuICAgICAgICAqIEUuZy4gXCJFeGFjdGx5IDUuMFwiXG4gICAgYCxcbiAgICAnRXhhY3RseScsXG4gICAgW25ldyBBcmcoJ2FtdCcsIGdldEV2ZW50VildLFxuICAgIGFzeW5jICh3b3JsZCwgeyBhbXQgfSkgPT4gZ2V0TnVtYmVyVih3b3JsZCwgYW10LnZhbClcbiAgICApLFxuXG4gIG5ldyBGZXRjaGVyPHsgaGV4VmFsOiBFdmVudFYgfSwgU3RyaW5nVj4oXG4gICAgYFxuICAgICAgIyMjIyBIZXhcblxuICAgICAgKiBcIkhleCA8SGV4VmFsPlwiIC0gUmV0dXJucyBhIGJ5dGUgc3RyaW5nIHdpdGggZ2l2ZW4gaGV4IHZhbHVlXG4gICAgICAgICogRS5nLiBcIkhleCBcXFwiMHhmZmZmXFxcIlwiXG4gICAgYCxcbiAgICAnSGV4JyxcbiAgICBbbmV3IEFyZygnaGV4VmFsJywgZ2V0RXZlbnRWKV0sXG4gICAgYXN5bmMgKHdvcmxkLCB7IGhleFZhbCB9KSA9PiBnZXRTdHJpbmdWKHdvcmxkLCBoZXhWYWwudmFsKVxuICApLFxuXG4gIG5ldyBGZXRjaGVyPHsgc3RyOiBFdmVudFYgfSwgU3RyaW5nVj4oXG4gICAgYFxuICAgICAgIyMjIyBTdHJpbmdcblxuICAgICAgKiBcIlN0cmluZyA8U3RyPlwiIC0gUmV0dXJucyBhIHN0cmluZyBsaXRlcmFsXG4gICAgICAgICogRS5nLiBcIlN0cmluZyBNeVN0cmluZ1wiXG4gICAgYCxcbiAgICAnU3RyaW5nJyxcbiAgICBbbmV3IEFyZygnc3RyJywgZ2V0RXZlbnRWKV0sXG4gICAgYXN5bmMgKHdvcmxkLCB7IHN0ciB9KSA9PiBnZXRTdHJpbmdWKHdvcmxkLCBzdHIudmFsKVxuICApLFxuXG4gIG5ldyBGZXRjaGVyPHsgYW10OiBFdmVudFYgfSwgTnVtYmVyVj4oXG4gICAgYFxuICAgICAgIyMjIyBFeHBcblxuICAgICAgKiBcIkV4cCA8QW1vdW50PlwiIC0gUmV0dXJucyB0aGUgbWFudGlzc2EgZm9yIGEgZ2l2ZW4gZXhwXG4gICAgICAgICogRS5nLiBcIkV4cCA1LjVcIlxuICAgIGAsXG4gICAgJ0V4cCcsXG4gICAgW25ldyBBcmcoJ2FtdCcsIGdldEV2ZW50VildLFxuICAgIGFzeW5jICh3b3JsZCwgeyBhbXQgfSkgPT4gZ2V0RXhwTnVtYmVyVih3b3JsZCwgYW10LnZhbClcbiAgKSxcblxuICBuZXcgRmV0Y2hlcjx7IGFtdDogRXZlbnRWIH0sIE51bWJlclY+KFxuICAgIGBcbiAgICAgICMjIyMgTmVnXG5cbiAgICAgICogXCJOZWcgPEFtb3VudD5cIiAtIFJldHVybnMgdGhlIGFtb3VudCBzdWJ0cmFjdGVkIGZyb20gemVyb1xuICAgICAgICAqIEUuZy4gXCJOZWcgYW1vdW50XCJcbiAgICBgLFxuICAgICdOZWcnLFxuICAgIFtuZXcgQXJnKCdhbXQnLCBnZXRFdmVudFYpXSxcbiAgICBhc3luYyAod29ybGQsIHsgYW10IH0pID0+IG5ldyBOdW1iZXJWKDApLnN1Yihhd2FpdCBnZXROdW1iZXJWKHdvcmxkLCBhbXQudmFsKSlcbiAgKSxcblxuICBuZXcgRmV0Y2hlcjx7IGFtdDogU3RyaW5nViB9LCBQcmVjaXNlVj4oXG4gICAgYFxuICAgICAgIyMjIyBQcmVjaXNlbHlcblxuICAgICAgKiBcIlByZWNpc2VseSA8QW1vdW50PlwiIC0gTWF0Y2hlcyBhIG51bWJlciB0byBnaXZlbiBudW1iZXIgb2Ygc2lnbmlmaWNhbnQgZmlndXJlc1xuICAgICAgICAqIEUuZy4gXCJQcmVjaXNlbHkgNS4xMDAwXCIgLSBNYXRjaGVzIHRvIDUgc2lnIGZpZ3NcbiAgICBgLFxuICAgICdQcmVjaXNlbHknLFxuICAgIFtuZXcgQXJnKCdhbXQnLCBnZXRTdHJpbmdWKV0sXG4gICAgYXN5bmMgKHdvcmxkLCB7IGFtdCB9KSA9PiBuZXcgUHJlY2lzZVYodG9FbmNvZGFibGVOdW0oYW10LnZhbCksIGdldFNpZ0ZpZ3MoYW10LnZhbCkpXG4gICksXG5cbiAgbmV3IEZldGNoZXI8e30sIEFueXRoaW5nVj4oXG4gICAgYFxuICAgICAgIyMjIyBBbnl0aGluZ1xuXG4gICAgICAqIFwiQW55dGhpbmdcIiAtIE1hdGNoZXMgYW55IHZhbHVlIGZvciBhc3NlcnRpb25zXG4gICAgYCxcbiAgICAnQW55dGhpbmcnLFxuICAgIFtdLFxuICAgIGFzeW5jICh3b3JsZCwge30pID0+IG5ldyBBbnl0aGluZ1YoKVxuICApLFxuXG4gIG5ldyBGZXRjaGVyPHt9LCBOb3RoaW5nVj4oXG4gICAgYFxuICAgICAgIyMjIyBOb3RoaW5nXG5cbiAgICAgICogXCJOb3RoaW5nXCIgLSBNYXRjaGVzIG5vIHZhbHVlcyBhbmQgaXMgbm90aGluZy5cbiAgICBgLFxuICAgICdOb3RoaW5nJyxcbiAgICBbXSxcbiAgICBhc3luYyAod29ybGQsIHt9KSA9PiBuZXcgTm90aGluZ1YoKVxuICApLFxuXG4gIG5ldyBGZXRjaGVyPHsgYWRkcjogQWRkcmVzc1YgfSwgQWRkcmVzc1Y+KFxuICAgIGBcbiAgICAgICMjIyMgQWRkcmVzc1xuXG4gICAgICAqIFwiQWRkcmVzcyBhcmc6PEFkZHJlc3M+XCIgLSBSZXR1cm5zIGFuIGFkZHJlc3NcbiAgICBgLFxuICAgICdBZGRyZXNzJyxcbiAgICBbbmV3IEFyZygnYWRkcicsIGdldEFkZHJlc3NWKV0sXG4gICAgYXN5bmMgKHdvcmxkLCB7IGFkZHIgfSkgPT4gYWRkclxuICApLFxuXG4gIG5ldyBGZXRjaGVyPHsgbnVtOiBOdW1iZXJWIH0sIE51bWJlclY+KFxuICAgIGBcbiAgICAgICMjIyMgTnVtYmVyXG5cbiAgICAgICogXCJOdW1iZXIgYXJnOjxOdW1iZXI+XCIgLSBSZXR1cm5zIGEgbnVtYmVyXG4gICAgYCxcbiAgICAnTnVtYmVyJyxcbiAgICBbbmV3IEFyZygnbnVtJywgZ2V0TnVtYmVyVildLFxuICAgIGFzeW5jICh3b3JsZCwgeyBudW0gfSkgPT4gbnVtXG4gICksXG5cbiAgbmV3IEZldGNoZXI8XG4gICAgeyBhZGRyOiBBZGRyZXNzVjsgc2xvdDogTnVtYmVyVjsgc3RhcnQ6IE51bWJlclY7IHZhbFR5cGU6IFN0cmluZ1YgfSxcbiAgICBCb29sViB8IEFkZHJlc3NWIHwgRXhwTnVtYmVyViB8IE5vdGhpbmdWXG4gID4oXG4gICAgYFxuICAgICMjIyMgU3RvcmFnZUF0XG5cbiAgICAqIFwiU3RvcmFnZUF0IGFkZHI6PEFkZHJlc3M+IHNsb3Q6PE51bWJlcj4gc3RhcnQ6PE51bWJlcj4sIHZhbFR5cGU6PFZUb0Nhc3RUbz5cIiAtIFJldHVybnMgYnl0ZXMgYXQgc3RvcmFnZSBzbG90XG4gICAgYCxcbiAgICAnU3RvcmFnZUF0JyxcbiAgICBbXG4gICAgICBuZXcgQXJnKCdhZGRyJywgZ2V0QWRkcmVzc1YpLFxuICAgICAgbmV3IEFyZygnc2xvdCcsIGdldE51bWJlclYpLFxuICAgICAgbmV3IEFyZygnc3RhcnQnLCBnZXROdW1iZXJWKSxcbiAgICAgIG5ldyBBcmcoJ3ZhbFR5cGUnLCBnZXRTdHJpbmdWKVxuICAgIF0sXG4gICAgYXN5bmMgKHdvcmxkLCB7IGFkZHIsIHNsb3QsIHN0YXJ0LCB2YWxUeXBlIH0pID0+IHtcbiAgICAgIGNvbnN0IHN0YXJ0VmFsID0gc3RhcnQudG9OdW1iZXIoKVxuICAgICAgY29uc3QgcmV2ZXJzZSA9IHMgPT4gcy5zcGxpdCgnJykucmV2ZXJzZSgpLmpvaW4oJycpO1xuICAgICAgY29uc3Qgc3RvcmFnZSA9IGF3YWl0IHdvcmxkLndlYjMuZXRoLmdldFN0b3JhZ2VBdChhZGRyLnZhbCwgc2xvdC50b051bWJlcigpKTtcbiAgICAgIGNvbnN0IHN0b3JlZCA9IHJldmVyc2Uoc3RvcmFnZS5zbGljZSgyKSk7IC8vIGRyb3AgbGVhZGluZyAweCBhbmQgcmV2ZXJzZSBzaW5jZSBpdGVtcyBhcmUgcGFja2VkIGZyb20gdGhlIGJhY2sgb2YgdGhlIHNsb3RcblxuICAgICAgLy8gRG9uJ3QgZm9yZ2V0IHRvIHJlLXJldmVyc2VcbiAgICAgIHN3aXRjaCAodmFsVHlwZS52YWwpIHtcbiAgICAgICAgY2FzZSAnYm9vbCc6XG4gICAgICAgICAgcmV0dXJuIG5ldyBCb29sVighIXJldmVyc2Uoc3RvcmVkLnNsaWNlKHN0YXJ0VmFsLCBzdGFydFZhbCArIDIpKSk7XG4gICAgICAgIGNhc2UgJ2FkZHJlc3MnOlxuICAgICAgICAgIHJldHVybiBuZXcgQWRkcmVzc1YoJzB4JyArIHBhZExlZnQocmV2ZXJzZShzdG9yZWQuc2xpY2Uoc3RhcnRWYWwsIHN0YXJ0VmFsICsgNDApKSwgNDApKTtcbiAgICAgICAgY2FzZSAnbnVtYmVyJzpcbiAgICAgICAgICByZXR1cm4gbmV3IE51bWJlclYodG9CTignMHgnICsgcmV2ZXJzZShzdG9yZWQpKS50b1N0cmluZygpKTtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICByZXR1cm4gbmV3IE5vdGhpbmdWKCk7XG4gICAgICB9XG4gICAgfVxuICApLFxuXG4gIG5ldyBGZXRjaGVyPFxuICAgIHsgYWRkcjogQWRkcmVzc1Y7IHNsb3Q6IE51bWJlclY7IGtleTogQWRkcmVzc1Y7IG5lc3RlZEtleTogQWRkcmVzc1Y7IHZhbFR5cGU6IFN0cmluZ1YgfSxcbiAgICBMaXN0ViB8IE5vdGhpbmdWXG4gID4oXG4gICAgYFxuICAgICMjIyMgU3RvcmFnZUF0TmVzdGVkTWFwcGluZ1xuXG4gICAgKiBcIlN0b3JhZ2VBdE5lc3RlZE1hcHBpbmcgYWRkcjo8QWRkcmVzcz4gc2xvdDo8TnVtYmVyPiwga2V5OjxhZGRyZXNzPiwgbmVzdGVkS2V5OjxhZGRyZXNzPiwgdmFsVHlwZTo8VlRvQ2FzdFRvPlwiIC0gUmV0dXJucyBieXRlcyBhdCBzdG9yYWdlIHNsb3RcbiAgICBgLFxuICAgICdTdG9yYWdlQXROZXN0ZWRNYXBwaW5nJyxcbiAgICBbXG4gICAgICBuZXcgQXJnKCdhZGRyJywgZ2V0QWRkcmVzc1YpLFxuICAgICAgbmV3IEFyZygnc2xvdCcsIGdldE51bWJlclYpLFxuICAgICAgbmV3IEFyZygna2V5JywgZ2V0QWRkcmVzc1YpLFxuICAgICAgbmV3IEFyZygnbmVzdGVkS2V5JywgZ2V0QWRkcmVzc1YpLFxuICAgICAgbmV3IEFyZygndmFsVHlwZScsIGdldFN0cmluZ1YpXG4gICAgXSxcbiAgICBhc3luYyAod29ybGQsIHsgYWRkciwgc2xvdCwga2V5LCBuZXN0ZWRLZXksIHZhbFR5cGUgfSkgPT4ge1xuICAgICAgY29uc3QgYXJlRXF1YWwgPSAodiwgeCkgPT4gdG9CTih2KS5lcSh0b0JOKHgpKTtcbiAgICAgIGxldCBwYWRkZWRTbG90ID0gc2xvdC50b051bWJlcigpLnRvU3RyaW5nKDE2KS5wYWRTdGFydCg2NCwgJzAnKTtcbiAgICAgIGxldCBwYWRkZWRLZXkgPSBwYWRMZWZ0KGtleS52YWwsIDY0KTtcbiAgICAgIGxldCBuZXdLZXkgPSBzaGEzKHBhZGRlZEtleSArIHBhZGRlZFNsb3QpO1xuICAgICAgbGV0IHZhbCA9IGF3YWl0IHdvcmxkLndlYjMuZXRoLmdldFN0b3JhZ2VBdChhZGRyLnZhbCwgbmV3S2V5KTtcblxuICAgICAgc3dpdGNoICh2YWxUeXBlLnZhbCkge1xuICAgICAgICBjYXNlICdtYXJrZXRTdHJ1Y3QnOlxuICAgICAgICAgIGxldCBpc0xpc3RlZCA9IGFyZUVxdWFsKHZhbCwgMSk7XG4gICAgICAgICAgbGV0IGNvbGxhdGVyYWxGYWN0b3JLZXkgPSAnMHgnICsgdG9CTihuZXdLZXkpLmFkZCh0b0JOKDEpKS50b1N0cmluZygxNik7XG4gICAgICAgICAgbGV0IGNvbGxhdGVyYWxGYWN0b3JTdHIgPSBhd2FpdCB3b3JsZC53ZWIzLmV0aC5nZXRTdG9yYWdlQXQoYWRkci52YWwsIGNvbGxhdGVyYWxGYWN0b3JLZXkpO1xuICAgICAgICAgIGxldCBjb2xsYXRlcmFsRmFjdG9yID0gdG9CTihjb2xsYXRlcmFsRmFjdG9yU3RyKTtcbiAgICAgICAgICBsZXQgdXNlck1hcmtldEJhc2VLZXkgPSBwYWRMZWZ0KHRvQk4obmV3S2V5KS5hZGQodG9CTigyKSkudG9TdHJpbmcoMTYpLCA2NCk7XG4gICAgICAgICAgbGV0IHBhZGRlZFNsb3QgPSBwYWRMZWZ0KHVzZXJNYXJrZXRCYXNlS2V5LCA2NCk7XG4gICAgICAgICAgbGV0IHBhZGRlZEtleSA9IHBhZExlZnQobmVzdGVkS2V5LnZhbCwgNjQpO1xuICAgICAgICAgIGxldCBuZXdLZXlUd28gPSBzaGEzKHBhZGRlZEtleSArIHBhZGRlZFNsb3QpO1xuICAgICAgICAgIGxldCB1c2VySW5NYXJrZXQgPSBhd2FpdCB3b3JsZC53ZWIzLmV0aC5nZXRTdG9yYWdlQXQoYWRkci52YWwsIG5ld0tleVR3byk7XG5cbiAgICAgICAgICBsZXQgaXNDb21wS2V5ID0gJzB4JyArIHRvQk4obmV3S2V5KS5hZGQodG9CTigzKSkudG9TdHJpbmcoMTYpO1xuICAgICAgICAgIGxldCBpc0NvbXBTdHIgPSBhd2FpdCB3b3JsZC53ZWIzLmV0aC5nZXRTdG9yYWdlQXQoYWRkci52YWwsIGlzQ29tcEtleSk7XG5cbiAgICAgICAgICByZXR1cm4gbmV3IExpc3RWKFtcbiAgICAgICAgICAgIG5ldyBCb29sVihpc0xpc3RlZCksXG4gICAgICAgICAgICBuZXcgRXhwTnVtYmVyVihjb2xsYXRlcmFsRmFjdG9yLnRvU3RyaW5nKCksIDFlMTgpLFxuICAgICAgICAgICAgbmV3IEJvb2xWKGFyZUVxdWFsKHVzZXJJbk1hcmtldCwgMSkpLFxuICAgICAgICAgICAgbmV3IEJvb2xWKGFyZUVxdWFsKGlzQ29tcFN0ciwgMSkpXG4gICAgICAgICAgXSk7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgcmV0dXJuIG5ldyBOb3RoaW5nVigpO1xuICAgICAgfVxuICAgIH1cbiAgKSxcblxuICBuZXcgRmV0Y2hlcjxcbiAgICB7IGFkZHI6IEFkZHJlc3NWOyBzbG90OiBOdW1iZXJWOyBrZXk6IEFkZHJlc3NWOyB2YWxUeXBlOiBTdHJpbmdWIH0sXG4gICAgQWRkcmVzc1YgfCBCb29sViB8IEV4cE51bWJlclYgfCBMaXN0ViB8IE5vdGhpbmdWXG4gID4oXG4gICAgYFxuICAgICMjIyMgU3RvcmFnZUF0TWFwcGluZ1xuXG4gICAgKiBcIlN0b3JhZ2VBdE1hcHBpbmcgYWRkcjo8QWRkcmVzcz4gc2xvdDo8TnVtYmVyPiwga2V5OjxhZGRyZXNzPiwgdmFsVHlwZTo8VlRvQ2FzdFRvPlwiIC0gUmV0dXJucyBieXRlcyBhdCBzdG9yYWdlIHNsb3RcbiAgICBgLFxuICAgICdTdG9yYWdlQXRNYXBwaW5nJyxcbiAgICBbXG4gICAgICBuZXcgQXJnKCdhZGRyJywgZ2V0QWRkcmVzc1YpLFxuICAgICAgbmV3IEFyZygnc2xvdCcsIGdldE51bWJlclYpLFxuICAgICAgbmV3IEFyZygna2V5JywgZ2V0QWRkcmVzc1YpLFxuICAgICAgbmV3IEFyZygndmFsVHlwZScsIGdldFN0cmluZ1YpXG4gICAgXSxcbiAgICBhc3luYyAod29ybGQsIHsgYWRkciwgc2xvdCwga2V5LCB2YWxUeXBlIH0pID0+IHtcbiAgICAgIGxldCBwYWRkZWRTbG90ID0gc2xvdC50b051bWJlcigpLnRvU3RyaW5nKDE2KS5wYWRTdGFydCg2NCwgJzAnKTtcbiAgICAgIGxldCBwYWRkZWRLZXkgPSBwYWRMZWZ0KGtleS52YWwsIDY0KTtcbiAgICAgIGxldCBuZXdLZXkgPSBzaGEzKHBhZGRlZEtleSArIHBhZGRlZFNsb3QpO1xuICAgICAgbGV0IHZhbCA9IGF3YWl0IHdvcmxkLndlYjMuZXRoLmdldFN0b3JhZ2VBdChhZGRyLnZhbCwgbmV3S2V5KTtcblxuICAgICAgc3dpdGNoICh2YWxUeXBlLnZhbCkge1xuICAgICAgICBjYXNlICdsaXN0KGFkZHJlc3MpJzpcbiAgICAgICAgICBsZXQgcCA9IG5ldyBBcnJheSh0b0RlY2ltYWwodmFsKSkuZmlsbCh1bmRlZmluZWQpLm1hcChhc3luYyAoX3YsIGluZGV4KSA9PiB7XG4gICAgICAgICAgICBsZXQgbmV3S2V5U2hhID0gc2hhMyhuZXdLZXkpO1xuICAgICAgICAgICAgbGV0IGl0ZW1LZXkgPSB0b0JOKG5ld0tleVNoYSkuYWRkKHRvQk4oaW5kZXgpKTtcbiAgICAgICAgICAgIGxldCBhZGRyZXNzID0gYXdhaXQgd29ybGQud2ViMy5ldGguZ2V0U3RvcmFnZUF0KGFkZHIudmFsLCBwYWRMZWZ0KHRvSGV4KGl0ZW1LZXkpLCA0MCkpO1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBBZGRyZXNzVihhZGRyZXNzKTtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIGxldCBhbGwgPSBhd2FpdCBQcm9taXNlLmFsbChwKTtcbiAgICAgICAgICByZXR1cm4gbmV3IExpc3RWKGFsbCk7XG5cbiAgICAgICAgY2FzZSAnYm9vbCc6XG4gICAgICAgICAgcmV0dXJuIG5ldyBCb29sVih2YWwgIT0gJzB4JyAmJiB2YWwgIT0gJzB4MCcpO1xuICAgICAgICBjYXNlICdhZGRyZXNzJzpcbiAgICAgICAgICByZXR1cm4gbmV3IEFkZHJlc3NWKHZhbCk7XG4gICAgICAgIGNhc2UgJ251bWJlcic6XG4gICAgICAgICAgcmV0dXJuIG5ldyBOdW1iZXJWKHRvQk4odmFsKS50b1N0cmluZygpKTtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICByZXR1cm4gbmV3IE5vdGhpbmdWKCk7XG4gICAgICB9XG4gICAgfVxuICApLFxuXG4gIG5ldyBGZXRjaGVyPHt9LCBOdW1iZXJWPihcbiAgICBgXG4gICAgIyMjIyBCbG9ja051bWJlclxuICAgICogQmxvY2tOdW1iZXJcbiAgICBgLFxuICAgICdCbG9ja051bWJlcicsXG4gICAgW10sXG4gICAgYXN5bmMgKHdvcmxkLCB7fSkgPT4ge1xuICAgICAgcmV0dXJuIG5ldyBOdW1iZXJWKGF3YWl0IGdldEN1cnJlbnRCbG9ja051bWJlcih3b3JsZCkpO1xuICAgIH1cbiAgKSxcblxuICBuZXcgRmV0Y2hlcjx7fSwgTnVtYmVyVj4oXG4gICAgYFxuICAgICMjIyMgR2FzQ291bnRlclxuICAgICogR2FzQ291bnRlclxuICAgIGAsXG4gICAgJ0dhc0NvdW50ZXInLFxuICAgIFtdLFxuICAgIGFzeW5jICh3b3JsZCwge30pID0+IG5ldyBOdW1iZXJWKHdvcmxkLmdhc0NvdW50ZXIudmFsdWUpXG4gICksXG5cbiAgbmV3IEZldGNoZXI8e30sIEFkZHJlc3NWPihcbiAgICBgXG4gICAgICAjIyMjIExhc3RDb250cmFjdFxuXG4gICAgICAqIFwiTGFzdENvbnRyYWN0XCIgLSBUaGUgYWRkcmVzcyBvZiBsYXN0IGNvbnN0cnVjdGVkIGNvbnRyYWN0XG4gICAgYCxcbiAgICAnTGFzdENvbnRyYWN0JyxcbiAgICBbXSxcbiAgICBhc3luYyAod29ybGQsIHsgfSkgPT4gbmV3IEFkZHJlc3NWKHdvcmxkLmdldCgnbGFzdENvbnRyYWN0JykpXG4gICksXG5cbiAgbmV3IEZldGNoZXI8e30sIE51bWJlclY+KFxuICAgIGBcbiAgICAgICMjIyMgTGFzdEJsb2NrXG5cbiAgICAgICogXCJMYXN0QmxvY2tcIiAtIFRoZSBibG9jayBvZiB0aGUgbGFzdCB0cmFuc2FjdGlvblxuICAgIGAsXG4gICAgJ0xhc3RCbG9jaycsXG4gICAgW10sXG4gICAgYXN5bmMgKHdvcmxkLCB7IH0pID0+IHtcbiAgICAgIGxldCBpbnZva2F0aW9uID0gd29ybGQuZ2V0KCdsYXN0SW52b2thdGlvbicpO1xuICAgICAgaWYgKCFpbnZva2F0aW9uKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgRXhwZWN0ZWQgbGFzdCBpbnZva2F0aW9uIGZvciBcImxhc3RCbG9ja1wiIGJ1dCBub25lIGZvdW5kLmApO1xuICAgICAgfVxuXG4gICAgICBpZiAoIWludm9rYXRpb24ucmVjZWlwdCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEV4cGVjdGVkIGxhc3QgaW52b2thdGlvbiB0byBoYXZlIHJlY2VpcHQgZm9yIFwibGFzdEJsb2NrXCIgYnV0IG5vbmUgZm91bmQuYCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBuZXcgTnVtYmVyVihpbnZva2F0aW9uLnJlY2VpcHQuYmxvY2tOdW1iZXIpO1xuICAgIH1cbiAgKSxcblxuICBuZXcgRmV0Y2hlcjx7fSwgTnVtYmVyVj4oXG4gICAgYFxuICAgICAgIyMjIyBMYXN0R2FzXG5cbiAgICAgICogXCJMYXN0R2FzXCIgLSBUaGUgZ2FzIGNvbnN1bWVkIGJ5IHRoZSBsYXN0IHRyYW5zYWN0aW9uXG4gICAgYCxcbiAgICAnTGFzdEdhcycsXG4gICAgW10sXG4gICAgYXN5bmMgKHdvcmxkLCB7fSkgPT4ge1xuICAgICAgbGV0IGludm9rYXRpb24gPSB3b3JsZC5nZXQoJ2xhc3RJbnZva2F0aW9uJyk7XG4gICAgICBpZiAoIWludm9rYXRpb24pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBFeHBlY3RlZCBsYXN0IGludm9rYXRpb24gZm9yIFwibGFzdEdhc1wiIGJ1dCBub25lIGZvdW5kLmApO1xuICAgICAgfVxuXG4gICAgICBpZiAoIWludm9rYXRpb24ucmVjZWlwdCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEV4cGVjdGVkIGxhc3QgaW52b2thdGlvbiB0byBoYXZlIHJlY2VpcHQgZm9yIFwibGFzdEdhc1wiIGJ1dCBub25lIGZvdW5kLmApO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gbmV3IE51bWJlclYoaW52b2thdGlvbi5yZWNlaXB0Lmdhc1VzZWQpO1xuICAgIH1cbiAgKSxcblxuICBuZXcgRmV0Y2hlcjx7IGVsczogVmFsdWVbXSB9LCBBbnl0aGluZ1Y+KFxuICAgIGBcbiAgICAgICMjIyMgTGlzdFxuXG4gICAgICAqIFwiTGlzdCAuLi5cIiAtIFJldHVybnMgYSBsaXN0IG9mIGdpdmVuIGVsZW1lbnRzXG4gICAgYCxcbiAgICAnTGlzdCcsXG4gICAgW25ldyBBcmcoJ2VscycsIGdldENvcmVWYWx1ZSwgeyB2YXJpYWRpYzogdHJ1ZSwgbWFwcGVkOiB0cnVlIH0pXSxcbiAgICBhc3luYyAod29ybGQsIHsgZWxzIH0pID0+IG5ldyBMaXN0VihlbHMpXG4gICksXG4gIG5ldyBGZXRjaGVyPHsgdmFsOiBWYWx1ZTsgZGVmOiBFdmVudFYgfSwgVmFsdWU+KFxuICAgIGBcbiAgICAgICMjIyMgRGVmYXVsdFxuXG4gICAgICAqIFwiRGVmYXVsdCB2YWw6PFZhbHVlPiBkZWY6PFZhbHVlPlwiIC0gUmV0dXJucyB2YWx1ZSBpZiB0cnV0aHksIG90aGVyd2lzZSBkZWZhdWx0LiBOb3RlOiB0aGlzICoqZG9lcyoqIHNob3J0IGNpcmN1aXQuXG4gICAgYCxcbiAgICAnRGVmYXVsdCcsXG4gICAgW25ldyBBcmcoJ3ZhbCcsIGdldENvcmVWYWx1ZSksIG5ldyBBcmcoJ2RlZicsIGdldEV2ZW50VildLFxuICAgIGFzeW5jICh3b3JsZCwgeyB2YWwsIGRlZiB9KSA9PiB7XG4gICAgICBpZiAodmFsLnRydXRoeSgpKSB7XG4gICAgICAgIHJldHVybiB2YWw7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gYXdhaXQgZ2V0Q29yZVZhbHVlKHdvcmxkLCBkZWYudmFsKTtcbiAgICAgIH1cbiAgICB9XG4gICksXG4gIG5ldyBGZXRjaGVyPHsgbWludXRlczogTnVtYmVyViB9LCBOdW1iZXJWPihcbiAgICBgXG4gICAgICAjIyMjIE1pbnV0ZXNcblxuICAgICAgKiBcIk1pbnV0ZXMgbWludXRlczo8TnVtYmVyVj5cIiAtIFJldHVybnMgbnVtYmVyIG9mIG1pbnV0ZXMgaW4gc2Vjb25kc1xuICAgIGAsXG4gICAgJ01pbnV0ZXMnLFxuICAgIFtuZXcgQXJnKCdtaW51dGVzJywgZ2V0TnVtYmVyVildLFxuICAgIGFzeW5jICh3b3JsZCwgeyBtaW51dGVzIH0pID0+IHtcbiAgICAgIGNvbnN0IG1pbnV0ZXNCbiA9IG5ldyBCaWdOdW1iZXIobWludXRlcy52YWwpO1xuICAgICAgcmV0dXJuIG5ldyBOdW1iZXJWKG1pbnV0ZXNCbi50aW1lcyg2MCkudG9GaXhlZCgwKSk7XG4gICAgfVxuICApLFxuICBuZXcgRmV0Y2hlcjx7IGhvdXJzOiBOdW1iZXJWIH0sIE51bWJlclY+KFxuICAgIGBcbiAgICAgICMjIyMgSG91cnNcblxuICAgICAgKiBcIkhvdXJzIGhvdXJzOjxOdW1iZXJWPlwiIC0gUmV0dXJucyBudW1iZXIgb2YgaG91cnMgaW4gc2Vjb25kc1xuICAgIGAsXG4gICAgJ0hvdXJzJyxcbiAgICBbbmV3IEFyZygnaG91cnMnLCBnZXROdW1iZXJWKV0sXG4gICAgYXN5bmMgKHdvcmxkLCB7IGhvdXJzIH0pID0+IHtcbiAgICAgIGNvbnN0IGhvdXJzQm4gPSBuZXcgQmlnTnVtYmVyKGhvdXJzLnZhbCk7XG4gICAgICByZXR1cm4gbmV3IE51bWJlclYoaG91cnNCbi50aW1lcygzNjAwKS50b0ZpeGVkKDApKTtcbiAgICB9XG4gICksXG4gIG5ldyBGZXRjaGVyPHsgZGF5czogTnVtYmVyViB9LCBOdW1iZXJWPihcbiAgICBgXG4gICAgICAjIyMjIERheXNcblxuICAgICAgKiBcIkRheXMgZGF5czo8TnVtYmVyVj5cIiAtIFJldHVybnMgbnVtYmVyIG9mIGRheXMgaW4gc2Vjb25kc1xuICAgIGAsXG4gICAgJ0RheXMnLFxuICAgIFtuZXcgQXJnKCdkYXlzJywgZ2V0TnVtYmVyVildLFxuICAgIGFzeW5jICh3b3JsZCwgeyBkYXlzIH0pID0+IHtcbiAgICAgIGNvbnN0IGRheXNCbiA9IG5ldyBCaWdOdW1iZXIoZGF5cy52YWwpO1xuICAgICAgcmV0dXJuIG5ldyBOdW1iZXJWKGRheXNCbi50aW1lcyg4NjQwMCkudG9GaXhlZCgwKSk7XG4gICAgfVxuICApLFxuICBuZXcgRmV0Y2hlcjx7IHdlZWtzOiBOdW1iZXJWIH0sIE51bWJlclY+KFxuICAgIGBcbiAgICAgICMjIyMgV2Vla3NcblxuICAgICAgKiBcIldlZWtzIHdlZWtzOjxOdW1iZXJWPlwiIC0gUmV0dXJucyBudW1iZXIgb2Ygd2Vla3MgaW4gc2Vjb25kc1xuICAgIGAsXG4gICAgJ1dlZWtzJyxcbiAgICBbbmV3IEFyZygnd2Vla3MnLCBnZXROdW1iZXJWKV0sXG4gICAgYXN5bmMgKHdvcmxkLCB7IHdlZWtzIH0pID0+IHtcbiAgICAgIGNvbnN0IHdlZWtzQm4gPSBuZXcgQmlnTnVtYmVyKHdlZWtzLnZhbCk7XG4gICAgICByZXR1cm4gbmV3IE51bWJlclYod2Vla3NCbi50aW1lcyg2MDQ4MDApLnRvRml4ZWQoMCkpO1xuICAgIH1cbiAgKSxcbiAgbmV3IEZldGNoZXI8eyB5ZWFyczogTnVtYmVyViB9LCBOdW1iZXJWPihcbiAgICBgXG4gICAgICAjIyMjIFllYXJzXG5cbiAgICAgICogXCJZZWFycyB5ZWFyczo8TnVtYmVyVj5cIiAtIFJldHVybnMgbnVtYmVyIG9mIHllYXJzIGluIHNlY29uZHNcbiAgICBgLFxuICAgICdZZWFycycsXG4gICAgW25ldyBBcmcoJ3llYXJzJywgZ2V0TnVtYmVyVildLFxuICAgIGFzeW5jICh3b3JsZCwgeyB5ZWFycyB9KSA9PiB7XG4gICAgICBjb25zdCB5ZWFyc0JuID0gbmV3IEJpZ051bWJlcih5ZWFycy52YWwpO1xuICAgICAgcmV0dXJuIG5ldyBOdW1iZXJWKHllYXJzQm4udGltZXMoMzE1MzYwMDApLnRvRml4ZWQoMCkpO1xuICAgIH1cbiAgKSxcbiAgbmV3IEZldGNoZXI8eyBzZWNvbmRzOiBOdW1iZXJWIH0sIE51bWJlclY+KFxuICAgIGBcbiAgICAgICMjIyMgRnJvbU5vd1xuXG4gICAgICAqIFwiRnJvbU5vdyBzZWNvbmRzOjxOdW1iZXJWPlwiIC0gUmV0dXJucyBmdXR1cmUgdGltZXN0YW1wIG9mIGdpdmVuIHNlY29uZHMgZnJvbSBub3dcbiAgICBgLFxuICAgICdGcm9tTm93JyxcbiAgICBbbmV3IEFyZygnc2Vjb25kcycsIGdldE51bWJlclYpXSxcbiAgICBhc3luYyAod29ybGQsIHsgc2Vjb25kcyB9KSA9PiB7XG4gICAgICBjb25zdCBzZWNvbmRzQm4gPSBuZXcgQmlnTnVtYmVyKHNlY29uZHMudmFsKTtcbiAgICAgIHJldHVybiBuZXcgTnVtYmVyVihzZWNvbmRzQm4ucGx1cyhnZXRDdXJyZW50VGltZXN0YW1wKCkpLnRvRml4ZWQoMCkpO1xuICAgIH1cbiAgKSxcbiAgICBuZXcgRmV0Y2hlcjx7fSwgTnVtYmVyVj4oXG4gICAgYFxuICAgICAgIyMjIyBOb3dcblxuICAgICAgKiBcIk5vdyBzZWNvbmRzOjxOdW1iZXJWPlwiIC0gUmV0dXJucyBjdXJyZW50IHRpbWVzdGFtcFxuICAgIGAsXG4gICAgJ05vdycsXG4gICAgW10sXG4gICAgYXN5bmMgKHdvcmxkLCB7fSkgPT4ge1xuICAgICAgcmV0dXJuIG5ldyBOdW1iZXJWKGdldEN1cnJlbnRUaW1lc3RhbXAoKSk7XG4gICAgfVxuICApLFxuICBuZXcgRmV0Y2hlcjx7fSwgTnVtYmVyVj4oXG4gICAgYFxuICAgICAgIyMjIyBCbG9ja1RpbWVzdGFtcFxuXG4gICAgICAqIFwiQmxvY2tUaW1lc3RhbXBcIiAtIFJldHVybnMgdGhlIGN1cnJlbnQgYmxvY2sncyB0aW1lc3RhbXBcbiAgICAgICAgKiBFLmcuIFwiQmxvY2tUaW1lc3RhbXBcIlxuICAgIGAsXG4gICAgJ0Jsb2NrVGltZXN0YW1wJyxcbiAgICBbXSxcbiAgICBhc3luYyAod29ybGQsIHt9KSA9PiB7XG4gICAgICBjb25zdCB7cmVzdWx0OiBibG9ja051bWJlcn06IGFueSA9IGF3YWl0IHNlbmRSUEMod29ybGQsICdldGhfYmxvY2tOdW1iZXInLCBbXSk7XG4gICAgICBjb25zdCB7cmVzdWx0OiBibG9ja306IGFueSA9IGF3YWl0IHNlbmRSUEMod29ybGQsICdldGhfZ2V0QmxvY2tCeU51bWJlcicsIFtibG9ja051bWJlciwgZmFsc2VdKTtcbiAgICAgIHJldHVybiBuZXcgTnVtYmVyVihwYXJzZUludChibG9jay50aW1lc3RhbXAsIDE2KSk7XG4gICAgfVxuICApLFxuICBuZXcgRmV0Y2hlcjx7fSwgU3RyaW5nVj4oXG4gICAgYFxuICAgICAgIyMjIyBOZXR3b3JrXG5cbiAgICAgICogXCJOZXR3b3JrXCIgLSBSZXR1cm5zIHRoZSBjdXJyZW50IE5ldHdvcmtcbiAgICBgLFxuICAgICdOZXR3b3JrJyxcbiAgICBbXSxcbiAgICBhc3luYyB3b3JsZCA9PiBuZXcgU3RyaW5nVih3b3JsZC5uZXR3b3JrKVxuICApLFxuICBuZXcgRmV0Y2hlcjx7IHJlczogVmFsdWUgfSwgVmFsdWU+KFxuICAgIGBcbiAgICAgICMjIyMgVXNlclxuXG4gICAgICAqIFwiVXNlciAuLi51c2VyQXJnc1wiIC0gUmV0dXJucyB1c2VyIHZhbHVlXG4gICAgYCxcbiAgICAnVXNlcicsXG4gICAgW25ldyBBcmcoJ3JlcycsIGdldFVzZXJWYWx1ZSwgeyB2YXJpYWRpYzogdHJ1ZSB9KV0sXG4gICAgYXN5bmMgKHdvcmxkLCB7IHJlcyB9KSA9PiByZXMsXG4gICAgeyBzdWJFeHByZXNzaW9uczogdXNlckZldGNoZXJzKCkgfVxuICApLFxuICBuZXcgRmV0Y2hlcjx7IGFkZHJlc3M6IEFkZHJlc3NWIH0sIFZhbHVlPihcbiAgICBgXG4gICAgICAjIyMjIEV0aGVyQmFsYW5jZVxuXG4gICAgICAqIFwiRXRoZXJCYWxhbmNlIDxBZGRyZXNzPlwiIC0gUmV0dXJucyBnaXZlbiBhZGRyZXNzJyBldGhlciBiYWxhbmNlLlxuICAgIGAsXG4gICAgJ0V0aGVyQmFsYW5jZScsXG4gICAgW25ldyBBcmcoJ2FkZHJlc3MnLCBnZXRBZGRyZXNzVildLFxuICAgICh3b3JsZCwgeyBhZGRyZXNzIH0pID0+IGdldEV0aGVyQmFsYW5jZSh3b3JsZCwgYWRkcmVzcy52YWwpXG4gICksXG4gIG5ldyBGZXRjaGVyPHsgZ2l2ZW46IFZhbHVlOyBleHBlY3RlZDogVmFsdWUgfSwgQm9vbFY+KFxuICAgIGBcbiAgICAgICMjIyMgRXF1YWxcblxuICAgICAgKiBcIkVxdWFsIGdpdmVuOjxWYWx1ZT4gZXhwZWN0ZWQ6PFZhbHVlPlwiIC0gUmV0dXJucyB0cnVlIGlmIGdpdmVuIHZhbHVlcyBhcmUgZXF1YWxcbiAgICAgICAgKiBFLmcuIFwiRXF1YWwgKEV4YWN0bHkgMCkgWmVyb1wiXG4gICAgICAgICogRS5nLiBcIkVxdWFsIChDVG9rZW4gY1pSWCBUb3RhbFN1cHBseSkgKEV4YWN0bHkgNTUpXCJcbiAgICAgICAgKiBFLmcuIFwiRXF1YWwgKENUb2tlbiBjWlJYIENvbXB0cm9sbGVyKSAoQ29tcHRyb2xsZXIgQWRkcmVzcylcIlxuICAgIGAsXG4gICAgJ0VxdWFsJyxcbiAgICBbbmV3IEFyZygnZ2l2ZW4nLCBnZXRDb3JlVmFsdWUpLCBuZXcgQXJnKCdleHBlY3RlZCcsIGdldENvcmVWYWx1ZSldLFxuICAgIGFzeW5jICh3b3JsZCwgeyBnaXZlbiwgZXhwZWN0ZWQgfSkgPT4gbmV3IEJvb2xWKGV4cGVjdGVkLmNvbXBhcmVUbyh3b3JsZCwgZ2l2ZW4pKVxuICApLFxuICBuZXcgRmV0Y2hlcjxcbiAgICAgIHtcbiAgICAgICAgYXJnVHlwZXM6IFN0cmluZ1ZbXTtcbiAgICAgICAgYXJnczogU3RyaW5nVltdO1xuICAgICAgfSxcbiAgICAgIFN0cmluZ1ZcbiAgICA+KFxuICAgICAgYFxuICAgICAgICAjIyMjIEVuY29kZVBhcmFtZXRlcnNcblxuICAgICAgICAqIFwiRW5jb2RlUGFyYW1ldGVycyAoLi4uYXJnVHlwZXM6PFN0cmluZz4pICguLi5hcmdzOjxBbnl0aGluZz4pXG4gICAgICAgICAgKiBFLmcuIFwiRW5jb2RlUGFyYW1ldGVycyAoXFxcImFkZHJlc3NcXFwiIFxcXCJhZGRyZXNzXFxcIikgKFxcXCIweGFiY1xcXCIgXFxcIjB4MTIzXFxcIilcbiAgICAgIGAsXG4gICAgICAnRW5jb2RlUGFyYW1ldGVycycsXG4gICAgICBbXG4gICAgICAgIG5ldyBBcmcoJ2FyZ1R5cGVzJywgZ2V0U3RyaW5nViwgeyBtYXBwZWQ6IHRydWUgfSksXG4gICAgICAgIG5ldyBBcmcoJ2FyZ3MnLCBnZXRTdHJpbmdWLCB7IG1hcHBlZDogdHJ1ZSB9KVxuICAgICAgXSxcbiAgICAgIGFzeW5jICh3b3JsZCwgeyBhcmdUeXBlcywgYXJncyB9KSA9PiB7XG4gICAgICAgIGNvbnN0IHJlYWxBcmdzID0gYXJncy5tYXAoKGEsIGkpID0+IHtcbiAgICAgICAgICBpZiAoYXJnVHlwZXNbaV0udmFsID09ICdhZGRyZXNzJylcbiAgICAgICAgICAgIHJldHVybiBnZXRBZGRyZXNzKHdvcmxkLCBhLnZhbCk7XG4gICAgICAgICAgcmV0dXJuIGEudmFsO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIG5ldyBTdHJpbmdWKHdvcmxkLndlYjMuZXRoLmFiaS5lbmNvZGVQYXJhbWV0ZXJzKGFyZ1R5cGVzLm1hcCh0ID0+IHQudmFsKSwgcmVhbEFyZ3MpKTtcbiAgICAgIH1cbiAgICApLFxuICBuZXcgRmV0Y2hlcjx7IHJlczogVmFsdWUgfSwgVmFsdWU+KFxuICAgIGBcbiAgICAgICMjIyMgVW5pdHJvbGxlclxuXG4gICAgICAqIFwiVW5pdHJvbGxlciAuLi51bml0cm9sbGVyQXJnc1wiIC0gUmV0dXJucyB1bml0cm9sbGVyIHZhbHVlXG4gICAgYCxcbiAgICAnVW5pdHJvbGxlcicsXG4gICAgW25ldyBBcmcoJ3JlcycsIGdldFVuaXRyb2xsZXJWYWx1ZSwgeyB2YXJpYWRpYzogdHJ1ZSB9KV0sXG4gICAgYXN5bmMgKHdvcmxkLCB7IHJlcyB9KSA9PiByZXMsXG4gICAgeyBzdWJFeHByZXNzaW9uczogdW5pdHJvbGxlckZldGNoZXJzKCkgfVxuICApLFxuICBuZXcgRmV0Y2hlcjx7IHJlczogVmFsdWUgfSwgVmFsdWU+KFxuICAgIGBcbiAgICAgICMjIyMgQ29tcHRyb2xsZXJcblxuICAgICAgKiBcIkNvbXB0cm9sbGVyIC4uLmNvbXB0cm9sbGVyQXJnc1wiIC0gUmV0dXJucyBjb21wdHJvbGxlciB2YWx1ZVxuICAgIGAsXG4gICAgJ0NvbXB0cm9sbGVyJyxcbiAgICBbbmV3IEFyZygncmVzJywgZ2V0Q29tcHRyb2xsZXJWYWx1ZSwgeyB2YXJpYWRpYzogdHJ1ZSB9KV0sXG4gICAgYXN5bmMgKHdvcmxkLCB7IHJlcyB9KSA9PiByZXMsXG4gICAgeyBzdWJFeHByZXNzaW9uczogY29tcHRyb2xsZXJGZXRjaGVycygpIH1cbiAgKSxcbiAgbmV3IEZldGNoZXI8eyByZXM6IFZhbHVlIH0sIFZhbHVlPihcbiAgICBgXG4gICAgICAjIyMjIENvbXB0cm9sbGVySW1wbFxuXG4gICAgICAqIFwiQ29tcHRyb2xsZXJJbXBsIC4uLmNvbXB0cm9sbGVySW1wbEFyZ3NcIiAtIFJldHVybnMgY29tcHRyb2xsZXIgaW1wbGVtZW50YXRpb24gdmFsdWVcbiAgICBgLFxuICAgICdDb21wdHJvbGxlckltcGwnLFxuICAgIFtuZXcgQXJnKCdyZXMnLCBnZXRDb21wdHJvbGxlckltcGxWYWx1ZSwgeyB2YXJpYWRpYzogdHJ1ZSB9KV0sXG4gICAgYXN5bmMgKHdvcmxkLCB7IHJlcyB9KSA9PiByZXMsXG4gICAgeyBzdWJFeHByZXNzaW9uczogY29tcHRyb2xsZXJJbXBsRmV0Y2hlcnMoKSB9XG4gICksXG4gIG5ldyBGZXRjaGVyPHsgcmVzOiBWYWx1ZSB9LCBWYWx1ZT4oXG4gICAgYFxuICAgICAgIyMjIyBDVG9rZW5cblxuICAgICAgKiBcIkNUb2tlbiAuLi5jVG9rZW5BcmdzXCIgLSBSZXR1cm5zIGNUb2tlbiB2YWx1ZVxuICAgIGAsXG4gICAgJ0NUb2tlbicsXG4gICAgW25ldyBBcmcoJ3JlcycsIGdldENUb2tlblZhbHVlLCB7IHZhcmlhZGljOiB0cnVlIH0pXSxcbiAgICBhc3luYyAod29ybGQsIHsgcmVzIH0pID0+IHJlcyxcbiAgICB7IHN1YkV4cHJlc3Npb25zOiBjVG9rZW5GZXRjaGVycygpIH1cbiAgKSxcbiAgbmV3IEZldGNoZXI8eyByZXM6IFZhbHVlIH0sIFZhbHVlPihcbiAgICBgXG4gICAgICAjIyMjIENUb2tlbkRlbGVnYXRlXG5cbiAgICAgICogXCJDVG9rZW5EZWxlZ2F0ZSAuLi5jVG9rZW5EZWxlZ2F0ZUFyZ3NcIiAtIFJldHVybnMgY1Rva2VuIGRlbGVnYXRlIHZhbHVlXG4gICAgYCxcbiAgICAnQ1Rva2VuRGVsZWdhdGUnLFxuICAgIFtuZXcgQXJnKCdyZXMnLCBnZXRDVG9rZW5EZWxlZ2F0ZVZhbHVlLCB7IHZhcmlhZGljOiB0cnVlIH0pXSxcbiAgICBhc3luYyAod29ybGQsIHsgcmVzIH0pID0+IHJlcyxcbiAgICB7IHN1YkV4cHJlc3Npb25zOiBjVG9rZW5EZWxlZ2F0ZUZldGNoZXJzKCkgfVxuICApLFxuICBuZXcgRmV0Y2hlcjx7IHJlczogVmFsdWUgfSwgVmFsdWU+KFxuICAgIGBcbiAgICAgICMjIyMgRXJjMjBcblxuICAgICAgKiBcIkVyYzIwIC4uLmVyYzIwQXJnc1wiIC0gUmV0dXJucyBFcmMyMCB2YWx1ZVxuICAgIGAsXG4gICAgJ0VyYzIwJyxcbiAgICBbbmV3IEFyZygncmVzJywgZ2V0RXJjMjBWYWx1ZSwgeyB2YXJpYWRpYzogdHJ1ZSB9KV0sXG4gICAgYXN5bmMgKHdvcmxkLCB7IHJlcyB9KSA9PiByZXMsXG4gICAgeyBzdWJFeHByZXNzaW9uczogZXJjMjBGZXRjaGVycygpIH1cbiAgKSxcbiAgbmV3IEZldGNoZXI8eyByZXM6IFZhbHVlIH0sIFZhbHVlPihcbiAgICBgXG4gICAgICAjIyMjIEludGVyZXN0UmF0ZU1vZGVsXG5cbiAgICAgICogXCJJbnRlcmVzdFJhdGVNb2RlbCAuLi5pbnRlcmVzdFJhdGVNb2RlbEFyZ3NcIiAtIFJldHVybnMgSW50ZXJlc3RSYXRlTW9kZWwgdmFsdWVcbiAgICBgLFxuICAgICdJbnRlcmVzdFJhdGVNb2RlbCcsXG4gICAgW25ldyBBcmcoJ3JlcycsIGdldEludGVyZXN0UmF0ZU1vZGVsVmFsdWUsIHsgdmFyaWFkaWM6IHRydWUgfSldLFxuICAgIGFzeW5jICh3b3JsZCwgeyByZXMgfSkgPT4gcmVzLFxuICAgIHsgc3ViRXhwcmVzc2lvbnM6IGludGVyZXN0UmF0ZU1vZGVsRmV0Y2hlcnMoKSB9XG4gICksXG4gIG5ldyBGZXRjaGVyPHsgcmVzOiBWYWx1ZSB9LCBWYWx1ZT4oXG4gICAgYFxuICAgICAgIyMjIyBQcmljZU9yYWNsZVxuXG4gICAgICAqIFwiUHJpY2VPcmFjbGUgLi4ucHJpY2VPcmFjbGVBcmdzXCIgLSBSZXR1cm5zIFByaWNlT3JhY2xlIHZhbHVlXG4gICAgYCxcbiAgICAnUHJpY2VPcmFjbGUnLFxuICAgIFtuZXcgQXJnKCdyZXMnLCBnZXRQcmljZU9yYWNsZVZhbHVlLCB7IHZhcmlhZGljOiB0cnVlIH0pXSxcbiAgICBhc3luYyAod29ybGQsIHsgcmVzIH0pID0+IHJlcyxcbiAgICB7IHN1YkV4cHJlc3Npb25zOiBwcmljZU9yYWNsZUZldGNoZXJzKCkgfVxuICApLFxuICBuZXcgRmV0Y2hlcjx7IHJlczogVmFsdWUgfSwgVmFsdWU+KFxuICAgIGBcbiAgICAgICMjIyMgUHJpY2VPcmFjbGVQcm94eVxuXG4gICAgICAqIFwiUHJpY2VPcmFjbGVQcm94eSAuLi5wcmljZU9yYWNsZVByb3h5QXJnc1wiIC0gUmV0dXJucyBQcmljZU9yYWNsZVByb3h5IHZhbHVlXG4gICAgYCxcbiAgICAnUHJpY2VPcmFjbGVQcm94eScsXG4gICAgW25ldyBBcmcoJ3JlcycsIGdldFByaWNlT3JhY2xlUHJveHlWYWx1ZSwgeyB2YXJpYWRpYzogdHJ1ZSB9KV0sXG4gICAgYXN5bmMgKHdvcmxkLCB7IHJlcyB9KSA9PiByZXMsXG4gICAgeyBzdWJFeHByZXNzaW9uczogcHJpY2VPcmFjbGVQcm94eUZldGNoZXJzKCkgfVxuICApLFxuICBuZXcgRmV0Y2hlcjx7IHJlczogVmFsdWUgfSwgVmFsdWU+KFxuICAgIGBcbiAgICAgICMjIyMgQW5jaG9yZWRWaWV3XG5cbiAgICAgICogXCJBbmNob3JlZFZpZXcgLi4uYW5jaG9yZWRWaWV3QXJnc1wiIC0gUmV0dXJucyBBbmNob3JlZFZpZXcgdmFsdWVcbiAgICBgLFxuICAgICdBbmNob3JlZFZpZXcnLFxuICAgIFtuZXcgQXJnKCdyZXMnLCBnZXRBbmNob3JlZFZpZXdWYWx1ZSwgeyB2YXJpYWRpYzogdHJ1ZSB9KV0sXG4gICAgYXN5bmMgKHdvcmxkLCB7IHJlcyB9KSA9PiByZXMsXG4gICAgeyBzdWJFeHByZXNzaW9uczogYW5jaG9yZWRWaWV3RmV0Y2hlcnMoKSB9XG4gICksXG4gIG5ldyBGZXRjaGVyPHsgcmVzOiBWYWx1ZSB9LCBWYWx1ZT4oXG4gICAgYFxuICAgICAgIyMjIyBUaW1lbG9ja1xuXG4gICAgICAqIFwiVGltZWxvY2sgLi4udGltZUxvY2tBcmdzXCIgLSBSZXR1cm5zIFRpbWVsb2NrIHZhbHVlXG4gICAgYCxcbiAgICAnVGltZWxvY2snLFxuICAgIFtuZXcgQXJnKCdyZXMnLCBnZXRUaW1lbG9ja1ZhbHVlLCB7IHZhcmlhZGljOiB0cnVlIH0pXSxcbiAgICBhc3luYyAod29ybGQsIHsgcmVzIH0pID0+IHJlcyxcbiAgICB7IHN1YkV4cHJlc3Npb25zOiB0aW1lbG9ja0ZldGNoZXJzKCkgfVxuICApLFxuICBuZXcgRmV0Y2hlcjx7IHJlczogVmFsdWUgfSwgVmFsdWU+KFxuICAgIGBcbiAgICAgICMjIyMgTWF4aW1pbGxpb25cblxuICAgICAgKiBcIk1heGltaWxsaW9uIC4uLm1heGltaWxsaW9uQXJnc1wiIC0gUmV0dXJucyBNYXhpbWlsbGlvbiB2YWx1ZVxuICAgIGAsXG4gICAgJ01heGltaWxsaW9uJyxcbiAgICBbbmV3IEFyZygncmVzJywgZ2V0TWF4aW1pbGxpb25WYWx1ZSwgeyB2YXJpYWRpYzogdHJ1ZSB9KV0sXG4gICAgYXN5bmMgKHdvcmxkLCB7IHJlcyB9KSA9PiByZXMsXG4gICAgeyBzdWJFeHByZXNzaW9uczogbWF4aW1pbGxpb25GZXRjaGVycygpIH1cbiAgKSxcbiAgbmV3IEZldGNoZXI8eyByZXM6IFZhbHVlIH0sIFZhbHVlPihcbiAgICBgXG4gICAgICAjIyMjIE1DRFxuXG4gICAgICAqIFwiTUNEIC4uLm1jZEFyZ3NcIiAtIFJldHVybnMgTUNEIHZhbHVlXG4gICAgYCxcbiAgICAnTUNEJyxcbiAgICBbbmV3IEFyZygncmVzJywgZ2V0TUNEVmFsdWUsIHsgdmFyaWFkaWM6IHRydWUgfSldLFxuICAgIGFzeW5jICh3b3JsZCwgeyByZXMgfSkgPT4gcmVzLFxuICAgIHsgc3ViRXhwcmVzc2lvbnM6IG1jZEZldGNoZXJzKCkgfVxuICApLFxuICBuZXcgRmV0Y2hlcjx7IHJlczogVmFsdWUgfSwgVmFsdWU+KFxuICAgIGBcbiAgICAgICMjIyMgQ29tcFxuXG4gICAgICAqIFwiQ29tcCAuLi5jb21wQXJnc1wiIC0gUmV0dXJucyBDb21wIHZhbHVlXG4gICAgYCxcbiAgICAnQ29tcCcsXG4gICAgW25ldyBBcmcoJ3JlcycsIGdldENvbXBWYWx1ZSwgeyB2YXJpYWRpYzogdHJ1ZSB9KV0sXG4gICAgYXN5bmMgKHdvcmxkLCB7IHJlcyB9KSA9PiByZXMsXG4gICAgeyBzdWJFeHByZXNzaW9uczogY29tcEZldGNoZXJzKCkgfVxuICApLFxuICBuZXcgRmV0Y2hlcjx7IHJlczogVmFsdWUgfSwgVmFsdWU+KFxuICAgIGBcbiAgICAgICMjIyMgR292ZXJub3JcblxuICAgICAgKiBcIkdvdmVybm9yIC4uLmdvdmVybm9yQXJnc1wiIC0gUmV0dXJucyBHb3Zlcm5vciB2YWx1ZVxuICAgIGAsXG4gICAgJ0dvdmVybm9yJyxcbiAgICBbbmV3IEFyZygncmVzJywgZ2V0R292ZXJub3JWYWx1ZSwgeyB2YXJpYWRpYzogdHJ1ZSB9KV0sXG4gICAgYXN5bmMgKHdvcmxkLCB7IHJlcyB9KSA9PiByZXMsXG4gICAgeyBzdWJFeHByZXNzaW9uczogZ292ZXJub3JGZXRjaGVycygpIH1cbiAgKSxcbiAgbmV3IEZldGNoZXI8eyByZXM6IFZhbHVlIH0sIFZhbHVlPihcbiAgICBgXG4gICAgICAjIyMjIEdvdmVybm9yQnJhdm9cblxuICAgICAgKiBcIkdvdmVybm9yQnJhdm8gLi4uZ292ZXJub3JBcmdzXCIgLSBSZXR1cm5zIEdvdmVybm9yQnJhdm8gdmFsdWVcbiAgICBgLFxuICAgICdHb3Zlcm5vckJyYXZvJyxcbiAgICBbbmV3IEFyZygncmVzJywgZ2V0R292ZXJub3JCcmF2b1ZhbHVlLCB7IHZhcmlhZGljOiB0cnVlIH0pXSxcbiAgICBhc3luYyAod29ybGQsIHsgcmVzIH0pID0+IHJlcyxcbiAgICB7IHN1YkV4cHJlc3Npb25zOiBnb3Zlcm5vckJyYXZvRmV0Y2hlcnMoKSB9XG4gICksXG5dO1xuXG5sZXQgY29udHJhY3RGZXRjaGVycyA9IFtcbiAgeyBjb250cmFjdDogXCJDb3VudGVyXCIsIGltcGxpY2l0OiBmYWxzZSB9LFxuICB7IGNvbnRyYWN0OiBcIkNvbXBvdW5kTGVuc1wiLCBpbXBsaWNpdDogZmFsc2UgfSxcbiAgeyBjb250cmFjdDogXCJSZXNlcnZvaXJcIiwgaW1wbGljaXQ6IHRydWUgfVxuXTtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEZldGNoZXJzKHdvcmxkOiBXb3JsZCkge1xuICBpZiAod29ybGQuZmV0Y2hlcnMpIHtcbiAgICByZXR1cm4geyB3b3JsZCwgZmV0Y2hlcnM6IHdvcmxkLmZldGNoZXJzIH07XG4gIH1cblxuICBsZXQgYWxsRmV0Y2hlcnMgPSBmZXRjaGVycy5jb25jYXQoYXdhaXQgUHJvbWlzZS5hbGwoY29udHJhY3RGZXRjaGVycy5tYXAoKHtjb250cmFjdCwgaW1wbGljaXR9KSA9PiB7XG4gICAgcmV0dXJuIGJ1aWxkQ29udHJhY3RGZXRjaGVyKHdvcmxkLCBjb250cmFjdCwgaW1wbGljaXQpO1xuICB9KSkpO1xuXG4gIHJldHVybiB7IHdvcmxkOiB3b3JsZC5zZXQoJ2ZldGNoZXJzJywgYWxsRmV0Y2hlcnMpLCBmZXRjaGVyczogYWxsRmV0Y2hlcnMgfTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldENvcmVWYWx1ZSh3b3JsZDogV29ybGQsIGV2ZW50OiBFdmVudCk6IFByb21pc2U8VmFsdWU+IHtcbiAgbGV0IHt3b3JsZDogbmV4dFdvcmxkLCBmZXRjaGVyc30gPSBhd2FpdCBnZXRGZXRjaGVycyh3b3JsZCk7XG4gIHJldHVybiBhd2FpdCBnZXRGZXRjaGVyVmFsdWU8YW55LCBhbnk+KCdDb3JlJywgZmV0Y2hlcnMsIG5leHRXb3JsZCwgZXZlbnQpO1xufVxuIl19