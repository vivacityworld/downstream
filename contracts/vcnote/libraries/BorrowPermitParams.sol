// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {VCNoteStorage, VCNoteStorageLib} from "../storages/VCNoteStorage.sol";

using BorrowPermitParamsLib for BorrowPermitParams global;

struct BorrowPermitParams {
    address executor;
    address payable borrower;
    address payable receiver;
    uint256 borrowAmount;
    uint256 deadline;
    bytes signature;
}

library BorrowPermitParamsLib {

    error InvalidSignature();
    error ExpiredSignature();
    error InvalidExecutor();
    error InvalidParams(string message);

    function validate(BorrowPermitParams memory params) internal {
        if (block.timestamp > params.deadline) revert ExpiredSignature();
        if (msg.sender != params.executor) revert InvalidExecutor();

        if (params.borrower == address(0)) revert InvalidParams("borrower is zero address");
        if (params.receiver == address(0)) revert InvalidParams("receiver is zero address");
        if (params.borrowAmount == 0) revert InvalidParams("borrowAmount is zero");
        if (params.signature.length != 65) revert InvalidParams("invalid signature length");

        bytes32 digest = MessageHashUtils.toEthSignedMessageHash(
            keccak256(
                abi.encodePacked(
                    block.chainid,
                    VCNoteStorageLib.useNonce(params.borrower),
                    params.executor,
                    params.borrower,
                    params.receiver,
                    params.borrowAmount,
                    params.deadline
                )
            )
        );
        if (params.borrower != ECDSA.recover(digest, params.signature)) {
            revert InvalidSignature();
        }
    }
}
