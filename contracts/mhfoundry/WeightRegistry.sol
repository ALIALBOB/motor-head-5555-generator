// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/// @title WeightRegistry — source of truth for each robot's reward weight + prestige.
/// @notice Reward weight = baseWeight (from tier) + bonusWeight (from CAPPED customization).
///         totalWeight tracks the sum across all robots for the RewardPot accumulator.
///         Weight is stored PER tokenId (travels with the NFT on sale).
/// @dev UPGRADE_ROLE (UpgradeManager) sets tier+baseWeight; CUSTOMIZE_ROLE (CustomizeManager) sets the
///      capped bonusWeight; BURN_ROLE (BurnAttestor) sets burn/skin. Callers MUST settle the robot in the
///      RewardPot before changing its weight (see FOUNDRY_CONTRACTS_SPEC §4/§7). Stores state only; moves no funds.
contract WeightRegistry is AccessControl {
    bytes32 public constant UPGRADE_ROLE = keccak256("UPGRADE_ROLE");
    bytes32 public constant CUSTOMIZE_ROLE = keccak256("CUSTOMIZE_ROLE");
    bytes32 public constant BURN_ROLE = keccak256("BURN_ROLE");

    struct Robot {
        uint8 tier;         // 0 = un-activated, 1..5 = activated tiers
        uint96 baseWeight;  // from tier (0 until activated)
        uint96 bonusWeight; // from customization (capped, set by CustomizeManager)
        bool activated;     // earns ongoing rewards?
        uint32 burnCount;   // total 2D burned INTO this robot
        uint8 skin;         // 0 none, 1 Copper, 2 Chrome, 3 Molten, 4 Gold
    }

    mapping(uint256 => Robot) public robots;
    uint256 public totalWeight; // Σ (baseWeight + bonusWeight)

    event BaseWeightSet(uint256 indexed tokenId, uint8 tier, uint96 baseWeight);
    event BonusWeightSet(uint256 indexed tokenId, uint96 bonusWeight);
    event BurnSet(uint256 indexed tokenId, uint32 burnCount, uint8 skin);

    constructor(address admin) {
        require(admin != address(0), "admin=0");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    /// @notice Activate/upgrade: set tier + base weight. Bonus weight is preserved. Keeps totalWeight in sync.
    function setTier(uint256 tokenId, uint8 tier, uint96 baseWeight) external onlyRole(UPGRADE_ROLE) {
        Robot storage r = robots[tokenId];
        totalWeight = totalWeight - r.baseWeight + baseWeight;
        r.tier = tier;
        r.baseWeight = baseWeight;
        r.activated = true;
        emit BaseWeightSet(tokenId, tier, baseWeight);
    }

    /// @notice Set the capped customization bonus weight (absolute value; cap enforced by CustomizeManager).
    function setBonus(uint256 tokenId, uint96 bonusWeight) external onlyRole(CUSTOMIZE_ROLE) {
        Robot storage r = robots[tokenId];
        totalWeight = totalWeight - r.bonusWeight + bonusWeight;
        r.bonusWeight = bonusWeight;
        emit BonusWeightSet(tokenId, bonusWeight);
    }

    function setBurn(uint256 tokenId, uint32 burnCount, uint8 skin) external onlyRole(BURN_ROLE) {
        Robot storage r = robots[tokenId];
        r.burnCount = burnCount;
        r.skin = skin;
        emit BurnSet(tokenId, burnCount, skin);
    }

    // ---- views ----
    function weightOf(uint256 tokenId) external view returns (uint256) {
        Robot storage r = robots[tokenId];
        return uint256(r.baseWeight) + uint256(r.bonusWeight);
    }
    function baseWeightOf(uint256 tokenId) external view returns (uint256) { return robots[tokenId].baseWeight; }
    function bonusWeightOf(uint256 tokenId) external view returns (uint256) { return robots[tokenId].bonusWeight; }
    function isActivated(uint256 tokenId) external view returns (bool) { return robots[tokenId].activated; }
    function tierOf(uint256 tokenId) external view returns (uint8) { return robots[tokenId].tier; }
}
