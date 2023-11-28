// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

interface IHYWhitelist {

    enum KStatus {
        Empty,
        Pending,
        Approved,
        Rejected
    }
    
    function getUserStatus(address account) external view returns (KStatus);
}
