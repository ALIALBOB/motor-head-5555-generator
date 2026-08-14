// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Minimal ScrapCrates stand-in for CrateDistributor tests: records mints per (to, id).
contract MockCrates {
    mapping(address => mapping(uint256 => uint256)) public balanceOf;

    function mintCrates(address to, uint256 id, uint256 amount) external {
        balanceOf[to][id] += amount;
    }
}
