pragma solidity ^0.8.20;

import {PrimaryProdDataServiceConsumerBase} from "@redstone-finance/evm-connector/contracts/data-services/PrimaryProdDataServiceConsumerBase.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {PriceOracle} from "./PriceOracle.sol";
import {CErc20} from "./CErc20.sol";
import {CToken} from "./CToken.sol";

import {ITurnstile} from "./_interfaces/ITurnstile.sol";


/**
 * @title RedstoneOracle
 * @notice PriceOracle contracts using the Redstone Core model (https://redstone.finance/)
 */
contract RedstoneOracle is PriceOracle, PrimaryProdDataServiceConsumerBase, Ownable {

  struct Asset {
    bytes32 id;
    address addr;
    uint256 decimals;
  }

  struct Price {
    uint256 price;
    uint256 timestamp;
  }

  mapping(bytes32 => Asset) public assets;
  mapping(address => Price) public prices;

  uint256 public freshTime = 1 minutes;

  error PriceIsNotFresh(uint256 blockTimestamp, uint256 priceTimestamp);
  error PriceIsExpired(uint256 lastTimestamp, uint256 priceTimestamp);
  error PriceIsNotSet();

  constructor() Ownable(msg.sender) {}

  // ==============================
  // ===     Admin Function     ===
  // ==============================

  /**
  * @notice  Set fresh time for the price
  * @param   _freshTime  Fresh time for the price
  */
  function setFreshTime(uint256 _freshTime) external onlyOwner {
    freshTime = _freshTime;
  }
  
  /**
  * @notice  Set asset info
  * @param   id        Asset id
  * @param   addr      Address of the asset
  * @param   decimals  Decimals of the asset
  */
  function setAssetInfo(bytes32 id, address addr, uint256 decimals) public onlyOwner {
    assets[id] = Asset(id, addr, decimals);
  }

  // ==============================
  // ======= Price Function =======
  // ==============================

  /**
  * @notice  setPrice is permissionless and anyone could call the function as the data is eventually validated on-chain using conditions defined by the protocol.
  * @param   ids        Array of asset ids
  */
  function setPrice(bytes32[] memory ids, bytes calldata) public {
    uint256 createdAt = extractTimestampsAndAssertAllAreEqual() / 1000;
    if (block.timestamp - createdAt > freshTime) revert PriceIsNotFresh(block.timestamp, createdAt);

    uint256[] memory values = getOracleNumericValuesFromTxMsg(ids);

    for (uint i = 0; i < ids.length; i++) {
      Asset storage asset = assets[ids[i]];
      Price storage price = prices[asset.addr];

      if (createdAt < price.timestamp) revert PriceIsExpired(price.timestamp, createdAt);
      uint256 extractPrice = values[i] * 1e28 / 10 ** asset.decimals;
      price.price = extractPrice;
      price.timestamp = createdAt;
    }
  }

  /**
  * @notice  getPrice is a view function that returns the price of an asset
  * @param   asset  Address of the asset
  * @return  Price of the asset
  */
  function getPrice(address asset) public view returns(uint256) {
    if (prices[asset].timestamp == 0 || prices[asset].price == 0) revert PriceIsNotSet();
    if (block.timestamp - prices[asset].timestamp > freshTime) revert PriceIsNotFresh(block.timestamp, prices[asset].timestamp);
    
    return prices[asset].price;
  }


  /**
  * @notice  getUnderlyingPrice is a view function that returns fresh price of an underlying asset
  * @param   cToken  Address of the cToken
  * @return  Price   Price of the underlying asset
  */
  function getUnderlyingPrice(CToken cToken) external view override returns (uint) {
    return getPrice(CErc20(address(cToken)).underlying());
  }



  /**
  * @notice  getUniqueSignersThreshold is a view function that returns the minimum required value of unique authorised signers
  * @return The minimum required value of unique authorised signers
  */
  function getUniqueSignersThreshold() public view virtual override returns (uint8) {
    return 5;
  }

  /**
  * @notice  Assign for CSR
  * @param   turnstile  Address of turnstile contract
  * @param   tokenId    tokenId which will collect fees
  */
  function assignForCSR(address turnstile, uint256 tokenId) external onlyOwner {
    ITurnstile(turnstile).assign(tokenId);
  }
}