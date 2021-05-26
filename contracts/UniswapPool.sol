// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./UniswapLPToken.sol";
import "./Math.sol";

contract UniswapPool {
    using SafeERC20 for IERC20Metadata;
    using Math for uint256;
    using SafeMath for uint256;

    IERC20Metadata public firstToken;
    IERC20Metadata public secondToken;
    UniswapLPToken public lpToken;

    // TODO - events

    constructor(IERC20Metadata firstTokenAddress, IERC20Metadata secondTokenAddress) {
        firstToken = IERC20Metadata(firstTokenAddress);
        secondToken = IERC20Metadata(secondTokenAddress);
        lpToken = _createLPToken();
    }

    function _createLPToken() private returns (UniswapLPToken) {
        string memory name =
            string(abi.encodePacked("Uniswap ", firstToken.name(), " + ", secondToken.name(), " LP Token"));
        string memory symbol = string(abi.encodePacked("uni", firstToken.symbol(), "+", secondToken.symbol()));
        return new UniswapLPToken(name, symbol, address(firstToken), address(secondToken));
    }

    function addLiquidity(
        uint256 firstTokenAmount,
        uint256 secondTokenAmount
    ) external {
        _transferTokensToPool(msg.sender, firstTokenAmount, secondTokenAmount);
        uint256 lpTokenAmount = _calculateLPTokenAmountToMint(firstTokenAmount, secondTokenAmount);
        lpToken.mint(msg.sender, lpTokenAmount);
    }

    function _transferTokensToPool(
        address depositor,
        uint256 firstTokenAmount,
        uint256 secondTokenAmount
    ) internal {
        require(firstTokenAmount > 0, "First token amount must be greater than 0");
        require(secondTokenAmount > 0, "Second token amount must be greater than 0");

        require(firstToken.allowance(depositor, address(this)) >= firstTokenAmount, "Not enough allowed first tokens");
        require(
            secondToken.allowance(depositor, address(this)) >= secondTokenAmount,
            "Not enough allowed second tokens"
        );

        firstToken.safeTransferFrom(depositor, address(this), firstTokenAmount);
        secondToken.safeTransferFrom(depositor, address(this), secondTokenAmount);
    }

    function _calculateLPTokenAmountToMint(
        uint256 firstTokenAmount,
        uint256 secondTokenAmount
    ) internal view returns (uint256) {
        uint256 lpTokenSupply = lpToken.totalSupply();
        if (lpTokenSupply == 0) {
            // TODO - how is this handled for irrational results?
            return (firstTokenAmount * secondTokenAmount).sqrt();
        } else {
            uint256 totalFirstTokenInPool = _getFirstTokenBalance();
            uint256 totalSecondTokenInPool = _getSecondAmountBalance();

            uint256 totalValueInPoolAsFirstToken = totalFirstTokenInPool.mul(2);
            uint256 secondTokenAmountAddedAsFirstToken = secondTokenAmount.mul(totalFirstTokenInPool).div(totalSecondTokenInPool);
            uint256 totalValueAddedAsFirstToken = firstTokenAmount.add(secondTokenAmountAddedAsFirstToken);

            uint256 totalFutureSupply = lpTokenSupply.mul(totalValueInPoolAsFirstToken).div((totalValueInPoolAsFirstToken.sub(totalValueAddedAsFirstToken)));
            uint256 total = totalFutureSupply - lpTokenSupply;
            return total;
        }
    }

    function _getFirstTokenBalance() private view returns (uint256) {
        return firstToken.balanceOf(address(this));
    }

    function _getSecondAmountBalance() private view returns (uint256) {
        return secondToken.balanceOf(address(this));
    }
}