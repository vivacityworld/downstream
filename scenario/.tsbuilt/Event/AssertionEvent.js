"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processAssertionEvent = exports.assertionCommands = void 0;
const World_1 = require("../World");
const CoreValue_1 = require("../CoreValue");
const Invokation_1 = require("../Invokation");
const CoreValue_2 = require("../CoreValue");
const Value_1 = require("../Value");
const Command_1 = require("../Command");
const Utils_1 = require("../Utils");
async function assertApprox(world, given, expected, tolerance) {
    if (Math.abs(Number(expected.sub(given).div(expected).val)) > Number(tolerance.val)) {
        return World_1.fail(world, `Expected ${given.toString()} to approximately equal ${expected.toString()} within ${tolerance.toString()}`);
    }
    return world;
}
async function assertEqual(world, given, expected) {
    if (!expected.compareTo(world, given)) {
        return World_1.fail(world, `Expected ${given.toString()} to equal ${expected.toString()}`);
    }
    return world;
}
async function assertLessThan(world, given, expected) {
    if (given.compareOrder(world, expected) !== Value_1.Order.LESS_THAN) {
        return World_1.fail(world, `Expected ${given.toString()} to be less than ${expected.toString()}`);
    }
    return world;
}
async function assertGreaterThan(world, given, expected) {
    if (given.compareOrder(world, expected) !== Value_1.Order.GREATER_THAN) {
        return World_1.fail(world, `Expected ${given.toString()} to be greater than ${expected.toString()}`);
    }
    return world;
}
async function assertFailure(world, failure) {
    if (!world.lastInvokation) {
        return World_1.fail(world, `Expected ${failure.toString()}, but missing any invokations.`);
    }
    if (world.lastInvokation.success()) {
        return World_1.fail(world, `Expected ${failure.toString()}, but last invokation was successful with result ${JSON.stringify(world.lastInvokation.value)}.`);
    }
    if (world.lastInvokation.error) {
        return World_1.fail(world, `Expected ${failure.toString()}, but last invokation threw error ${world.lastInvokation.error}.`);
    }
    if (world.lastInvokation.failures.length === 0) {
        throw new Error(`Invokation requires success, failure or error, got: ${world.lastInvokation.toString()}`);
    }
    if (world.lastInvokation.failures.find((f) => f.equals(failure)) === undefined) {
        return World_1.fail(world, `Expected ${failure.toString()}, but got ${world.lastInvokation.failures.toString()}.`);
    }
    return world;
}
// coverage tests don't currently support checking full message given with a revert
function coverageSafeRevertMessage(world, message) {
    if (world.network === 'coverage') {
        return "revert";
    }
    else {
        return message;
    }
}
async function assertRevertFailure(world, err, message) {
    if (world.network === 'coverage') { // coverage doesn't have detailed message, thus no revert failures
        return await assertRevert(world, message);
    }
    if (!world.lastInvokation) {
        return World_1.fail(world, `Expected revert failure, but missing any invokations.`);
    }
    if (world.lastInvokation.success()) {
        return World_1.fail(world, `Expected revert failure, but last invokation was successful with result ${JSON.stringify(world.lastInvokation.value)}.`);
    }
    if (world.lastInvokation.failures.length > 0) {
        return World_1.fail(world, `Expected revert failure, but got ${world.lastInvokation.failures.toString()}.`);
    }
    if (!world.lastInvokation.error) {
        throw new Error(`Invokation requires success, failure or error, got: ${world.lastInvokation.toString()}`);
    }
    if (!(world.lastInvokation.error instanceof Invokation_1.InvokationRevertFailure)) {
        throw new Error(`Invokation error mismatch, expected revert failure: "${err}, ${message}", got: "${world.lastInvokation.error.toString()}"`);
    }
    const expectedMessage = `VM Exception while processing transaction: ${coverageSafeRevertMessage(world, message)}`;
    if (world.lastInvokation.error.error !== err || world.lastInvokation.error.errMessage !== expectedMessage) {
        throw new Error(`Invokation error mismatch, expected revert failure: err=${err}, message="${expectedMessage}", got: "${world.lastInvokation.error.toString()}"`);
    }
    return world;
}
async function assertRevertCustomError(world, err, args) {
    if (world.network === 'coverage') { // coverage doesn't have detailed message, thus no revert failures
        return await assertRevert(world, "revert");
    }
    if (!world.lastInvokation) {
        return World_1.fail(world, `Expected revert failure, but missing any invokations.`);
    }
    if (world.lastInvokation.success()) {
        return World_1.fail(world, `Expected revert failure, but last invokation was successful with result ${JSON.stringify(world.lastInvokation.value)}.`);
    }
    if (world.lastInvokation.failures.length > 0) {
        return World_1.fail(world, `Expected revert failure, but got ${world.lastInvokation.failures.toString()}.`);
    }
    if (!world.lastInvokation.error) {
        throw new Error(`Invokation requires success, failure or error, got: ${world.lastInvokation.toString()}`);
    }
    if (!(world.lastInvokation.error instanceof Invokation_1.InvokationRevertCustomError)) {
        throw new Error(`Invokation error mismatch, expected revert custom error: "${err}", got: "${world.lastInvokation.error.toString()}"`);
    }
    const expectedResult = world.lastInvokation.errorReporter.getEncodedCustomError(err, args);
    if (!expectedResult) {
        throw new Error(`Expected revert with custom error, but custom error ${err} not found`);
    }
    if (Object.values(world.lastInvokation.error.errorResults).findIndex(v => v.error === 'revert' && v.return === expectedResult) < 0) {
        throw new Error(`Invokation error mismatch, expected revert custom error: err=${err}, args="${args.join(',')}", got: "${world.lastInvokation.error.toString()}"`);
    }
    return world;
}
async function assertError(world, message) {
    if (!world.lastInvokation) {
        return World_1.fail(world, `Expected revert, but missing any invokations.`);
    }
    if (world.lastInvokation.success()) {
        return World_1.fail(world, `Expected revert, but last invokation was successful with result ${JSON.stringify(world.lastInvokation.value)}.`);
    }
    if (world.lastInvokation.failures.length > 0) {
        return World_1.fail(world, `Expected revert, but got ${world.lastInvokation.failures.toString()}.`);
    }
    if (!world.lastInvokation.error) {
        throw new Error(`Invokation requires success, failure or error, got: ${world.lastInvokation.toString()}`);
    }
    if (!world.lastInvokation.error.message.startsWith(message)) {
        throw new Error(`Invokation error mismatch, expected: "${message}", got: "${world.lastInvokation.error.message}"`);
    }
    return world;
}
function buildRevertMessage(world, message) {
    return `VM Exception while processing transaction: ${coverageSafeRevertMessage(world, message)}`;
}
async function assertRevert(world, message) {
    return await assertError(world, buildRevertMessage(world, message));
}
async function assertSuccess(world) {
    if (!world.lastInvokation || world.lastInvokation.success()) {
        return world;
    }
    else {
        return World_1.fail(world, `Expected success, but got ${world.lastInvokation.toString()}.`);
    }
}
async function assertReadError(world, event, message, isRevert) {
    try {
        let value = await CoreValue_1.getCoreValue(world, event);
        throw new Error(`Expected read revert, instead got value \`${value}\``);
    }
    catch (err) {
        let expectedMessage;
        if (isRevert) {
            expectedMessage = buildRevertMessage(world, message);
        }
        else {
            expectedMessage = message;
        }
        world.expect(expectedMessage).toEqual(err.message); // XXXS "expected read revert"
    }
    return world;
}
function getLogValue(value) {
    if (typeof value === 'number' || (typeof value === 'string' && value.match(/^[0-9]+$/))) {
        return new Value_1.NumberV(Number(value));
    }
    else if (typeof value === 'string') {
        return new Value_1.StringV(value);
    }
    else if (typeof value === 'boolean') {
        return new Value_1.BoolV(value);
    }
    else if (Array.isArray(value)) {
        return new Value_1.ListV(value.map(getLogValue));
    }
    else {
        throw new Error('Unknown type of log parameter: ${value}');
    }
}
async function assertLog(world, event, keyValues) {
    if (!world.lastInvokation) {
        return World_1.fail(world, `Expected log message "${event}" from contract execution, but world missing any invokations.`);
    }
    else if (!world.lastInvokation.receipt) {
        return World_1.fail(world, `Expected log message "${event}" from contract execution, but world invokation transaction.`);
    }
    else {
        const log = world.lastInvokation.receipt.events && world.lastInvokation.receipt.events[event];
        if (!log) {
            const events = Object.keys(world.lastInvokation.receipt.events || {}).join(', ');
            return World_1.fail(world, `Expected log with event \`${event}\`, found logs with events: [${events}]`);
        }
        if (Array.isArray(log)) {
            const found = log.find(_log => {
                return Object.entries(keyValues.val).reduce((previousValue, currentValue) => {
                    const [key, value] = currentValue;
                    if (previousValue) {
                        if (_log.returnValues[key] === undefined) {
                            return false;
                        }
                        else {
                            let logValue = getLogValue(_log.returnValues[key]);
                            if (!logValue.compareTo(world, value)) {
                                return false;
                            }
                            return true;
                        }
                    }
                    return previousValue;
                }, true);
            });
            if (!found) {
                const eventExpected = Object.entries(keyValues.val).join(', ');
                const eventDetailsFound = log.map(_log => {
                    return Object.entries(_log.returnValues);
                });
                return World_1.fail(world, `Expected log with event \`${eventExpected}\`, found logs for this event with: [${eventDetailsFound}]`);
            }
        }
        else {
            Object.entries(keyValues.val).forEach(([key, value]) => {
                if (log.returnValues[key] === undefined) {
                    World_1.fail(world, `Expected log to have param for \`${key}\``);
                }
                else {
                    let logValue = getLogValue(log.returnValues[key]);
                    if (!logValue.compareTo(world, value)) {
                        World_1.fail(world, `Expected log to have param \`${key}\` to match ${value.toString()}, but got ${logValue.toString()}`);
                    }
                }
            });
        }
        return world;
    }
}
function assertionCommands() {
    return [
        new Command_1.View(`
        #### Approx

        * "Approx given:<Value> expected:<Value> tolerance:<Value>" - Asserts that given approximately matches expected.
          * E.g. "Assert Approx (Exactly 0) Zero "
          * E.g. "Assert Approx (CToken cZRX TotalSupply) (Exactly 55) 1e-18"
          * E.g. "Assert Approx (CToken cZRX Comptroller) (Comptroller Address) 1"
      `, "Approx", [
            new Command_1.Arg("given", CoreValue_2.getNumberV),
            new Command_1.Arg("expected", CoreValue_2.getNumberV),
            new Command_1.Arg("tolerance", CoreValue_2.getNumberV, { default: new Value_1.NumberV(0.001) })
        ], (world, { given, expected, tolerance }) => assertApprox(world, given, expected, tolerance)),
        new Command_1.View(`
        #### Equal

        * "Equal given:<Value> expected:<Value>" - Asserts that given matches expected.
          * E.g. "Assert Equal (Exactly 0) Zero"
          * E.g. "Assert Equal (CToken cZRX TotalSupply) (Exactly 55)"
          * E.g. "Assert Equal (CToken cZRX Comptroller) (Comptroller Address)"
      `, "Equal", [
            new Command_1.Arg("given", CoreValue_1.getCoreValue),
            new Command_1.Arg("expected", CoreValue_1.getCoreValue)
        ], (world, { given, expected }) => assertEqual(world, given, expected)),
        new Command_1.View(`
        #### LessThan

        * "given:<Value> LessThan expected:<Value>" - Asserts that given is less than expected.
          * E.g. "Assert (Exactly 0) LessThan (Exactly 1)"
      `, "LessThan", [
            new Command_1.Arg("given", CoreValue_1.getCoreValue),
            new Command_1.Arg("expected", CoreValue_1.getCoreValue)
        ], (world, { given, expected }) => assertLessThan(world, given, expected), { namePos: 1 }),
        new Command_1.View(`
        #### GreaterThan

        * "given:<Value> GreaterThan expected:<Value>" - Asserts that given is greater than the expected.
          * E.g. "Assert (Exactly 0) GreaterThan (Exactly 1)"
      `, "GreaterThan", [
            new Command_1.Arg("given", CoreValue_1.getCoreValue),
            new Command_1.Arg("expected", CoreValue_1.getCoreValue)
        ], (world, { given, expected }) => assertGreaterThan(world, given, expected), { namePos: 1 }),
        new Command_1.View(`
        #### True

        * "True given:<Value>" - Asserts that given is true.
          * E.g. "Assert True (Comptroller CheckMembership Geoff cETH)"
      `, "True", [
            new Command_1.Arg("given", CoreValue_1.getCoreValue)
        ], (world, { given }) => assertEqual(world, given, new Value_1.BoolV(true))),
        new Command_1.View(`
        #### False

        * "False given:<Value>" - Asserts that given is false.
          * E.g. "Assert False (Comptroller CheckMembership Geoff cETH)"
      `, "False", [
            new Command_1.Arg("given", CoreValue_1.getCoreValue)
        ], (world, { given }) => assertEqual(world, given, new Value_1.BoolV(false))),
        new Command_1.View(`
        #### ReadRevert

        * "ReadRevert event:<Event> message:<String>" - Asserts that reading the given value reverts with given message.
          * E.g. "Assert ReadRevert (Comptroller CheckMembership Geoff cETH) \"revert\""
      `, "ReadRevert", [
            new Command_1.Arg("event", CoreValue_2.getEventV),
            new Command_1.Arg("message", CoreValue_2.getStringV)
        ], (world, { event, message }) => assertReadError(world, event.val, message.val, true)),
        new Command_1.View(`
        #### ReadError

        * "ReadError event:<Event> message:<String>" - Asserts that reading the given value throws given error
          * E.g. "Assert ReadError (Comptroller Bad Address) \"cannot find comptroller\""
      `, "ReadError", [
            new Command_1.Arg("event", CoreValue_2.getEventV),
            new Command_1.Arg("message", CoreValue_2.getStringV)
        ], (world, { event, message }) => assertReadError(world, event.val, message.val, false)),
        new Command_1.View(`
        #### Failure

        * "Failure error:<String> info:<String> detail:<Number?>" - Asserts that last transaction had a graceful failure with given error, info and detail.
          * E.g. "Assert Failure UNAUTHORIZED SUPPORT_MARKET_OWNER_CHECK"
          * E.g. "Assert Failure MATH_ERROR MINT_CALCULATE_BALANCE 5"
      `, "Failure", [
            new Command_1.Arg("error", CoreValue_2.getStringV),
            new Command_1.Arg("info", CoreValue_2.getStringV),
            new Command_1.Arg("detail", CoreValue_2.getStringV, { default: new Value_1.StringV("0") }),
        ], (world, { error, info, detail }) => assertFailure(world, new Invokation_1.Failure(error.val, info.val, detail.val))),
        new Command_1.View(`
        #### RevertFailure

        * "RevertFailure error:<String> message:<String>" - Assert last transaction reverted with a message beginning with an error code
          * E.g. "Assert RevertFailure UNAUTHORIZED \"set reserves failed\""
      `, "RevertFailure", [
            new Command_1.Arg("error", CoreValue_2.getStringV),
            new Command_1.Arg("message", CoreValue_2.getStringV),
        ], (world, { error, message }) => assertRevertFailure(world, error.val, message.val)),
        new Command_1.View(`
        #### RevertCustomError

        * "RevertCustomError error:<String> args:<[]Value>" - Assert last transaction reverted with a message beginning with an error code
          * E.g. "Assert RevertFailure UNAUTHORIZED \"set reserves failed\""
      `, "RevertCustomError", [
            new Command_1.Arg("error", CoreValue_2.getStringV),
            new Command_1.Arg("args", CoreValue_1.getCoreValue, { variadic: true, mapped: true, default: [] }),
        ], (world, { error, args }) => assertRevertCustomError(world, error.val, Utils_1.rawValues(args))),
        new Command_1.View(`
        #### Revert

        * "Revert message:<String>" - Asserts that the last transaction reverted.
      `, "Revert", [
            new Command_1.Arg("message", CoreValue_2.getStringV, { default: new Value_1.StringV("revert") }),
        ], (world, { message }) => assertRevert(world, message.val)),
        new Command_1.View(`
        #### Error

        * "Error message:<String>" - Asserts that the last transaction had the given error.
      `, "Error", [
            new Command_1.Arg("message", CoreValue_2.getStringV),
        ], (world, { message }) => assertError(world, message.val)),
        new Command_1.View(`
        #### Success

        * "Success" - Asserts that the last transaction completed successfully (that is, did not revert nor emit graceful failure).
      `, "Success", [], (world, { given }) => assertSuccess(world)),
        new Command_1.View(`
        #### Log

        * "Log name:<String> (key:<String> value:<Value>) ..." - Asserts that last transaction emitted log with given name and key-value pairs.
          * E.g. "Assert Log Minted ("account" (User Geoff address)) ("amount" (Exactly 55))"
      `, "Log", [
            new Command_1.Arg("name", CoreValue_2.getStringV),
            new Command_1.Arg("params", CoreValue_2.getMapV, { variadic: true }),
        ], (world, { name, params }) => assertLog(world, name.val, params))
    ];
}
exports.assertionCommands = assertionCommands;
async function processAssertionEvent(world, event, from) {
    return await Command_1.processCommandEvent("Assertion", assertionCommands(), world, event, from);
}
exports.processAssertionEvent = processAssertionEvent;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQXNzZXJ0aW9uRXZlbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvRXZlbnQvQXNzZXJ0aW9uRXZlbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0Esb0NBQXVDO0FBQ3ZDLDRDQUE0QztBQUM1Qyw4Q0FBOEY7QUFDOUYsNENBS3NCO0FBQ3RCLG9DQVVrQjtBQUNsQix3Q0FBNEQ7QUFDNUQsb0NBQXFDO0FBRXJDLEtBQUssVUFBVSxZQUFZLENBQUMsS0FBWSxFQUFFLEtBQWMsRUFBRSxRQUFpQixFQUFFLFNBQWtCO0lBQzdGLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1FBQ25GLE9BQU8sWUFBSSxDQUFDLEtBQUssRUFBRSxZQUFZLEtBQUssQ0FBQyxRQUFRLEVBQUUsMkJBQTJCLFFBQVEsQ0FBQyxRQUFRLEVBQUUsV0FBVyxTQUFTLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0tBQ2pJO0lBRUQsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDO0FBRUQsS0FBSyxVQUFVLFdBQVcsQ0FBQyxLQUFZLEVBQUUsS0FBWSxFQUFFLFFBQWU7SUFDcEUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxFQUFFO1FBQ3JDLE9BQU8sWUFBSSxDQUFDLEtBQUssRUFBRSxZQUFZLEtBQUssQ0FBQyxRQUFRLEVBQUUsYUFBYSxRQUFRLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0tBQ3BGO0lBRUQsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDO0FBRUQsS0FBSyxVQUFVLGNBQWMsQ0FBQyxLQUFZLEVBQUUsS0FBWSxFQUFFLFFBQWU7SUFDdkUsSUFB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RSxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDOUYsQ0FBQztBQUZELHNEQUVDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRXZlbnQgfSBmcm9tICcuLi9FdmVudCc7XG5pbXBvcnQgeyBmYWlsLCBXb3JsZCB9IGZyb20gJy4uL1dvcmxkJztcbmltcG9ydCB7IGdldENvcmVWYWx1ZSB9IGZyb20gJy4uL0NvcmVWYWx1ZSc7XG5pbXBvcnQgeyBGYWlsdXJlLCBJbnZva2F0aW9uUmV2ZXJ0Q3VzdG9tRXJyb3IsIEludm9rYXRpb25SZXZlcnRGYWlsdXJlIH0gZnJvbSAnLi4vSW52b2thdGlvbic7XG5pbXBvcnQge1xuICBnZXRFdmVudFYsXG4gIGdldE1hcFYsXG4gIGdldE51bWJlclYsXG4gIGdldFN0cmluZ1Zcbn0gZnJvbSAnLi4vQ29yZVZhbHVlJztcbmltcG9ydCB7XG4gIEFkZHJlc3NWLFxuICBCb29sVixcbiAgRXZlbnRWLFxuICBMaXN0VixcbiAgTWFwVixcbiAgTnVtYmVyVixcbiAgT3JkZXIsXG4gIFN0cmluZ1YsXG4gIFZhbHVlXG59IGZyb20gJy4uL1ZhbHVlJztcbmltcG9ydCB7IEFyZywgVmlldywgcHJvY2Vzc0NvbW1hbmRFdmVudCB9IGZyb20gJy4uL0NvbW1hbmQnO1xuaW1wb3J0IHsgcmF3VmFsdWVzIH0gZnJvbSAnLi4vVXRpbHMnO1xuXG5hc3luYyBmdW5jdGlvbiBhc3NlcnRBcHByb3god29ybGQ6IFdvcmxkLCBnaXZlbjogTnVtYmVyViwgZXhwZWN0ZWQ6IE51bWJlclYsIHRvbGVyYW5jZTogTnVtYmVyVik6IFByb21pc2U8V29ybGQ+IHtcbiAgaWYgKE1hdGguYWJzKE51bWJlcihleHBlY3RlZC5zdWIoZ2l2ZW4pLmRpdihleHBlY3RlZCkudmFsKSkgPiBOdW1iZXIodG9sZXJhbmNlLnZhbCkpIHtcbiAgICByZXR1cm4gZmFpbCh3b3JsZCwgYEV4cGVjdGVkICR7Z2l2ZW4udG9TdHJpbmcoKX0gdG8gYXBwcm94aW1hdGVseSBlcXVhbCAke2V4cGVjdGVkLnRvU3RyaW5nKCl9IHdpdGhpbiAke3RvbGVyYW5jZS50b1N0cmluZygpfWApO1xuICB9XG5cbiAgcmV0dXJuIHdvcmxkO1xufVxuXG5hc3luYyBmdW5jdGlvbiBhc3NlcnRFcXVhbCh3b3JsZDogV29ybGQsIGdpdmVuOiBWYWx1ZSwgZXhwZWN0ZWQ6IFZhbHVlKTogUHJvbWlzZTxXb3JsZD4ge1xuICBpZiAoIWV4cGVjdGVkLmNvbXBhcmVUbyh3b3JsZCwgZ2l2ZW4pKSB7XG4gICAgcmV0dXJuIGZhaWwod29ybGQsIGBFeHBlY3RlZCAke2dpdmVuLnRvU3RyaW5nKCl9IHRvIGVxdWFsICR7ZXhwZWN0ZWQudG9TdHJpbmcoKX1gKTtcbiAgfVxuXG4gIHJldHVybiB3b3JsZDtcbn1cblxuYXN5bmMgZnVuY3Rpb24gYXNzZXJ0TGVzc1RoYW4od29ybGQ6IFdvcmxkLCBnaXZlbjogVmFsdWUsIGV4cGVjdGVkOiBWYWx1ZSk6IFByb21pc2U8V29ybGQ+IHtcbiAgaWYgKGdpdmVuLmNvbXBhcmVPcmRlcih3b3JsZCwgZXhwZWN0ZWQpICE9PSBPcmRlci5MRVNTX1RIQU4pIHtcbiAgICByZXR1cm4gZmFpbCh3b3JsZCwgYEV4cGVjdGVkICR7Z2l2ZW4udG9TdHJpbmcoKX0gdG8gYmUgbGVzcyB0aGFuICR7ZXhwZWN0ZWQudG9TdHJpbmcoKX1gKTtcbiAgfVxuXG4gIHJldHVybiB3b3JsZDtcbn1cblxuYXN5bmMgZnVuY3Rpb24gYXNzZXJ0R3JlYXRlclRoYW4od29ybGQ6IFdvcmxkLCBnaXZlbjogVmFsdWUsIGV4cGVjdGVkOiBWYWx1ZSk6IFByb21pc2U8V29ybGQ+IHtcbiAgaWYgKGdpdmVuLmNvbXBhcmVPcmRlcih3b3JsZCwgZXhwZWN0ZWQpICE9PSBPcmRlci5HUkVBVEVSX1RIQU4pIHtcbiAgICByZXR1cm4gZmFpbCh3b3JsZCwgYEV4cGVjdGVkICR7Z2l2ZW4udG9TdHJpbmcoKX0gdG8gYmUgZ3JlYXRlciB0aGFuICR7ZXhwZWN0ZWQudG9TdHJpbmcoKX1gKTtcbiAgfVxuXG4gIHJldHVybiB3b3JsZDtcbn1cblxuYXN5bmMgZnVuY3Rpb24gYXNzZXJ0RmFpbHVyZSh3b3JsZDogV29ybGQsIGZhaWx1cmU6IEZhaWx1cmUpOiBQcm9taXNlPFdvcmxkPiB7XG4gIGlmICghd29ybGQubGFzdEludm9rYXRpb24pIHtcbiAgICByZXR1cm4gZmFpbCh3b3JsZCwgYEV4cGVjdGVkICR7ZmFpbHVyZS50b1N0cmluZygpfSwgYnV0IG1pc3NpbmcgYW55IGludm9rYXRpb25zLmApO1xuICB9XG5cbiAgaWYgKHdvcmxkLmxhc3RJbnZva2F0aW9uLnN1Y2Nlc3MoKSkge1xuICAgIHJldHVybiBmYWlsKHdvcmxkLCBgRXhwZWN0ZWQgJHtmYWlsdXJlLnRvU3RyaW5nKCl9LCBidXQgbGFzdCBpbnZva2F0aW9uIHdhcyBzdWNjZXNzZnVsIHdpdGggcmVzdWx0ICR7SlNPTi5zdHJpbmdpZnkod29ybGQubGFzdEludm9rYXRpb24udmFsdWUpfS5gKTtcbiAgfVxuXG4gIGlmICh3b3JsZC5sYXN0SW52b2thdGlvbi5lcnJvcikge1xuICAgIHJldHVybiBmYWlsKHdvcmxkLCBgRXhwZWN0ZWQgJHtmYWlsdXJlLnRvU3RyaW5nKCl9LCBidXQgbGFzdCBpbnZva2F0aW9uIHRocmV3IGVycm9yICR7d29ybGQubGFzdEludm9rYXRpb24uZXJyb3J9LmApO1xuICB9XG5cbiAgaWYgKHdvcmxkLmxhc3RJbnZva2F0aW9uLmZhaWx1cmVzLmxlbmd0aCA9PT0gMCkge1xuICAgIHRocm93IG5ldyBFcnJvcihgSW52b2thdGlvbiByZXF1aXJlcyBzdWNjZXNzLCBmYWlsdXJlIG9yIGVycm9yLCBnb3Q6ICR7d29ybGQubGFzdEludm9rYXRpb24udG9TdHJpbmcoKX1gKTtcbiAgfVxuXG4gIGlmICh3b3JsZC5sYXN0SW52b2thdGlvbi5mYWlsdXJlcy5maW5kKChmKSA9PiBmLmVxdWFscyhmYWlsdXJlKSkgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBmYWlsKHdvcmxkLCBgRXhwZWN0ZWQgJHtmYWlsdXJlLnRvU3RyaW5nKCl9LCBidXQgZ290ICR7d29ybGQubGFzdEludm9rYXRpb24uZmFpbHVyZXMudG9TdHJpbmcoKX0uYCk7XG4gIH1cblxuICByZXR1cm4gd29ybGQ7XG59XG5cbi8vIGNvdmVyYWdlIHRlc3RzIGRvbid0IGN1cnJlbnRseSBzdXBwb3J0IGNoZWNraW5nIGZ1bGwgbWVzc2FnZSBnaXZlbiB3aXRoIGEgcmV2ZXJ0XG5mdW5jdGlvbiBjb3ZlcmFnZVNhZmVSZXZlcnRNZXNzYWdlKHdvcmxkOiBXb3JsZCwgbWVzc2FnZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgaWYgKHdvcmxkLm5ldHdvcmsgPT09ICdjb3ZlcmFnZScpIHtcbiAgICByZXR1cm4gXCJyZXZlcnRcIjtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbWVzc2FnZTtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBhc3NlcnRSZXZlcnRGYWlsdXJlKHdvcmxkOiBXb3JsZCwgZXJyOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZyk6IFByb21pc2U8V29ybGQ+IHtcbiAgaWYgKHdvcmxkLm5ldHdvcmsgPT09ICdjb3ZlcmFnZScpIHsgLy8gY292ZXJhZ2UgZG9lc24ndCBoYXZlIGRldGFpbGVkIG1lc3NhZ2UsIHRodXMgbm8gcmV2ZXJ0IGZhaWx1cmVzXG4gICAgcmV0dXJuIGF3YWl0IGFzc2VydFJldmVydCh3b3JsZCwgbWVzc2FnZSk7XG4gIH1cblxuICBpZiAoIXdvcmxkLmxhc3RJbnZva2F0aW9uKSB7XG4gICAgcmV0dXJuIGZhaWwod29ybGQsIGBFeHBlY3RlZCByZXZlcnQgZmFpbHVyZSwgYnV0IG1pc3NpbmcgYW55IGludm9rYXRpb25zLmApO1xuICB9XG5cbiAgaWYgKHdvcmxkLmxhc3RJbnZva2F0aW9uLnN1Y2Nlc3MoKSkge1xuICAgIHJldHVybiBmYWlsKHdvcmxkLCBgRXhwZWN0ZWQgcmV2ZXJ0IGZhaWx1cmUsIGJ1dCBsYXN0IGludm9rYXRpb24gd2FzIHN1Y2Nlc3NmdWwgd2l0aCByZXN1bHQgJHtKU09OLnN0cmluZ2lmeSh3b3JsZC5sYXN0SW52b2thdGlvbi52YWx1ZSl9LmApO1xuICB9XG5cbiAgaWYgKHdvcmxkLmxhc3RJbnZva2F0aW9uLmZhaWx1cmVzLmxlbmd0aCA+IDApIHtcbiAgICByZXR1cm4gZmFpbCh3b3JsZCwgYEV4cGVjdGVkIHJldmVydCBmYWlsdXJlLCBidXQgZ290ICR7d29ybGQubGFzdEludm9rYXRpb24uZmFpbHVyZXMudG9TdHJpbmcoKX0uYCk7XG4gIH1cblxuICBpZiAoIXdvcmxkLmxhc3RJbnZva2F0aW9uLmVycm9yKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBJbnZva2F0aW9uIHJlcXVpcmVzIHN1Y2Nlc3MsIGZhaWx1cmUgb3IgZXJyb3IsIGdvdDogJHt3b3JsZC5sYXN0SW52b2thdGlvbi50b1N0cmluZygpfWApO1xuICB9XG5cbiAgaWYgKCEod29ybGQubGFzdEludm9rYXRpb24uZXJyb3IgaW5zdGFuY2VvZiBJbnZva2F0aW9uUmV2ZXJ0RmFpbHVyZSkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEludm9rYXRpb24gZXJyb3IgbWlzbWF0Y2gsIGV4cGVjdGVkIHJldmVydCBmYWlsdXJlOiBcIiR7ZXJyfSwgJHttZXNzYWdlfVwiLCBnb3Q6IFwiJHt3b3JsZC5sYXN0SW52b2thdGlvbi5lcnJvci50b1N0cmluZygpfVwiYCk7XG4gIH1cblxuICBjb25zdCBleHBlY3RlZE1lc3NhZ2UgPSBgVk0gRXhjZXB0aW9uIHdoaWxlIHByb2Nlc3NpbmcgdHJhbnNhY3Rpb246ICR7Y292ZXJhZ2VTYWZlUmV2ZXJ0TWVzc2FnZSh3b3JsZCwgbWVzc2FnZSl9YDtcblxuICBpZiAod29ybGQubGFzdEludm9rYXRpb24uZXJyb3IuZXJyb3IgIT09IGVyciB8fCB3b3JsZC5sYXN0SW52b2thdGlvbi5lcnJvci5lcnJNZXNzYWdlICE9PSBleHBlY3RlZE1lc3NhZ2UpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEludm9rYXRpb24gZXJyb3IgbWlzbWF0Y2gsIGV4cGVjdGVkIHJldmVydCBmYWlsdXJlOiBlcnI9JHtlcnJ9LCBtZXNzYWdlPVwiJHtleHBlY3RlZE1lc3NhZ2V9XCIsIGdvdDogXCIke3dvcmxkLmxhc3RJbnZva2F0aW9uLmVycm9yLnRvU3RyaW5nKCl9XCJgKTtcbiAgfVxuXG4gIHJldHVybiB3b3JsZDtcbn1cblxuYXN5bmMgZnVuY3Rpb24gYXNzZXJ0UmV2ZXJ0Q3VzdG9tRXJyb3Iod29ybGQ6IFdvcmxkLCBlcnI6IHN0cmluZywgYXJnczogdW5rbm93bltdKTogUHJvbWlzZTxXb3JsZD4ge1xuICBpZiAod29ybGQubmV0d29yayA9PT0gJ2NvdmVyYWdlJykgeyAvLyBjb3ZlcmFnZSBkb2Vzbid0IGhhdmUgZGV0YWlsZWQgbWVzc2FnZSwgdGh1cyBubyByZXZlcnQgZmFpbHVyZXNcbiAgICByZXR1cm4gYXdhaXQgYXNzZXJ0UmV2ZXJ0KHdvcmxkLCBcInJldmVydFwiKTtcbiAgfVxuXG4gIGlmICghd29ybGQubGFzdEludm9rYXRpb24pIHtcbiAgICByZXR1cm4gZmFpbCh3b3JsZCwgYEV4cGVjdGVkIHJldmVydCBmYWlsdXJlLCBidXQgbWlzc2luZyBhbnkgaW52b2thdGlvbnMuYCk7XG4gIH1cblxuICBpZiAod29ybGQubGFzdEludm9rYXRpb24uc3VjY2VzcygpKSB7XG4gICAgcmV0dXJuIGZhaWwod29ybGQsIGBFeHBlY3RlZCByZXZlcnQgZmFpbHVyZSwgYnV0IGxhc3QgaW52b2thdGlvbiB3YXMgc3VjY2Vzc2Z1bCB3aXRoIHJlc3VsdCAke0pTT04uc3RyaW5naWZ5KHdvcmxkLmxhc3RJbnZva2F0aW9uLnZhbHVlKX0uYCk7XG4gIH1cblxuICBpZiAod29ybGQubGFzdEludm9rYXRpb24uZmFpbHVyZXMubGVuZ3RoID4gMCkge1xuICAgIHJldHVybiBmYWlsKHdvcmxkLCBgRXhwZWN0ZWQgcmV2ZXJ0IGZhaWx1cmUsIGJ1dCBnb3QgJHt3b3JsZC5sYXN0SW52b2thdGlvbi5mYWlsdXJlcy50b1N0cmluZygpfS5gKTtcbiAgfVxuXG4gIGlmICghd29ybGQubGFzdEludm9rYXRpb24uZXJyb3IpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEludm9rYXRpb24gcmVxdWlyZXMgc3VjY2VzcywgZmFpbHVyZSBvciBlcnJvciwgZ290OiAke3dvcmxkLmxhc3RJbnZva2F0aW9uLnRvU3RyaW5nKCl9YCk7XG4gIH1cblxuICBpZiAoISh3b3JsZC5sYXN0SW52b2thdGlvbi5lcnJvciBpbnN0YW5jZW9mIEludm9rYXRpb25SZXZlcnRDdXN0b21FcnJvcikpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEludm9rYXRpb24gZXJyb3IgbWlzbWF0Y2gsIGV4cGVjdGVkIHJldmVydCBjdXN0b20gZXJyb3I6IFwiJHtlcnJ9XCIsIGdvdDogXCIke3dvcmxkLmxhc3RJbnZva2F0aW9uLmVycm9yLnRvU3RyaW5nKCl9XCJgKTtcbiAgfVxuXG4gIGNvbnN0IGV4cGVjdGVkUmVzdWx0ID0gd29ybGQubGFzdEludm9rYXRpb24uZXJyb3JSZXBvcnRlci5nZXRFbmNvZGVkQ3VzdG9tRXJyb3IoZXJyLCBhcmdzKTtcblxuICBpZiAoIWV4cGVjdGVkUmVzdWx0KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBFeHBlY3RlZCByZXZlcnQgd2l0aCBjdXN0b20gZXJyb3IsIGJ1dCBjdXN0b20gZXJyb3IgJHtlcnJ9IG5vdCBmb3VuZGApXG4gIH1cblxuICBpZiAoT2JqZWN0LnZhbHVlcyh3b3JsZC5sYXN0SW52b2thdGlvbi5lcnJvci5lcnJvclJlc3VsdHMpLmZpbmRJbmRleCh2ID0+IHYuZXJyb3IgPT09ICdyZXZlcnQnICYmIHYucmV0dXJuID09PSBleHBlY3RlZFJlc3VsdCkgPCAwKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBJbnZva2F0aW9uIGVycm9yIG1pc21hdGNoLCBleHBlY3RlZCByZXZlcnQgY3VzdG9tIGVycm9yOiBlcnI9JHtlcnJ9LCBhcmdzPVwiJHthcmdzLmpvaW4oJywnKX1cIiwgZ290OiBcIiR7d29ybGQubGFzdEludm9rYXRpb24uZXJyb3IudG9TdHJpbmcoKX1cImApO1xuICB9XG5cbiAgcmV0dXJuIHdvcmxkO1xufVxuXG5hc3luYyBmdW5jdGlvbiBhc3NlcnRFcnJvcih3b3JsZDogV29ybGQsIG1lc3NhZ2U6IHN0cmluZyk6IFByb21pc2U8V29ybGQ+IHtcbiAgaWYgKCF3b3JsZC5sYXN0SW52b2thdGlvbikge1xuICAgIHJldHVybiBmYWlsKHdvcmxkLCBgRXhwZWN0ZWQgcmV2ZXJ0LCBidXQgbWlzc2luZyBhbnkgaW52b2thdGlvbnMuYCk7XG4gIH1cblxuICBpZiAod29ybGQubGFzdEludm9rYXRpb24uc3VjY2VzcygpKSB7XG4gICAgcmV0dXJuIGZhaWwod29ybGQsIGBFeHBlY3RlZCByZXZlcnQsIGJ1dCBsYXN0IGludm9rYXRpb24gd2FzIHN1Y2Nlc3NmdWwgd2l0aCByZXN1bHQgJHtKU09OLnN0cmluZ2lmeSh3b3JsZC5sYXN0SW52b2thdGlvbi52YWx1ZSl9LmApO1xuICB9XG5cbiAgaWYgKHdvcmxkLmxhc3RJbnZva2F0aW9uLmZhaWx1cmVzLmxlbmd0aCA+IDApIHtcbiAgICByZXR1cm4gZmFpbCh3b3JsZCwgYEV4cGVjdGVkIHJldmVydCwgYnV0IGdvdCAke3dvcmxkLmxhc3RJbnZva2F0aW9uLmZhaWx1cmVzLnRvU3RyaW5nKCl9LmApO1xuICB9XG5cbiAgaWYgKCF3b3JsZC5sYXN0SW52b2thdGlvbi5lcnJvcikge1xuICAgIHRocm93IG5ldyBFcnJvcihgSW52b2thdGlvbiByZXF1aXJlcyBzdWNjZXNzLCBmYWlsdXJlIG9yIGVycm9yLCBnb3Q6ICR7d29ybGQubGFzdEludm9rYXRpb24udG9TdHJpbmcoKX1gKTtcbiAgfVxuXG4gIGlmICghd29ybGQubGFzdEludm9rYXRpb24uZXJyb3IubWVzc2FnZS5zdGFydHNXaXRoKG1lc3NhZ2UpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBJbnZva2F0aW9uIGVycm9yIG1pc21hdGNoLCBleHBlY3RlZDogXCIke21lc3NhZ2V9XCIsIGdvdDogXCIke3dvcmxkLmxhc3RJbnZva2F0aW9uLmVycm9yLm1lc3NhZ2V9XCJgKTtcbiAgfVxuXG4gIHJldHVybiB3b3JsZDtcbn1cblxuZnVuY3Rpb24gYnVpbGRSZXZlcnRNZXNzYWdlKHdvcmxkOiBXb3JsZCwgbWVzc2FnZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGBWTSBFeGNlcHRpb24gd2hpbGUgcHJvY2Vzc2luZyB0cmFuc2FjdGlvbjogJHtjb3ZlcmFnZVNhZmVSZXZlcnRNZXNzYWdlKHdvcmxkLCBtZXNzYWdlKX1gXG59XG5cbmFzeW5jIGZ1bmN0aW9uIGFzc2VydFJldmVydCh3b3JsZDogV29ybGQsIG1lc3NhZ2U6IHN0cmluZyk6IFByb21pc2U8V29ybGQ+IHtcbiAgcmV0dXJuIGF3YWl0IGFzc2VydEVycm9yKHdvcmxkLCBidWlsZFJldmVydE1lc3NhZ2Uod29ybGQsIG1lc3NhZ2UpKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gYXNzZXJ0U3VjY2Vzcyh3b3JsZDogV29ybGQpOiBQcm9taXNlPFdvcmxkPiB7XG4gIGlmICghd29ybGQubGFzdEludm9rYXRpb24gfHwgd29ybGQubGFzdEludm9rYXRpb24uc3VjY2VzcygpKSB7XG4gICAgcmV0dXJuIHdvcmxkO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBmYWlsKHdvcmxkLCBgRXhwZWN0ZWQgc3VjY2VzcywgYnV0IGdvdCAke3dvcmxkLmxhc3RJbnZva2F0aW9uLnRvU3RyaW5nKCl9LmApO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGFzc2VydFJlYWRFcnJvcih3b3JsZDogV29ybGQsIGV2ZW50OiBFdmVudCwgbWVzc2FnZTogc3RyaW5nLCBpc1JldmVydDogYm9vbGVhbik6IFByb21pc2U8V29ybGQ+IHtcbiAgdHJ5IHtcbiAgICBsZXQgdmFsdWUgPSBhd2FpdCBnZXRDb3JlVmFsdWUod29ybGQsIGV2ZW50KTtcblxuICAgIHRocm93IG5ldyBFcnJvcihgRXhwZWN0ZWQgcmVhZCByZXZlcnQsIGluc3RlYWQgZ290IHZhbHVlIFxcYCR7dmFsdWV9XFxgYCk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGxldCBleHBlY3RlZE1lc3NhZ2U7XG4gICAgaWYgKGlzUmV2ZXJ0KSB7XG4gICAgICBleHBlY3RlZE1lc3NhZ2UgPSBidWlsZFJldmVydE1lc3NhZ2Uod29ybGQsIG1lc3NhZ2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICBleHBlY3RlZE1lc3NhZ2UgPSBtZXNzYWdlO1xuICAgIH1cblxuICAgIHdvcmxkLmV4cGVjdChleHBlY3RlZE1lc3NhZ2UpLnRvRXF1YWwoZXJyLm1lc3NhZ2UpOyAvLyBYWFhTIFwiZXhwZWN0ZWQgcmVhZCByZXZlcnRcIlxuICB9XG5cbiAgcmV0dXJuIHdvcmxkO1xufVxuXG5mdW5jdGlvbiBnZXRMb2dWYWx1ZSh2YWx1ZTogYW55KTogVmFsdWUge1xuICBpZiAodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJyB8fCAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyAmJiB2YWx1ZS5tYXRjaCgvXlswLTldKyQvKSkpIHtcbiAgICByZXR1cm4gbmV3IE51bWJlclYoTnVtYmVyKHZhbHVlKSk7XG4gIH0gZWxzZSBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgIHJldHVybiBuZXcgU3RyaW5nVih2YWx1ZSk7XG4gIH0gZWxzZSBpZiAodHlwZW9mIHZhbHVlID09PSAnYm9vbGVhbicpIHtcbiAgICByZXR1cm4gbmV3IEJvb2xWKHZhbHVlKTtcbiAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgIHJldHVybiBuZXcgTGlzdFYodmFsdWUubWFwKGdldExvZ1ZhbHVlKSk7XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdVbmtub3duIHR5cGUgb2YgbG9nIHBhcmFtZXRlcjogJHt2YWx1ZX0nKTtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBhc3NlcnRMb2cod29ybGQ6IFdvcmxkLCBldmVudDogc3RyaW5nLCBrZXlWYWx1ZXM6IE1hcFYpOiBQcm9taXNlPFdvcmxkPiB7XG4gIGlmICghd29ybGQubGFzdEludm9rYXRpb24pIHtcbiAgICByZXR1cm4gZmFpbCh3b3JsZCwgYEV4cGVjdGVkIGxvZyBtZXNzYWdlIFwiJHtldmVudH1cIiBmcm9tIGNvbnRyYWN0IGV4ZWN1dGlvbiwgYnV0IHdvcmxkIG1pc3NpbmcgYW55IGludm9rYXRpb25zLmApO1xuICB9IGVsc2UgaWYgKCF3b3JsZC5sYXN0SW52b2thdGlvbi5yZWNlaXB0KSB7XG4gICAgcmV0dXJuIGZhaWwod29ybGQsIGBFeHBlY3RlZCBsb2cgbWVzc2FnZSBcIiR7ZXZlbnR9XCIgZnJvbSBjb250cmFjdCBleGVjdXRpb24sIGJ1dCB3b3JsZCBpbnZva2F0aW9uIHRyYW5zYWN0aW9uLmApO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IGxvZyA9IHdvcmxkLmxhc3RJbnZva2F0aW9uLnJlY2VpcHQuZXZlbnRzICYmIHdvcmxkLmxhc3RJbnZva2F0aW9uLnJlY2VpcHQuZXZlbnRzW2V2ZW50XTtcblxuICAgIGlmICghbG9nKSB7XG4gICAgICBjb25zdCBldmVudHMgPSBPYmplY3Qua2V5cyh3b3JsZC5sYXN0SW52b2thdGlvbi5yZWNlaXB0LmV2ZW50cyB8fCB7fSkuam9pbignLCAnKTtcbiAgICAgIHJldHVybiBmYWlsKHdvcmxkLCBgRXhwZWN0ZWQgbG9nIHdpdGggZXZlbnQgXFxgJHtldmVudH1cXGAsIGZvdW5kIGxvZ3Mgd2l0aCBldmVudHM6IFske2V2ZW50c31dYCk7XG4gICAgfVxuXG4gICAgaWYgKEFycmF5LmlzQXJyYXkobG9nKSkge1xuICAgICAgY29uc3QgZm91bmQgPSBsb2cuZmluZChfbG9nID0+IHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5lbnRyaWVzKGtleVZhbHVlcy52YWwpLnJlZHVjZSgocHJldmlvdXNWYWx1ZSwgY3VycmVudFZhbHVlKSA9PiB7XG4gICAgICAgICAgY29uc3QgW2tleSwgdmFsdWVdID0gY3VycmVudFZhbHVlO1xuICAgICAgICAgIGlmIChwcmV2aW91c1ZhbHVlKSB7XG4gICAgICAgICAgICBpZiAoX2xvZy5yZXR1cm5WYWx1ZXNba2V5XSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGxldCBsb2dWYWx1ZSA9IGdldExvZ1ZhbHVlKF9sb2cucmV0dXJuVmFsdWVzW2tleV0pO1xuXG4gICAgICAgICAgICAgIGlmICghbG9nVmFsdWUuY29tcGFyZVRvKHdvcmxkLCB2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHByZXZpb3VzVmFsdWU7XG4gICAgICAgIH0sIHRydWUgYXMgYm9vbGVhbik7XG4gICAgICB9KTtcblxuICAgICAgaWYgKCFmb3VuZCkge1xuICAgICAgICBjb25zdCBldmVudEV4cGVjdGVkID0gT2JqZWN0LmVudHJpZXMoa2V5VmFsdWVzLnZhbCkuam9pbignLCAnKTtcbiAgICAgICAgY29uc3QgZXZlbnREZXRhaWxzRm91bmQgPSBsb2cubWFwKF9sb2cgPT4ge1xuICAgICAgICAgIHJldHVybiBPYmplY3QuZW50cmllcyhfbG9nLnJldHVyblZhbHVlcyk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZmFpbCh3b3JsZCwgYEV4cGVjdGVkIGxvZyB3aXRoIGV2ZW50IFxcYCR7ZXZlbnRFeHBlY3RlZH1cXGAsIGZvdW5kIGxvZ3MgZm9yIHRoaXMgZXZlbnQgd2l0aDogWyR7ZXZlbnREZXRhaWxzRm91bmR9XWApO1xuICAgICAgfVxuXG4gICAgfSBlbHNlIHtcbiAgICAgIE9iamVjdC5lbnRyaWVzKGtleVZhbHVlcy52YWwpLmZvckVhY2goKFtrZXksIHZhbHVlXSkgPT4ge1xuICAgICAgICBpZiAobG9nLnJldHVyblZhbHVlc1trZXldID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBmYWlsKHdvcmxkLCBgRXhwZWN0ZWQgbG9nIHRvIGhhdmUgcGFyYW0gZm9yIFxcYCR7a2V5fVxcYGApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxldCBsb2dWYWx1ZSA9IGdldExvZ1ZhbHVlKGxvZy5yZXR1cm5WYWx1ZXNba2V5XSk7XG5cbiAgICAgICAgICBpZiAoIWxvZ1ZhbHVlLmNvbXBhcmVUbyh3b3JsZCwgdmFsdWUpKSB7XG4gICAgICAgICAgICBmYWlsKHdvcmxkLCBgRXhwZWN0ZWQgbG9nIHRvIGhhdmUgcGFyYW0gXFxgJHtrZXl9XFxgIHRvIG1hdGNoICR7dmFsdWUudG9TdHJpbmcoKX0sIGJ1dCBnb3QgJHtsb2dWYWx1ZS50b1N0cmluZygpfWApO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHdvcmxkO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRpb25Db21tYW5kcygpIHtcbiAgcmV0dXJuIFtcbiAgICBuZXcgVmlldzx7IGdpdmVuOiBOdW1iZXJWLCBleHBlY3RlZDogTnVtYmVyViwgdG9sZXJhbmNlOiBOdW1iZXJWIH0+KGBcbiAgICAgICAgIyMjIyBBcHByb3hcblxuICAgICAgICAqIFwiQXBwcm94IGdpdmVuOjxWYWx1ZT4gZXhwZWN0ZWQ6PFZhbHVlPiB0b2xlcmFuY2U6PFZhbHVlPlwiIC0gQXNzZXJ0cyB0aGF0IGdpdmVuIGFwcHJveGltYXRlbHkgbWF0Y2hlcyBleHBlY3RlZC5cbiAgICAgICAgICAqIEUuZy4gXCJBc3NlcnQgQXBwcm94IChFeGFjdGx5IDApIFplcm8gXCJcbiAgICAgICAgICAqIEUuZy4gXCJBc3NlcnQgQXBwcm94IChDVG9rZW4gY1pSWCBUb3RhbFN1cHBseSkgKEV4YWN0bHkgNTUpIDFlLTE4XCJcbiAgICAgICAgICAqIEUuZy4gXCJBc3NlcnQgQXBwcm94IChDVG9rZW4gY1pSWCBDb21wdHJvbGxlcikgKENvbXB0cm9sbGVyIEFkZHJlc3MpIDFcIlxuICAgICAgYCxcbiAgICAgIFwiQXBwcm94XCIsXG4gICAgICBbXG4gICAgICAgIG5ldyBBcmcoXCJnaXZlblwiLCBnZXROdW1iZXJWKSxcbiAgICAgICAgbmV3IEFyZyhcImV4cGVjdGVkXCIsIGdldE51bWJlclYpLFxuICAgICAgICBuZXcgQXJnKFwidG9sZXJhbmNlXCIsIGdldE51bWJlclYsIHsgZGVmYXVsdDogbmV3IE51bWJlclYoMC4wMDEpIH0pXG4gICAgICBdLFxuICAgICAgKHdvcmxkLCB7IGdpdmVuLCBleHBlY3RlZCwgdG9sZXJhbmNlIH0pID0+IGFzc2VydEFwcHJveCh3b3JsZCwgZ2l2ZW4sIGV4cGVjdGVkLCB0b2xlcmFuY2UpXG4gICAgKSxcblxuICAgIG5ldyBWaWV3PHsgZ2l2ZW46IFZhbHVlLCBleHBlY3RlZDogVmFsdWUgfT4oYFxuICAgICAgICAjIyMjIEVxdWFsXG5cbiAgICAgICAgKiBcIkVxdWFsIGdpdmVuOjxWYWx1ZT4gZXhwZWN0ZWQ6PFZhbHVlPlwiIC0gQXNzZXJ0cyB0aGF0IGdpdmVuIG1hdGNoZXMgZXhwZWN0ZWQuXG4gICAgICAgICAgKiBFLmcuIFwiQXNzZXJ0IEVxdWFsIChFeGFjdGx5IDApIFplcm9cIlxuICAgICAgICAgICogRS5nLiBcIkFzc2VydCBFcXVhbCAoQ1Rva2VuIGNaUlggVG90YWxTdXBwbHkpIChFeGFjdGx5IDU1KVwiXG4gICAgICAgICAgKiBFLmcuIFwiQXNzZXJ0IEVxdWFsIChDVG9rZW4gY1pSWCBDb21wdHJvbGxlcikgKENvbXB0cm9sbGVyIEFkZHJlc3MpXCJcbiAgICAgIGAsXG4gICAgICBcIkVxdWFsXCIsXG4gICAgICBbXG4gICAgICAgIG5ldyBBcmcoXCJnaXZlblwiLCBnZXRDb3JlVmFsdWUpLFxuICAgICAgICBuZXcgQXJnKFwiZXhwZWN0ZWRcIiwgZ2V0Q29yZVZhbHVlKVxuICAgICAgXSxcbiAgICAgICh3b3JsZCwgeyBnaXZlbiwgZXhwZWN0ZWQgfSkgPT4gYXNzZXJ0RXF1YWwod29ybGQsIGdpdmVuLCBleHBlY3RlZClcbiAgICApLFxuXG4gICAgbmV3IFZpZXc8eyBnaXZlbjogVmFsdWUsIGV4cGVjdGVkOiBWYWx1ZSB9PihgXG4gICAgICAgICMjIyMgTGVzc1RoYW5cblxuICAgICAgICAqIFwiZ2l2ZW46PFZhbHVlPiBMZXNzVGhhbiBleHBlY3RlZDo8VmFsdWU+XCIgLSBBc3NlcnRzIHRoYXQgZ2l2ZW4gaXMgbGVzcyB0aGFuIGV4cGVjdGVkLlxuICAgICAgICAgICogRS5nLiBcIkFzc2VydCAoRXhhY3RseSAwKSBMZXNzVGhhbiAoRXhhY3RseSAxKVwiXG4gICAgICBgLFxuICAgICAgXCJMZXNzVGhhblwiLFxuICAgICAgW1xuICAgICAgICBuZXcgQXJnKFwiZ2l2ZW5cIiwgZ2V0Q29yZVZhbHVlKSxcbiAgICAgICAgbmV3IEFyZyhcImV4cGVjdGVkXCIsIGdldENvcmVWYWx1ZSlcbiAgICAgIF0sXG4gICAgICAod29ybGQsIHsgZ2l2ZW4sIGV4cGVjdGVkIH0pID0+IGFzc2VydExlc3NUaGFuKHdvcmxkLCBnaXZlbiwgZXhwZWN0ZWQpLFxuICAgICAgeyBuYW1lUG9zOiAxIH1cbiAgICApLFxuXG4gICAgbmV3IFZpZXc8eyBnaXZlbjogVmFsdWUsIGV4cGVjdGVkOiBWYWx1ZSB9PihgXG4gICAgICAgICMjIyMgR3JlYXRlclRoYW5cblxuICAgICAgICAqIFwiZ2l2ZW46PFZhbHVlPiBHcmVhdGVyVGhhbiBleHBlY3RlZDo8VmFsdWU+XCIgLSBBc3NlcnRzIHRoYXQgZ2l2ZW4gaXMgZ3JlYXRlciB0aGFuIHRoZSBleHBlY3RlZC5cbiAgICAgICAgICAqIEUuZy4gXCJBc3NlcnQgKEV4YWN0bHkgMCkgR3JlYXRlclRoYW4gKEV4YWN0bHkgMSlcIlxuICAgICAgYCxcbiAgICAgIFwiR3JlYXRlclRoYW5cIixcbiAgICAgIFtcbiAgICAgICAgbmV3IEFyZyhcImdpdmVuXCIsIGdldENvcmVWYWx1ZSksXG4gICAgICAgIG5ldyBBcmcoXCJleHBlY3RlZFwiLCBnZXRDb3JlVmFsdWUpXG4gICAgICBdLFxuICAgICAgKHdvcmxkLCB7IGdpdmVuLCBleHBlY3RlZCB9KSA9PiBhc3NlcnRHcmVhdGVyVGhhbih3b3JsZCwgZ2l2ZW4sIGV4cGVjdGVkKSxcbiAgICAgIHsgbmFtZVBvczogMSB9XG4gICAgKSxcblxuICAgIG5ldyBWaWV3PHsgZ2l2ZW46IFZhbHVlIH0+KGBcbiAgICAgICAgIyMjIyBUcnVlXG5cbiAgICAgICAgKiBcIlRydWUgZ2l2ZW46PFZhbHVlPlwiIC0gQXNzZXJ0cyB0aGF0IGdpdmVuIGlzIHRydWUuXG4gICAgICAgICAgKiBFLmcuIFwiQXNzZXJ0IFRydWUgKENvbXB0cm9sbGVyIENoZWNrTWVtYmVyc2hpcCBHZW9mZiBjRVRIKVwiXG4gICAgICBgLFxuICAgICAgXCJUcnVlXCIsXG4gICAgICBbXG4gICAgICAgIG5ldyBBcmcoXCJnaXZlblwiLCBnZXRDb3JlVmFsdWUpXG4gICAgICBdLFxuICAgICAgKHdvcmxkLCB7IGdpdmVuIH0pID0+IGFzc2VydEVxdWFsKHdvcmxkLCBnaXZlbiwgbmV3IEJvb2xWKHRydWUpKVxuICAgICksXG5cbiAgICBuZXcgVmlldzx7IGdpdmVuOiBWYWx1ZSB9PihgXG4gICAgICAgICMjIyMgRmFsc2VcblxuICAgICAgICAqIFwiRmFsc2UgZ2l2ZW46PFZhbHVlPlwiIC0gQXNzZXJ0cyB0aGF0IGdpdmVuIGlzIGZhbHNlLlxuICAgICAgICAgICogRS5nLiBcIkFzc2VydCBGYWxzZSAoQ29tcHRyb2xsZXIgQ2hlY2tNZW1iZXJzaGlwIEdlb2ZmIGNFVEgpXCJcbiAgICAgIGAsXG4gICAgICBcIkZhbHNlXCIsXG4gICAgICBbXG4gICAgICAgIG5ldyBBcmcoXCJnaXZlblwiLCBnZXRDb3JlVmFsdWUpXG4gICAgICBdLFxuICAgICAgKHdvcmxkLCB7IGdpdmVuIH0pID0+IGFzc2VydEVxdWFsKHdvcmxkLCBnaXZlbiwgbmV3IEJvb2xWKGZhbHNlKSlcbiAgICApLFxuICAgIG5ldyBWaWV3PHsgZXZlbnQ6IEV2ZW50ViwgbWVzc2FnZTogU3RyaW5nViB9PihgXG4gICAgICAgICMjIyMgUmVhZFJldmVydFxuXG4gICAgICAgICogXCJSZWFkUmV2ZXJ0IGV2ZW50OjxFdmVudD4gbWVzc2FnZTo8U3RyaW5nPlwiIC0gQXNzZXJ0cyB0aGF0IHJlYWRpbmcgdGhlIGdpdmVuIHZhbHVlIHJldmVydHMgd2l0aCBnaXZlbiBtZXNzYWdlLlxuICAgICAgICAgICogRS5nLiBcIkFzc2VydCBSZWFkUmV2ZXJ0IChDb21wdHJvbGxlciBDaGVja01lbWJlcnNoaXAgR2VvZmYgY0VUSCkgXFxcInJldmVydFxcXCJcIlxuICAgICAgYCxcbiAgICAgIFwiUmVhZFJldmVydFwiLFxuICAgICAgW1xuICAgICAgICBuZXcgQXJnKFwiZXZlbnRcIiwgZ2V0RXZlbnRWKSxcbiAgICAgICAgbmV3IEFyZyhcIm1lc3NhZ2VcIiwgZ2V0U3RyaW5nVilcbiAgICAgIF0sXG4gICAgICAod29ybGQsIHsgZXZlbnQsIG1lc3NhZ2UgfSkgPT4gYXNzZXJ0UmVhZEVycm9yKHdvcmxkLCBldmVudC52YWwsIG1lc3NhZ2UudmFsLCB0cnVlKVxuICAgICksXG5cbiAgICBuZXcgVmlldzx7IGV2ZW50OiBFdmVudFYsIG1lc3NhZ2U6IFN0cmluZ1YgfT4oYFxuICAgICAgICAjIyMjIFJlYWRFcnJvclxuXG4gICAgICAgICogXCJSZWFkRXJyb3IgZXZlbnQ6PEV2ZW50PiBtZXNzYWdlOjxTdHJpbmc+XCIgLSBBc3NlcnRzIHRoYXQgcmVhZGluZyB0aGUgZ2l2ZW4gdmFsdWUgdGhyb3dzIGdpdmVuIGVycm9yXG4gICAgICAgICAgKiBFLmcuIFwiQXNzZXJ0IFJlYWRFcnJvciAoQ29tcHRyb2xsZXIgQmFkIEFkZHJlc3MpIFxcXCJjYW5ub3QgZmluZCBjb21wdHJvbGxlclxcXCJcIlxuICAgICAgYCxcbiAgICAgIFwiUmVhZEVycm9yXCIsXG4gICAgICBbXG4gICAgICAgIG5ldyBBcmcoXCJldmVudFwiLCBnZXRFdmVudFYpLFxuICAgICAgICBuZXcgQXJnKFwibWVzc2FnZVwiLCBnZXRTdHJpbmdWKVxuICAgICAgXSxcbiAgICAgICh3b3JsZCwgeyBldmVudCwgbWVzc2FnZSB9KSA9PiBhc3NlcnRSZWFkRXJyb3Iod29ybGQsIGV2ZW50LnZhbCwgbWVzc2FnZS52YWwsIGZhbHNlKVxuICAgICksXG5cbiAgICBuZXcgVmlldzx7IGVycm9yOiBTdHJpbmdWLCBpbmZvOiBTdHJpbmdWLCBkZXRhaWw6IFN0cmluZ1YgfT4oYFxuICAgICAgICAjIyMjIEZhaWx1cmVcblxuICAgICAgICAqIFwiRmFpbHVyZSBlcnJvcjo8U3RyaW5nPiBpbmZvOjxTdHJpbmc+IGRldGFpbDo8TnVtYmVyPz5cIiAtIEFzc2VydHMgdGhhdCBsYXN0IHRyYW5zYWN0aW9uIGhhZCBhIGdyYWNlZnVsIGZhaWx1cmUgd2l0aCBnaXZlbiBlcnJvciwgaW5mbyBhbmQgZGV0YWlsLlxuICAgICAgICAgICogRS5nLiBcIkFzc2VydCBGYWlsdXJlIFVOQVVUSE9SSVpFRCBTVVBQT1JUX01BUktFVF9PV05FUl9DSEVDS1wiXG4gICAgICAgICAgKiBFLmcuIFwiQXNzZXJ0IEZhaWx1cmUgTUFUSF9FUlJPUiBNSU5UX0NBTENVTEFURV9CQUxBTkNFIDVcIlxuICAgICAgYCxcbiAgICAgIFwiRmFpbHVyZVwiLFxuICAgICAgW1xuICAgICAgICBuZXcgQXJnKFwiZXJyb3JcIiwgZ2V0U3RyaW5nViksXG4gICAgICAgIG5ldyBBcmcoXCJpbmZvXCIsIGdldFN0cmluZ1YpLFxuICAgICAgICBuZXcgQXJnKFwiZGV0YWlsXCIsIGdldFN0cmluZ1YsIHsgZGVmYXVsdDogbmV3IFN0cmluZ1YoXCIwXCIpIH0pLFxuICAgICAgXSxcbiAgICAgICh3b3JsZCwgeyBlcnJvciwgaW5mbywgZGV0YWlsIH0pID0+IGFzc2VydEZhaWx1cmUod29ybGQsIG5ldyBGYWlsdXJlKGVycm9yLnZhbCwgaW5mby52YWwsIGRldGFpbC52YWwpKVxuICAgICksXG5cbiAgICBuZXcgVmlldzx7IGVycm9yOiBTdHJpbmdWLCBtZXNzYWdlOiBTdHJpbmdWIH0+KGBcbiAgICAgICAgIyMjIyBSZXZlcnRGYWlsdXJlXG5cbiAgICAgICAgKiBcIlJldmVydEZhaWx1cmUgZXJyb3I6PFN0cmluZz4gbWVzc2FnZTo8U3RyaW5nPlwiIC0gQXNzZXJ0IGxhc3QgdHJhbnNhY3Rpb24gcmV2ZXJ0ZWQgd2l0aCBhIG1lc3NhZ2UgYmVnaW5uaW5nIHdpdGggYW4gZXJyb3IgY29kZVxuICAgICAgICAgICogRS5nLiBcIkFzc2VydCBSZXZlcnRGYWlsdXJlIFVOQVVUSE9SSVpFRCBcXFwic2V0IHJlc2VydmVzIGZhaWxlZFxcXCJcIlxuICAgICAgYCxcbiAgICAgIFwiUmV2ZXJ0RmFpbHVyZVwiLFxuICAgICAgW1xuICAgICAgICBuZXcgQXJnKFwiZXJyb3JcIiwgZ2V0U3RyaW5nViksXG4gICAgICAgIG5ldyBBcmcoXCJtZXNzYWdlXCIsIGdldFN0cmluZ1YpLFxuICAgICAgXSxcbiAgICAgICh3b3JsZCwgeyBlcnJvciwgbWVzc2FnZSB9KSA9PiBhc3NlcnRSZXZlcnRGYWlsdXJlKHdvcmxkLCBlcnJvci52YWwsIG1lc3NhZ2UudmFsKVxuICAgICksXG5cbiAgICBuZXcgVmlldzx7IGVycm9yOiBTdHJpbmdWLCBhcmdzOiBTdHJpbmdWW10gfT4oYFxuICAgICAgICAjIyMjIFJldmVydEN1c3RvbUVycm9yXG5cbiAgICAgICAgKiBcIlJldmVydEN1c3RvbUVycm9yIGVycm9yOjxTdHJpbmc+IGFyZ3M6PFtdVmFsdWU+XCIgLSBBc3NlcnQgbGFzdCB0cmFuc2FjdGlvbiByZXZlcnRlZCB3aXRoIGEgbWVzc2FnZSBiZWdpbm5pbmcgd2l0aCBhbiBlcnJvciBjb2RlXG4gICAgICAgICAgKiBFLmcuIFwiQXNzZXJ0IFJldmVydEZhaWx1cmUgVU5BVVRIT1JJWkVEIFxcXCJzZXQgcmVzZXJ2ZXMgZmFpbGVkXFxcIlwiXG4gICAgICBgLFxuICAgICAgXCJSZXZlcnRDdXN0b21FcnJvclwiLFxuICAgICAgW1xuICAgICAgICBuZXcgQXJnKFwiZXJyb3JcIiwgZ2V0U3RyaW5nViksXG4gICAgICAgIG5ldyBBcmcoXCJhcmdzXCIsIGdldENvcmVWYWx1ZSwge3ZhcmlhZGljOiB0cnVlLCBtYXBwZWQ6IHRydWUsIGRlZmF1bHQ6IFtdfSksXG4gICAgICBdLFxuICAgICAgKHdvcmxkLCB7IGVycm9yLCBhcmdzIH0pID0+IGFzc2VydFJldmVydEN1c3RvbUVycm9yKHdvcmxkLCBlcnJvci52YWwsIHJhd1ZhbHVlcyhhcmdzKSlcbiAgICApLFxuXG4gICAgbmV3IFZpZXc8eyBtZXNzYWdlOiBTdHJpbmdWIH0+KGBcbiAgICAgICAgIyMjIyBSZXZlcnRcblxuICAgICAgICAqIFwiUmV2ZXJ0IG1lc3NhZ2U6PFN0cmluZz5cIiAtIEFzc2VydHMgdGhhdCB0aGUgbGFzdCB0cmFuc2FjdGlvbiByZXZlcnRlZC5cbiAgICAgIGAsXG4gICAgICBcIlJldmVydFwiLFxuICAgICAgW1xuICAgICAgICBuZXcgQXJnKFwibWVzc2FnZVwiLCBnZXRTdHJpbmdWLCB7IGRlZmF1bHQ6IG5ldyBTdHJpbmdWKFwicmV2ZXJ0XCIpIH0pLFxuICAgICAgXSxcbiAgICAgICh3b3JsZCwgeyBtZXNzYWdlIH0pID0+IGFzc2VydFJldmVydCh3b3JsZCwgbWVzc2FnZS52YWwpXG4gICAgKSxcblxuICAgIG5ldyBWaWV3PHsgbWVzc2FnZTogU3RyaW5nViB9PihgXG4gICAgICAgICMjIyMgRXJyb3JcblxuICAgICAgICAqIFwiRXJyb3IgbWVzc2FnZTo8U3RyaW5nPlwiIC0gQXNzZXJ0cyB0aGF0IHRoZSBsYXN0IHRyYW5zYWN0aW9uIGhhZCB0aGUgZ2l2ZW4gZXJyb3IuXG4gICAgICBgLFxuICAgICAgXCJFcnJvclwiLFxuICAgICAgW1xuICAgICAgICBuZXcgQXJnKFwibWVzc2FnZVwiLCBnZXRTdHJpbmdWKSxcbiAgICAgIF0sXG4gICAgICAod29ybGQsIHsgbWVzc2FnZSB9KSA9PiBhc3NlcnRFcnJvcih3b3JsZCwgbWVzc2FnZS52YWwpXG4gICAgKSxcblxuICAgIG5ldyBWaWV3PHsgZ2l2ZW46IFZhbHVlIH0+KGBcbiAgICAgICAgIyMjIyBTdWNjZXNzXG5cbiAgICAgICAgKiBcIlN1Y2Nlc3NcIiAtIEFzc2VydHMgdGhhdCB0aGUgbGFzdCB0cmFuc2FjdGlvbiBjb21wbGV0ZWQgc3VjY2Vzc2Z1bGx5ICh0aGF0IGlzLCBkaWQgbm90IHJldmVydCBub3IgZW1pdCBncmFjZWZ1bCBmYWlsdXJlKS5cbiAgICAgIGAsXG4gICAgICBcIlN1Y2Nlc3NcIixcbiAgICAgIFtdLFxuICAgICAgKHdvcmxkLCB7IGdpdmVuIH0pID0+IGFzc2VydFN1Y2Nlc3Mod29ybGQpXG4gICAgKSxcblxuICAgIG5ldyBWaWV3PHsgbmFtZTogU3RyaW5nViwgcGFyYW1zOiBNYXBWIH0+KGBcbiAgICAgICAgIyMjIyBMb2dcblxuICAgICAgICAqIFwiTG9nIG5hbWU6PFN0cmluZz4gKGtleTo8U3RyaW5nPiB2YWx1ZTo8VmFsdWU+KSAuLi5cIiAtIEFzc2VydHMgdGhhdCBsYXN0IHRyYW5zYWN0aW9uIGVtaXR0ZWQgbG9nIHdpdGggZ2l2ZW4gbmFtZSBhbmQga2V5LXZhbHVlIHBhaXJzLlxuICAgICAgICAgICogRS5nLiBcIkFzc2VydCBMb2cgTWludGVkIChcImFjY291bnRcIiAoVXNlciBHZW9mZiBhZGRyZXNzKSkgKFwiYW1vdW50XCIgKEV4YWN0bHkgNTUpKVwiXG4gICAgICBgLFxuICAgICAgXCJMb2dcIixcbiAgICAgIFtcbiAgICAgICAgbmV3IEFyZyhcIm5hbWVcIiwgZ2V0U3RyaW5nViksXG4gICAgICAgIG5ldyBBcmcoXCJwYXJhbXNcIiwgZ2V0TWFwViwgeyB2YXJpYWRpYzogdHJ1ZSB9KSxcbiAgICAgIF0sXG4gICAgICAod29ybGQsIHsgbmFtZSwgcGFyYW1zIH0pID0+IGFzc2VydExvZyh3b3JsZCwgbmFtZS52YWwsIHBhcmFtcylcbiAgICApXG4gIF07XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwcm9jZXNzQXNzZXJ0aW9uRXZlbnQod29ybGQ6IFdvcmxkLCBldmVudDogRXZlbnQsIGZyb206IHN0cmluZyB8IG51bGwpOiBQcm9taXNlPFdvcmxkPiB7XG4gIHJldHVybiBhd2FpdCBwcm9jZXNzQ29tbWFuZEV2ZW50PGFueT4oXCJBc3NlcnRpb25cIiwgYXNzZXJ0aW9uQ29tbWFuZHMoKSwgd29ybGQsIGV2ZW50LCBmcm9tKTtcbn1cbiJdfQ==