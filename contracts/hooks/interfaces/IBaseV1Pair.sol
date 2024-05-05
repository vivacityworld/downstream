pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";


interface IBaseV1Pair {
    function transferFrom(address src, address dst, uint amount) external returns (bool);
    function permit(address owner, address spender, uint value, uint deadline, uint8 v, bytes32 r, bytes32 s) external;
    function swap(uint amount0Out, uint amount1Out, address to, bytes calldata data) external;
    function burn(address to) external returns (uint amount0, uint amount1);
    function mint(address to) external returns (uint liquidity);
    function getReserves() external view returns (uint112 _reserve0, uint112 _reserve1, uint32 _blockTimestampLast);
    function getAmountOut(uint, address) external view returns (uint);
    function current(address tokenIn, uint amountIn) external view returns(uint);
    function token0() external view returns(address);
    function token1() external view returns(address);
    function stable() external view returns(bool);
    function _k(uint x, uint y) external view returns(uint);
    //LP token pricing
    function sampleReserves(uint points, uint window) external view returns(uint[] memory, uint[] memory);
    function sampleSupply(uint points, uint window) external view returns(uint[] memory);
    function sample(address tokenIn, uint amountIn, uint points, uint window) external view returns(uint[] memory);
    function quote(address tokenIn, uint amountIn, uint granularity) external view returns(uint);
    function observationLength() external view returns(uint);
}