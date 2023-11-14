// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "../whitelist/interfaces/IOffchainFundWhitelist.sol";

contract MockOffchainFundWhitelist is IOffchainFundWhitelist {

    mapping(address => bool) public whitelist;

    function isWhitelisted(
        address _account
    ) external view returns (bool) {
        return whitelist[_account];
    }

    function setWhitelisted(
        address _account,
        bool _whitelist
    ) external {
        whitelist[_account] = _whitelist;
    }
}
