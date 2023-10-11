// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {PriceOracle, CToken} from "../../PriceOracle.sol";
import {IOffchainFundPriceOracle} from "./interfaces/IOffchainFundPriceOracle.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

contract OffchainFundPriceOracleRouter is PriceOracle, Ownable {
    using Math for uint256;

    mapping(CToken => address) public oracles;

    function getUnderlyingPrice(CToken cToken) public override view returns (uint) {
        if (oracles[cToken] == address(0)) {
            return 0;
        }
        uint256 answer = IOffchainFundPriceOracle(oracles[cToken]).currentPrice();
        return uint256(answer).mulDiv(1e18, 10 ** 8);
    }

    function setOracle(CToken cToken, address oracle) public onlyOwner {
        oracles[cToken] = oracle;
    }

    function getOracle(CToken cToken) public view returns (address) {
        return oracles[cToken];
    }
}
