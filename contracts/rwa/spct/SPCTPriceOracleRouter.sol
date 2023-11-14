// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {PriceOracle, CToken} from "../../PriceOracle.sol";
import {ISPCTPriceOracle} from "./interfaces/ISPCTPriceOracle.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract SPCTPriceOracleRouter is PriceOracle, Ownable {

    mapping(CToken => address) public oracles;

    constructor() Ownable(msg.sender) {}

    function getUnderlyingPrice(CToken cToken) public override view returns (uint) {
        if (oracles[cToken] == address(0)) {
            return 0;
        }
        uint256 price = ISPCTPriceOracle(oracles[cToken]).exchangeRate();
        return price;
    }

    function setOracle(CToken cToken, address oracle) public onlyOwner {
        oracles[cToken] = oracle;
    }

    function getOracle(CToken cToken) public view returns (address) {
        return oracles[cToken];
    }
}