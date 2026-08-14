// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/*
    ScrapCrates.sol — the crate token + the opener for MotorHeads.

    Crates are ERC-1155 tokens (one id per tier). Holders EARN them (backend mints via MINTER_ROLE).
    Opening is a two-step commit/resolve so a draw can never be re-rolled or predicted:

        commitOpen(machineTokenId, crateId)
          -> caller must own the machine + hold the crate
          -> BURNS 1 crate, snapshots the tier's loot-table version, records a pending requestId

        resolveOpen(requestId, seed, signature)
          -> the randomness `seed` is produced OFF-CHAIN by the project's trusted `signer` (the backend),
             signed as (chainid, this, requestId, seed). The contract verifies the signature, then maps the
             seed through the SNAPSHOTTED, immutable loot table with the on-chain weighted _pick, and mints
             the drawn part into the machine's ERC-6551 GARAGE.
          -> NEVER loses a crate: a failing mint is recorded redeemable (claimPart). The mint gas is bounded
             so a gas-heavy garage receiver can't starve the catch.

    Why signed off-chain randomness (not Chainlink VRF): zero per-open LINK cost. The trust model is
    "trust the project's signer to roll fairly" — but the WEIGHTING stays fully on-chain and transparent
    (public, versioned loot tables + the audited _pick), so odds can't be skewed per-draw, and the crate is
    burned BEFORE the seed exists, so no one can peek-and-reroll. resolveOpenAdmin is a CONFIG_ROLE backstop
    so a committed open can always be resolved even if the backend is temporarily down (never stuck).

    Security notes:
    - The ERC-6551 registry / account implementation / salt are canonical constants -> immutable.
    - Parts mint requires this contract to hold ScrapParts.MINTER_ROLE; the failure-safe path turns a
      missing/revoked role or a rejecting garage into a redeemable claim rather than a lost crate.

    NOTE: full tests before mainnet — this custodies fees + mints value.
*/

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

interface IScrapPartsMint {
    function mint(address to, uint256 id, uint256 amount) external;
}

/// Canonical ERC-6551 registry — account() is a pure view returning a machine's deterministic garage.
interface IERC6551Registry {
    function account(address implementation, bytes32 salt, uint256 chainId, address tokenContract, uint256 tokenId)
        external
        view
        returns (address);
}

contract ScrapCrates is ERC1155, AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant CONFIG_ROLE = keccak256("CONFIG_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    uint256 public constant MAX_LOOT_ENTRIES = 256; // caps _pick gas
    uint256 private constant MINT_GAS = 100_000; // bound the mint so a gas-heavy garage receiver can't
    //                                              starve the failure-safe catch (the 63/64 rule) and lose a crate

    string public name = "MotorHeads Scrap Crates";
    string public symbol = "MHCRATE";

    IERC721 public immutable collection; // MotorHeads
    IScrapPartsMint public immutable parts; // ScrapParts

    // ERC-6551 garage derivation — canonical constants (immutable: cannot be repointed to steal value)
    IERC6551Registry public immutable registry;
    address public immutable accountImplementation;
    bytes32 public immutable accountSalt;

    // activation
    address public treasury;
    uint256 public activationFeeWei;
    mapping(uint256 => bool) public activated;

    // off-chain randomness: the trusted backend signer whose signature authorizes a draw's seed
    address public signer;
    uint256 public nextRequestId = 1;

    // versioned, immutable-once-written loot tables (cumulative weights for O(log n) pick)
    struct Loot {
        uint256[] partIds;
        uint256[] cumWeights;
        uint256 total;
    }
    mapping(uint256 => Loot) private _lootByVersion; // versionId => table (never mutated after write)
    mapping(uint256 => uint256) public crateLootVersion; // crateId => current versionId (0 = unset)
    uint256 public nextLootVersion = 1;

    // in-flight opens (burned, awaiting a signed seed). Bound to the loot version live at commit.
    struct Pending {
        uint256 machineTokenId;
        uint256 crateId;
        uint256 lootVersion;
        address opener;
    }
    mapping(uint256 => Pending) public pending; // requestId => Pending

    // draws whose mint failed at resolve — redeemable by the machine owner (no lost crates). Packed into
    // ONE storage slot (tokenIds <= 5555, crate/part ids are small) so the failure-safe catch is a single SSTORE.
    struct ClaimablePart {
        uint64 machineTokenId;
        uint64 crateId;
        uint64 partId;
        bool redeemable;
    }
    mapping(uint256 => ClaimablePart) public claimableOf; // requestId => claimable

    event Activated(uint256 indexed tokenId, address indexed owner, uint256 feeWei);
    event CrateOpening(uint256 indexed machineTokenId, uint256 indexed crateId, uint256 requestId, uint256 lootVersion, address opener); // commit
    event CrateOpened(uint256 indexed machineTokenId, uint256 indexed crateId, address indexed garage, uint256 partId, uint256 requestId);
    event CratePending(uint256 indexed machineTokenId, uint256 indexed crateId, uint256 partId, uint256 requestId); // mint failed -> redeemable
    event LootTableSet(uint256 indexed crateId, uint256 indexed version, uint256 total);
    event ActivationFeeSet(uint256 feeWei);
    event TreasurySet(address indexed treasury);
    event SignerSet(address indexed signer);
    event URISet(string uri);
    event Swept(address indexed treasury, uint256 amount);

    constructor(
        address admin,
        string memory uri_,
        address collection_,
        address parts_,
        address registry_,
        address accountImplementation_,
        bytes32 accountSalt_,
        address treasury_,
        uint256 activationFeeWei_,
        address signer_
    ) ERC1155(uri_) {
        require(admin != address(0), "admin=0");
        require(collection_ != address(0) && parts_ != address(0), "zero addr");
        require(registry_ != address(0) && treasury_ != address(0), "zero addr");
        require(accountImplementation_ != address(0), "impl=0");
        require(signer_ != address(0), "signer=0");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(CONFIG_ROLE, admin);
        collection = IERC721(collection_);
        parts = IScrapPartsMint(parts_);
        registry = IERC6551Registry(registry_);
        accountImplementation = accountImplementation_;
        accountSalt = accountSalt_;
        treasury = treasury_;
        activationFeeWei = activationFeeWei_;
        signer = signer_;
    }

    // -------------------------------------------------------------------- Crates (backend mints)

    function mintCrates(address to, uint256 crateId, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, crateId, amount, "");
    }

    // -------------------------------------------------------------------- Activation

    function activate(uint256 tokenId) external payable nonReentrant whenNotPaused {
        require(collection.ownerOf(tokenId) == msg.sender, "not owner");
        require(!activated[tokenId], "already active");
        require(msg.value >= activationFeeWei, "fee too low");
        activated[tokenId] = true;
        uint256 overpay = msg.value - activationFeeWei;
        if (overpay > 0) {
            (bool ok, ) = payable(msg.sender).call{value: overpay}("");
            require(ok, "refund failed");
        }
        emit Activated(tokenId, msg.sender, activationFeeWei);
    }

    // -------------------------------------------------------------------- Open (commit + resolve)

    function garageOf(uint256 tokenId) public view returns (address) {
        return registry.account(accountImplementation, accountSalt, block.chainid, address(collection), tokenId);
    }

    /// Step 1 — burn one crate and record a pending draw. The outcome does NOT exist yet (no seed), so it
    /// can't be predicted or re-rolled.
    function commitOpen(uint256 machineTokenId, uint256 crateId)
        external
        nonReentrant
        whenNotPaused
        returns (uint256 requestId)
    {
        require(collection.ownerOf(machineTokenId) == msg.sender, "not owner");
        uint256 version = crateLootVersion[crateId];
        require(version != 0, "no loot table");

        _burn(msg.sender, crateId, 1); // reverts if caller doesn't hold the crate

        requestId = nextRequestId++;
        pending[requestId] = Pending({machineTokenId: machineTokenId, crateId: crateId, lootVersion: version, opener: msg.sender});
        emit CrateOpening(machineTokenId, crateId, requestId, version, msg.sender);
    }

    /// Step 2 — resolve with a seed signed by `signer`. Anyone may submit the signed seed (the signature is
    /// the authorization). The digest binds the chain, this contract, the requestId and the seed, so a
    /// signature can't be replayed across chains/contracts/requests.
    function resolveOpen(uint256 requestId, uint256 seed, bytes calldata signature) external nonReentrant {
        bytes32 digest = MessageHashUtils.toEthSignedMessageHash(
            keccak256(abi.encodePacked(block.chainid, address(this), requestId, seed))
        );
        require(ECDSA.recover(digest, signature) == signer, "bad signature");
        _resolve(requestId, seed);
    }

    /// Backstop — CONFIG_ROLE can resolve a committed open directly (e.g. if the backend signer is down),
    /// so a burned crate can never be permanently stuck. Same on-chain weighted pick.
    function resolveOpenAdmin(uint256 requestId, uint256 seed) external nonReentrant onlyRole(CONFIG_ROLE) {
        _resolve(requestId, seed);
    }

    function _resolve(uint256 requestId, uint256 seed) internal {
        Pending memory p = pending[requestId];
        require(p.opener != address(0), "unknown request"); // unknown or already resolved
        delete pending[requestId];

        Loot storage L = _lootByVersion[p.lootVersion];
        uint256 partId = _pick(L, seed % L.total);
        address garage = garageOf(p.machineTokenId);

        // Bound the mint gas: a gas-heavy garage receiver can't consume everything and leave the catch too
        // little to record the claim. A mint needing more than MINT_GAS simply defers to claimPart (full gas).
        try parts.mint{gas: MINT_GAS}(garage, partId, 1) {
            emit CrateOpened(p.machineTokenId, p.crateId, garage, partId, requestId);
        } catch {
            claimableOf[requestId] = ClaimablePart({machineTokenId: uint64(p.machineTokenId), crateId: uint64(p.crateId), partId: uint64(partId), redeemable: true});
            emit CratePending(p.machineTokenId, p.crateId, partId, requestId);
        }
    }

    /// Redeem a draw whose mint failed (e.g. role/garage was fixed since). Owner-only, retryable.
    function claimPart(uint256 requestId) external nonReentrant {
        ClaimablePart storage c = claimableOf[requestId];
        require(c.redeemable, "nothing to claim");
        require(collection.ownerOf(c.machineTokenId) == msg.sender, "not owner");
        c.redeemable = false;
        address garage = garageOf(c.machineTokenId);
        parts.mint(garage, c.partId, 1); // if this still reverts, state rolls back and it stays redeemable
        emit CrateOpened(c.machineTokenId, c.crateId, garage, c.partId, requestId);
    }

    /// Binary search over the ascending cumWeights (O(log n)). roll < L.total ⇒ a hit.
    function _pick(Loot storage L, uint256 roll) internal view returns (uint256) {
        uint256 lo = 0;
        uint256 hi = L.cumWeights.length - 1;
        while (lo < hi) {
            uint256 mid = (lo + hi) >> 1;
            if (roll < L.cumWeights[mid]) hi = mid;
            else lo = mid + 1;
        }
        return L.partIds[lo];
    }

    // -------------------------------------------------------------------- Admin

    /// Write a NEW immutable loot version for a tier. In-flight opens keep the version they snapshotted.
    function setLootTable(uint256 crateId, uint256[] calldata partIds, uint256[] calldata weights)
        external
        onlyRole(CONFIG_ROLE)
    {
        require(partIds.length == weights.length && partIds.length > 0, "bad arrays");
        require(partIds.length <= MAX_LOOT_ENTRIES, "too many entries");
        uint256 version = nextLootVersion++;
        Loot storage L = _lootByVersion[version];
        uint256 running = 0;
        for (uint256 i = 0; i < weights.length; i++) {
            require(weights[i] > 0, "weight=0");
            running += weights[i];
            L.partIds.push(partIds[i]);
            L.cumWeights.push(running);
        }
        L.total = running;
        crateLootVersion[crateId] = version;
        emit LootTableSet(crateId, version, running);
    }

    function lootTable(uint256 crateId)
        external
        view
        returns (uint256 version, uint256[] memory partIds, uint256[] memory cumWeights, uint256 total)
    {
        version = crateLootVersion[crateId];
        Loot storage L = _lootByVersion[version];
        return (version, L.partIds, L.cumWeights, L.total);
    }

    function lootTableAt(uint256 version)
        external
        view
        returns (uint256[] memory partIds, uint256[] memory cumWeights, uint256 total)
    {
        Loot storage L = _lootByVersion[version];
        return (L.partIds, L.cumWeights, L.total);
    }

    function setActivationFee(uint256 feeWei) external onlyRole(CONFIG_ROLE) {
        activationFeeWei = feeWei;
        emit ActivationFeeSet(feeWei);
    }

    function setTreasury(address treasury_) external onlyRole(CONFIG_ROLE) {
        require(treasury_ != address(0), "treasury=0");
        treasury = treasury_;
        emit TreasurySet(treasury_);
    }

    function setSigner(address signer_) external onlyRole(CONFIG_ROLE) {
        require(signer_ != address(0), "signer=0");
        signer = signer_;
        emit SignerSet(signer_);
    }

    function setURI(string calldata newuri) external onlyRole(CONFIG_ROLE) {
        _setURI(newuri);
        emit URISet(newuri);
    }

    function pause() external onlyRole(CONFIG_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(CONFIG_ROLE) {
        _unpause();
    }

    /// Sweep accrued activation fees to the treasury. Open to anyone — funds only ever go to `treasury`.
    function withdraw() external nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "nothing to withdraw");
        (bool ok, ) = payable(treasury).call{value: balance}("");
        require(ok, "sweep failed");
        emit Swept(treasury, balance);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
