// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

interface ITurnstile {
    struct NftData {
        uint256 tokenId;
        bool registered;
    }

    function register(address) external returns(uint256);
    function assign(uint256) external returns(uint256);
    function feeRecipient(address) external view returns(NftData memory);
    function ownerOf(uint256) external view returns(address);
    function withdraw(uint256 _tokenId, address payable _recipient, uint256 _amount) external returns(uint256);
}