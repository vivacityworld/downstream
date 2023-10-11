// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IWhitelistRouter.sol";
import "./interfaces/ISDYCWhitelist.sol";

contract SDYCWhitelistRouter is Ownable, IWhitelistRouter {

    mapping(address => address) public whitelistContracts;

    function isWhitelisted(
        address token,
        address receiver
    ) external view returns (bool) {
        address whitelistContract = whitelistContracts[token];
        if (whitelistContract == address(0)) {
            return false;
        }
        return ISDYCWhitelist(whitelistContract).isCustomer(receiver);
    }

    function setWhitelistContract(
        address token,
        address whitelistContract
    ) external onlyOwner {
        whitelistContracts[token] = whitelistContract;
    }
}
