// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyERC20 is ERC20 {

    mapping(address => bool) claimedAirdropPlayerList;

    constructor(string memory name, string memory symbol) ERC20(name, symbol) {

    }

    function trans(address a1, address a2, uint256 amount) public{
        _transfer(a1, a2, amount);
    }

    function airdrop(address add) public {
        require(claimedAirdropPlayerList[add] == false, "This user has claimed airdrop already");
        _mint(add, 10000);
        claimedAirdropPlayerList[add] = true;
    }

}

