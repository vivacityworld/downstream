// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {IERC20, SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ILendingLedger} from "../interfaces/ILendingLedger.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {IERC20, SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {VCNote} from "../VCNote.sol";

contract BatchSyncLendingLedger {
    function batchSync(address _vcNote, address[] calldata _accounts) external {
        for (uint256 i = 0; i < _accounts.length; i++) {
            VCNote(_vcNote).syncLendingLedger(_accounts[i]);
        }
    }
}