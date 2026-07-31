// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/*
    MotorHeadsParts.sol — companion on-chain customization store for the (immutable)
    MotorHeads collection (LivingArchiveMachines, 0x0a5008550fc1402bb567a3ba38d9433e6199ceb1).

    The live MotorHeads contract is NOT upgradeable, so instead of touching it we store the
    holder's Owner-Canvas customization HERE. applyParts() writes the chosen parts + their
    placements into this contract's storage — a real on-chain save. Ownership is enforced by
    reading ownerOf() from the live collection, so only the true owner can edit a token and the
    live collection is never modified. An off-chain renderer reads partsOf() to draw the image +
    animation the marketplace shows (base art stays pinned on IPFS; parts are layered on top).

    Each save charges an edit fee (~$1 in ETH, admin-adjustable as price moves). Fees accrue in
    this contract and are swept to the treasury via withdraw().
*/

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract MotorHeadsParts is AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant CONFIG_ROLE = keccak256("CONFIG_ROLE");

    /// Upper bound on parts per token — caps gas + storage per save.
    uint256 public constant MAX_PARTS = 64;

    /// ERC-4906-style refresh signal for our indexer/renderer (this contract's own event).
    event MetadataUpdate(uint256 _tokenId);

    /// The live MotorHeads collection whose ownership gates every edit.
    IERC721 public immutable collection;

    /// Fee recipient (the treasury wallet).
    address public treasury;

    /// Per-save edit fee in wei (~$1). Adjustable by CONFIG_ROLE as the ETH price moves.
    uint256 public editFeeWei;

    /// A placed holder item — mirrors what the Owner Canvas actually saves:
    /// item + colorway + transparency + a free transform. `itemId`/`colorwayId` are catalog
    /// ids whose meaning lives OFF-chain (append-only: an id always means the same thing).
    /// Placement is fixed-point: scale of 1000 == 1.0x; rotation is degrees (0-359);
    /// transparency is 0-100.
    struct Part {
        uint16 itemId;
        int32 x;
        int32 y;
        uint16 scale;
        uint16 rotation;
        uint16 colorwayId;
        uint8 transparency;
    }

    mapping(uint256 => Part[]) private _parts;
    mapping(uint256 => uint32) public buildRevision;

    /// Encoding version of the saved layout — lets the placement model evolve without
    /// breaking already-saved on-chain data (the renderer interprets by schema).
    mapping(uint256 => uint16) public schemaVersion;

    event PartsApplied(uint256 indexed tokenId, address indexed editor, uint16 schema, uint32 revision, uint256 partCount, uint256 feeWei);
    event EditFeeSet(uint256 feeWei);
    event TreasurySet(address indexed treasury);
    event Swept(address indexed treasury, uint256 amount);

    constructor(address admin, address collection_, address treasury_, uint256 editFeeWei_) {
        require(admin != address(0), "admin=0");
        require(collection_ != address(0), "collection=0");
        require(treasury_ != address(0), "treasury=0");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(CONFIG_ROLE, admin);
        collection = IERC721(collection_);
        treasury = treasury_;
        editFeeWei = editFeeWei_;
    }

    // -------------------------------------------------------------------- Holder save

    /// Save `parts` on-chain for `tokenId` under encoding `schema`. Caller must own the token
    /// in the live collection and send at least `editFeeWei`. Replaces any previous layout.
    function applyParts(uint256 tokenId, uint16 schema, Part[] calldata parts)
        external
        payable
        nonReentrant
        whenNotPaused
    {
        require(collection.ownerOf(tokenId) == msg.sender, "not owner");
        require(parts.length <= MAX_PARTS, "too many parts");
        require(msg.value >= editFeeWei, "fee too low");

        // Effects: replace the stored layout, record the schema, and bump the revision.
        delete _parts[tokenId];
        Part[] storage stored = _parts[tokenId];
        for (uint256 i = 0; i < parts.length; i++) {
            stored.push(parts[i]);
        }
        schemaVersion[tokenId] = schema;
        uint32 revision = ++buildRevision[tokenId];

        // Interaction: refund any overpayment; the fee itself stays for withdraw().
        uint256 overpay = msg.value - editFeeWei;
        if (overpay > 0) {
            (bool ok, ) = payable(msg.sender).call{value: overpay}("");
            require(ok, "refund failed");
        }

        emit PartsApplied(tokenId, msg.sender, schema, revision, parts.length, editFeeWei);
        emit MetadataUpdate(tokenId);
    }

    // -------------------------------------------------------------------- Reads (renderer)

    function partsOf(uint256 tokenId) external view returns (Part[] memory) {
        return _parts[tokenId];
    }

    function partCountOf(uint256 tokenId) external view returns (uint256) {
        return _parts[tokenId].length;
    }

    // -------------------------------------------------------------------- Admin

    function setEditFee(uint256 feeWei) external onlyRole(CONFIG_ROLE) {
        editFeeWei = feeWei;
        emit EditFeeSet(feeWei);
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
