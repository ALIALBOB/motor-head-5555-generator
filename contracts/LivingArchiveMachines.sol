// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/*
    LivingArchiveMachines.sol

    Fixed-trait PFP collection scaffold.

    The visual identity is assigned at mint/reveal and can be locked. The chain
    does not store local assembly-game progress. Instead, it stores only history
    that should affect the live animation: age, holder bond, transfers, verified
    sales, unlock flags, and global phase.
*/

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

contract LivingArchiveMachines is ERC721, AccessControl, Pausable, ReentrancyGuard {
    using Strings for uint256;

    uint256 public constant MAX_SUPPLY = 5555;

    bytes32 public constant CONFIG_ROLE = keccak256("CONFIG_ROLE");

    // ERC-4906 metadata update events/interface id.
    bytes4 private constant _INTERFACE_ID_ERC4906 = 0x49064906;
    event MetadataUpdate(uint256 _tokenId);
    event BatchMetadataUpdate(uint256 _fromTokenId, uint256 _toTokenId);

    struct FixedTraits {
        uint16 chassis;
        uint16 head;
        uint16 expression;
        uint16 clothes;
        uint16 hat;
        uint16 chestAccessory;
        uint16 armItem;
        uint16 background;
        uint16 core;
    }

    uint256 public mintPriceWei;
    uint256 public nextTokenId = 1;
    uint256 public totalMinted;
    bool public publicMintEnabled;
    bool public fixedTraitsLocked;
    uint8 public globalPhase;

    string private _baseTokenURI;
    string private _contractURIValue;

    mapping(uint256 => uint64) public mintedAt;
    mapping(uint256 => uint64) public birthBlock;
    mapping(uint256 => uint64) public ownerSince;
    mapping(uint256 => uint32) public transferCount;
    mapping(uint256 => uint128) public highestVerifiedSaleWei;
    mapping(uint256 => uint256) public unlockFlags;
    mapping(uint256 => FixedTraits) public fixedTraits;

    event MachineMinted(uint256 indexed tokenId, address indexed owner);
    event FixedTraitsSet(uint256 indexed tokenId, FixedTraits traits);
    event FixedTraitsLocked(uint256 indexed fromTokenId, uint256 indexed toTokenId);
    event VerifiedSaleRecorded(uint256 indexed tokenId, uint128 saleWei);
    event UnlockFlagSet(uint256 indexed tokenId, uint8 indexed flagIndex, bool enabled);
    event GlobalPhaseSet(uint8 indexed phase);
    event BaseURISet(string baseURI);
    event ContractURISet(string contractURI);

    constructor(
        address admin,
        string memory baseURI_,
        string memory contractURI_,
        uint256 mintPriceWei_
    ) ERC721("Motorheads", "MOTOR") {
        require(admin != address(0), "admin=0");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(CONFIG_ROLE, admin);
        _baseTokenURI = baseURI_;
        _contractURIValue = contractURI_;
        mintPriceWei = mintPriceWei_;
    }

    function mint(uint256 quantity) external payable nonReentrant whenNotPaused {
        require(publicMintEnabled, "public mint off");
        require(quantity > 0 && quantity <= 20, "bad quantity");
        require(totalMinted + quantity <= MAX_SUPPLY, "sold out");

        uint256 expected = mintPriceWei * quantity;
        require(msg.value >= expected, "underpaid");

        for (uint256 i = 0; i < quantity; i++) {
            _mintOne(msg.sender);
        }

        if (msg.value > expected) {
            (bool ok, ) = payable(msg.sender).call{value: msg.value - expected}("");
            require(ok, "refund failed");
        }
    }

    function adminMint(address to, uint256 quantity) external onlyRole(CONFIG_ROLE) {
        require(to != address(0), "to=0");
        require(quantity > 0, "quantity=0");
        require(totalMinted + quantity <= MAX_SUPPLY, "sold out");

        for (uint256 i = 0; i < quantity; i++) {
            _mintOne(to);
        }
    }

    function _mintOne(address to) internal {
        uint256 tokenId = nextTokenId++;
        totalMinted += 1;

        uint64 now64 = uint64(block.timestamp);
        mintedAt[tokenId] = now64;
        birthBlock[tokenId] = uint64(block.number);
        ownerSince[tokenId] = now64;
        fixedTraits[tokenId] = _defaultTraits(tokenId);

        _safeMint(to, tokenId);

        emit MachineMinted(tokenId, to);
        emit FixedTraitsSet(tokenId, fixedTraits[tokenId]);
        emit MetadataUpdate(tokenId);
    }

    function _defaultTraits(uint256 tokenId) internal pure returns (FixedTraits memory) {
        return FixedTraits({
            chassis: uint16(tokenId % 7),
            head: uint16(tokenId % 5),
            expression: uint16(tokenId % 4),
            clothes: uint16(tokenId % 3),
            hat: uint16(tokenId % 3),
            chestAccessory: uint16(tokenId % 3),
            armItem: uint16(tokenId % 2),
            background: uint16(tokenId % 2),
            core: uint16(tokenId % 3)
        });
    }

    function setFixedTraits(uint256 tokenId, FixedTraits calldata traits) external onlyRole(CONFIG_ROLE) {
        require(_ownerOf(tokenId) != address(0), "missing token");
        require(!fixedTraitsLocked, "traits locked");
        fixedTraits[tokenId] = traits;
        emit FixedTraitsSet(tokenId, traits);
        emit MetadataUpdate(tokenId);
    }

    function setFixedTraitsBatch(uint256[] calldata tokenIds, FixedTraits[] calldata traits) external onlyRole(CONFIG_ROLE) {
        require(tokenIds.length == traits.length, "length mismatch");
        require(!fixedTraitsLocked, "traits locked");
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(_ownerOf(tokenIds[i]) != address(0), "missing token");
            fixedTraits[tokenIds[i]] = traits[i];
            emit FixedTraitsSet(tokenIds[i], traits[i]);
            emit MetadataUpdate(tokenIds[i]);
        }
    }

    function lockFixedTraits() external onlyRole(CONFIG_ROLE) {
        fixedTraitsLocked = true;
        emit FixedTraitsLocked(1, totalMinted);
        if (totalMinted > 0) emit BatchMetadataUpdate(1, totalMinted);
    }

    function recordVerifiedSale(uint256 tokenId, uint128 saleWei) public onlyRole(CONFIG_ROLE) {
        require(_ownerOf(tokenId) != address(0), "missing token");
        if (saleWei <= highestVerifiedSaleWei[tokenId]) return;
        highestVerifiedSaleWei[tokenId] = saleWei;
        emit VerifiedSaleRecorded(tokenId, saleWei);
        emit MetadataUpdate(tokenId);
    }

    function batchRecordVerifiedSales(uint256[] calldata tokenIds, uint128[] calldata saleWeiValues)
        external
        onlyRole(CONFIG_ROLE)
    {
        require(tokenIds.length == saleWeiValues.length, "length mismatch");
        for (uint256 i = 0; i < tokenIds.length; i++) {
            recordVerifiedSale(tokenIds[i], saleWeiValues[i]);
        }
    }

    function setUnlockFlag(uint256 tokenId, uint8 flagIndex, bool enabled) external onlyRole(CONFIG_ROLE) {
        require(_ownerOf(tokenId) != address(0), "missing token");
        uint256 mask = uint256(1) << flagIndex;
        uint256 beforeFlags = unlockFlags[tokenId];
        if (enabled) {
            unlockFlags[tokenId] = beforeFlags | mask;
        } else {
            unlockFlags[tokenId] = beforeFlags & ~mask;
        }
        if (unlockFlags[tokenId] != beforeFlags) {
            emit UnlockFlagSet(tokenId, flagIndex, enabled);
            emit MetadataUpdate(tokenId);
        }
    }

    function setGlobalPhase(uint8 phase) external onlyRole(CONFIG_ROLE) {
        globalPhase = phase;
        emit GlobalPhaseSet(phase);
        if (totalMinted > 0) emit BatchMetadataUpdate(1, totalMinted);
    }

    function setPublicMintEnabled(bool enabled) external onlyRole(CONFIG_ROLE) {
        publicMintEnabled = enabled;
    }

    function setMintPrice(uint256 mintPriceWei_) external onlyRole(CONFIG_ROLE) {
        mintPriceWei = mintPriceWei_;
    }

    function setBaseURI(string calldata baseURI_) external onlyRole(CONFIG_ROLE) {
        _baseTokenURI = baseURI_;
        emit BaseURISet(baseURI_);
        if (totalMinted > 0) emit BatchMetadataUpdate(1, totalMinted);
    }

    function setContractURI(string calldata contractURI_) external onlyRole(CONFIG_ROLE) {
        _contractURIValue = contractURI_;
        emit ContractURISet(contractURI_);
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

    function archiveAgeSeconds(uint256 tokenId) external view returns (uint256) {
        require(_ownerOf(tokenId) != address(0), "missing token");
        return block.timestamp - mintedAt[tokenId];
    }

    function holderBondSeconds(uint256 tokenId) external view returns (uint256) {
        require(_ownerOf(tokenId) != address(0), "missing token");
        return block.timestamp - ownerSince[tokenId];
    }

    function contractURI() external view returns (string memory) {
        return _contractURIValue;
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "missing token");
        string memory base = _baseURI();
        return bytes(base).length > 0 ? string.concat(base, tokenId.toString(), ".json") : "";
    }

    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        uint64 oldMintedAt = mintedAt[tokenId];
        address from = super._update(to, tokenId, auth);

        if (from != address(0) && to != address(0)) {
            transferCount[tokenId] += 1;
            ownerSince[tokenId] = uint64(block.timestamp);
            require(mintedAt[tokenId] == oldMintedAt, "mint time changed");
            emit MetadataUpdate(tokenId);
        }

        return from;
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return interfaceId == _INTERFACE_ID_ERC4906 || super.supportsInterface(interfaceId);
    }
}
