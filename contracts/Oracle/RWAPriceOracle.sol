// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.10;

import "../PriceOracle.sol";
import "../CErc20.sol";
import "../RWA/IRWAPriceOracle.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

import "hardhat/console.sol";

contract RWAPriceOracle is PriceOracle, Ownable {
    using Math for uint256;
    // token => oracleAddress
    mapping(CToken => address) public oracles;

    function getUnderlyingPrice(CToken cToken) public override view returns (uint) {
        if (oracles[cToken] == address(0)) {
            return 0;
        }
        (, int answer, , , ) = IRWAPriceOracle(oracles[cToken]).latestRoundData();
        return uint256(answer).mulDiv(1e18, 10 ** IRWAPriceOracle(oracles[cToken]).decimals());
    }

    function setOracle(CToken cToken, address oracle) public onlyOwner {
        oracles[cToken] = oracle;
    }

    function getOracle(CToken cToken) public view returns (address) {
        return oracles[cToken];
    }
}
