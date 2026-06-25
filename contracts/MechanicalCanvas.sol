// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/*
    MechanicalCanvas.sol

    This is the "brain" for the collection.

    The art idea:
    - Every ERC721 token is a mechanical canvas.
    - The holder can freely arrange gears, pipes, bolts, liquid tanks, eyes, crowns, etc.
    - The exact freeform layout is stored as JSON on IPFS/Arweave to avoid huge gas costs.
    - The contract stores the important permanent machine state:
      seed, mint time, transfer count, oil/liquid state, repair/wind counts, equipped/unlocked parts,
      and the published layout URI/hash.

    Why not store every x/y coordinate on-chain?
    - A creative build can contain 100+ micro-parts.
    - Storing every part placement directly in Solidity would make every save expensive.
    - Instead, the user publishes layout JSON off-chain and the contract stores a content URI + hash.

    Upgradeability:
    - This contract uses UUPS upgradeability through OpenZeppelin.
    - The proxy address stays the same; implementation logic can be upgraded by UPGRADER_ROLE.
    - IMPORTANT: future versions must keep storage layout compatible.
*/

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import {ERC721BurnableUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721BurnableUpgradeable.sol";
import {ERC2981Upgradeable} from "@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";

contract MechanicalCanvas is
    Initializable,
    ERC721Upgradeable,
    ERC721BurnableUpgradeable,
    ERC2981Upgradeable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable
{
    using Strings for uint256;

    // Roles are split so the artist/dev team can delegate duties safely.
    bytes32 public constant CONFIG_ROLE = keccak256("CONFIG_ROLE");
    bytes32 public constant PART_MANAGER_ROLE = keccak256("PART_MANAGER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    // ERC-4906 interface id. Marketplaces can listen for MetadataUpdate events.
    bytes4 private constant _INTERFACE_ID_ERC4906 = 0x49064906;

    // Emitted when dynamic metadata for one token changes.
    event MetadataUpdate(uint256 _tokenId);

    // Emitted when dynamic metadata for a range of tokens changes.
    event BatchMetadataUpdate(uint256 _fromTokenId, uint256 _toTokenId);

    // ----- Collection config -----
    uint256 public maxSupply;
    uint256 public mintPriceWei;
    uint256 public nextTokenId;
    uint256 public totalMinted;
    uint8 public canvasCount;

    // Static preview base. Example: ipfs://CID/previews/ -> tokenURI image = ipfs://CID/previews/1.svg
    string public previewBaseURI;

    // Live renderer URL. Example: ipfs://CID/index.html -> animation_url = ipfs://CID/index.html?tokenId=1&contract=...
    string public rendererURL;

    // Collection-level metadata URI, used by marketplaces that support contractURI.
    string private _contractURIValue;

    // ----- Dynamic machine state -----

    struct LiquidState {
        // liquidType is the semantic family: black oil, coolant, mercury, resin, sludge, etc.
        uint8 liquidType;

        // color is a palette index used by the renderer. A red coolant and a blue coolant can share liquidType but differ in color.
        uint8 color;

        // texture is visual structure: smooth, bubbly, molten, metallic, slimy, electric, etc.
        uint8 texture;

        // fillLevel/purity/viscosity/temperature are 0-100 values.
        uint8 fillLevel;
        uint8 purity;
        uint8 viscosity;
        uint8 temperature;

        // leaking makes the renderer draw drips/stains and makes the machine feel damaged.
        bool leaking;

        // The renderer can compute time decay from this without constant chain writes.
        uint64 lastChangedAt;
    }

    struct Machine {
        // Permanent random seed for deterministic art generation.
        uint256 seed;

        // Mint timestamp. Renderer uses this for aging, dust, rust, time-reactive gears, etc.
        uint64 mintedAt;

        // Last meaningful owner interaction timestamp.
        uint64 lastActionAt;

        // Transaction-reactive counters.
        uint32 transferCount;
        uint32 windCount;
        uint32 repairCount;
        uint32 overclockCount;

        // Base canvas type: gear swarm, pipe chamber, clock reactor, liquid engine, etc.
        uint8 canvasType;

        // Artistic burn state. This does NOT destroy the NFT; it transforms it into a dead/burned core visually.
        bool burnedCore;

        // Current oil/liquid system.
        LiquidState liquid;

        // Published freeform build. This points to layout JSON saved on IPFS/Arweave/backend.
        string layoutURI;

        // Hash of the layout JSON so users can verify the off-chain layout was not silently changed.
        bytes32 layoutHash;

        // Number of placed parts in the published build. Useful for renderer/UI and marketplace traits.
        uint32 partCount;

        // Incremented every time the holder publishes a new layout.
        uint32 buildRevision;
    }

    struct Part {
        // key is a short stable renderer key, for example: "gear.large", "pipe.elbow", "micro.bolt".
        string key;

        // Human-readable display name.
        string name;

        // category: 1 gear, 2 pipe, 3 frame, 4 liquid, 5 face, 6 creature, 7 micro, 8 rare, etc.
        uint8 category;

        // rarity: 1 common, 2 uncommon, 3 rare, 4 epic, 5 legendary.
        uint8 rarity;

        // assetURI can point to SVG/vector data, but the renderer can also draw by key without external assets.
        string assetURI;

        // inactive parts stay in history but cannot be newly granted/equipped.
        bool active;

        // duplicable means the builder may allow the user to place multiple copies of this part.
        bool duplicable;
    }

    mapping(uint256 => Machine) private _machines;
    mapping(uint16 => Part) public parts;
    mapping(uint16 => bool) public partExists;
    uint16[] private _allPartIds;

    // Token-specific part inventory. A holder can only build with parts unlocked for that token.
    mapping(uint256 => mapping(uint16 => bool)) public tokenHasPart;
    mapping(uint256 => uint16[]) private _tokenParts;

    // Parts granted automatically to every newly minted token.
    uint16[] private _starterPartIds;

    event MachineMinted(uint256 indexed tokenId, address indexed owner, uint256 seed, uint8 canvasType);
    event MachineWound(uint256 indexed tokenId, uint32 windCount);
    event MachineRepaired(uint256 indexed tokenId, uint32 repairCount);
    event MachineOverclocked(uint256 indexed tokenId, uint32 overclockCount, uint8 temperature);
    event MachineCoreBurned(uint256 indexed tokenId);
    event OilChanged(uint256 indexed tokenId, uint8 liquidType, uint8 color, uint8 texture);
    event LeakStateChanged(uint256 indexed tokenId, bool leaking);
    event BuildPublished(uint256 indexed tokenId, uint32 revision, string layoutURI, bytes32 layoutHash, uint32 partCount);
    event PartUpserted(uint16 indexed partId, string key, string name, uint8 category, uint8 rarity, bool active);
    event PartGranted(uint256 indexed tokenId, uint16 indexed partId);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address admin,
        string memory name_,
        string memory symbol_,
        uint256 maxSupply_,
        uint256 mintPriceWei_,
        string memory previewBaseURI_,
        string memory rendererURL_,
        string memory contractURI_
    ) public initializer {
        require(admin != address(0), "admin=0");
        require(maxSupply_ > 0, "maxSupply=0");

        __ERC721_init(name_, symbol_);
        __ERC721Burnable_init();
        __ERC2981_init();
        __AccessControl_init();
        __Pausable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(CONFIG_ROLE, admin);
        _grantRole(PART_MANAGER_ROLE, admin);
        _grantRole(UPGRADER_ROLE, admin);

        maxSupply = maxSupply_;
        mintPriceWei = mintPriceWei_;
        previewBaseURI = previewBaseURI_;
        rendererURL = rendererURL_;
        _contractURIValue = contractURI_;
        nextTokenId = 1;
        canvasCount = 12;

        // Default royalty placeholder. Change this before mainnet if needed.
        _setDefaultRoyalty(admin, 500); // 500 basis points = 5%
    }

    // ----- Minting -----

    function mint(uint256 quantity) external payable nonReentrant whenNotPaused {
        require(quantity > 0 && quantity <= 20, "bad quantity");
        require(totalMinted + quantity <= maxSupply, "sold out");

        uint256 expected = mintPriceWei * quantity;
        require(msg.value >= expected, "underpaid");

        for (uint256 i = 0; i < quantity; i++) {
            _mintOne(msg.sender);
        }

        // Refund accidental overpayment.
        if (msg.value > expected) {
            (bool ok, ) = payable(msg.sender).call{value: msg.value - expected}("");
            require(ok, "refund failed");
        }
    }

    function adminMint(address to, uint256 quantity) external onlyRole(CONFIG_ROLE) {
        require(to != address(0), "to=0");
        require(quantity > 0, "quantity=0");
        require(totalMinted + quantity <= maxSupply, "sold out");

        for (uint256 i = 0; i < quantity; i++) {
            _mintOne(to);
        }
    }

    function _mintOne(address to) internal {
        uint256 tokenId = nextTokenId++;
        totalMinted++;

        uint256 seed = uint256(
            keccak256(
                abi.encodePacked(
                    tokenId,
                    to,
                    address(this),
                    block.timestamp,
                    block.prevrandao,
                    totalMinted
                )
            )
        );

        uint8 canvasType = uint8(seed % canvasCount);
        _machines[tokenId] = Machine({
            seed: seed,
            mintedAt: uint64(block.timestamp),
            lastActionAt: uint64(block.timestamp),
            transferCount: 0,
            windCount: 0,
            repairCount: 0,
            overclockCount: 0,
            canvasType: canvasType,
            burnedCore: false,
            liquid: _initialLiquid(seed),
            layoutURI: "",
            layoutHash: bytes32(0),
            partCount: 0,
            buildRevision: 0
        });

        _safeMint(to, tokenId);
        _grantStarterPack(tokenId);

        emit MachineMinted(tokenId, to, seed, canvasType);
        emit MetadataUpdate(tokenId);
    }

    function _initialLiquid(uint256 seed) internal view returns (LiquidState memory) {
        return LiquidState({
            liquidType: uint8((seed >> 8) % 8),
            color: uint8((seed >> 16) % 12),
            texture: uint8((seed >> 24) % 8),
            fillLevel: uint8(60 + ((seed >> 32) % 41)),
            purity: uint8(70 + ((seed >> 40) % 31)),
            viscosity: uint8(20 + ((seed >> 48) % 81)),
            temperature: uint8(25 + ((seed >> 56) % 46)),
            leaking: false,
            lastChangedAt: uint64(block.timestamp)
        });
    }

    // ----- Holder interactions -----

    function wind(uint256 tokenId, uint8 pulses) external onlyTokenOwner(tokenId) {
        require(pulses > 0 && pulses <= 20, "bad pulses");
        Machine storage m = _machines[tokenId];
        m.windCount += uint32(pulses);
        m.lastActionAt = uint64(block.timestamp);

        emit MachineWound(tokenId, m.windCount);
        emit MetadataUpdate(tokenId);
    }

    function repair(uint256 tokenId) external onlyTokenOwner(tokenId) {
        Machine storage m = _machines[tokenId];
        m.repairCount += 1;
        m.lastActionAt = uint64(block.timestamp);

        // Repair slowly improves purity and can stop leaks.
        if (m.liquid.purity < 100) m.liquid.purity += 1;
        m.liquid.leaking = false;

        emit MachineRepaired(tokenId, m.repairCount);
        emit MetadataUpdate(tokenId);
    }

    function overclock(uint256 tokenId) external onlyTokenOwner(tokenId) {
        Machine storage m = _machines[tokenId];
        m.overclockCount += 1;
        m.lastActionAt = uint64(block.timestamp);

        // Temperature is capped at 100. The renderer can use it for red glow/sparks.
        if (m.liquid.temperature <= 90) {
            m.liquid.temperature += 10;
        } else {
            m.liquid.temperature = 100;
        }

        emit MachineOverclocked(tokenId, m.overclockCount, m.liquid.temperature);
        emit MetadataUpdate(tokenId);
    }

    function changeOil(
        uint256 tokenId,
        uint8 liquidType,
        uint8 color,
        uint8 texture,
        uint8 viscosity
    ) external onlyTokenOwner(tokenId) {
        require(liquidType < 32, "liquidType too high");
        require(color < 32, "color too high");
        require(texture < 32, "texture too high");
        require(viscosity <= 100, "viscosity>100");

        Machine storage m = _machines[tokenId];
        m.liquid = LiquidState({
            liquidType: liquidType,
            color: color,
            texture: texture,
            fillLevel: 100,
            purity: 100,
            viscosity: viscosity,
            temperature: 35,
            leaking: false,
            lastChangedAt: uint64(block.timestamp)
        });
        m.lastActionAt = uint64(block.timestamp);

        emit OilChanged(tokenId, liquidType, color, texture);
        emit MetadataUpdate(tokenId);
    }

    function setLeakState(uint256 tokenId, bool leaking) external onlyTokenOwner(tokenId) {
        Machine storage m = _machines[tokenId];
        m.liquid.leaking = leaking;
        m.liquid.lastChangedAt = uint64(block.timestamp);
        m.lastActionAt = uint64(block.timestamp);

        emit LeakStateChanged(tokenId, leaking);
        emit MetadataUpdate(tokenId);
    }

    function burnCore(uint256 tokenId) external onlyTokenOwner(tokenId) {
        Machine storage m = _machines[tokenId];
        require(!m.burnedCore, "already burned");
        m.burnedCore = true;
        m.lastActionAt = uint64(block.timestamp);

        emit MachineCoreBurned(tokenId);
        emit MetadataUpdate(tokenId);
    }

    // ----- Freeform builder publishing -----

    function publishBuild(
        uint256 tokenId,
        string calldata layoutURI,
        bytes32 layoutHash,
        uint32 partCount
    ) external onlyTokenOwner(tokenId) {
        require(bytes(layoutURI).length > 0, "layoutURI empty");

        Machine storage m = _machines[tokenId];
        m.layoutURI = layoutURI;
        m.layoutHash = layoutHash;
        m.partCount = partCount;
        m.buildRevision += 1;
        m.lastActionAt = uint64(block.timestamp);

        emit BuildPublished(tokenId, m.buildRevision, layoutURI, layoutHash, partCount);
        emit MetadataUpdate(tokenId);
    }

    // ----- Part catalog / inventory -----

    function upsertPart(
        uint16 partId,
        string calldata key,
        string calldata name_,
        uint8 category,
        uint8 rarity,
        string calldata assetURI,
        bool active,
        bool duplicable
    ) external onlyRole(PART_MANAGER_ROLE) {
        require(partId != 0, "partId=0");
        require(bytes(key).length > 0, "key empty");
        require(bytes(name_).length > 0, "name empty");

        if (!partExists[partId]) {
            partExists[partId] = true;
            _allPartIds.push(partId);
        }

        parts[partId] = Part({
            key: key,
            name: name_,
            category: category,
            rarity: rarity,
            assetURI: assetURI,
            active: active,
            duplicable: duplicable
        });

        emit PartUpserted(partId, key, name_, category, rarity, active);
    }

    function setStarterPack(uint16[] calldata partIds) external onlyRole(PART_MANAGER_ROLE) {
        delete _starterPartIds;
        for (uint256 i = 0; i < partIds.length; i++) {
            require(partExists[partIds[i]], "unknown part");
            require(parts[partIds[i]].active, "inactive part");
            _starterPartIds.push(partIds[i]);
        }
    }

    function grantPartToToken(uint256 tokenId, uint16 partId) external onlyRole(PART_MANAGER_ROLE) {
        ownerOf(tokenId); // reverts if token does not exist
        _grantPart(tokenId, partId);
    }

    function grantPartsToToken(uint256 tokenId, uint16[] calldata partIds) external onlyRole(PART_MANAGER_ROLE) {
        ownerOf(tokenId); // reverts if token does not exist
        for (uint256 i = 0; i < partIds.length; i++) {
            _grantPart(tokenId, partIds[i]);
        }
    }

    function _grantStarterPack(uint256 tokenId) internal {
        for (uint256 i = 0; i < _starterPartIds.length; i++) {
            _grantPart(tokenId, _starterPartIds[i]);
        }
    }

    function _grantPart(uint256 tokenId, uint16 partId) internal {
        require(partExists[partId], "unknown part");
        require(parts[partId].active, "inactive part");

        if (!tokenHasPart[tokenId][partId]) {
            tokenHasPart[tokenId][partId] = true;
            _tokenParts[tokenId].push(partId);
            emit PartGranted(tokenId, partId);
            emit MetadataUpdate(tokenId);
        }
    }

    // ----- Admin config -----

    function setMintPrice(uint256 newPriceWei) external onlyRole(CONFIG_ROLE) {
        mintPriceWei = newPriceWei;
    }

    function setMaxSupply(uint256 newMaxSupply) external onlyRole(CONFIG_ROLE) {
        require(newMaxSupply >= totalMinted, "below minted");
        maxSupply = newMaxSupply;
    }

    function setCanvasCount(uint8 newCanvasCount) external onlyRole(CONFIG_ROLE) {
        require(newCanvasCount > 0, "canvasCount=0");
        canvasCount = newCanvasCount;
    }

    function setPreviewBaseURI(string calldata newPreviewBaseURI) external onlyRole(CONFIG_ROLE) {
        previewBaseURI = newPreviewBaseURI;
        if (totalMinted > 0) emit BatchMetadataUpdate(1, totalMinted);
    }

    function setRendererURL(string calldata newRendererURL) external onlyRole(CONFIG_ROLE) {
        rendererURL = newRendererURL;
        if (totalMinted > 0) emit BatchMetadataUpdate(1, totalMinted);
    }

    function setContractURI(string calldata newContractURI) external onlyRole(CONFIG_ROLE) {
        _contractURIValue = newContractURI;
    }

    function pause() external onlyRole(CONFIG_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(CONFIG_ROLE) {
        _unpause();
    }

    function withdraw(address payable recipient) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(recipient != address(0), "recipient=0");
        (bool ok, ) = recipient.call{value: address(this).balance}("");
        require(ok, "withdraw failed");
    }

    function setDefaultRoyalty(address receiver, uint96 feeNumerator) external onlyRole(CONFIG_ROLE) {
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    // ----- Read helpers -----

    function machine(uint256 tokenId) external view returns (Machine memory) {
        ownerOf(tokenId); // reverts if token does not exist
        return _machines[tokenId];
    }

    function allPartIds() external view returns (uint16[] memory) {
        return _allPartIds;
    }

    function tokenParts(uint256 tokenId) external view returns (uint16[] memory) {
        ownerOf(tokenId); // reverts if token does not exist
        return _tokenParts[tokenId];
    }

    function starterPartIds() external view returns (uint16[] memory) {
        return _starterPartIds;
    }

    function contractURI() external view returns (string memory) {
        return _contractURIValue;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        ownerOf(tokenId); // reverts if token does not exist
        Machine storage m = _machines[tokenId];

        string memory imageURL = string(abi.encodePacked(previewBaseURI, tokenId.toString(), ".svg"));
        string memory animationURL = _animationURL(tokenId);

        bytes memory json = abi.encodePacked(
            "{",
                "\"name\":\"Mechanical Canvas #", tokenId.toString(), "\",",
                "\"description\":\"A freeform mechanical canvas NFT that changes with chain state, liquid/oil state, owner interactions, and published builder layouts.\",",
                "\"image\":\"", imageURL, "\",",
                "\"animation_url\":\"", animationURL, "\",",
                "\"external_url\":\"", animationURL, "\",",
                "\"attributes\":[",
                    _attr("Canvas Type", uint256(m.canvasType).toString()), ",",
                    _attr("Liquid Type", uint256(m.liquid.liquidType).toString()), ",",
                    _attr("Liquid Color", uint256(m.liquid.color).toString()), ",",
                    _attr("Liquid Texture", uint256(m.liquid.texture).toString()), ",",
                    _attr("Fill Level", uint256(m.liquid.fillLevel).toString()), ",",
                    _attr("Purity", uint256(m.liquid.purity).toString()), ",",
                    _attr("Transfers", uint256(m.transferCount).toString()), ",",
                    _attr("Wind Count", uint256(m.windCount).toString()), ",",
                    _attr("Build Revision", uint256(m.buildRevision).toString()), ",",
                    _attr("Burned Core", m.burnedCore ? "Yes" : "No"),
                "]",
            "}"
        );

        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(json)));
    }

    function _animationURL(uint256 tokenId) internal view returns (string memory) {
        return string(
            abi.encodePacked(
                rendererURL,
                "?tokenId=", tokenId.toString(),
                "&contract=", Strings.toHexString(uint256(uint160(address(this))), 20)
            )
        );
    }

    function _attr(string memory trait, string memory value) internal pure returns (string memory) {
        return string(abi.encodePacked("{\"trait_type\":\"", trait, "\",\"value\":\"", value, "\"}"));
    }

    // Track transfer count so the artwork can visibly react after ownership changes.
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721Upgradeable)
        returns (address)
    {
        address from = super._update(to, tokenId, auth);

        // Count normal transfers only, not mints or burns.
        if (from != address(0) && to != address(0)) {
            Machine storage m = _machines[tokenId];
            m.transferCount += 1;
            m.lastActionAt = uint64(block.timestamp);
            emit MetadataUpdate(tokenId);
        }

        return from;
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Upgradeable, ERC2981Upgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return interfaceId == _INTERFACE_ID_ERC4906 || super.supportsInterface(interfaceId);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}

    modifier onlyTokenOwner(uint256 tokenId) {
        require(ownerOf(tokenId) == msg.sender, "not token owner");
        _;
    }

    // Storage gap for future upgrades. Do not remove or reorder existing state variables.
    uint256[40] private __gap;
}
