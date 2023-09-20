"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildGovernor = void 0;
const CoreValue_1 = require("../CoreValue");
const Command_1 = require("../Command");
const Networks_1 = require("../Networks");
const Contract_1 = require("../Contract");
const GovernorBravoDelegate = Contract_1.getContract("GovernorBravoDelegate");
const GovernorBravoDelegateHarness = Contract_1.getContract("GovernorBravoDelegateHarness");
const GovernorBravoDelegator = Contract_1.getContract("GovernorBravoDelegator");
const GovernorBravoImmutable = Contract_1.getContract("GovernorBravoImmutable");
async function buildGovernor(world, from, params) {
    const fetchers = [
        new Command_1.Fetcher(`
      #### GovernorBravoDelegator

      * "GovernorBravo Deploy BravoDelegator name:<String> timelock:<Address> comp:<Address> admin:<Address> implementation<address> votingPeriod:<Number> votingDelay:<Number>" - Deploys Compound Governor Bravo with a given parameters
        * E.g. "GovernorBravo Deploy BravoDelegator GovernorBravo (Address Timelock) (Address Comp) Admin (Address impl) 17280 1"
    `, "BravoDelegator", [
            new Command_1.Arg("name", CoreValue_1.getStringV),
            new Command_1.Arg("timelock", CoreValue_1.getAddressV),
            new Command_1.Arg("comp", CoreValue_1.getAddressV),
            new Command_1.Arg("admin", CoreValue_1.getAddressV),
            new Command_1.Arg("implementation", CoreValue_1.getAddressV),
            new Command_1.Arg("votingPeriod", CoreValue_1.getNumberV),
            new Command_1.Arg("votingDelay", CoreValue_1.getNumberV),
            new Command_1.Arg("proposalThreshold", CoreValue_1.getNumberV)
        ], async (world, { name, timelock, comp, admin, implementation, votingPeriod, votingDelay, proposalThreshold }) => {
            return {
                invokation: await GovernorBravoDelegator.deploy(world, from, [timelock.val, comp.val, admin.val, implementation.val, votingPeriod.encode(), votingDelay.encode(), proposalThreshold.encode()]),
                name: name.val,
                contract: "GovernorBravoDelegator"
            };
        }),
        new Command_1.Fetcher(`
      #### GovernorBravoImmutable

      * "GovernorBravoImmut Deploy BravoImmutable name:<String> timelock:<Address> comp:<Address> admin:<Address> votingPeriod:<Number> votingDelay:<Number>" - Deploys Compound Governor Bravo Immutable with a given parameters
        * E.g. "GovernorBravo Deploy BravoImmutable GovernorBravo (Address Timelock) (Address Comp) Admin 17280 1"
    `, "BravoImmutable", [
            new Command_1.Arg("name", CoreValue_1.getStringV),
            new Command_1.Arg("timelock", CoreValue_1.getAddressV),
            new Command_1.Arg("comp", CoreValue_1.getAddressV),
            new Command_1.Arg("admin", CoreValue_1.getAddressV),
            new Command_1.Arg("votingPeriod", CoreValue_1.getNumberV),
            new Command_1.Arg("votingDelay", CoreValue_1.getNumberV),
            new Command_1.Arg("proposalThreshold", CoreValue_1.getNumberV)
        ], async (world, { name, timelock, comp, admin, votingPeriod, votingDelay, proposalThreshold }) => {
            return {
                invokation: await GovernorBravoImmutable.deploy(world, from, [timelock.val, comp.val, admin.val, votingPeriod.encode(), votingDelay.encode(), proposalThreshold.encode()]),
                name: name.val,
                contract: "GovernorBravoImmutable"
            };
        }),
        new Command_1.Fetcher(`
      #### GovernorBravoDelegate

      * "Governor Deploy BravoDelegate name:<String>" - Deploys Compound Governor Bravo Delegate
        * E.g. "Governor Deploy BravoDelegate GovernorBravoDelegate"
    `, "BravoDelegate", [
            new Command_1.Arg("name", CoreValue_1.getStringV)
        ], async (world, { name }) => {
            return {
                invokation: await GovernorBravoDelegate.deploy(world, from, []),
                name: name.val,
                contract: "GovernorBravoDelegate"
            };
        }),
        new Command_1.Fetcher(`
      #### GovernorBravoDelegateHarness

      * "Governor Deploy BravoDelegateHarness name:<String>" - Deploys Compound Governor Bravo Delegate Harness
        * E.g. "Governor Deploy BravoDelegateHarness GovernorBravoDelegateHarness"
    `, "BravoDelegateHarness", [
            new Command_1.Arg("name", CoreValue_1.getStringV)
        ], async (world, { name }) => {
            return {
                invokation: await GovernorBravoDelegateHarness.deploy(world, from, []),
                name: name.val,
                contract: "GovernorBravoDelegateHarness"
            };
        })
    ];
    let govData = await Command_1.getFetcherValue("DeployGovernor", fetchers, world, params);
    let invokation = govData.invokation;
    delete govData.invokation;
    if (invokation.error) {
        throw invokation.error;
    }
    const governor = invokation.value;
    govData.address = governor._address;
    world = await Networks_1.storeAndSaveContract(world, governor, govData.name, invokation, [
        { index: ["Governor", govData.name], data: govData },
    ]);
    return { world, governor, govData };
}
exports.buildGovernor = buildGovernor;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiR292ZXJub3JCcmF2b0J1aWxkZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvQnVpbGRlci9Hb3Zlcm5vckJyYXZvQnVpbGRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFJQSw0Q0FBbUU7QUFFbkUsd0NBQTJEO0FBQzNELDBDQUFtRDtBQUNuRCwwQ0FBMEM7QUFFMUMsTUFBTSxxQkFBcUIsR0FBRyxzQkFBVyxDQUFDLHVCQUF1QixDQUFDLENBQUM7QUFDbkUsTUFBTSw0QkFBNEIsR0FBRyxzQkFBVyxDQUFDLDhCQUE4QixDQUFDLENBQUM7QUFDakYsTUFBTSxzQkFBc0IsR0FBRyxzQkFBVyxDQUFDLHdCQUF3QixDQUFDLENBQUM7QUFDckUsTUFBTSxzQkFBc0IsR0FBRyxzQkFBVyxDQUFDLHdCQUF3QixDQUFDLENBQUM7QUFTOUQsS0FBSyxVQUFVLGFBQWEsQ0FDakMsS0FBWSxFQUNaLElBQVksRUFDWixNQUFhO0lBRWIsTUFBTSxRQUFRLEdBQUc7UUFDZixJQUFJLGlCQUFPLENBSVQ7Ozs7O0tBS0QsRUFDQyxnQkFBZ0IsRUFDaEI7WUFDRSxJQUFJLGFBQUcsQ0FBQyxNQUFNLEVBQUUsc0JBQVUsQ0FBQztZQUMzQixJQUFJLGFBQUcsQ0FBQyxVQUFVLEVBQUUsdUJBQVcsQ0FBQztZQUNoQyxJQUFJLGFBQUcsQ0FBQyxNQUFNLEVBQUUsdUJBQVcsQ0FBQztZQUM1QixJQUFJLGFBQUcsQ0FBQyxPQUFPLEVBQUUsdUJBQVcsQ0FBQztZQUM3QixJQUFJLGFBQUcsQ0FBQyxnQkFBZ0IsRUFBRSx1QkFBVyxDQUFDO1lBQ3RDLElBQUksYUFBRyxDQUFDLGNBQWMsRUFBRSxzQkFBVSxDQUFDO1lBQ25DLElBQUksYUFBRyxDQUFDLGFBQWEsRUFBRSxzQkFBVSxDQUFDO1lBQ2xDLElBQUksYUFBRyxDQUFDLG1CQUFtQixFQUFFLHNCQUFVLENBQUM7U0FDekMsRUFDRCxLQUFLLEVBQUUsS0FBSyxFQUFFLEVBQUUsSUFBSSxF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SUFFRixJQUFJLE9BQU8sR0FBRyxNQUFNLHlCQUFlLENBQ2pDLGdCQUFnQixFQUNoQixRQUFRLEVBQ1IsS0FBSyxFQUNMLE1BQU0sQ0FDUCxDQUFDO0lBQ0YsSUFBSSxVQUFVLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQztJQUNwQyxPQUFPLE9BQU8sQ0FBQyxVQUFVLENBQUM7SUFFMUIsSUFBSSxVQUFVLENBQUMsS0FBSyxFQUFFO1FBQ3BCLE1BQU0sVUFBVSxDQUFDLEtBQUssQ0FBQztLQUN4QjtJQUVELE1BQU0sUUFBUSxHQUFHLFVBQVUsQ0FBQyxLQUFNLENBQUM7SUFDbkMsT0FBTyxDQUFDLE9BQU8sR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDO0lBRXBDLEtBQUssR0FBRyxNQUFNLCtCQUFvQixDQUNoQyxLQUFLLEVBQ0wsUUFBUSxFQUNSLE9BQU8sQ0FBQyxJQUFJLEVBQ1osVUFBVSxFQUNWO1FBQ0UsRUFBRSxLQUFLLEVBQUUsQ0FBQyxVQUFVLEVBQUUsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUU7S0FDckQsQ0FDRixDQUFDO0lBRUYsT0FBTyxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLENBQUM7QUFDdEMsQ0FBQztBQXhKRCxzQ0F3SkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBFdmVudCB9IGZyb20gXCIuLi9FdmVudFwiO1xuaW1wb3J0IHsgV29ybGQgfSBmcm9tIFwiLi4vV29ybGRcIjtcbmltcG9ydCB7IEdvdmVybm9yQnJhdm8gfSBmcm9tIFwiLi4vQ29udHJhY3QvR292ZXJub3JCcmF2b1wiO1xuaW1wb3J0IHsgSW52b2thdGlvbiB9IGZyb20gXCIuLi9JbnZva2F0aW9uXCI7XG5pbXBvcnQgeyBnZXRBZGRyZXNzViwgZ2V0TnVtYmVyViwgZ2V0U3RyaW5nViB9IGZyb20gXCIuLi9Db3JlVmFsdWVcIjtcbmltcG9ydCB7IEFkZHJlc3NWLCBOdW1iZXJWLCBTdHJpbmdWIH0gZnJvbSBcIi4uL1ZhbHVlXCI7XG5pbXBvcnQgeyBBcmcsIEZldGNoZXIsIGdldEZldGNoZXJWYWx1ZSB9IGZyb20gXCIuLi9Db21tYW5kXCI7XG5pbXBvcnQgeyBzdG9yZUFuZFNhdmVDb250cmFjdCB9IGZyb20gXCIuLi9OZXR3b3Jrc1wiO1xuaW1wb3J0IHsgZ2V0Q29udHJhY3QgfSBmcm9tIFwiLi4vQ29udHJhY3RcIjtcblxuY29uc3QgR292ZXJub3JCcmF2b0RlbGVnYXRlID0gZ2V0Q29udHJhY3QoXCJHb3Zlcm5vckJyYXZvRGVsZWdhdGVcIik7XG5jb25zdCBHb3Zlcm5vckJyYXZvRGVsZWdhdGVIYXJuZXNzID0gZ2V0Q29udHJhY3QoXCJHb3Zlcm5vckJyYXZvRGVsZWdhdGVIYXJuZXNzXCIpO1xuY29uc3QgR292ZXJub3JCcmF2b0RlbGVnYXRvciA9IGdldENvbnRyYWN0KFwiR292ZXJub3JCcmF2b0RlbGVnYXRvclwiKTtcbmNvbnN0IEdvdmVybm9yQnJhdm9JbW11dGFibGUgPSBnZXRDb250cmFjdChcIkdvdmVybm9yQnJhdm9JbW11dGFibGVcIik7XG5cbmV4cG9ydCBpbnRlcmZhY2UgR292ZXJub3JCcmF2b0RhdGEge1xuICBpbnZva2F0aW9uOiBJbnZva2F0aW9uPEdvdmVybm9yQnJhdm8+O1xuICBuYW1lOiBzdHJpbmc7XG4gIGNvbnRyYWN0OiBzdHJpbmc7XG4gIGFkZHJlc3M/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBidWlsZEdvdmVybm9yKFxuICB3b3JsZDogV29ybGQsXG4gIGZyb206IHN0cmluZyxcbiAgcGFyYW1zOiBFdmVudFxuKTogUHJvbWlzZTx7IHdvcmxkOiBXb3JsZDsgZ292ZXJub3I6IEdvdmVybm9yQnJhdm87IGdvdkRhdGE6IEdvdmVybm9yQnJhdm9EYXRhIH0+IHtcbiAgY29uc3QgZmV0Y2hlcnMgPSBbXG4gICAgbmV3IEZldGNoZXI8XG4gICAgICB7IG5hbWU6IFN0cmluZ1YsIHRpbWVsb2NrOiBBZGRyZXNzViwgY29tcDogQWRkcmVzc1YsIGFkbWluOiBBZGRyZXNzViwgaW1wbGVtZW50YXRpb246IEFkZHJlc3NWLCB2b3RpbmdQZXJpb2Q6IE51bWJlclYsIHZvdGluZ0RlbGF5OiBOdW1iZXJWLCBwcm9wb3NhbFRocmVzaG9sZDogTnVtYmVyVn0sXG4gICAgICBHb3Zlcm5vckJyYXZvRGF0YVxuICAgID4oXG4gICAgICBgXG4gICAgICAjIyMjIEdvdmVybm9yQnJhdm9EZWxlZ2F0b3JcblxuICAgICAgKiBcIkdvdmVybm9yQnJhdm8gRGVwbG95IEJyYXZvRGVsZWdhdG9yIG5hbWU6PFN0cmluZz4gdGltZWxvY2s6PEFkZHJlc3M+IGNvbXA6PEFkZHJlc3M+IGFkbWluOjxBZGRyZXNzPiBpbXBsZW1lbnRhdGlvbjxhZGRyZXNzPiB2b3RpbmdQZXJpb2Q6PE51bWJlcj4gdm90aW5nRGVsYXk6PE51bWJlcj5cIiAtIERlcGxveXMgQ29tcG91bmQgR292ZXJub3IgQnJhdm8gd2l0aCBhIGdpdmVuIHBhcmFtZXRlcnNcbiAgICAgICAgKiBFLmcuIFwiR292ZXJub3JCcmF2byBEZXBsb3kgQnJhdm9EZWxlZ2F0b3IgR292ZXJub3JCcmF2byAoQWRkcmVzcyBUaW1lbG9jaykgKEFkZHJlc3MgQ29tcCkgQWRtaW4gKEFkZHJlc3MgaW1wbCkgMTcyODAgMVwiXG4gICAgYCxcbiAgICAgIFwiQnJhdm9EZWxlZ2F0b3JcIixcbiAgICAgIFtcbiAgICAgICAgbmV3IEFyZyhcIm5hbWVcIiwgZ2V0U3RyaW5nViksXG4gICAgICAgIG5ldyBBcmcoXCJ0aW1lbG9ja1wiLCBnZXRBZGRyZXNzViksXG4gICAgICAgIG5ldyBBcmcoXCJjb21wXCIsIGdldEFkZHJlc3NWKSxcbiAgICAgICAgbmV3IEFyZyhcImFkbWluXCIsIGdldEFkZHJlc3NWKSxcbiAgICAgICAgbmV3IEFyZyhcImltcGxlbWVudGF0aW9uXCIsIGdldEFkZHJlc3NWKSxcbiAgICAgICAgbmV3IEFyZyhcInZvdGluZ1BlcmlvZFwiLCBnZXROdW1iZXJWKSxcbiAgICAgICAgbmV3IEFyZyhcInZvdGluZ0RlbGF5XCIsIGdldE51bWJlclYpLFxuICAgICAgICBuZXcgQXJnKFwicHJvcG9zYWxUaHJlc2hvbGRcIiwgZ2V0TnVtYmVyVilcbiAgICAgIF0sXG4gICAgICBhc3luYyAod29ybGQsIHsgbmFtZSwgdGltZWxvY2ssIGNvbXAsIGFkbWluLCBpbXBsZW1lbnRhdGlvbiwgdm90aW5nUGVyaW9kLCB2b3RpbmdEZWxheSwgcHJvcG9zYWxUaHJlc2hvbGQgfSkgPT4ge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGludm9rYXRpb246IGF3YWl0IEdvdmVybm9yQnJhdm9EZWxlZ2F0b3IuZGVwbG95PEdvdmVybm9yQnJhdm8+KFxuICAgICAgICAgICAgd29ybGQsXG4gICAgICAgICAgICBmcm9tLFxuICAgICAgICAgICAgW3RpbWVsb2NrLnZhbCwgY29tcC52YWwsIGFkbWluLnZhbCwgaW1wbGVtZW50YXRpb24udmFsLCB2b3RpbmdQZXJpb2QuZW5jb2RlKCksIHZvdGluZ0RlbGF5LmVuY29kZSgpLCBwcm9wb3NhbFRocmVzaG9sZC5lbmNvZGUoKV1cbiAgICAgICAgICApLFxuICAgICAgICAgIG5hbWU6IG5hbWUudmFsLFxuICAgICAgICAgIGNvbnRyYWN0OiBcIkdvdmVybm9yQnJhdm9EZWxlZ2F0b3JcIlxuICAgICAgICB9O1xuICAgICAgfVxuICAgICksXG4gICAgbmV3IEZldGNoZXI8XG4gICAgICB7IG5hbWU6IFN0cmluZ1YsIHRpbWVsb2NrOiBBZGRyZXNzViwgY29tcDogQWRkcmVzc1YsIGFkbWluOiBBZGRyZXNzViwgdm90aW5nUGVyaW9kOiBOdW1iZXJWLCB2b3RpbmdEZWxheTogTnVtYmVyViwgcHJvcG9zYWxUaHJlc2hvbGQ6IE51bWJlclYgfSxcbiAgICAgIEdvdmVybm9yQnJhdm9EYXRhXG4gICAgPihcbiAgICAgIGBcbiAgICAgICMjIyMgR292ZXJub3JCcmF2b0ltbXV0YWJsZVxuXG4gICAgICAqIFwiR292ZXJub3JCcmF2b0ltbXV0IERlcGxveSBCcmF2b0ltbXV0YWJsZSBuYW1lOjxTdHJpbmc+IHRpbWVsb2NrOjxBZGRyZXNzPiBjb21wOjxBZGRyZXNzPiBhZG1pbjo8QWRkcmVzcz4gdm90aW5nUGVyaW9kOjxOdW1iZXI+IHZvdGluZ0RlbGF5OjxOdW1iZXI+XCIgLSBEZXBsb3lzIENvbXBvdW5kIEdvdmVybm9yIEJyYXZvIEltbXV0YWJsZSB3aXRoIGEgZ2l2ZW4gcGFyYW1ldGVyc1xuICAgICAgICAqIEUuZy4gXCJHb3Zlcm5vckJyYXZvIERlcGxveSBCcmF2b0ltbXV0YWJsZSBHb3Zlcm5vckJyYXZvIChBZGRyZXNzIFRpbWVsb2NrKSAoQWRkcmVzcyBDb21wKSBBZG1pbiAxNzI4MCAxXCJcbiAgICBgLFxuICAgICAgXCJCcmF2b0ltbXV0YWJsZVwiLFxuICAgICAgW1xuICAgICAgICBuZXcgQXJnKFwibmFtZVwiLCBnZXRTdHJpbmdWKSxcbiAgICAgICAgbmV3IEFyZyhcInRpbWVsb2NrXCIsIGdldEFkZHJlc3NWKSxcbiAgICAgICAgbmV3IEFyZyhcImNvbXBcIiwgZ2V0QWRkcmVzc1YpLFxuICAgICAgICBuZXcgQXJnKFwiYWRtaW5cIiwgZ2V0QWRkcmVzc1YpLFxuICAgICAgICBuZXcgQXJnKFwidm90aW5nUGVyaW9kXCIsIGdldE51bWJlclYpLFxuICAgICAgICBuZXcgQXJnKFwidm90aW5nRGVsYXlcIiwgZ2V0TnVtYmVyViksXG4gICAgICAgIG5ldyBBcmcoXCJwcm9wb3NhbFRocmVzaG9sZFwiLCBnZXROdW1iZXJWKVxuICAgICAgXSxcbiAgICAgIGFzeW5jICh3b3JsZCwgeyBuYW1lLCB0aW1lbG9jaywgY29tcCwgYWRtaW4sIHZvdGluZ1BlcmlvZCwgdm90aW5nRGVsYXksIHByb3Bvc2FsVGhyZXNob2xkIH0pID0+IHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBpbnZva2F0aW9uOiBhd2FpdCBHb3Zlcm5vckJyYXZvSW1tdXRhYmxlLmRlcGxveTxHb3Zlcm5vckJyYXZvPihcbiAgICAgICAgICAgIHdvcmxkLFxuICAgICAgICAgICAgZnJvbSxcbiAgICAgICAgICAgIFt0aW1lbG9jay52YWwsIGNvbXAudmFsLCBhZG1pbi52YWwsIHZvdGluZ1BlcmlvZC5lbmNvZGUoKSwgdm90aW5nRGVsYXkuZW5jb2RlKCksIHByb3Bvc2FsVGhyZXNob2xkLmVuY29kZSgpXVxuICAgICAgICAgICksXG4gICAgICAgICAgbmFtZTogbmFtZS52YWwsXG4gICAgICAgICAgY29udHJhY3Q6IFwiR292ZXJub3JCcmF2b0ltbXV0YWJsZVwiXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgKSxcbiAgICBuZXcgRmV0Y2hlcjxcbiAgICAgIHsgbmFtZTogU3RyaW5nViB9LFxuICAgICAgR292ZXJub3JCcmF2b0RhdGFcbiAgICA+KFxuICAgICAgYFxuICAgICAgIyMjIyBHb3Zlcm5vckJyYXZvRGVsZWdhdGVcblxuICAgICAgKiBcIkdvdmVybm9yIERlcGxveSBCcmF2b0RlbGVnYXRlIG5hbWU6PFN0cmluZz5cIiAtIERlcGxveXMgQ29tcG91bmQgR292ZXJub3IgQnJhdm8gRGVsZWdhdGVcbiAgICAgICAgKiBFLmcuIFwiR292ZXJub3IgRGVwbG95IEJyYXZvRGVsZWdhdGUgR292ZXJub3JCcmF2b0RlbGVnYXRlXCJcbiAgICBgLFxuICAgICAgXCJCcmF2b0RlbGVnYXRlXCIsXG4gICAgICBbXG4gICAgICAgIG5ldyBBcmcoXCJuYW1lXCIsIGdldFN0cmluZ1YpXG4gICAgICBdLFxuICAgICAgYXN5bmMgKHdvcmxkLCB7IG5hbWUgfSkgPT4ge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGludm9rYXRpb246IGF3YWl0IEdvdmVybm9yQnJhdm9EZWxlZ2F0ZS5kZXBsb3k8R292ZXJub3JCcmF2bz4oXG4gICAgICAgICAgICB3b3JsZCxcbiAgICAgICAgICAgIGZyb20sXG4gICAgICAgICAgICBbXVxuICAgICAgICAgICksXG4gICAgICAgICAgbmFtZTogbmFtZS52YWwsXG4gICAgICAgICAgY29udHJhY3Q6IFwiR292ZXJub3JCcmF2b0RlbGVnYXRlXCJcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICApLFxuICAgIG5ldyBGZXRjaGVyPFxuICAgICAgeyBuYW1lOiBTdHJpbmdWIH0sXG4gICAgICBHb3Zlcm5vckJyYXZvRGF0YVxuICAgID4oXG4gICAgICBgXG4gICAgICAjIyMjIEdvdmVybm9yQnJhdm9EZWxlZ2F0ZUhhcm5lc3NcblxuICAgICAgKiBcIkdvdmVybm9yIERlcGxveSBCcmF2b0RlbGVnYXRlSGFybmVzcyBuYW1lOjxTdHJpbmc+XCIgLSBEZXBsb3lzIENvbXBvdW5kIEdvdmVybm9yIEJyYXZvIERlbGVnYXRlIEhhcm5lc3NcbiAgICAgICAgKiBFLmcuIFwiR292ZXJub3IgRGVwbG95IEJyYXZvRGVsZWdhdGVIYXJuZXNzIEdvdmVybm9yQnJhdm9EZWxlZ2F0ZUhhcm5lc3NcIlxuICAgIGAsXG4gICAgICBcIkJyYXZvRGVsZWdhdGVIYXJuZXNzXCIsXG4gICAgICBbXG4gICAgICAgIG5ldyBBcmcoXCJuYW1lXCIsIGdldFN0cmluZ1YpXG4gICAgICBdLFxuICAgICAgYXN5bmMgKHdvcmxkLCB7IG5hbWUgfSkgPT4ge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGludm9rYXRpb246IGF3YWl0IEdvdmVybm9yQnJhdm9EZWxlZ2F0ZUhhcm5lc3MuZGVwbG95PEdvdmVybm9yQnJhdm8+KFxuICAgICAgICAgICAgd29ybGQsXG4gICAgICAgICAgICBmcm9tLFxuICAgICAgICAgICAgW11cbiAgICAgICAgICApLFxuICAgICAgICAgIG5hbWU6IG5hbWUudmFsLFxuICAgICAgICAgIGNvbnRyYWN0OiBcIkdvdmVybm9yQnJhdm9EZWxlZ2F0ZUhhcm5lc3NcIlxuICAgICAgICB9O1xuICAgICAgfVxuICAgIClcbiAgXTtcblxuICBsZXQgZ292RGF0YSA9IGF3YWl0IGdldEZldGNoZXJWYWx1ZTxhbnksIEdvdmVybm9yQnJhdm9EYXRhPihcbiAgICBcIkRlcGxveUdvdmVybm9yXCIsXG4gICAgZmV0Y2hlcnMsXG4gICAgd29ybGQsXG4gICAgcGFyYW1zXG4gICk7XG4gIGxldCBpbnZva2F0aW9uID0gZ292RGF0YS5pbnZva2F0aW9uO1xuICBkZWxldGUgZ292RGF0YS5pbnZva2F0aW9uO1xuXG4gIGlmIChpbnZva2F0aW9uLmVycm9yKSB7XG4gICAgdGhyb3cgaW52b2thdGlvbi5lcnJvcjtcbiAgfVxuXG4gIGNvbnN0IGdvdmVybm9yID0gaW52b2thdGlvbi52YWx1ZSE7XG4gIGdvdkRhdGEuYWRkcmVzcyA9IGdvdmVybm9yLl9hZGRyZXNzO1xuXG4gIHdvcmxkID0gYXdhaXQgc3RvcmVBbmRTYXZlQ29udHJhY3QoXG4gICAgd29ybGQsXG4gICAgZ292ZXJub3IsXG4gICAgZ292RGF0YS5uYW1lLFxuICAgIGludm9rYXRpb24sXG4gICAgW1xuICAgICAgeyBpbmRleDogW1wiR292ZXJub3JcIiwgZ292RGF0YS5uYW1lXSwgZGF0YTogZ292RGF0YSB9LFxuICAgIF1cbiAgKTtcblxuICByZXR1cm4geyB3b3JsZCwgZ292ZXJub3IsIGdvdkRhdGEgfTtcbn1cbiJdfQ==