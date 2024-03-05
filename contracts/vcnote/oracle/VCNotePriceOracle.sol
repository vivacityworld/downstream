// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "../../PriceOracle.sol";
import "../../CErc20.sol";

contract VCNotePriceOracle is PriceOracle {

    address public immutable note;

    constructor (address _note) {
        note = _note;
    }

    function getUnderlyingPrice(CToken cToken) public override view returns (uint) {
        address _underlying = CErc20(address(cToken)).underlying();
        require(_underlying == note, "VCNotePriceOracle: not note");
        return 1e18;
    }
}
