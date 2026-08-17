// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/*
    MotorHeadsEquip.sol — on-chain "equip" store for the whole-machine effects + animated
    backgrounds that holders win from ScrapCrates.

    A won effect/background is an ERC-1155 part minted into the token's ERC-6551 garage — that's
    the holder's INVENTORY. Owning a part no longer auto-applies it. To APPLY one, the holder does
    a paid on-chain save here: equip() records which effect + which background the token wears, the
    same opt-in, fee-paying model as MotorHeadsParts.applyParts (the canvas save). The off-chain
    renderer reads equippedOf() to drive the live animation, so what shows is the holder's explicit
    choice — not "the first part they happen to own".

    Model (per the collection owner's decisions):
      • Opt-in: nothing shows until equipped (equipped id 0 = none). Winners are grandfathered by the
        admin so nothing already-visible disappears.
      • Keep-the-part: equip NEVER burns the part — it stays in the garage, so a holder can re-equip
        or switch anytime. Every equip/switch pays the fee to the treasury.
      • Travels on sale: the equipped ids are per-token on-chain state; a sold token keeps whatever it
        wears (the ERC-6551 garage + its parts move with the token, and this state is keyed by tokenId).

    Ownership is enforced by reading ownerOf() from the live (immutable) MotorHeads collection, and a
    non-zero effect/background must actually be owned in the token's garage at equip time.
*/

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// Minimal view into ScrapCrates: the deterministic ERC-6551 garage that holds a token's won parts.
interface IGarageRegistry {
    function garageOf(uint256 tokenId) external view returns (address);
}

contract MotorHeadsEquip is AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant CONFIG_ROLE = keccak256("CONFIG_ROLE");

    // Part-id ranges (MUST match the crate loot tables + the site): effects 1..12, backgrounds 13..36
    // (Vol.1 = 13-24, Vol.2 = 25-36). Settable by CONFIG_ROLE so new effect/background waves never need a
    // redeploy — the v1 contract hard-coded these as `constant` and hit a wall at 24; v2 widens + un-freezes them.
    uint256 public effectMin = 1;
    uint256 public effectMax = 12;
    uint256 public backgroundMin = 13;
    uint256 public backgroundMax = 36;

    /// The live MotorHeads collection whose ownership gates every equip.
    IERC721 public immutable collection;
    /// ScrapCrates — resolves a token's ERC-6551 garage (holds the won ERC-1155 parts).
    IGarageRegistry public immutable crates;
    /// ScrapParts — the ERC-1155 effect/background parts; balanceOf gates "you must own it to equip it".
    IERC1155 public immutable parts;

    /// Fee recipient (the treasury wallet).
    address public treasury;
    /// Per-equip fee in wei — initialised to match the canvas save fee, adjustable by CONFIG_ROLE.
    uint256 public equipFeeWei;

    /// Equipped part ids per token. 0 = nothing equipped (the opt-in default).
    mapping(uint256 => uint256) public equippedEffect;
    mapping(uint256 => uint256) public equippedBackground;
    /// Bumped on every change — an ERC-4906-style refresh signal for the indexer/renderer.
    mapping(uint256 => uint32) public equipRevision;

    event Equipped(
        uint256 indexed tokenId,
        address indexed editor,
        uint256 effectId,
        uint256 backgroundId,
        uint32 revision,
        uint256 feeWei
    );
    event MetadataUpdate(uint256 _tokenId);
    event EquipFeeSet(uint256 feeWei);
    event PartRangesSet(uint256 effectMin, uint256 effectMax, uint256 backgroundMin, uint256 backgroundMax);
    event TreasurySet(address indexed treasury);
    event Swept(address indexed treasury, uint256 amount);

    constructor(
        address admin,
        address collection_,
        address crates_,
        address parts_,
        address treasury_,
        uint256 equipFeeWei_
    ) {
        require(admin != address(0), "admin=0");
        require(collection_ != address(0), "collection=0");
        require(crates_ != address(0), "crates=0");
        require(parts_ != address(0), "parts=0");
        require(treasury_ != address(0), "treasury=0");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(CONFIG_ROLE, admin);
        collection = IERC721(collection_);
        crates = IGarageRegistry(crates_);
        parts = IERC1155(parts_);
        treasury = treasury_;
        equipFeeWei = equipFeeWei_;
    }

    // -------------------------------------------------------------------- Holder equip (paid save)

    /// Equip `effectId` + `backgroundId` on `tokenId`. Pass 0 for a slot to clear it (unequip).
    /// A non-zero id must be in range AND owned in the token's garage. Caller must own the token
    /// and send at least `equipFeeWei` (overpay refunded). NEVER burns the part — re-equippable.
    function equip(uint256 tokenId, uint256 effectId, uint256 backgroundId)
        external
        payable
        nonReentrant
        whenNotPaused
    {
        require(collection.ownerOf(tokenId) == msg.sender, "not owner");
        require(msg.value >= equipFeeWei, "fee too low");

        if (effectId != 0 || backgroundId != 0) {
            address garage = crates.garageOf(tokenId);
            require(garage != address(0), "no garage");
            if (effectId != 0) {
                require(effectId >= effectMin && effectId <= effectMax, "bad effect");
                require(parts.balanceOf(garage, effectId) > 0, "effect not owned");
            }
            if (backgroundId != 0) {
                require(backgroundId >= backgroundMin && backgroundId <= backgroundMax, "bad background");
                require(parts.balanceOf(garage, backgroundId) > 0, "background not owned");
            }
        }

        equippedEffect[tokenId] = effectId;
        equippedBackground[tokenId] = backgroundId;
        uint32 revision = ++equipRevision[tokenId];

        // Interaction last: refund any overpayment; the fee itself stays for withdraw().
        uint256 overpay = msg.value - equipFeeWei;
        if (overpay > 0) {
            (bool ok, ) = payable(msg.sender).call{value: overpay}("");
            require(ok, "refund failed");
        }

        emit Equipped(tokenId, msg.sender, effectId, backgroundId, revision, equipFeeWei);
        emit MetadataUpdate(tokenId);
    }

    // -------------------------------------------------------------------- Reads (renderer/backend)

    /// The equipped ids for a token (0 = none). The renderer verifies current ownership itself.
    function equippedOf(uint256 tokenId) external view returns (uint256 effectId, uint256 backgroundId) {
        return (equippedEffect[tokenId], equippedBackground[tokenId]);
    }

    // -------------------------------------------------------------------- Grandfather migration

    /// One-time admin seeding so holders who already had an effect visible (pre-equip, when owning
    /// auto-showed the part) keep it after the switch to opt-in. No fee, no ownership/garage check —
    /// admin-only and used with a snapshot of current first-owned parts. Ids still stored verbatim.
    function grandfather(
        uint256[] calldata tokenIds,
        uint256[] calldata effectIds,
        uint256[] calldata backgroundIds
    ) external onlyRole(CONFIG_ROLE) {
        require(tokenIds.length == effectIds.length && tokenIds.length == backgroundIds.length, "length mismatch");
        for (uint256 i = 0; i < tokenIds.length; i++) {
            equippedEffect[tokenIds[i]] = effectIds[i];
            equippedBackground[tokenIds[i]] = backgroundIds[i];
            uint32 revision = ++equipRevision[tokenIds[i]];
            emit Equipped(tokenIds[i], msg.sender, effectIds[i], backgroundIds[i], revision, 0);
            emit MetadataUpdate(tokenIds[i]);
        }
    }

    // -------------------------------------------------------------------- Admin

    function setEquipFee(uint256 feeWei) external onlyRole(CONFIG_ROLE) {
        equipFeeWei = feeWei;
        emit EquipFeeSet(feeWei);
    }

    /// Widen (or adjust) the valid part-id ranges as new effect/background waves ship. Ranges must be
    /// well-formed and non-overlapping so an id can only ever be one slot type.
    function setPartRanges(uint256 effMin, uint256 effMax, uint256 bgMin, uint256 bgMax)
        external
        onlyRole(CONFIG_ROLE)
    {
        require(effMin >= 1 && effMin <= effMax, "bad effect range");
        require(bgMin > effMax && bgMin <= bgMax, "bad bg range");
        effectMin = effMin;
        effectMax = effMax;
        backgroundMin = bgMin;
        backgroundMax = bgMax;
        emit PartRangesSet(effMin, effMax, bgMin, bgMax);
    }

    function setTreasury(address treasury_) external onlyRole(CONFIG_ROLE) {
        require(treasury_ != address(0), "treasury=0");
        treasury = treasury_;
        emit TreasurySet(treasury_);
    }

    function pause() external onlyRole(CONFIG_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(CONFIG_ROLE) {
        _unpause();
    }

    /// Sweep accrued fees to the treasury. Open to anyone — funds can only ever go to `treasury`.
    function withdraw() external nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "nothing to withdraw");
        (bool ok, ) = payable(treasury).call{value: balance}("");
        require(ok, "sweep failed");
        emit Swept(treasury, balance);
    }
}
