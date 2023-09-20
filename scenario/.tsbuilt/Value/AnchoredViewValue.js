"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAnchoredViewValue = exports.anchoredViewFetchers = exports.getAnchoredViewAddress = void 0;
const CoreValue_1 = require("../CoreValue");
const Value_1 = require("../Value");
const Command_1 = require("../Command");
const ContractLookup_1 = require("../ContractLookup");
async function getAnchoredViewAddress(_, anchoredView) {
    return new Value_1.AddressV(anchoredView._address);
}
exports.getAnchoredViewAddress = getAnchoredViewAddress;
async function getUnderlyingPrice(_, anchoredView, asset) {
    return new Value_1.NumberV(await anchoredView.methods.getUnderlyingPrice(asset).call());
}
function anchoredViewFetchers() {
    return [
        new Command_1.Fetcher(`
        #### UnderlyingPrice

        * "UnderlyingPrice asset:<Address>" - Gets the price of the given asset
      `, "UnderlyingPrice", [
            new Command_1.Arg("anchoredView", ContractLookup_1.getAnchoredView, { implicit: true }),
            new Command_1.Arg("asset", CoreValue_1.getAddressV)
        ], (world, { anchoredView, asset }) => getUnderlyingPrice(world, anchoredView, asset.val))
    ];
}
exports.anchoredViewFetchers = anchoredViewFetchers;
async function getAnchoredViewValue(world, event) {
    return await Command_1.getFetcherValue("AnchoredView", anchoredViewFetchers(), world, event);
}
exports.getAnchoredViewValue = getAnchoredViewValue;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQW5jaG9yZWRWaWV3VmFsdWUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvVmFsdWUvQW5jaG9yZWRWaWV3VmFsdWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBR0EsNENBQXlDO0FBQ3pDLG9DQUFrRDtBQUNsRCx3Q0FBeUQ7QUFDekQsc0RBQWtEO0FBRTNDLEtBQUssVUFBVSxzQkFBc0IsQ0FBQyxDQUFRLEVBQUUsWUFBMEI7SUFDL0UsT0FBTyxJQUFJLGdCQUFRLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQzdDLENBQUM7QUFGRCx3REFFQztBQUVELEtBQUssVUFBVSxrQkFBa0IsQ0FBQyxDQUFRLEVBQUUsWUFBMEIsRUFBRSxLQUFhO0lBQ25GLE9BQU8sSUFBSSxlQUFPLENBQUMsTUFBTSxZQUFZLENBQUMsT0FBTyxDQUFDLGtCQUFrQixDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7QUFDbEYsQ0FBQztBQUVELFNBQWdCLG9CQUFvQjtJQUNsQyxPQUFPO1FBQ0wsSUFBSSxpQkFBTyxDQUF5RDs7OztPQUlqRSxFQUNELGlCQUFpQixFQUNqQjtZQUNFLElBQUksYUFBRyxDQUFDLGNBQWMsRUFBRSxnQ0FBZSxFQUFFLEVBQUMsUUFBUSxFQUFFLElBQUksRUFBQyxDQUFDO1lBQzFELElBQUksYUFBRyxDQUFDLE9BQU8sRUFBRSx1QkFBVyxDQUFDO1NBQzlCLEVBQ0QsQ0FBQyxLQUFLLEVBQUUsRUFBQyxZQUFZLEVBQUUsS0FBSyxFQUFDLEVBQUUsRUFBRSxDQUFDLGtCQUFrQixDQUFDLEtBQUssRUFBRSxZQUFZLEVBQUUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUNyRjtLQUNGLENBQUM7QUFDSixDQUFDO0FBZkQsb0RBZUM7QUFFTSxLQUFLLFVBQVUsb0JBQW9CLENBQUMsS0FBWSxFQUFFLEtBQVk7SUFDbkUsT0FBTyxNQUFNLHlCQUFlLENBQVcsY0FBYyxFQUFFLG9CQUFvQixFQUFFLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQy9GLENBQUM7QUFGRCxvREFFQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7RXZlbnR9IGZyb20gJy4uL0V2ZW50JztcbmltcG9ydCB7V29ybGR9IGZyb20gJy4uL1dvcmxkJztcbmltcG9ydCB7QW5jaG9yZWRWaWV3fSBmcm9tICcuLi9Db250cmFjdC9BbmNob3JlZFZpZXcnO1xuaW1wb3J0IHtnZXRBZGRyZXNzVn0gZnJvbSAnLi4vQ29yZVZhbHVlJztcbmltcG9ydCB7QWRkcmVzc1YsIE51bWJlclYsIFZhbHVlfSBmcm9tICcuLi9WYWx1ZSc7XG5pbXBvcnQge0FyZywgRmV0Y2hlciwgZ2V0RmV0Y2hlclZhbHVlfSBmcm9tICcuLi9Db21tYW5kJztcbmltcG9ydCB7Z2V0QW5jaG9yZWRWaWV3fSBmcm9tICcuLi9Db250cmFjdExvb2t1cCc7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRBbmNob3JlZFZpZXdBZGRyZXNzKF86IFdvcmxkLCBhbmNob3JlZFZpZXc6IEFuY2hvcmVkVmlldyk6IFByb21pc2U8QWRkcmVzc1Y+IHtcbiAgcmV0dXJuIG5ldyBBZGRyZXNzVihhbmNob3JlZFZpZXcuX2FkZHJlc3MpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBnZXRVbmRlcmx5aW5nUHJpY2UoXzogV29ybGQsIGFuY2hvcmVkVmlldzogQW5jaG9yZWRWaWV3LCBhc3NldDogc3RyaW5nKTogUHJvbWlzZTxOdW1iZXJWPiB7XG4gIHJldHVybiBuZXcgTnVtYmVyVihhd2FpdCBhbmNob3JlZFZpZXcubWV0aG9kcy5nZXRVbmRlcmx5aW5nUHJpY2UoYXNzZXQpLmNhbGwoKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhbmNob3JlZFZpZXdGZXRjaGVycygpIHtcbiAgcmV0dXJuIFtcbiAgICBuZXcgRmV0Y2hlcjx7YW5jaG9yZWRWaWV3OiBBbmNob3JlZFZpZXcsIGFzc2V0OiBBZGRyZXNzVn0sIE51bWJlclY+KGBcbiAgICAgICAgIyMjIyBVbmRlcmx5aW5nUHJpY2VcblxuICAgICAgICAqIFwiVW5kZXJseWluZ1ByaWNlIGFzc2V0OjxBZGRyZXNzPlwiIC0gR2V0cyB0aGUgcHJpY2Ugb2YgdGhlIGdpdmVuIGFzc2V0XG4gICAgICBgLFxuICAgICAgXCJVbmRlcmx5aW5nUHJpY2VcIixcbiAgICAgIFtcbiAgICAgICAgbmV3IEFyZyhcImFuY2hvcmVkVmlld1wiLCBnZXRBbmNob3JlZFZpZXcsIHtpbXBsaWNpdDogdHJ1ZX0pLFxuICAgICAgICBuZXcgQXJnKFwiYXNzZXRcIiwgZ2V0QWRkcmVzc1YpXG4gICAgICBdLFxuICAgICAgKHdvcmxkLCB7YW5jaG9yZWRWaWV3LCBhc3NldH0pID0+IGdldFVuZGVybHlpbmdQcmljZSh3b3JsZCwgYW5jaG9yZWRWaWV3LCBhc3NldC52YWwpXG4gICAgKVxuICBdO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0QW5jaG9yZWRWaWV3VmFsdWUod29ybGQ6IFdvcmxkLCBldmVudDogRXZlbnQpOiBQcm9taXNlPFZhbHVlPiB7XG4gIHJldHVybiBhd2FpdCBnZXRGZXRjaGVyVmFsdWU8YW55LCBhbnk+KFwiQW5jaG9yZWRWaWV3XCIsIGFuY2hvcmVkVmlld0ZldGNoZXJzKCksIHdvcmxkLCBldmVudCk7XG59XG4iXX0=