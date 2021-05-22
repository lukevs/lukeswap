// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract UniswapLPToken is Ownable, ERC20 {
    address public firstTokenAddress;
    address public secondTokenAddress;

    constructor(
        string memory name,
        string memory symbol,
        address _firstTokenAddress,
        address _secondTokenAddress
    ) Ownable() ERC20(name, symbol) {
        firstTokenAddress = _firstTokenAddress;
        secondTokenAddress = _secondTokenAddress;
    }

    function mint(address account, uint256 amount) public onlyOwner {
        _mint(account, amount);
    }

    function burn(address account, uint256 amount) public onlyOwner {
        _burn(account, amount);
    }
}