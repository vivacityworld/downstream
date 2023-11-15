// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

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

struct Cache {
    bytes32 domainSeparator;
}

library BorrowPermitParamsLib {
    bytes32 private constant _BORROW_PERMIT_STORAGE = keccak256(abi.encode("vivacity.contracts.vcnote.libraries.BorrowPermitParams.Cache"));

    bytes32 constant EIP712_TYPE_HASH =
        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");
    bytes32 constant STRUCT_HASH =
        keccak256("Vivacity Borrow Permit(address executor,address borrower,address receiver,uint256 borrowAmount,uint256 deadline,uint256 nonce)");
    
    bytes private constant NAME = bytes("Vivacity Borrow Permit");
    bytes private constant VERSION = bytes("1");

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

        bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(
            STRUCT_HASH,
            params.executor,
            params.borrower,
            params.receiver,
            params.borrowAmount,
            params.deadline,
            VCNoteStorageLib.useNonce(params.borrower)
        )));
        if (params.borrower != ECDSA.recover(digest, params.signature)) {
            revert InvalidSignature();
        }
    }

    function _hashTypedDataV4(bytes32 structHash) internal returns (bytes32) {
        return MessageHashUtils.toTypedDataHash(_domainSeparatorV4(), structHash);
    }

    function _domainSeparatorV4() internal returns (bytes32 domainSeparator) {
        Cache storage cache = get();
        if (cache.domainSeparator != bytes32(0)) {
            return cache.domainSeparator;
        } else {
            domainSeparator = _buildDomainSeparator();
            cache.domainSeparator = domainSeparator;
        }
    }

    function _buildDomainSeparator() private view returns (bytes32) {
        return keccak256(abi.encode(EIP712_TYPE_HASH, keccak256(NAME), keccak256(VERSION), block.chainid, address(this)));
    }

    function get() internal pure returns (Cache storage s) {
        bytes32 position = _BORROW_PERMIT_STORAGE;
        assembly {
            s.slot := position
        }
    }
}
