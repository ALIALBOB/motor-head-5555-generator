// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface IRegW {
    function weightOf(uint256 tokenId) external view returns (uint256);
    function setTier(uint256 tokenId, uint8 tier, uint96 weight) external;
}
interface IPotW {
    function onWeightChange(uint256 tokenId, uint256 oldWeight, uint256 newWeight) external;
}

/// @notice TEST-ONLY stand-in for the real UpgradeManager (Milestone 3). Does the two things
///         an activate/upgrade must do, atomically: settle the robot in the RewardPot, then set
///         its new weight in the WeightRegistry. Needs SETTLER_ROLE on the pot + UPGRADE_ROLE on the reg.
contract MockUpgrader {
    IRegW public immutable reg;
    IPotW public immutable pot;

    constructor(address _reg, address _pot) {
        reg = IRegW(_reg);
        pot = IPotW(_pot);
    }

    function setWeight(uint256 tokenId, uint8 tier, uint96 newWeight) external {
        uint256 oldW = reg.weightOf(tokenId);
        pot.onWeightChange(tokenId, oldW, newWeight); // settle at current acc
        reg.setTier(tokenId, tier, newWeight);        // then move weight (affects future funding)
    }
}
