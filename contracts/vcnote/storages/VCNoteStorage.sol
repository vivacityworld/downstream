// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

struct VCNoteStorage {
    address lendingLedger;                        // lending ledger address
    mapping(address => uint256) nonces;           // nonces for permit
    address cNote;                                // cNote address in CLM
}

library VCNoteStorageLib {
    bytes32 private constant _VCNOTE_STORAGE = keccak256(abi.encode("vivacity.contracts.vcnote.storages.VCNoteStorage"));

    function get() internal pure returns (VCNoteStorage storage s) {
        bytes32 position = _VCNOTE_STORAGE;
        assembly {
            s.slot := position
        }
    }

    function setCNote(address _cNOTE) internal {
        VCNoteStorage storage s = get();
        s.cNote = _cNOTE;
    }

    function getCNote() internal view returns (address cNote) {
        VCNoteStorage storage s = get();
        cNote = s.cNote;
    }

    function setLendingLedger(address _lendingLedger) internal {
        VCNoteStorage storage s = get();
        s.lendingLedger = _lendingLedger;
    }

    function getLendingLedger() internal view returns (address lendingLedger) {
        VCNoteStorage storage s = get();
        lendingLedger = s.lendingLedger;
    }

    function getNonce(address account) internal view returns (uint256 nonce) {
        VCNoteStorage storage s = get();
        nonce = s.nonces[account];
    }

    function useNonce(address account) internal returns (uint256 nonce) {
        VCNoteStorage storage s = get();
        nonce = s.nonces[account];
        s.nonces[account]++;
    }
}
