// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./UniswapLPToken.sol";
// import "./Math.sol";

contract UniswapPool {
    using SafeERC20 for IERC20Metadata;
    using Math for uint256;

    IERC20Metadata private firstToken;
    IERC20Metadata private secondToken;
    UniswapLPToken public lpToken;

    constructor(
        address firstTokenAddress,
        address secondTokenAddress
    ) {
        firstToken = IERC20Metadata(firstTokenAddress);
        secondToken = IERC20Metadata(secondTokenAddress);
        lpToken = _createLPToken(firstTokenAddress, secondTokenAddress);
    }

    function _createLPToken(
        address firstTokenAddress,
        address secondTokenAddress
    ) internal returns (UniswapLPToken) {
        string memory name = string(abi.encodePacked("Uniswap ", firstToken.name(), " + ", secondToken.name(), " LP Token"));
        string memory symbol = string(abi.encodePacked("uni", firstToken.symbol(), "+", secondToken.symbol()));
        return new UniswapLPToken(name, symbol, firstTokenAddress, secondTokenAddress);
    }

    // function deposit(
    //     uint256 firstTokenAmount,
    //     uint256 secondTokenAmount
    // ) external {
    //     requre(firstTokenAmount > 0, "First token amount must be greater than 0");
    //     requre(secondTokenAmount > 0, "Second token amount must be greater than 0");

    //     firstToken = IERC20(firstTokenAddress);
    //     secondToken = IERC20(secondTokenAddress);

    //     require(firstToken.allowance(msg.sender, address(this)) >= firstTokenAmount, "Not enough allowed first tokens");
    //     require(secondToken.allowance(msg.sender, address(this)) >= secondTokenAmount, "Not enough allowed second tokens");

    //     firstToken.safeTransferFrom(msg.sender, address(this), firstTokenAmount);
    //     secondToken.safeTransferFrom(msg.sender, address(this), secondTokenAmount);

    //     uint256 lpTokenAmount = (firstTokenAmount * secondTokenAmount).sqrt();
    //     lpToken.call(abi.encodeWithSignature("mint(address, uint256)", msg.sender, lpTokenAmount));
    // }
}