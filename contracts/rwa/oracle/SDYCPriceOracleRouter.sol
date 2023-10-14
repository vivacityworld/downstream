// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {PriceOracle, CToken} from "../../PriceOracle.sol";
import {ISDYCPriceOracle} from "./interfaces/ISDYCPriceOracle.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

contract SDYCPriceOracleRouter is PriceOracle, Ownable {
    using Math for uint256;

    mapping(CToken => address) public oracles;

    function getUnderlyingPrice(CToken cToken) public override view returns (uint) {
        if (oracles[cToken] == address(0)) {
            return 0;
        }
        (, int256 answer,,,) = ISDYCPriceOracle(oracles[cToken]).latestRoundData();
        return uint256(answer).mulDiv(1e18, 10 ** ISDYCPriceOracle(oracles[cToken]).decimals());
    }

    function setOracle(CToken cToken, address oracle) public onlyOwner {
        oracles[cToken] = oracle;
    }

    function getOracle(CToken cToken) public view returns (address) {
        return oracles[cToken];
    }
}