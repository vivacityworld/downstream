// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import "../../PriceOracle.sol";
import "../../CErc20.sol";

contract CCNotePriceOracle is PriceOracle {

    address public immutable cnote;

    constructor (address _cnote) {
        cnote = _cnote;
    }

    function getUnderlyingPrice(CToken cToken) public override view returns (uint) {
        address _underlying = CErc20(address(cToken)).underlying();
        require(_underlying == cnote, "CCNotePriceOracle: not cnote");
        (bool success, bytes memory returndata) = _underlying.staticcall(abi.encodeWithSignature("exchangeRateStored()"));
        if (success) {
            return uint256(bytes32(returndata));
        } else {
            if (returndata.length > 0) {
                assembly {
                    let returndata_size := mload(returndata)
                    revert(add(32, returndata), returndata_size)
                }
            } else {
                revert("CCNotePriceOracle: no underlying price");
            }
        }
    }
}
