pragma solidity ^0.8.20;

import "hardhat/console.sol";
import {BorrowPermitParams} from "../../../vcnote/libraries/BorrowPermitParams.sol";
import {IVCNote} from "../../../vcnote/interfaces/IVCNote.sol";
import {CErc20, CToken} from "../../../CErc20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {RedstoneOracle} from "../../../RedstoneOracle.sol";
import {PriceOracleRouter} from "../../../PriceOracleRouter.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {IVivacityBorrower} from "../../../vcnote/interfaces/IVivacityBorrower.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { Math } from "@openzeppelin/contracts/utils/math/Math.sol";

import {FarmToken} from "./FarmToken.sol";

import {PriceOracle} from "../../../PriceOracle.sol";

import {IBaseV1Factory} from "../../interfaces/IBaseV1Factory.sol";
import {IBaseV1Pair} from "../../interfaces/IBaseV1Pair.sol";

contract LF is IVivacityBorrower, ERC20 {
    IVCNote public immutable vcNOTE;
    address public immutable NOTE;
    address public immutable WCANTO;
    CErc20 public vcFarmToken;
    IBaseV1Factory public immutable factory;

    // temp
    address public user;
    

    constructor(IVCNote _vcNOTE, address _NOTE, address _WCANTO, IBaseV1Factory _factory, CErc20 _vcFarmToken) ERC20("LF", "LF") {
        vcNOTE = _vcNOTE;
        NOTE = _NOTE;
        WCANTO = _WCANTO;
        factory = _factory;
        vcFarmToken = _vcFarmToken;
    }

    function executeWithPrice(
        bytes calldata _executeData,
        address _redstoneOracle,
        bytes32[] memory _redstoneIds,
        bytes calldata _redstoneData
    ) public returns (bytes memory) {
        RedstoneOracle(_redstoneOracle).setPrice(_redstoneIds, _redstoneData);
        return Address.functionDelegateCall(address(this), _executeData);
    }

    function farming(uint256 _token0Amount, uint256 _token1Amount, BorrowPermitParams memory params) public returns (uint256) {
        require(params.executor == address(this), "LF: invalid executor");
        require(user == address(0), "LF: already in process");

        address underlying = CErc20(vcFarmToken).underlying();
        IBaseV1Pair pair = IBaseV1Pair(FarmToken(underlying).pair());

        address token0 = pair.token0();
        address token1 = pair.token1();

        IERC20(token0).transferFrom(msg.sender, address(this), _token0Amount);
        IERC20(token1).transferFrom(msg.sender, address(this), _token1Amount);

        user = msg.sender;
     
        vcNOTE.borrowPermit(params);

        require(user == address(0), "Loop: invalid state");
    }

    function _swap(address _from, address _to, bool stable, uint256 _amount) internal {
        IBaseV1Pair pair = IBaseV1Pair(factory.getPair(_from, _to, stable));

        uint amountOut = pair.getAmountOut(_amount, address(_from));
        (uint amount0Out, uint amount1Out) = pair.token0() == address(_from) ? (uint(0), amountOut) : (amountOut, uint(0));
        
        IERC20(_from).transfer(address(pair), _amount);
        pair.swap(amount0Out, amount1Out, address(this), "");
    }

    function borrowCallback(address borrower, uint256 borrowAmount) override external returns (uint256) {
        address underlying = CErc20(vcFarmToken).underlying();
        IBaseV1Pair pair = IBaseV1Pair(FarmToken(underlying).pair());

        address token0 = pair.token0();
        address token1 = pair.token1();

        // Todo: refactor for scalability
        if (!(token0 == NOTE && token1 == WCANTO)) {
            _swap(address(NOTE), address(WCANTO), false, borrowAmount);
        }

        {
            (uint112 reserve0, uint112 reserve1, ) = pair.getReserves();
            uint256 previousK = uint256(reserve0) * uint256(reserve1);
            IERC20(token0).transfer(address(pair), IERC20(token0).balanceOf(address(this)));
            IERC20(token1).transfer(address(pair), IERC20(token1).balanceOf(address(this)));
    
            uint256 balance0 = IERC20(token0).balanceOf(address(pair));
            uint256 balance1 = IERC20(token1).balanceOf(address(pair));
    
            uint256 currentK = balance0 * balance1;
            uint256 increaseRatio = Math.mulDiv(previousK, 1e36, currentK);
            uint256 sqrtIncreaseRatio = Math.sqrt(increaseRatio * 1e36);
            
            uint256 percent = 1e36 - sqrtIncreaseRatio;
    
            uint256 amountOut0 = Math.mulDiv(balance0, percent, 1e36);
            uint256 amountOut1 = Math.mulDiv(balance1, percent, 1e36);
            pair.swap(amountOut0, amountOut1, address(this), "");
        }

        {
            IERC20(token0).transfer(address(pair), IERC20(token0).balanceOf(address(this)));
            IERC20(token1).transfer(address(pair), IERC20(token1).balanceOf(address(this)));
            pair.mint(address(this));
        }
        
        uint256 mintedAmount = IERC20(address(pair)).balanceOf(address(this));

        IERC20(address(pair)).approve(underlying, mintedAmount);
        
        FarmToken(underlying).deposit(mintedAmount);


        uint256 mintedFarmTokenAmount = IERC20(underlying).balanceOf(address(this));

        IERC20(underlying).approve(address(vcFarmToken), mintedFarmTokenAmount);
        
        vcFarmToken.mint(mintedFarmTokenAmount);

        vcFarmToken.transfer(borrower, vcFarmToken.balanceOf(address(this)));

        user = address(0);
    }

}