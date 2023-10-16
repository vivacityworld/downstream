// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.10;

import "./PriceOracle.sol";
import "./CErc20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PriceOracleRouter is PriceOracle, Ownable {
    
    mapping(CToken => address) public oracles;

    constructor() Ownable(msg.sender) {}

    function getUnderlyingPrice(CToken cToken) public override view returns (uint) {
        if (oracles[cToken] == address(0)) {
            return 0;
        }
        return PriceOracle(oracles[cToken]).getUnderlyingPrice(cToken);
    }

    function setOracle(CToken cToken, address oracle) public onlyOwner {
        oracles[cToken] = oracle;
    }

    function getOracle(CToken cToken) public view returns (address) {
        return oracles[cToken];
    }
}
