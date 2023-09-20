"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMCDValue = exports.mcdFetchers = void 0;
const Contract_1 = require("../Contract");
const CoreValue_1 = require("../CoreValue");
const Command_1 = require("../Command");
const Value_1 = require("../Value");
function mcdFetchers() {
    return [
        new Command_1.Fetcher(`
        #### PotAt

        * "MCD PotAt <potAddress> <method> <args>"
          * E.g. "MCD PotAt "0xPotAddress" "pie" (CToken cDai Address)"
      `, "PotAt", [
            new Command_1.Arg("potAddress", CoreValue_1.getAddressV),
            new Command_1.Arg("method", CoreValue_1.getStringV),
            new Command_1.Arg('args', CoreValue_1.getCoreValue, { variadic: true, mapped: true })
        ], async (world, { potAddress, method, args }) => {
            const PotContract = Contract_1.getContract('PotLike');
            const pot = await PotContract.at(world, potAddress.val);
            const argStrings = args.map(arg => arg.val);
            return new Value_1.NumberV(await pot.methods[method.val](...argStrings).call());
        }),
        new Command_1.Fetcher(`
        #### VatAt

        * "MCD VatAt <vatAddress> <method> <args>"
          * E.g. "MCD VatAt "0xVatAddress" "dai" (CToken cDai Address)"
      `, "VatAt", [
            new Command_1.Arg("vatAddress", CoreValue_1.getAddressV),
            new Command_1.Arg("method", CoreValue_1.getStringV),
            new Command_1.Arg('args', CoreValue_1.getCoreValue, { variadic: true, mapped: true })
        ], async (world, { vatAddress, method, args }) => {
            const VatContract = Contract_1.getContract('VatLike');
            const vat = await VatContract.at(world, vatAddress.val);
            const argStrings = args.map(arg => arg.val);
            return new Value_1.NumberV(await vat.methods[method.val](...argStrings).call());
        })
    ];
}
exports.mcdFetchers = mcdFetchers;
async function getMCDValue(world, event) {
    return await Command_1.getFetcherValue("MCD", mcdFetchers(), world, event);
}
exports.getMCDValue = getMCDValue;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTUNEVmFsdWUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvVmFsdWUvTUNEVmFsdWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBRUEsMENBQTBDO0FBRzFDLDRDQUlzQjtBQUN0Qix3Q0FBMkQ7QUFDM0Qsb0NBS2tCO0FBRWxCLFNBQWdCLFdBQVc7SUFDekIsT0FBTztRQUNMLElBQUksaUJBQU8sQ0FBb0U7Ozs7O09BSzVFLEVBQ0QsT0FBTyxFQUNQO1lBQ0UsSUFBSSxhQUFHLENBQUMsWUFBWSxFQUFFLHVCQUFXLENBQUM7WUFDbEMsSUFBSSxhQUFHLENBQUMsUUFBUSxFQUFFLHNCQUFVLENBQUM7WUFDN0IsSUFBSSxhQUFHLENBQUMsTUFBTSxFQUFFLHdCQUFZLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQztTQUNoRSxFQUNELEtBQUssRUFBRSxLQUFLLEVBQUUsRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUU7WUFDNUMsTUFBTSxXQUFXLEdBQUcsc0JBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUMzQyxNQUFNLEdBQUcsR0FBRyxNQUFNLFdBQVcsQ0FBQyxFQUFFLENBQU0sS0FBSyxFQUFFLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUM3RCxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzVDLE9BQU8sSUFBSSxlQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUE7UUFDekUsQ0FBQyxDQUNGO1FBRUQsSUFBSSxpQkFBTyxDQUFvRTs7Ozs7T0FLNUUsRUFDRCxPQUFPLEVBQ1A7WUFDRSxJQUFJLGFBQUcsQ0FBQyxZQUFZLEVBQUUsdUJBQVcsQ0FBQztZQUNsQyxJQUFJLGFBQUcsQ0FBQyxRQUFRLEVBQUUsc0JBQVUsQ0FBQztZQUM3QixJQUFJLGFBQUcsQ0FBQyxNQUFNLEVBQUUsd0JBQVksRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDO1NBQ2hFLEVBQ0QsS0FBSyxFQUFFLEtBQUssRUFBRSxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRTtZQUM1QyxNQUFNLFdBQVcsR0FBRyxzQkFBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQzNDLE1BQU0sR0FBRyxHQUFHLE1BQU0sV0FBVyxDQUFDLEVBQUUsQ0FBTSxLQUFLLEVBQUUsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzdELE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDNUMsT0FBTyxJQUFJLGVBQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsVUFBVSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQTtRQUN6RSxDQUFDLENBQ0Y7S0FDRixDQUFDO0FBQ0osQ0FBQztBQTFDRCxrQ0EwQ0M7QUFFTSxLQUFLLFVBQVUsV0FBVyxDQUFDLEtBQVksRUFBRSxLQUFZO0lBQzFELE9BQU8sTUFBTSx5QkFBZSxDQUFXLEtBQUssRUFBRSxXQUFXLEVBQUUsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDN0UsQ0FBQztBQUZELGtDQUVDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRXZlbnQgfSBmcm9tICcuLi9FdmVudCc7XG5pbXBvcnQgeyBXb3JsZCB9IGZyb20gJy4uL1dvcmxkJztcbmltcG9ydCB7IGdldENvbnRyYWN0IH0gZnJvbSAnLi4vQ29udHJhY3QnO1xuaW1wb3J0IHsgUG90IH0gZnJvbSAnLi4vQ29udHJhY3QvUG90JztcbmltcG9ydCB7IFZhdCB9IGZyb20gJy4uL0NvbnRyYWN0L1ZhdCc7XG5pbXBvcnQge1xuICBnZXRBZGRyZXNzVixcbiAgZ2V0Q29yZVZhbHVlLFxuICBnZXRTdHJpbmdWXG59IGZyb20gJy4uL0NvcmVWYWx1ZSc7XG5pbXBvcnQgeyBBcmcsIEZldGNoZXIsIGdldEZldGNoZXJWYWx1ZSB9IGZyb20gJy4uL0NvbW1hbmQnO1xuaW1wb3J0IHtcbiAgQWRkcmVzc1YsXG4gIE51bWJlclYsXG4gIFZhbHVlLFxuICBTdHJpbmdWXG59IGZyb20gJy4uL1ZhbHVlJztcblxuZXhwb3J0IGZ1bmN0aW9uIG1jZEZldGNoZXJzKCkge1xuICByZXR1cm4gW1xuICAgIG5ldyBGZXRjaGVyPHsgcG90QWRkcmVzczogQWRkcmVzc1YsIG1ldGhvZDogU3RyaW5nViwgYXJnczogU3RyaW5nVltdIH0sIFZhbHVlPihgXG4gICAgICAgICMjIyMgUG90QXRcblxuICAgICAgICAqIFwiTUNEIFBvdEF0IDxwb3RBZGRyZXNzPiA8bWV0aG9kPiA8YXJncz5cIlxuICAgICAgICAgICogRS5nLiBcIk1DRCBQb3RBdCBcIjB4UG90QWRkcmVzc1wiIFwicGllXCIgKENUb2tlbiBjRGFpIEFkZHJlc3MpXCJcbiAgICAgIGAsXG4gICAgICBcIlBvdEF0XCIsXG4gICAgICBbXG4gICAgICAgIG5ldyBBcmcoXCJwb3RBZGRyZXNzXCIsIGdldEFkZHJlc3NWKSxcbiAgICAgICAgbmV3IEFyZyhcIm1ldGhvZFwiLCBnZXRTdHJpbmdWKSxcbiAgICAgICAgbmV3IEFyZygnYXJncycsIGdldENvcmVWYWx1ZSwgeyB2YXJpYWRpYzogdHJ1ZSwgbWFwcGVkOiB0cnVlIH0pXG4gICAgICBdLFxuICAgICAgYXN5bmMgKHdvcmxkLCB7IHBvdEFkZHJlc3MsIG1ldGhvZCwgYXJncyB9KSA9PiB7XG4gICAgICAgIGNvbnN0IFBvdENvbnRyYWN0ID0gZ2V0Q29udHJhY3QoJ1BvdExpa2UnKTtcbiAgICAgICAgY29uc3QgcG90ID0gYXdhaXQgUG90Q29udHJhY3QuYXQ8UG90Pih3b3JsZCwgcG90QWRkcmVzcy52YWwpO1xuICAgICAgICBjb25zdCBhcmdTdHJpbmdzID0gYXJncy5tYXAoYXJnID0+IGFyZy52YWwpO1xuICAgICAgICByZXR1cm4gbmV3IE51bWJlclYoYXdhaXQgcG90Lm1ldGhvZHNbbWV0aG9kLnZhbF0oLi4uYXJnU3RyaW5ncykuY2FsbCgpKVxuICAgICAgfVxuICAgICksXG5cbiAgICBuZXcgRmV0Y2hlcjx7IHZhdEFkZHJlc3M6IEFkZHJlc3NWLCBtZXRob2Q6IFN0cmluZ1YsIGFyZ3M6IFN0cmluZ1ZbXSB9LCBWYWx1ZT4oYFxuICAgICAgICAjIyMjIFZhdEF0XG5cbiAgICAgICAgKiBcIk1DRCBWYXRBdCA8dmF0QWRkcmVzcz4gPG1ldGhvZD4gPGFyZ3M+XCJcbiAgICAgICAgICAqIEUuZy4gXCJNQ0QgVmF0QXQgXCIweFZhdEFkZHJlc3NcIiBcImRhaVwiIChDVG9rZW4gY0RhaSBBZGRyZXNzKVwiXG4gICAgICBgLFxuICAgICAgXCJWYXRBdFwiLFxuICAgICAgW1xuICAgICAgICBuZXcgQXJnKFwidmF0QWRkcmVzc1wiLCBnZXRBZGRyZXNzViksXG4gICAgICAgIG5ldyBBcmcoXCJtZXRob2RcIiwgZ2V0U3RyaW5nViksXG4gICAgICAgIG5ldyBBcmcoJ2FyZ3MnLCBnZXRDb3JlVmFsdWUsIHsgdmFyaWFkaWM6IHRydWUsIG1hcHBlZDogdHJ1ZSB9KVxuICAgICAgXSxcbiAgICAgIGFzeW5jICh3b3JsZCwgeyB2YXRBZGRyZXNzLCBtZXRob2QsIGFyZ3MgfSkgPT4ge1xuICAgICAgICBjb25zdCBWYXRDb250cmFjdCA9IGdldENvbnRyYWN0KCdWYXRMaWtlJyk7XG4gICAgICAgIGNvbnN0IHZhdCA9IGF3YWl0IFZhdENvbnRyYWN0LmF0PFZhdD4od29ybGQsIHZhdEFkZHJlc3MudmFsKTtcbiAgICAgICAgY29uc3QgYXJnU3RyaW5ncyA9IGFyZ3MubWFwKGFyZyA9PiBhcmcudmFsKTtcbiAgICAgICAgcmV0dXJuIG5ldyBOdW1iZXJWKGF3YWl0IHZhdC5tZXRob2RzW21ldGhvZC52YWxdKC4uLmFyZ1N0cmluZ3MpLmNhbGwoKSlcbiAgICAgIH1cbiAgICApXG4gIF07XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRNQ0RWYWx1ZSh3b3JsZDogV29ybGQsIGV2ZW50OiBFdmVudCk6IFByb21pc2U8VmFsdWU+IHtcbiAgcmV0dXJuIGF3YWl0IGdldEZldGNoZXJWYWx1ZTxhbnksIGFueT4oXCJNQ0RcIiwgbWNkRmV0Y2hlcnMoKSwgd29ybGQsIGV2ZW50KTtcbn1cbiJdfQ==