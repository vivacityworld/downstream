// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

struct VCNoteRouterStorage {
    address NOTE;
    address cNOTE;
    address vcNOTE;
}

library VCNoteRouterStorageLib {
    bytes32 private constant _VCNOTE_ROUTER_STORAGE = keccak256(abi.encode("vivacity.contracts.vcnote.storages.VCNoteRouterStorage"));

    function _read() internal pure returns (VCNoteRouterStorage storage s) {
        bytes32 position = _VCNOTE_ROUTER_STORAGE;
        assembly {
            s.slot := position
        }
    }

    function get() internal pure returns (VCNoteRouterStorage memory s) {
        s = _read();
    }

    function set(address _NOTE, address _cNOTE, address _vcNOTE) internal {
        VCNoteRouterStorage storage s = _read();
        s.NOTE = _NOTE;
        s.cNOTE = _cNOTE;
        s.vcNOTE = _vcNOTE;
    }

    function NOTE() internal view returns (address) {
        return _read().NOTE;
    }

    function cNOTE() internal view returns (address) {
        return _read().cNOTE;
    }

    function vcNOTE() internal view returns (address) {
        return _read().vcNOTE;
    }

}
