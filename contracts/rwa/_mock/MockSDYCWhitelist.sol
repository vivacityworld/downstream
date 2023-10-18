// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "../whitelist/interfaces/ISDYCWhitelist.sol";

contract MockSDYCWhitelist is ISDYCWhitelist {

    mapping(address => bool) public whitelist;

    function setWhitelisted(
        address _account,
        bool _whitelist
    ) external {
        whitelist[_account] = _whitelist;
    }

	function isCustomer(address _receiver) external view returns (bool) {
		return whitelist[_receiver];
	}
}
