// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IWhitelistRouter.sol";

contract WhitelistRouter is Ownable, IWhitelistRouter {

    mapping(address => address) public whitelistContracts;

    function isWhitelisted(
        address token,
        address receiver
    ) external view returns (bool) {
        address whitelistContract = whitelistContracts[token];
        if (whitelistContract == address(0)) {
            return false;
        }
        return IWhitelistRouter(whitelistContract).isWhitelisted(token, receiver);
    }

    function setWhitelistContract(
        address token,
        address whitelistContract
    ) external onlyOwner {
        whitelistContracts[token] = whitelistContract;
    }
}
