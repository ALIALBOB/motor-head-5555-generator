// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Minimal ScrapCrates.garageOf stand-in for MotorHeadsEquip tests: a settable tokenId -> garage map.
contract MockGarageRegistry {
    mapping(uint256 => address) public garages;

    function setGarage(uint256 tokenId, address garage) external {
        garages[tokenId] = garage;
    }

    function garageOf(uint256 tokenId) external view returns (address) {
        return garages[tokenId];
    }
}
