// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

struct VCNoteStorage {
    address lendingLedger;                        // lending ledger address
    mapping(address => uint256) nonces;           // nonces for permit
    address cNote;                                // cNote address in CLM
    mapping(address => bool) blacklist;
    address vivaPoint;
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

    function setBlacklist(address account, bool _isBlacklist) internal {
        VCNoteStorage storage s = get();
        s.blacklist[account] = _isBlacklist;
    }

    function isBlacklist(address account) internal view returns (bool _isBlacklist) {
        VCNoteStorage storage s = get();
        return s.blacklist[account];
    }

    function setVivaPoint(address _vivaPoint) internal {
        VCNoteStorage storage s = get();
        s.vivaPoint = _vivaPoint;
    }

    function getVivaPoint() internal view returns (address vivaPoint) {
        VCNoteStorage storage s = get();
        vivaPoint = s.vivaPoint;
    }
}
