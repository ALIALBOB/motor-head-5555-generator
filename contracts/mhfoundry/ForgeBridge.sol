// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface IWeightRegistry {
    function tierOf(uint256 tokenId) external view returns (uint8);
    function weightOf(uint256 tokenId) external view returns (uint256);
    function bonusWeightOf(uint256 tokenId) external view returns (uint96);
    function setTier(uint256 tokenId, uint8 tier, uint96 baseWeight) external; // UPGRADE_ROLE
    function setBonus(uint256 tokenId, uint96 bonusWeight) external;           // CUSTOMIZE_ROLE
}
interface IRewardPot {
    function onWeightChange(uint256 tokenId, uint256 oldWeight, uint256 newWeight) external; // SETTLER_ROLE
}

/// @title ForgeBridge — cross-chain "burn a 2D / attach a 333" for the Foundry.
/// @notice The 2D MotorHeads + 333 Archive live on ETHEREUM; the robots + economy live on Robinhood, and the two
///         chains can't see each other. So the flow is: (1) you burn a 2D (send it to a burn address) or you hold a
///         333 on Ethereum; (2) our backend WATCHES Ethereum, verifies it, and SIGNS an EIP-712 voucher; (3) you
///         redeem the voucher here — this contract checks the signature came from our `signer`, consumes it once
///         (anti-replay), and applies the tier / attaches the 333, moving weight exactly like the on-chain managers.
/// @dev Holds UPGRADE_ROLE + SETTLER_ROLE (for burn→tier) and CUSTOMIZE_ROLE + SETTLER_ROLE (for 333 bonus) on the
///      registry/pot. The signer is trusted for the OFF-CHAIN facts (did you really burn N? do you really own the
///      333?); the contract guarantees the ON-CHAIN safety: one voucher used once, one 2D applied once, one 333
///      bound to one robot at a time, and the robot's owner is the one redeeming.
contract ForgeBridge is AccessControl, EIP712 {
    IWeightRegistry public immutable reg;
    IRewardPot public immutable pot;
    IERC721 public immutable robot;

    address public signer;          // the backend attestor key — vouchers must be signed by it
    uint96[] public tierWeight;     // tier => base weight (mirrors UpgradeManager's table)
    uint96 public bonusPerArchive;  // weight added per attached 333
    uint96 public maxBonus;         // cap on a robot's total 333 bonus weight (0 = uncapped)
    uint8  public maxArchives;      // max 333s per robot (windows)

    mapping(bytes32 => bool) public usedNonce;          // voucher replay guard
    mapping(uint256 => bool) public burnConsumed;       // 2D tokenId already applied (can't be reused)
    mapping(uint256 => uint256) public archiveBoundTo;  // 333 tokenId => robotId (0 = unbound)
    mapping(uint256 => uint256) public archiveCount;    // robotId => # of 333s attached
    mapping(uint256 => uint96) public archiveBonus;     // robotId => the bonus weight THIS bridge currently contributes

    // EIP-712 typed data
    bytes32 private constant BURN_TYPEHASH =
        keccak256("Burn(address owner,uint256 robotId,uint8 toTier,uint256[] burnIds,bytes32 nonce,uint256 deadline)");
    bytes32 private constant ATTACH_TYPEHASH =
        keccak256("Attach(address owner,uint256 robotId,uint256 archiveId,bytes32 nonce,uint256 deadline)");

    event ActivatedWithBurn(uint256 indexed robotId, uint8 toTier, uint256[] burnIds);
    event ArchiveAttached(uint256 indexed robotId, uint256 indexed archiveId, uint96 newBonus);
    event ArchiveDetached(uint256 indexed robotId, uint256 indexed archiveId, uint96 newBonus);
    event SignerSet(address signer);

    constructor(
        address admin, address signer_, address reg_, address pot_, address robot_,
        uint96[] memory tierWeight_, uint96 bonusPerArchive_, uint96 maxBonus_, uint8 maxArchives_
    ) EIP712("MHForgeBridge", "1") {
        require(admin != address(0) && signer_ != address(0) && reg_ != address(0) && pot_ != address(0) && robot_ != address(0), "zero");
        require(tierWeight_.length >= 2 && tierWeight_[0] == 0, "tiers");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        signer = signer_;
        reg = IWeightRegistry(reg_); pot = IRewardPot(pot_); robot = IERC721(robot_);
        tierWeight = tierWeight_; bonusPerArchive = bonusPerArchive_; maxBonus = maxBonus_; maxArchives = maxArchives_;
    }

    // ── admin ──
    function setSigner(address s) external onlyRole(DEFAULT_ADMIN_ROLE) { require(s != address(0), "zero"); signer = s; emit SignerSet(s); }
    function setArchiveParams(uint96 bonusPerArchive_, uint96 maxBonus_, uint8 maxArchives_) external onlyRole(DEFAULT_ADMIN_ROLE) {
        bonusPerArchive = bonusPerArchive_; maxBonus = maxBonus_; maxArchives = maxArchives_;
    }
    function maxTier() public view returns (uint8) { return uint8(tierWeight.length - 1); }

    // ── burn a 2D → reach a tier (no $TOKEN charged; the burn IS the payment) ──
    function activateWithBurn(
        address owner, uint256 robotId, uint8 toTier,
        uint256[] calldata burnIds, bytes32 nonce, uint256 deadline, bytes calldata sig
    ) external {
        require(block.timestamp <= deadline, "expired");
        require(msg.sender == owner && robot.ownerOf(robotId) == owner, "not robot owner");
        require(toTier > reg.tierOf(robotId) && toTier <= maxTier(), "bad tier");
        require(burnIds.length > 0, "no burns");
        require(!usedNonce[nonce], "nonce used"); usedNonce[nonce] = true;

        bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(
            BURN_TYPEHASH, owner, robotId, toTier, keccak256(abi.encodePacked(burnIds)), nonce, deadline
        )));
        require(ECDSA.recover(digest, sig) == signer, "bad sig");

        for (uint256 i; i < burnIds.length; i++) {
            require(!burnConsumed[burnIds[i]], "burn reused");
            burnConsumed[burnIds[i]] = true;
        }
        _setTier(robotId, toTier);
        emit ActivatedWithBurn(robotId, toTier, burnIds);
    }

    // ── attach a 333 you own on Ethereum → bonus weight (non-destructive) ──
    function attachArchive(
        address owner, uint256 robotId, uint256 archiveId, bytes32 nonce, uint256 deadline, bytes calldata sig
    ) external {
        require(block.timestamp <= deadline, "expired");
        require(msg.sender == owner && robot.ownerOf(robotId) == owner, "not robot owner");
        require(reg.tierOf(robotId) >= 1, "activate first"); // only Activated robots earn
        require(archiveBoundTo[archiveId] == 0, "333 already attached");
        require(archiveCount[robotId] < maxArchives, "max archives");
        require(!usedNonce[nonce], "nonce used"); usedNonce[nonce] = true;

        bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(
            ATTACH_TYPEHASH, owner, robotId, archiveId, nonce, deadline
        )));
        require(ECDSA.recover(digest, sig) == signer, "bad sig");

        archiveBoundTo[archiveId] = robotId;
        archiveCount[robotId] += 1;
        uint96 nb = _syncArchiveBonus(robotId);
        emit ArchiveAttached(robotId, archiveId, nb);
    }

    // ── detach a 333 (the robot owner, any time; e.g. they sold the 333) ──
    function detachArchive(uint256 robotId, uint256 archiveId) external {
        require(robot.ownerOf(robotId) == msg.sender, "not robot owner");
        _detach(robotId, archiveId);
    }

    /// Admin recourse for a 333 that was SOLD on Ethereum: its Robinhood binding is stale (the seller keeps the bonus,
    /// the new owner is locked out). This unbinds it so the new owner can attach it. (A signer-authorised detach voucher
    /// is the nicer production path; this is the on-chain lever so a 333 can never be permanently frozen.)
    function forceDetach(uint256 robotId, uint256 archiveId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _detach(robotId, archiveId);
    }

    function _detach(uint256 robotId, uint256 archiveId) internal {
        require(archiveBoundTo[archiveId] == robotId, "not attached here");
        archiveBoundTo[archiveId] = 0;
        archiveCount[robotId] -= 1;
        uint96 nb = _syncArchiveBonus(robotId);
        emit ArchiveDetached(robotId, archiveId, nb);
    }

    // ── internal: mirror UpgradeManager's settle-then-move-weight so the accumulator stays exact ──
    function _setTier(uint256 robotId, uint8 tier) internal {
        uint256 oldW = reg.weightOf(robotId);
        uint96 base = tierWeight[tier];
        uint256 newW = uint256(base) + reg.bonusWeightOf(robotId); // ForgeBridge WRITES base below, so weightOf stays self-consistent
        pot.onWeightChange(robotId, oldW, newW); // settle at current acc BEFORE weight moves
        reg.setTier(robotId, tier, base);
    }

    /// Recompute THIS bridge's archive bonus from the live count (cap-correct + retune-safe), PRESERVE any bonus set by
    /// another manager (work off the delta on the LIVE registry weight — never rebuild base from a local table), settle
    /// the pot exactly, and write it back. This is conservation-safe: bonusWeightOf always tracks archiveCount.
    function _syncArchiveBonus(uint256 robotId) internal returns (uint96 target) {
        uint256 want = uint256(archiveCount[robotId]) * bonusPerArchive;
        if (maxBonus > 0 && want > maxBonus) want = maxBonus;
        target = uint96(want);

        uint256 oldW = reg.weightOf(robotId);
        uint256 curBonus = reg.bonusWeightOf(robotId);
        uint96 mine = archiveBonus[robotId];
        uint256 other = curBonus > mine ? curBonus - mine : 0; // bonus contributed by anything other than this bridge
        uint256 newBonus = other + target;
        uint256 newW = oldW - curBonus + newBonus;             // base is read live (oldW - curBonus), not reconstructed

        pot.onWeightChange(robotId, oldW, newW); // settle BEFORE the weight moves
        reg.setBonus(robotId, uint96(newBonus));
        archiveBonus[robotId] = target;
    }
}
