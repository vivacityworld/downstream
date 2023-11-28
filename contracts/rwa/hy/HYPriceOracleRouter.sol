// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {PriceOracle, CToken} from "../../PriceOracle.sol";
import {IHYPriceOracle} from "./interfaces/IHYPriceOracle.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract HYPriceOracleRouter is PriceOracle, Ownable {

    mapping(CToken => address) public oracles;

    constructor() Ownable(msg.sender) {}

    function getUnderlyingPrice(CToken cToken) public override view returns (uint) {
        if (oracles[cToken] == address(0)) {
            return 0;
        }
        uint256 price = IHYPriceOracle(oracles[cToken]).rate();
        return price;
    }

    function setOracle(CToken cToken, address oracle) public onlyOwner {
        oracles[cToken] = oracle;
    }

    function getOracle(CToken cToken) public view returns (address) {
        return oracles[cToken];
    }
}