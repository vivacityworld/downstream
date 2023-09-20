"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fork = exports.forkWeb3 = void 0;
const Accounts_1 = require("./Accounts");
const config_1 = require("eth-saddle/dist/config");
const web3_1 = __importDefault(require("web3"));
async function forkWeb3(web3, url, accounts) {
    let lastBlock = await web3.eth.getBlock("latest");
    return new web3_1.default(config_1.Ganache.provider({
        allowUnlimitedContractSize: true,
        fork: url,
        gasLimit: lastBlock.gasLimit,
        gasPrice: '20000',
        port: 8546,
        unlocked_accounts: accounts
    }));
}
exports.forkWeb3 = forkWeb3;
async function fork(world, url, accounts) {
    let newWeb3 = await forkWeb3(world.web3, url, accounts);
    const newAccounts = Accounts_1.loadAccounts(await newWeb3.eth.getAccounts());
    return world
        .set('web3', newWeb3)
        .set('accounts', newAccounts);
}
exports.fork = fork;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSHlwb3RoZXRpY2FsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL0h5cG90aGV0aWNhbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSx5Q0FBa0Q7QUFXbEQsbURBQStDO0FBQy9DLGdEQUF3QjtBQUVqQixLQUFLLFVBQVUsUUFBUSxDQUFDLElBQVUsRUFBRSxHQUFXLEVBQUUsUUFBa0I7SUFDeEUsSUFBSSxTQUFTLEdBQUcsTUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQTtJQUNqRCxPQUFPLElBQUksY0FBSSxDQUNSLGdCQUFPLENBQUMsUUFBUSxDQUFDO1FBQ3BCLDBCQUEwQixFQUFFLElBQUk7UUFDaEMsSUFBSSxFQUFFLEdBQUc7UUFDVCxRQUFRLEVBQUUsU0FBUyxDQUFDLFFBQVE7UUFDNUIsUUFBUSxFQUFFLE9BQU87UUFDakIsSUFBSSxFQUFFLElBQUk7UUFDVixpQkFBaUIsRUFBRSxRQUFRO0tBQzVCLENBQUMsQ0FDSCxDQUFDO0FBQ0osQ0FBQztBQVpELDRCQVlDO0FBRU0sS0FBSyxVQUFVLElBQUksQ0FBQyxLQUFZLEVBQUUsR0FBVyxFQUFFLFFBQWtCO0lBQ3RFLElBQUksT0FBTyxHQUFHLE1BQU0sUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQ3hELE1BQU0sV0FBVyxHQUFHLHVCQUFZLENBQUMsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7SUFFbEUsT0FBTyxLQUFLO1NBQ1QsR0FBRyxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUM7U0FDcEIsR0FBRyxDQUFDLFVBQVUsRUFBRSxXQUFXLENBQUMsQ0FBQztBQUNsQyxDQUFDO0FBUEQsb0JBT0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge0FjY291bnRzLCBsb2FkQWNjb3VudHN9IGZyb20gJy4vQWNjb3VudHMnO1xuaW1wb3J0IHtcbiAgYWRkQWN0aW9uLFxuICBjaGVja0V4cGVjdGF0aW9ucyxcbiAgY2hlY2tJbnZhcmlhbnRzLFxuICBjbGVhckludmFyaWFudHMsXG4gIGRlc2NyaWJlVXNlcixcbiAgaG9sZEludmFyaWFudHMsXG4gIHNldEV2ZW50LFxuICBXb3JsZFxufSBmcm9tICcuL1dvcmxkJztcbmltcG9ydCB7R2FuYWNoZX0gZnJvbSAnZXRoLXNhZGRsZS9kaXN0L2NvbmZpZyc7XG5pbXBvcnQgV2ViMyBmcm9tICd3ZWIzJztcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGZvcmtXZWIzKHdlYjM6IFdlYjMsIHVybDogc3RyaW5nLCBhY2NvdW50czogc3RyaW5nW10pOiBQcm9taXNlPFdlYjM+IHtcbiAgbGV0IGxhc3RCbG9jayA9IGF3YWl0IHdlYjMuZXRoLmdldEJsb2NrKFwibGF0ZXN0XCIpXG4gIHJldHVybiBuZXcgV2ViMyhcbiAgICA8YW55PkdhbmFjaGUucHJvdmlkZXIoe1xuICAgICAgYWxsb3dVbmxpbWl0ZWRDb250cmFjdFNpemU6IHRydWUsXG4gICAgICBmb3JrOiB1cmwsXG4gICAgICBnYXNMaW1pdDogbGFzdEJsb2NrLmdhc0xpbWl0LCAvLyBtYWludGFpbiBjb25maWd1cmVkIGdhcyBsaW1pdFxuICAgICAgZ2FzUHJpY2U6ICcyMDAwMCcsXG4gICAgICBwb3J0OiA4NTQ2LFxuICAgICAgdW5sb2NrZWRfYWNjb3VudHM6IGFjY291bnRzXG4gICAgfSlcbiAgKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGZvcmsod29ybGQ6IFdvcmxkLCB1cmw6IHN0cmluZywgYWNjb3VudHM6IHN0cmluZ1tdKTogUHJvbWlzZTxXb3JsZD4ge1xuICBsZXQgbmV3V2ViMyA9IGF3YWl0IGZvcmtXZWIzKHdvcmxkLndlYjMsIHVybCwgYWNjb3VudHMpO1xuICBjb25zdCBuZXdBY2NvdW50cyA9IGxvYWRBY2NvdW50cyhhd2FpdCBuZXdXZWIzLmV0aC5nZXRBY2NvdW50cygpKTtcblxuICByZXR1cm4gd29ybGRcbiAgICAuc2V0KCd3ZWIzJywgbmV3V2ViMylcbiAgICAuc2V0KCdhY2NvdW50cycsIG5ld0FjY291bnRzKTtcbn1cbiJdfQ==