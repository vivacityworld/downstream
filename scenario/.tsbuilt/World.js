"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fail = exports.describeUser = exports.checkInvariants = exports.checkExpectations = exports.holdInvariants = exports.clearInvariants = exports.addExpectation = exports.addInvariant = exports.addAction = exports.setEvent = exports.initWorld = exports.loadSettings = exports.loadDryRun = exports.loadVerbose = exports.loadInvokationOpts = exports.World = void 0;
const Assert_1 = require("./Assert");
const Action_1 = require("./Action");
const immutable_1 = require("immutable");
const SuccessInvariant_1 = require("./Invariant/SuccessInvariant");
const RemainsInvariant_1 = require("./Invariant/RemainsInvariant");
const StaticInvariant_1 = require("./Invariant/StaticInvariant");
const Formatter_1 = require("./Formatter");
const immutable_2 = require("immutable");
const Settings_1 = require("./Settings");
const Accounts_1 = require("./Accounts");
const startingBlockNumber = 1000;
const defaultWorldProps = {
    actions: [],
    event: null,
    lastInvokation: null,
    newInvokation: false,
    blockNumber: 0,
    gasCounter: { value: 0 },
    lastContract: null,
    invariants: [],
    expectations: [],
    contractIndex: {},
    contractData: immutable_2.Map({}),
    expect: Assert_1.throwExpect,
    web3: null,
    saddle: null,
    printer: null,
    network: null,
    dryRun: false,
    verbose: false,
    settings: Settings_1.Settings.default(null, null),
    accounts: null,
    invokationOpts: {},
    trxInvokationOpts: immutable_2.Map({}),
    basePath: null,
    totalGas: null,
    eventDecoder: {},
    fs: null,
    commands: undefined,
    fetchers: undefined,
};
class World extends immutable_1.Record(defaultWorldProps) {
    constructor(values) {
        values ? super(values) : super();
    }
    getInvokationOpts(baseOpts) {
        return {
            ...baseOpts,
            ...this.invokationOpts,
            ...this.value ? { value: this.value.toString() } : {}
        };
    }
    isLocalNetwork() {
        return this.network === 'test' || this.network === 'development' || this.network === 'coverage';
    }
    async updateSettings(fn) {
        // TODO: Should we do an immutable update?
        const newSettings = await fn(this.settings);
        // TODO: Should we await or just let it clobber?
        await newSettings.save();
        return this.set('settings', newSettings);
    }
    defaultFrom() {
        let settingsFrom = this.settings.findAlias('Me');
        if (settingsFrom) {
            return settingsFrom;
        }
        let accountsDefault = this.accounts.get('default');
        if (accountsDefault) {
            return accountsDefault.address;
        }
        return null;
    }
}
exports.World = World;
function loadInvokationOpts(world) {
    let networkOpts = {};
    const networkOptsStr = process.env[`${world.network}_opts`];
    if (networkOptsStr) {
        networkOpts = JSON.parse(networkOptsStr);
    }
    return world.set('invokationOpts', networkOpts);
}
exports.loadInvokationOpts = loadInvokationOpts;
function loadVerbose(world) {
    return world.set('verbose', !!process.env['verbose']);
}
exports.loadVerbose = loadVerbose;
function loadDryRun(world) {
    return world.set('dryRun', !!process.env['dry_run']);
}
exports.loadDryRun = loadDryRun;
async function loadSettings(world) {
    if (world.basePath) {
        return world.set('settings', await Settings_1.Settings.load(world.basePath, world.network));
    }
    else {
        return world;
    }
}
exports.loadSettings = loadSettings;
async function initWorld(expect, printer, iweb3, saddle, network, accounts, basePath, totalGas) {
    return new World({
        actions: [],
        event: null,
        lastInvokation: null,
        newInvokation: true,
        blockNumber: startingBlockNumber,
        gasCounter: { value: 0 },
        lastContract: null,
        invariants: [new SuccessInvariant_1.SuccessInvariant()],
        expectations: [],
        contractIndex: {},
        contractData: immutable_2.Map({}),
        expect: expect,
        web3: iweb3,
        saddle: saddle,
        printer: printer,
        network: network,
        settings: Settings_1.Settings.default(basePath, null),
        accounts: Accounts_1.loadAccounts(accounts),
        trxInvokationOpts: immutable_2.Map({}),
        basePath: basePath,
        totalGas: totalGas ? totalGas : null,
        eventDecoder: {},
        fs: network === 'test' ? {} : null
    });
}
exports.initWorld = initWorld;
function setEvent(world, event) {
    return world.set('event', event);
}
exports.setEvent = setEvent;
function addAction(world, log, invokation) {
    const action = new Action_1.Action(log, invokation);
    world = world.update('actions', actions => actions.concat([action]));
    // Print the action via the printer
    world.printer.printAction(action);
    return world.merge(world, {
        lastInvokation: invokation,
        newInvokation: true
    });
}
exports.addAction = addAction;
function addInvariant(world, invariant) {
    return world.update('invariants', invariants => invariants.concat([invariant]));
}
exports.addInvariant = addInvariant;
function addExpectation(world, expectation) {
    return world.update('expectations', expectations => expectations.concat([expectation]));
}
exports.addExpectation = addExpectation;
function getInvariantFilter(type) {
    let filters = {
        all: _invariant => true,
        success: invariant => !(invariant instanceof SuccessInvariant_1.SuccessInvariant),
        remains: invariant => !(invariant instanceof RemainsInvariant_1.RemainsInvariant),
        static: invariant => !(invariant instanceof StaticInvariant_1.StaticInvariant)
    };
    let filter = filters[type.toLowerCase()];
    if (!filter) {
        throw new Error(`Unknown invariant type \`${type}\` when wiping invariants.`);
    }
    return filter;
}
function clearInvariants(world, type) {
    let filter = getInvariantFilter(type);
    return world.update('invariants', invariants => world.invariants.filter(filter));
}
exports.clearInvariants = clearInvariants;
function holdInvariants(world, type) {
    let filter = getInvariantFilter(type);
    return world.update('invariants', invariants => {
        return world.invariants.map(invariant => {
            if (filter(invariant)) {
                invariant.held = true;
            }
            return invariant;
        });
    });
}
exports.holdInvariants = holdInvariants;
async function checkExpectations(world) {
    if (!world.get('newInvokation')) {
        return world;
    }
    else {
        // Lastly, check invariants each hold
        await Promise.all(world.get('expectations').map(expectation => {
            // Check the expectation holds
            return expectation.checker(world);
        }));
        return world.set('expectations', []);
    }
}
exports.checkExpectations = checkExpectations;
async function checkInvariants(world) {
    if (!world.get('newInvokation')) {
        return world;
    }
    else {
        // Lastly, check invariants each hold
        await Promise.all(world.get('invariants').map(invariant => {
            // Check the invariant still holds
            if (!invariant.held) {
                return invariant.checker(world);
            }
        }));
        // Remove holds
        return world.update('invariants', invariants => {
            return invariants.map(invariant => {
                invariant.held = false;
                return invariant;
            });
        });
    }
}
exports.checkInvariants = checkInvariants;
function describeUser(world, address) {
    // Look up by alias
    let alias = Object.entries(world.settings.aliases).find(([name, aliasAddr]) => aliasAddr === address);
    if (alias) {
        return `${alias[0]} (${address.slice(0, 6)}...)`;
    }
    // Look up by `from`
    if (world.settings.from === address) {
        return `root (${address.slice(0, 6)}...)`;
    }
    // Look up by unlocked accounts
    let account = world.accounts.find(account => account.address === address);
    if (account) {
        return `${account.name} (${address.slice(0, 6)}...)`;
    }
    // Otherwise, just return the address itself
    return address;
}
exports.describeUser = describeUser;
// Fails an assertion with reason
function fail(world, reason) {
    if (world.event) {
        world.expect(undefined).fail(`${reason} processing ${Formatter_1.formatEvent(world.event)}`);
    }
    else {
        world.expect(undefined).fail(reason);
    }
    return world;
}
exports.fail = fail;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiV29ybGQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvV29ybGQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEscUNBQStDO0FBQy9DLHFDQUFrQztBQUVsQyx5Q0FBbUM7QUFHbkMsbUVBQWdFO0FBQ2hFLG1FQUFnRTtBQUNoRSxpRUFBOEQ7QUFLOUQsMkNBQTBDO0FBQzFDLHlDQUFnQztBQUNoQyx5Q0FBc0M7QUFDdEMseUNBQW9EO0FBTXBELE1BQU0sbUJBQW1CLEdBQUcsSUFBSSxDQUFDO0FBcUNqQyxNQUFNLGlCQUFpQixHQUFlO0lBQ3BDLE9BQU8sRUFBaUIsRUFBRTtJQUMxQixLQUFLLEVBQUUsSUFBSTtJQUNYLGNBQWMsRUFBRSxJQUFJO0lBQ3BCLGFBQWEsRUFBRSxLQUFLO0lBQ3BCLFdBQVcsRUFBRSxDQUFDO0lBQ2QsVUFBVSxFQUFFLEVBQUMsS0FBSyxFQUFFLENBQUMsRUFBQztJQUN0QixZQUFZLEVBQUUsSUFBSTtJQUNsQixVQUFVLEVBQUUsRUFBRTtJQUNkLFlBQVksRUFBRSxFQUFFO0lBQ2hCLGFBQWEsRUFBRSxFQUFFO0lBQ2pCLFlBQVksRUFBRSxlQUFHLENBQUMsRUFBRSxDQUFDO0lBQ3JCLE1BQU0sRUFBRSxvQkFBVztJQUNuQixJQUFJLEVBQUUsSUFBSTtJQUNWLE1BQU0sRUFBRSxJQUFJO0lBQ1osT0FBTyxFQUFFLElBQUk7SUFDYixPQUFPLEVBQUUsSUFBSTtJQUNiLE1BQU0sRUFBRSxLQUFLO0lBQ2IsT0FBTyxFQUFFLEtBQUs7SUFDZCxRQUFRLEVBQUUsbUJBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQztJQUN0QyxRQUFRLEVBQUUsSUFBSTtJQUNkLGNBQWMsRUFBRSxFQUFFO0lBQ2xCLGlCQUFpQixFQUFFLGVBQUcsQ0FBQyxFQUFFLENBQUM7SUFDMUIsUUFBUSxFQUFFLElBQUk7SUFDZCxRQUFRLEVBQUUsSUFBSTtJQUNkLFlBQVksRUFBRSxFQUFFO0lBQ2hCLEVB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RUQsNENBQTRDO0lBQzVDLE9BQU8sT0FBTyxDQUFDO0FBQ2pCLENBQUM7QUFwQkQsb0NBb0JDO0FBRUQsaUNBQWlDO0FBQ2pDLFNBQWdCLElBQUksQ0FBQyxLQUFZLEVBQUUsTUFBYztJQUMvQyxJQUFJLEtBQUssQ0FBQyxLQUFLLEVBQUU7UUFDZixLQUFLLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLE1BQU0sZUFBZSx1QkFBVyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUM7S0FDbEY7U0FBTTtRQUNMLEtBQUssQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0tBQ3RDO0lBRUQsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDO0FBUkQsb0JBUUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBFeHBlY3QsIHRocm93RXhwZWN0IH0gZnJvbSAnLi9Bc3NlcnQnO1xuaW1wb3J0IHsgQWN0aW9uIH0gZnJvbSAnLi9BY3Rpb24nO1xuaW1wb3J0IHsgQ29udHJhY3QgfSBmcm9tICcuL0NvbnRyYWN0JztcbmltcG9ydCB7IFJlY29yZCB9IGZyb20gJ2ltbXV0YWJsZSc7XG5pbXBvcnQgeyBQcmludGVyIH0gZnJvbSAnLi9QcmludGVyJztcbmltcG9ydCB7IEludmFyaWFudCB9IGZyb20gJy4vSW52YXJpYW50JztcbmltcG9ydCB7IFN1Y2Nlc3NJbnZhcmlhbnQgfSBmcm9tICcuL0ludmFyaWFudC9TdWNjZXNzSW52YXJpYW50JztcbmltcG9ydCB7IFJlbWFpbnNJbnZhcmlhbnQgfSBmcm9tICcuL0ludmFyaWFudC9SZW1haW5zSW52YXJpYW50JztcbmltcG9ydCB7IFN0YXRpY0ludmFyaWFudCB9IGZyb20gJy4vSW52YXJpYW50L1N0YXRpY0ludmFyaWFudCc7XG5pbXBvcnQgeyBFeHBlY3RhdGlvbiB9IGZyb20gJy4vRXhwZWN0YXRpb24nO1xuaW1wb3J0IHsgZm9ybWF0UmVzdWx0IH0gZnJvbSAnLi9FcnJvclJlcG9ydGVyJztcbmltcG9ydCB7IEludm9rYXRpb24sIEludm9rYXRpb25PcHRzIH0gZnJvbSAnLi9JbnZva2F0aW9uJztcbmltcG9ydCB7IEV2ZW50IH0gZnJvbSAnLi9FdmVudCc7XG5pbXBvcnQgeyBmb3JtYXRFdmVudCB9IGZyb20gJy4vRm9ybWF0dGVyJztcbmltcG9ydCB7IE1hcCB9IGZyb20gJ2ltbXV0YWJsZSc7XG5pbXBvcnQgeyBTZXR0aW5ncyB9IGZyb20gJy4vU2V0dGluZ3MnO1xuaW1wb3J0IHsgQWNjb3VudHMsIGxvYWRBY2NvdW50cyB9IGZyb20gJy4vQWNjb3VudHMnO1xuaW1wb3J0IFdlYjMgZnJvbSAnd2ViMyc7XG5pbXBvcnQgeyBTYWRkbGUgfSBmcm9tICdldGgtc2FkZGxlJztcbmltcG9ydCB7IENvbW1hbmQsIEZldGNoZXIgfSBmcm9tICcuL0NvbW1hbmQnO1xuaW1wb3J0IHsgVmFsdWV9IGZyb20gJy4vVmFsdWUnO1xuXG5jb25zdCBzdGFydGluZ0Jsb2NrTnVtYmVyID0gMTAwMDtcblxudHlwZSBDb250cmFjdEluZGV4ID0geyBbYWRkcmVzczogc3RyaW5nXTogQ29udHJhY3QgfTtcbnR5cGUgQ291bnRlciA9IHsgdmFsdWU6IG51bWJlciB9O1xudHlwZSBFdmVudERlY29kZXIgPSB7IFtldmVudFNpZ25hdHVyZTogc3RyaW5nXTogKGxvZzogYW55KSA9PiBhbnkgfTtcblxuZXhwb3J0IGludGVyZmFjZSBXb3JsZFByb3BzIHtcbiAgYWN0aW9uczogQWN0aW9uPGFueT5bXTtcbiAgZXZlbnQ6IEV2ZW50IHwgbnVsbDtcbiAgbGFzdEludm9rYXRpb246IEludm9rYXRpb248YW55PiB8IG51bGw7XG4gIG5ld0ludm9rYXRpb246IGJvb2xlYW47XG4gIGJsb2NrTnVtYmVyOiBudW1iZXI7XG4gIGdhc0NvdW50ZXI6IENvdW50ZXI7XG4gIGxhc3RDb250cmFjdDogQ29udHJhY3QgfCBudWxsO1xuICBpbnZhcmlhbnRzOiBJbnZhcmlhbnRbXTtcbiAgZXhwZWN0YXRpb25zOiBFeHBlY3RhdGlvbltdO1xuICBjb250cmFjdEluZGV4OiBDb250cmFjdEluZGV4O1xuICBjb250cmFjdERhdGE6IE1hcDxzdHJpbmcsIG9iamVjdD47XG4gIGV4cGVjdDogRXhwZWN0O1xuICB3ZWIzOiBXZWIzIHwgbnVsbDtcbiAgc2FkZGxlOiBTYWRkbGUgfCBudWxsO1xuICBwcmludGVyOiBQcmludGVyIHwgbnVsbDtcbiAgbmV0d29yazogc3RyaW5nIHwgbnVsbDtcbiAgZHJ5UnVuOiBib29sZWFuO1xuICB2ZXJib3NlOiBib29sZWFuO1xuICBzZXR0aW5nczogU2V0dGluZ3M7XG4gIGFjY291bnRzOiBBY2NvdW50cyB8IG51bGw7XG4gIGludm9rYXRpb25PcHRzOiBJbnZva2F0aW9uT3B0cztcbiAgdHJ4SW52b2thdGlvbk9wdHM6IE1hcDxzdHJpbmcsIGFueT47XG4gIGJhc2VQYXRoOiBzdHJpbmcgfCBudWxsO1xuICB0b3RhbEdhczogbnVtYmVyIHwgbnVsbDtcbiAgZXZlbnREZWNvZGVyOiBFdmVudERlY29kZXI7XG4gIGZzOiBvYmplY3QgfCBudWxsO1xuICBjb21tYW5kczogQ29tbWFuZDxhbnk+W10gfCB1bmRlZmluZWQ7XG4gIGZldGNoZXJzOiBGZXRjaGVyPGFueSwgVmFsdWU+W10gfCB1bmRlZmluZWQ7XG59XG5cbmNvbnN0IGRlZmF1bHRXb3JsZFByb3BzOiBXb3JsZFByb3BzID0ge1xuICBhY3Rpb25zOiA8QWN0aW9uPGFueT5bXT5bXSxcbiAgZXZlbnQ6IG51bGwsXG4gIGxhc3RJbnZva2F0aW9uOiBudWxsLFxuICBuZXdJbnZva2F0aW9uOiBmYWxzZSxcbiAgYmxvY2tOdW1iZXI6IDAsXG4gIGdhc0NvdW50ZXI6IHt2YWx1ZTogMH0sXG4gIGxhc3RDb250cmFjdDogbnVsbCxcbiAgaW52YXJpYW50czogW10sXG4gIGV4cGVjdGF0aW9uczogW10sXG4gIGNvbnRyYWN0SW5kZXg6IHt9LFxuICBjb250cmFjdERhdGE6IE1hcCh7fSksXG4gIGV4cGVjdDogdGhyb3dFeHBlY3QsXG4gIHdlYjM6IG51bGwsXG4gIHNhZGRsZTogbnVsbCxcbiAgcHJpbnRlcjogbnVsbCxcbiAgbmV0d29yazogbnVsbCxcbiAgZHJ5UnVuOiBmYWxzZSxcbiAgdmVyYm9zZTogZmFsc2UsXG4gIHNldHRpbmdzOiBTZXR0aW5ncy5kZWZhdWx0KG51bGwsIG51bGwpLFxuICBhY2NvdW50czogbnVsbCxcbiAgaW52b2thdGlvbk9wdHM6IHt9LFxuICB0cnhJbnZva2F0aW9uT3B0czogTWFwKHt9KSxcbiAgYmFzZVBhdGg6IG51bGwsXG4gIHRvdGFsR2FzOiBudWxsLFxuICBldmVudERlY29kZXI6IHt9LFxuICBmczogbnVsbCxcbiAgY29tbWFuZHM6IHVuZGVmaW5lZCxcbiAgZmV0Y2hlcnM6IHVuZGVmaW5lZCxcbn07XG5cbmV4cG9ydCBjbGFzcyBXb3JsZCBleHRlbmRzIFJlY29yZChkZWZhdWx0V29ybGRQcm9wcykge1xuICBwdWJsaWMgcmVhZG9ubHkgYWN0aW9ucyE6IEFjdGlvbjxhbnk+W107XG4gIHB1YmxpYyByZWFkb25seSBldmVudCE6IEV2ZW50IHwgbnVsbDtcbiAgcHVibGljIHJlYWRvbmx5IHZhbHVlITogbnVtYmVyIHwgbnVsbDtcbiAgcHVibGljIHJlYWRvbmx5IGxhc3RJbnZva2F0aW9uITogSW52b2thdGlvbjxhbnk+IHwgbnVsbDtcbiAgcHVibGljIHJlYWRvbmx5IG5ld0ludm9rYXRpb24hOiBib29sZWFuO1xuICBwdWJsaWMgcmVhZG9ubHkgYmxvY2tOdW1iZXIhOiBudW1iZXI7XG4gIHB1YmxpYyByZWFkb25seSBnYXNDb3VudGVyITogQ291bnRlcjtcbiAgcHVibGljIHJlYWRvbmx5IGxhc3RDb250cmFjdCE6IENvbnRyYWN0IHwgbnVsbDtcbiAgcHVibGljIHJlYWRvbmx5IGludmFyaWFudHMhOiBJbnZhcmlhbnRbXTtcbiAgcHVibGljIHJlYWRvbmx5IGV4cGVjdGF0aW9ucyE6IEV4cGVjdGF0aW9uW107XG4gIHB1YmxpYyByZWFkb25seSBjb250cmFjdEluZGV4ITogQ29udHJhY3RJbmRleDtcbiAgcHVibGljIHJlYWRvbmx5IGNvbnRyYWN0RGF0YSE6IE1hcDxzdHJpbmcsIG9iamVjdD47XG4gIHB1YmxpYyByZWFkb25seSBleHBlY3QhOiBFeHBlY3Q7XG4gIHB1YmxpYyByZWFkb25seSB3ZWIzITogV2ViMztcbiAgcHVibGljIHJlYWRvbmx5IHNhZGRsZSE6IFNhZGRsZTtcbiAgcHVibGljIHJlYWRvbmx5IHByaW50ZXIhOiBQcmludGVyO1xuICBwdWJsaWMgcmVhZG9ubHkgbmV0d29yayE6IHN0cmluZztcbiAgcHVibGljIHJlYWRvbmx5IGRyeVJ1biE6IGJvb2xlYW47XG4gIHB1YmxpYyByZWFkb25seSB2ZXJib3NlITogYm9vbGVhbjtcbiAgcHVibGljIHJlYWRvbmx5IHNldHRpbmdzITogU2V0dGluZ3M7XG4gIHB1YmxpYyByZWFkb25seSBhY2NvdW50cyE6IEFjY291bnRzO1xuICBwdWJsaWMgcmVhZG9ubHkgaW52b2thdGlvbk9wdHMhOiBJbnZva2F0aW9uT3B0cztcbiAgcHVibGljIHJlYWRvbmx5IHRyeEludm9rYXRpb25PcHRzITogTWFwPHN0cmluZywgYW55PjtcbiAgcHVibGljIHJlYWRvbmx5IGJhc2VQYXRoITogc3RyaW5nIHwgbnVsbDtcblxuICBwdWJsaWMgY29uc3RydWN0b3IodmFsdWVzPzogUGFydGlhbDxXb3JsZFByb3BzPikge1xuICAgIHZhbHVlcyA/IHN1cGVyKHZhbHVlcykgOiBzdXBlcigpO1xuICB9XG5cbiAgZ2V0SW52b2thdGlvbk9wdHMoYmFzZU9wdHM6IEludm9rYXRpb25PcHRzKTogSW52b2thdGlvbk9wdHMge1xuICAgIHJldHVybiB7XG4gICAgICAuLi5iYXNlT3B0cyxcbiAgICAgIC4uLnRoaXMuaW52b2thdGlvbk9wdHMsXG4gICAgICAuLi50aGlzLnZhbHVlID8ge3ZhbHVlOiB0aGlzLnZhbHVlLnRvU3RyaW5nKCl9IDoge31cbiAgICB9O1xuICB9XG5cbiAgaXNMb2NhbE5ldHdvcmsoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMubmV0d29yayA9PT0gJ3Rlc3QnIHx8IHRoaXMubmV0d29yayA9PT0gJ2RldmVsb3BtZW50JyB8fCB0aGlzLm5ldHdvcmsgPT09ICdjb3ZlcmFnZSc7XG4gIH1cblxuICBhc3luYyB1cGRhdGVTZXR0aW5ncyhmbjogKHNldHRpbmdzOiBTZXR0aW5ncykgPT4gUHJvbWlzZTxTZXR0aW5ncz4pOiBQcm9taXNlPFdvcmxkPiB7XG4gICAgLy8gVE9ETzogU2hvdWxkIHdlIGRvIGFuIGltbXV0YWJsZSB1cGRhdGU/XG4gICAgY29uc3QgbmV3U2V0dGluZ3MgPSBhd2FpdCBmbih0aGlzLnNldHRpbmdzKTtcblxuICAgIC8vIFRPRE86IFNob3VsZCB3ZSBhd2FpdCBvciBqdXN0IGxldCBpdCBjbG9iYmVyP1xuICAgIGF3YWl0IG5ld1NldHRpbmdzLnNhdmUoKTtcblxuICAgIHJldHVybiB0aGlzLnNldCgnc2V0dGluZ3MnLCBuZXdTZXR0aW5ncyk7XG4gIH1cblxuICBkZWZhdWx0RnJvbSgpOiBzdHJpbmcgfCBudWxsIHtcbiAgICBsZXQgc2V0dGluZ3NGcm9tID0gdGhpcy5zZXR0aW5ncy5maW5kQWxpYXMoJ01lJyk7XG4gICAgaWYgKHNldHRpbmdzRnJvbSkge1xuICAgICAgcmV0dXJuIHNldHRpbmdzRnJvbTtcbiAgICB9XG5cbiAgICBsZXQgYWNjb3VudHNEZWZhdWx0ID0gdGhpcy5hY2NvdW50cy5nZXQoJ2RlZmF1bHQnKTtcbiAgICBpZiAoYWNjb3VudHNEZWZhdWx0KSB7XG4gICAgICByZXR1cm4gYWNjb3VudHNEZWZhdWx0LmFkZHJlc3M7XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGxvYWRJbnZva2F0aW9uT3B0cyh3b3JsZDogV29ybGQpOiBXb3JsZCB7XG4gIGxldCBuZXR3b3JrT3B0cyA9IHt9O1xuICBjb25zdCBuZXR3b3JrT3B0c1N0ciA9IHByb2Nlc3MuZW52W2Ake3dvcmxkLm5ldHdvcmt9X29wdHNgXTtcbiAgaWYgKG5ldHdvcmtPcHRzU3RyKSB7XG4gICAgbmV0d29ya09wdHMgPSBKU09OLnBhcnNlKG5ldHdvcmtPcHRzU3RyKTtcbiAgfVxuXG4gIHJldHVybiB3b3JsZC5zZXQoJ2ludm9rYXRpb25PcHRzJywgbmV0d29ya09wdHMpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbG9hZFZlcmJvc2Uod29ybGQ6IFdvcmxkKTogV29ybGQge1xuICByZXR1cm4gd29ybGQuc2V0KCd2ZXJib3NlJywgISFwcm9jZXNzLmVudlsndmVyYm9zZSddKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGxvYWREcnlSdW4od29ybGQ6IFdvcmxkKTogV29ybGQge1xuICByZXR1cm4gd29ybGQuc2V0KCdkcnlSdW4nLCAhIXByb2Nlc3MuZW52WydkcnlfcnVuJ10pO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbG9hZFNldHRpbmdzKHdvcmxkOiBXb3JsZCk6IFByb21pc2U8V29ybGQ+IHtcbiAgaWYgKHdvcmxkLmJhc2VQYXRoKSB7XG4gICAgcmV0dXJuIHdvcmxkLnNldCgnc2V0dGluZ3MnLCBhd2FpdCBTZXR0aW5ncy5sb2FkKHdvcmxkLmJhc2VQYXRoLCB3b3JsZC5uZXR3b3JrKSk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHdvcmxkO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBpbml0V29ybGQoXG4gIGV4cGVjdDogRXhwZWN0LFxuICBwcmludGVyOiBQcmludGVyLFxuICBpd2ViMzogV2ViMyxcbiAgc2FkZGxlOiBTYWRkbGUsXG4gIG5ldHdvcms6IHN0cmluZyxcbiAgYWNjb3VudHM6IHN0cmluZ1tdLFxuICBiYXNlUGF0aDogc3RyaW5nIHwgbnVsbCxcbiAgdG90YWxHYXM6IG51bWJlciB8IG51bGxcbik6IFByb21pc2U8V29ybGQ+IHtcbiAgcmV0dXJuIG5ldyBXb3JsZCh7XG4gICAgYWN0aW9uczogW10sXG4gICAgZXZlbnQ6IG51bGwsXG4gICAgbGFzdEludm9rYXRpb246IG51bGwsXG4gICAgbmV3SW52b2thdGlvbjogdHJ1ZSxcbiAgICBibG9ja051bWJlcjogc3RhcnRpbmdCbG9ja051bWJlcixcbiAgICBnYXNDb3VudGVyOiB7dmFsdWU6IDB9LFxuICAgIGxhc3RDb250cmFjdDogbnVsbCxcbiAgICBpbnZhcmlhbnRzOiBbbmV3IFN1Y2Nlc3NJbnZhcmlhbnQoKV0sIC8vIFN0YXJ0IHdpdGggaW52YXJpYW50IHN1Y2Nlc3MsXG4gICAgZXhwZWN0YXRpb25zOiBbXSxcbiAgICBjb250cmFjdEluZGV4OiB7fSxcbiAgICBjb250cmFjdERhdGE6IE1hcCh7fSksXG4gICAgZXhwZWN0OiBleHBlY3QsXG4gICAgd2ViMzogaXdlYjMsXG4gICAgc2FkZGxlOiBzYWRkbGUsXG4gICAgcHJpbnRlcjogcHJpbnRlcixcbiAgICBuZXR3b3JrOiBuZXR3b3JrLFxuICAgIHNldHRpbmdzOiBTZXR0aW5ncy5kZWZhdWx0KGJhc2VQYXRoLCBudWxsKSxcbiAgICBhY2NvdW50czogbG9hZEFjY291bnRzKGFjY291bnRzKSxcbiAgICB0cnhJbnZva2F0aW9uT3B0czogTWFwKHt9KSxcbiAgICBiYXNlUGF0aDogYmFzZVBhdGgsXG4gICAgdG90YWxHYXM6IHRvdGFsR2FzID8gdG90YWxHYXMgOiBudWxsLFxuICAgIGV2ZW50RGVjb2Rlcjoge30sXG4gICAgZnM6IG5ldHdvcmsgPT09ICd0ZXN0JyA/IHt9IDogbnVsbFxuICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldEV2ZW50KHdvcmxkOiBXb3JsZCwgZXZlbnQ6IEV2ZW50KTogV29ybGQge1xuICByZXR1cm4gd29ybGQuc2V0KCdldmVudCcsIGV2ZW50KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFkZEFjdGlvbih3b3JsZDogV29ybGQsIGxvZzogc3RyaW5nLCBpbnZva2F0aW9uOiBJbnZva2F0aW9uPGFueT4pOiBXb3JsZCB7XG4gIGNvbnN0IGFjdGlvbiA9IG5ldyBBY3Rpb24obG9nLCBpbnZva2F0aW9uKTtcblxuICB3b3JsZCA9IHdvcmxkLnVwZGF0ZSgnYWN0aW9ucycsIGFjdGlvbnMgPT4gYWN0aW9ucy5jb25jYXQoW2FjdGlvbl0pKTtcblxuICAvLyBQcmludCB0aGUgYWN0aW9uIHZpYSB0aGUgcHJpbnRlclxuICB3b3JsZC5wcmludGVyLnByaW50QWN0aW9uKGFjdGlvbik7XG5cbiAgcmV0dXJuIHdvcmxkLm1lcmdlKHdvcmxkLCB7XG4gICAgbGFzdEludm9rYXRpb246IGludm9rYXRpb24sXG4gICAgbmV3SW52b2thdGlvbjogdHJ1ZVxuICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFkZEludmFyaWFudCh3b3JsZDogV29ybGQsIGludmFyaWFudDogSW52YXJpYW50KTogV29ybGQge1xuICByZXR1cm4gd29ybGQudXBkYXRlKCdpbnZhcmlhbnRzJywgaW52YXJpYW50cyA9PiBpbnZhcmlhbnRzLmNvbmNhdChbaW52YXJpYW50XSkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYWRkRXhwZWN0YXRpb24od29ybGQ6IFdvcmxkLCBleHBlY3RhdGlvbjogRXhwZWN0YXRpb24pOiBXb3JsZCB7XG4gIHJldHVybiB3b3JsZC51cGRhdGUoJ2V4cGVjdGF0aW9ucycsIGV4cGVjdGF0aW9ucyA9PiBleHBlY3RhdGlvbnMuY29uY2F0KFtleHBlY3RhdGlvbl0pKTtcbn1cblxuZnVuY3Rpb24gZ2V0SW52YXJpYW50RmlsdGVyKHR5cGU6IHN0cmluZykge1xuICBsZXQgZmlsdGVyczogeyBbZmlsdGVyOiBzdHJpbmddOiAoaW52YXJpYW50OiBJbnZhcmlhbnQpID0+IGJvb2xlYW4gfSA9IHtcbiAgICBhbGw6IF9pbnZhcmlhbnQgPT4gdHJ1ZSxcbiAgICBzdWNjZXNzOiBpbnZhcmlhbnQgPT4gIShpbnZhcmlhbnQgaW5zdGFuY2VvZiBTdWNjZXNzSW52YXJpYW50KSxcbiAgICByZW1haW5zOiBpbnZhcmlhbnQgPT4gIShpbnZhcmlhbnQgaW5zdGFuY2VvZiBSZW1haW5zSW52YXJpYW50KSxcbiAgICBzdGF0aWM6IGludmFyaWFudCA9PiAhKGludmFyaWFudCBpbnN0YW5jZW9mIFN0YXRpY0ludmFyaWFudClcbiAgfTtcblxuICBsZXQgZmlsdGVyID0gZmlsdGVyc1t0eXBlLnRvTG93ZXJDYXNlKCldO1xuXG4gIGlmICghZmlsdGVyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIGludmFyaWFudCB0eXBlIFxcYCR7dHlwZX1cXGAgd2hlbiB3aXBpbmcgaW52YXJpYW50cy5gKTtcbiAgfVxuXG4gIHJldHVybiBmaWx0ZXI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjbGVhckludmFyaWFudHMod29ybGQ6IFdvcmxkLCB0eXBlOiBzdHJpbmcpOiBXb3JsZCB7XG4gIGxldCBmaWx0ZXIgPSBnZXRJbnZhcmlhbnRGaWx0ZXIodHlwZSk7XG5cbiAgcmV0dXJuIHdvcmxkLnVwZGF0ZSgnaW52YXJpYW50cycsIGludmFyaWFudHMgPT4gd29ybGQuaW52YXJpYW50cy5maWx0ZXIoZmlsdGVyKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBob2xkSW52YXJpYW50cyh3b3JsZDogV29ybGQsIHR5cGU6IHN0cmluZyk6IFdvcmxkIHtcbiAgbGV0IGZpbHRlciA9IGdldEludmFyaWFudEZpbHRlcih0eXBlKTtcblxuICByZXR1cm4gd29ybGQudXBkYXRlKCdpbnZhcmlhbnRzJywgaW52YXJpYW50cyA9PiB7XG4gICAgcmV0dXJuIHdvcmxkLmludmFyaWFudHMubWFwKGludmFyaWFudCA9PiB7XG4gICAgICBpZiAoZmlsdGVyKGludmFyaWFudCkpIHtcbiAgICAgICAgaW52YXJpYW50LmhlbGQgPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gaW52YXJpYW50O1xuICAgIH0pO1xuICB9KTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNoZWNrRXhwZWN0YXRpb25zKHdvcmxkOiBXb3JsZCk6IFByb21pc2U8V29ybGQ+IHtcbiAgaWYgKCF3b3JsZC5nZXQoJ25ld0ludm9rYXRpb24nKSkge1xuICAgIHJldHVybiB3b3JsZDtcbiAgfSBlbHNlIHtcbiAgICAvLyBMYXN0bHksIGNoZWNrIGludmFyaWFudHMgZWFjaCBob2xkXG4gICAgYXdhaXQgUHJvbWlzZS5hbGwoXG4gICAgICB3b3JsZC5nZXQoJ2V4cGVjdGF0aW9ucycpLm1hcChleHBlY3RhdGlvbiA9PiB7XG4gICAgICAgIC8vIENoZWNrIHRoZSBleHBlY3RhdGlvbiBob2xkc1xuICAgICAgICByZXR1cm4gZXhwZWN0YXRpb24uY2hlY2tlcih3b3JsZCk7XG4gICAgICB9KVxuICAgICk7XG5cbiAgICByZXR1cm4gd29ybGQuc2V0KCdleHBlY3RhdGlvbnMnLCBbXSk7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNoZWNrSW52YXJpYW50cyh3b3JsZDogV29ybGQpOiBQcm9taXNlPFdvcmxkPiB7XG4gIGlmICghd29ybGQuZ2V0KCduZXdJbnZva2F0aW9uJykpIHtcbiAgICByZXR1cm4gd29ybGQ7XG4gIH0gZWxzZSB7XG4gICAgLy8gTGFzdGx5LCBjaGVjayBpbnZhcmlhbnRzIGVhY2ggaG9sZFxuICAgIGF3YWl0IFByb21pc2UuYWxsKFxuICAgICAgd29ybGQuZ2V0KCdpbnZhcmlhbnRzJykubWFwKGludmFyaWFudCA9PiB7XG4gICAgICAgIC8vIENoZWNrIHRoZSBpbnZhcmlhbnQgc3RpbGwgaG9sZHNcbiAgICAgICAgaWYgKCFpbnZhcmlhbnQuaGVsZCkge1xuICAgICAgICAgIHJldHVybiBpbnZhcmlhbnQuY2hlY2tlcih3b3JsZCk7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgKTtcblxuICAgIC8vIFJlbW92ZSBob2xkc1xuICAgIHJldHVybiB3b3JsZC51cGRhdGUoJ2ludmFyaWFudHMnLCBpbnZhcmlhbnRzID0+IHtcbiAgICAgIHJldHVybiBpbnZhcmlhbnRzLm1hcChpbnZhcmlhbnQgPT4ge1xuICAgICAgICBpbnZhcmlhbnQuaGVsZCA9IGZhbHNlO1xuXG4gICAgICAgIHJldHVybiBpbnZhcmlhbnQ7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZGVzY3JpYmVVc2VyKHdvcmxkOiBXb3JsZCwgYWRkcmVzczogc3RyaW5nKTogc3RyaW5nIHtcbiAgLy8gTG9vayB1cCBieSBhbGlhc1xuICBsZXQgYWxpYXMgPSBPYmplY3QuZW50cmllcyh3b3JsZC5zZXR0aW5ncy5hbGlhc2VzKS5maW5kKChbbmFtZSwgYWxpYXNBZGRyXSkgPT4gYWxpYXNBZGRyID09PSBhZGRyZXNzKTtcbiAgaWYgKGFsaWFzKSB7XG4gICAgcmV0dXJuIGAke2FsaWFzWzBdfSAoJHthZGRyZXNzLnNsaWNlKDAsNil9Li4uKWA7XG4gIH1cblxuICAvLyBMb29rIHVwIGJ5IGBmcm9tYFxuICBpZiAod29ybGQuc2V0dGluZ3MuZnJvbSA9PT0gYWRkcmVzcykge1xuICAgIHJldHVybiBgcm9vdCAoJHthZGRyZXNzLnNsaWNlKDAsNil9Li4uKWA7XG4gIH1cblxuICAvLyBMb29rIHVwIGJ5IHVubG9ja2VkIGFjY291bnRzXG4gIGxldCBhY2NvdW50ID0gd29ybGQuYWNjb3VudHMuZmluZChhY2NvdW50ID0+IGFjY291bnQuYWRkcmVzcyA9PT0gYWRkcmVzcyk7XG4gIGlmIChhY2NvdW50KSB7XG4gICAgcmV0dXJuIGAke2FjY291bnQubmFtZX0gKCR7YWRkcmVzcy5zbGljZSgwLDYpfS4uLilgO1xuICB9XG5cbiAgLy8gT3RoZXJ3aXNlLCBqdXN0IHJldHVybiB0aGUgYWRkcmVzcyBpdHNlbGZcbiAgcmV0dXJuIGFkZHJlc3M7XG59XG5cbi8vIEZhaWxzIGFuIGFzc2VydGlvbiB3aXRoIHJlYXNvblxuZXhwb3J0IGZ1bmN0aW9uIGZhaWwod29ybGQ6IFdvcmxkLCByZWFzb246IHN0cmluZyk6IFdvcmxkIHtcbiAgaWYgKHdvcmxkLmV2ZW50KSB7XG4gICAgd29ybGQuZXhwZWN0KHVuZGVmaW5lZCkuZmFpbChgJHtyZWFzb259IHByb2Nlc3NpbmcgJHtmb3JtYXRFdmVudCh3b3JsZC5ldmVudCl9YCk7XG4gIH0gZWxzZSB7XG4gICAgd29ybGQuZXhwZWN0KHVuZGVmaW5lZCkuZmFpbChyZWFzb24pO1xuICB9XG5cbiAgcmV0dXJuIHdvcmxkO1xufVxuIl19