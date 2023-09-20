"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPriceOracleProxy = void 0;
const Command_1 = require("../Command");
const Networks_1 = require("../Networks");
const Contract_1 = require("../Contract");
const CoreValue_1 = require("../CoreValue");
const PriceOracleProxyContract = Contract_1.getContract("PriceOracleProxy");
async function buildPriceOracleProxy(world, from, event) {
    const fetchers = [
        new Command_1.Fetcher(`
        #### Price Oracle Proxy

        * "Deploy <Guardian:Address> <PriceOracle:Address> <cETH:Address> <cUSDC:Address> <cSAI:Address> <cDAI:Address> <cUSDT:Address>" - The Price Oracle which proxies to a backing oracle
        * E.g. "PriceOracleProxy Deploy Admin (PriceOracle Address) cETH cUSDC cSAI cDAI cUSDT"
      `, "PriceOracleProxy", [
            new Command_1.Arg("guardian", CoreValue_1.getAddressV),
            new Command_1.Arg("priceOracle", CoreValue_1.getAddressV),
            new Command_1.Arg("cETH", CoreValue_1.getAddressV),
            new Command_1.Arg("cUSDC", CoreValue_1.getAddressV),
            new Command_1.Arg("cSAI", CoreValue_1.getAddressV),
            new Command_1.Arg("cDAI", CoreValue_1.getAddressV),
            new Command_1.Arg("cUSDT", CoreValue_1.getAddressV)
        ], async (world, { guardian, priceOracle, cETH, cUSDC, cSAI, cDAI, cUSDT }) => {
            return {
                invokation: await PriceOracleProxyContract.deploy(world, from, [guardian.val, priceOracle.val, cETH.val, cUSDC.val, cSAI.val, cDAI.val, cUSDT.val]),
                description: "Price Oracle Proxy",
                cETH: cETH.val,
                cUSDC: cUSDC.val,
                cSAI: cSAI.val,
                cDAI: cDAI.val,
                cUSDT: cUSDT.val
            };
        }, { catchall: true })
    ];
    let priceOracleProxyData = await Command_1.getFetcherValue("DeployPriceOracleProxy", fetchers, world, event);
    let invokation = priceOracleProxyData.invokation;
    delete priceOracleProxyData.invokation;
    if (invokation.error) {
        throw invokation.error;
    }
    const priceOracleProxy = invokation.value;
    priceOracleProxyData.address = priceOracleProxy._address;
    world = await Networks_1.storeAndSaveContract(world, priceOracleProxy, 'PriceOracleProxy', invokation, [
        { index: ['PriceOracleProxy'], data: priceOracleProxyData }
    ]);
    return { world, priceOracleProxy, invokation };
}
exports.buildPriceOracleProxy = buildPriceOracleProxy;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUHJpY2VPcmFjbGVQcm94eUJ1aWxkZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvQnVpbGRlci9QcmljZU9yYWNsZVByb3h5QnVpbGRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFJQSx3Q0FBeUQ7QUFDekQsMENBQWlEO0FBQ2pELDBDQUF3QztBQUN4Qyw0Q0FBeUM7QUFHekMsTUFBTSx3QkFBd0IsR0FBRyxzQkFBVyxDQUFDLGtCQUFrQixDQUFDLENBQUM7QUFZMUQsS0FBSyxVQUFVLHFCQUFxQixDQUFDLEtBQVksRUFBRSxJQUFZLEVBQUUsS0FBWTtJQUNsRixNQUFNLFFBQVEsR0FBRztRQUNmLElBQUksaUJBQU8sQ0FBc0o7Ozs7O09BSzlKLEVBQ0Qsa0JBQWtCLEVBQ2xCO1lBQ0UsSUFBSSxhQUFHLENBQUMsVUFBVSxFQUFFLHVCQUFXLENBQUM7WUFDaEMsSUFBSSxhQUFHLENBQUMsYUFBYSxFQUFFLHVCQUFXLENBQUM7WUFDbkMsSUFBSSxhQUFHLENBQUMsTUFBTSxFQUFFLHVCQUFXLENBQUM7WUFDNUIsSUFBSSxhQUFHLENBQUMsT0FBTyxFQUFFLHVCQUFXLENBQUM7WUFDN0IsSUFBSSxhQUFHLENBQUMsTUFBTSxFQUFFLHVCQUFXLENBQUM7WUFDNUIsSUFBSSxhQUFHLENBQUMsTUFBTSxFQUFFLHVCQUFXLENBQUM7WUFDNUIsSUFBSSxhQUFHLENBQUMsT0FBTyxFQUFFLHVCQUFXLENBQUM7U0FDOUIsRUFDRCxLQUFLLEVBQUUsS0FBSyxFQUFFLEVBQUMsUUFBUSxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFDLEVBQUUsRUFBRTtZQUN2RSxPQUFPO2dCQUNMLFVBQVUsRUFBRSxNQUFNLHdCQUF3QixDQUFDLE1BQU0sQ0FBbUIsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDLFFBQVEsQ0FBQyxHQUFHLEVBQUUsV0FBVyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDckssV0FBVyxFQUFFLG9CQUFvQjtnQkFDakMsSUFBSSxFQUFFLElBQUksQ0FBQyxHQUFHO2dCQUNkLEtBQUssRUFBRSxLQUFLLENBQUMsR0FBRztnQkFDaEIsSUFBSSxFQUFFLElBQUksQ0FBQyxHQUFHO2dCQUNkLElBQUksRUFBRSxJQUFJLENBQUMsR0FBRztnQkFDZCxLQUFLLEVBQUUsS0FBSyxDQUFDLEdBQUc7YUFDakIsQ0FBQztRQUNKLENBQUMsRUFDRCxFQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUMsQ0FDakI7S0FDRixDQUFDO0lBRUYsSUFBSSxvQkFBb0IsR0FBRyxNQUFNLHlCQUFlLENBQTRCLHdCQUF3QixFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDOUgsSUFBSSxVQUFVLEdBQUcsb0JBQW9CLENBQUMsVUFBVyxDQUFDO0lBQ2xELE9BQU8sb0JBQW9CLENBQUMsVUFBVSxDQUFDO0lBRXZDLElBQUksVUFBVSxDQUFDLEtBQUssRUFBRTtRQUNwQixNQUFNLFVBQVUsQ0FBQyxLQUFLLENBQUM7S0FDeEI7SUFDRCxNQUFNLGdCQUFnQixHQUFHLFVBQVUsQ0FBQyxLQUFNLENBQUM7SUFDM0Msb0JBQW9CLENBQUMsT0FBTyxHQUFHLGdCQUFnQixDQUFDLFFBQVEsQ0FBQztJQUV6RCxLQUFLLEdBQUcsTUFBTSwrQkFBb0IsQ0FDaEMsS0FBSyxFQUNMLGdCQUFnQixFQUNoQixrQkFBa0IsRUFDbEIsVUFBVSxFQUNWO1FBQ0UsRUFBRSxLQUFLLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFLElBQUksRUFBRSxvQkFBb0IsRUFBRTtLQUM1RCxDQUNGLENBQUM7SUFFRixPQUFPLEVBQUMsS0FBSyxFQUFFLGdCQUFnQixFQUFFLFVBQVUsRUFBQyxDQUFDO0FBQy9DLENBQUM7QUF0REQsc0RBc0RDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtFdmVudH0gZnJvbSAnLi4vRXZlbnQnO1xuaW1wb3J0IHthZGRBY3Rpb24sIFdvcmxkfSBmcm9tICcuLi9Xb3JsZCc7XG5pbXBvcnQge1ByaWNlT3JhY2xlUHJveHl9IGZyb20gJy4uL0NvbnRyYWN0L1ByaWNlT3JhY2xlUHJveHknO1xuaW1wb3J0IHtJbnZva2F0aW9ufSBmcm9tICcuLi9JbnZva2F0aW9uJztcbmltcG9ydCB7QXJnLCBGZXRjaGVyLCBnZXRGZXRjaGVyVmFsdWV9IGZyb20gJy4uL0NvbW1hbmQnO1xuaW1wb3J0IHtzdG9yZUFuZFNhdmVDb250cmFjdH0gZnJvbSAnLi4vTmV0d29ya3MnO1xuaW1wb3J0IHtnZXRDb250cmFjdH0gZnJvbSAnLi4vQ29udHJhY3QnO1xuaW1wb3J0IHtnZXRBZGRyZXNzVn0gZnJvbSAnLi4vQ29yZVZhbHVlJztcbmltcG9ydCB7QWRkcmVzc1Z9IGZyb20gJy4uL1ZhbHVlJztcblxuY29uc3QgUHJpY2VPcmFjbGVQcm94eUNvbnRyYWN0ID0gZ2V0Q29udHJhY3QoXCJQcmljZU9yYWNsZVByb3h5XCIpO1xuXG5leHBvcnQgaW50ZXJmYWNlIFByaWNlT3JhY2xlUHJveHlEYXRhIHtcbiAgaW52b2thdGlvbj86IEludm9rYXRpb248UHJpY2VPcmFjbGVQcm94eT4sXG4gIGNvbnRyYWN0PzogUHJpY2VPcmFjbGVQcm94eSxcbiAgZGVzY3JpcHRpb246IHN0cmluZyxcbiAgYWRkcmVzcz86IHN0cmluZyxcbiAgY0VUSDogc3RyaW5nLFxuICBjVVNEQzogc3RyaW5nLFxuICBjREFJOiBzdHJpbmdcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGJ1aWxkUHJpY2VPcmFjbGVQcm94eSh3b3JsZDogV29ybGQsIGZyb206IHN0cmluZywgZXZlbnQ6IEV2ZW50KTogUHJvbWlzZTx7d29ybGQ6IFdvcmxkLCBwcmljZU9yYWNsZVByb3h5OiBQcmljZU9yYWNsZVByb3h5LCBpbnZva2F0aW9uOiBJbnZva2F0aW9uPFByaWNlT3JhY2xlUHJveHk+fT4ge1xuICBjb25zdCBmZXRjaGVycyA9IFtcbiAgICBuZXcgRmV0Y2hlcjx7Z3VhcmRpYW46IEFkZHJlc3NWLCBwcmljZU9yYWNsZTogQWRkcmVzc1YsIGNFVEg6IEFkZHJlc3NWLCBjVVNEQzogQWRkcmVzc1YsIGNTQUk6IEFkZHJlc3NWLCBjREFJOiBBZGRyZXNzViwgY1VTRFQ6IEFkZHJlc3NWfSwgUHJpY2VPcmFjbGVQcm94eURhdGE+KGBcbiAgICAgICAgIyMjIyBQcmljZSBPcmFjbGUgUHJveHlcblxuICAgICAgICAqIFwiRGVwbG95IDxHdWFyZGlhbjpBZGRyZXNzPiA8UHJpY2VPcmFjbGU6QWRkcmVzcz4gPGNFVEg6QWRkcmVzcz4gPGNVU0RDOkFkZHJlc3M+IDxjU0FJOkFkZHJlc3M+IDxjREFJOkFkZHJlc3M+IDxjVVNEVDpBZGRyZXNzPlwiIC0gVGhlIFByaWNlIE9yYWNsZSB3aGljaCBwcm94aWVzIHRvIGEgYmFja2luZyBvcmFjbGVcbiAgICAgICAgKiBFLmcuIFwiUHJpY2VPcmFjbGVQcm94eSBEZXBsb3kgQWRtaW4gKFByaWNlT3JhY2xlIEFkZHJlc3MpIGNFVEggY1VTREMgY1NBSSBjREFJIGNVU0RUXCJcbiAgICAgIGAsXG4gICAgICBcIlByaWNlT3JhY2xlUHJveHlcIixcbiAgICAgIFtcbiAgICAgICAgbmV3IEFyZyhcImd1YXJkaWFuXCIsIGdldEFkZHJlc3NWKSxcbiAgICAgICAgbmV3IEFyZyhcInByaWNlT3JhY2xlXCIsIGdldEFkZHJlc3NWKSxcbiAgICAgICAgbmV3IEFyZyhcImNFVEhcIiwgZ2V0QWRkcmVzc1YpLFxuICAgICAgICBuZXcgQXJnKFwiY1VTRENcIiwgZ2V0QWRkcmVzc1YpLFxuICAgICAgICBuZXcgQXJnKFwiY1NBSVwiLCBnZXRBZGRyZXNzViksXG4gICAgICAgIG5ldyBBcmcoXCJjREFJXCIsIGdldEFkZHJlc3NWKSxcbiAgICAgICAgbmV3IEFyZyhcImNVU0RUXCIsIGdldEFkZHJlc3NWKVxuICAgICAgXSxcbiAgICAgIGFzeW5jICh3b3JsZCwge2d1YXJkaWFuLCBwcmljZU9yYWNsZSwgY0VUSCwgY1VTREMsIGNTQUksIGNEQUksIGNVU0RUfSkgPT4ge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGludm9rYXRpb246IGF3YWl0IFByaWNlT3JhY2xlUHJveHlDb250cmFjdC5kZXBsb3k8UHJpY2VPcmFjbGVQcm94eT4od29ybGQsIGZyb20sIFtndWFyZGlhbi52YWwsIHByaWNlT3JhY2xlLnZhbCwgY0VUSC52YWwsIGNVU0RDLnZhbCwgY1NBSS52YWwsIGNEQUkudmFsLCBjVVNEVC52YWxdKSxcbiAgICAgICAgICBkZXNjcmlwdGlvbjogXCJQcmljZSBPcmFjbGUgUHJveHlcIixcbiAgICAgICAgICBjRVRIOiBjRVRILnZhbCxcbiAgICAgICAgICBjVVNEQzogY1VTREMudmFsLFxuICAgICAgICAgIGNTQUk6IGNTQUkudmFsLFxuICAgICAgICAgIGNEQUk6IGNEQUkudmFsLFxuICAgICAgICAgIGNVU0RUOiBjVVNEVC52YWxcbiAgICAgICAgfTtcbiAgICAgIH0sXG4gICAgICB7Y2F0Y2hhbGw6IHRydWV9XG4gICAgKVxuICBdO1xuXG4gIGxldCBwcmljZU9yYWNsZVByb3h5RGF0YSA9IGF3YWl0IGdldEZldGNoZXJWYWx1ZTxhbnksIFByaWNlT3JhY2xlUHJveHlEYXRhPihcIkRlcGxveVByaWNlT3JhY2xlUHJveHlcIiwgZmV0Y2hlcnMsIHdvcmxkLCBldmVudCk7XG4gIGxldCBpbnZva2F0aW9uID0gcHJpY2VPcmFjbGVQcm94eURhdGEuaW52b2thdGlvbiE7XG4gIGRlbGV0ZSBwcmljZU9yYWNsZVByb3h5RGF0YS5pbnZva2F0aW9uO1xuXG4gIGlmIChpbnZva2F0aW9uLmVycm9yKSB7XG4gICAgdGhyb3cgaW52b2thdGlvbi5lcnJvcjtcbiAgfVxuICBjb25zdCBwcmljZU9yYWNsZVByb3h5ID0gaW52b2thdGlvbi52YWx1ZSE7XG4gIHByaWNlT3JhY2xlUHJveHlEYXRhLmFkZHJlc3MgPSBwcmljZU9yYWNsZVByb3h5Ll9hZGRyZXNzO1xuXG4gIHdvcmxkID0gYXdhaXQgc3RvcmVBbmRTYXZlQ29udHJhY3QoXG4gICAgd29ybGQsXG4gICAgcHJpY2VPcmFjbGVQcm94eSxcbiAgICAnUHJpY2VPcmFjbGVQcm94eScsXG4gICAgaW52b2thdGlvbixcbiAgICBbXG4gICAgICB7IGluZGV4OiBbJ1ByaWNlT3JhY2xlUHJveHknXSwgZGF0YTogcHJpY2VPcmFjbGVQcm94eURhdGEgfVxuICAgIF1cbiAgKTtcblxuICByZXR1cm4ge3dvcmxkLCBwcmljZU9yYWNsZVByb3h5LCBpbnZva2F0aW9ufTtcbn1cbiJdfQ==