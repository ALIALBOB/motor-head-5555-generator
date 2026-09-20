// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC2981} from "@openzeppelin/contracts/token/common/ERC2981.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/// @title RobotNFT (MH3D) — the forged 3D MotorHeads on Robinhood Chain.
/// @notice Paid mint. 2D holders get a guaranteed allowlist spot (Merkle = GTD snapshot); public mint for the rest.
///         Dynamic metadata via a renderer worker (baseURI + tokenId). 10% enforced-intent royalty via ERC2981.
/// @dev Milestone 1 scope: mint + allowlist + royalty + dynamic URI. 6551 account + weight live in later milestones.
contract RobotNFT is ERC721, ERC2981, Ownable, Pausable {
    using Strings for uint256;

    uint256 public immutable maxSupply;
    uint256 public totalMinted;
    uint256 public mintPrice;         // wei (ETH gas token)
    bytes32 public allowlistRoot;     // GTD snapshot of 2D holders
    bool public publicOpen;
    string public baseURI;            // renderer worker, e.g. https://mh3d.worker/meta/
    mapping(address => bool) public allowlistMinted; // 1 per wallet on the allowlist

    event Minted(address indexed to, uint256 indexed tokenId);
    event PublicOpenSet(bool open);
    event AllowlistRootSet(bytes32 root);

    constructor(
        uint256 _maxSupply,
        uint256 _mintPrice,
        address royaltyReceiver,
        uint96 royaltyBps,          // 1000 = 10%
        address initialOwner
    ) ERC721("MotorHeads 3D", "MH3D") Ownable(initialOwner) {
        require(_maxSupply > 0, "supply=0");
        maxSupply = _maxSupply;
        mintPrice = _mintPrice;
        _setDefaultRoyalty(royaltyReceiver, royaltyBps);
    }

    // ---- mint ----
    function allowlistMint(bytes32[] calldata proof) external payable whenNotPaused {
        require(msg.value >= mintPrice, "insufficient fee");
        require(!allowlistMinted[msg.sender], "already claimed");
        // StandardMerkleTree(["address"]) leaf format — matches @openzeppelin/merkle-tree used across the repo
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(msg.sender))));
        require(MerkleProof.verify(proof, allowlistRoot, leaf), "not allowlisted");
        allowlistMinted[msg.sender] = true;
        _mintOne(msg.sender);
    }

    function publicMint() external payable whenNotPaused {
        require(publicOpen, "public closed");
        require(msg.value >= mintPrice, "insufficient fee");
        _mintOne(msg.sender);
    }

    function _mintOne(address to) internal {
        require(totalMinted < maxSupply, "sold out");
        uint256 id = ++totalMinted; // 1-indexed
        _safeMint(to, id);
        emit Minted(to, id);
    }

    /// @notice Owner-only reserve/test mint. Bypasses publicOpen + mintPrice (no ETH charged) but still
    ///         respects maxSupply and the pause switch. Lets the team seed reserve/marketplace-test tokens
    ///         WITHOUT opening the public sale. Mints `qty` sequential ids to `to`.
    function ownerMint(address to, uint256 qty) external onlyOwner whenNotPaused {
        require(to != address(0), "to=0");
        require(qty > 0, "qty=0");
        for (uint256 i = 0; i < qty; i++) _mintOne(to);
    }

    // ---- admin ----
    function setPublicOpen(bool v) external onlyOwner { publicOpen = v; emit PublicOpenSet(v); }
    function setAllowlistRoot(bytes32 r) external onlyOwner { allowlistRoot = r; emit AllowlistRootSet(r); }
    function setMintPrice(uint256 p) external onlyOwner { mintPrice = p; }
    function setBaseURI(string calldata u) external onlyOwner { baseURI = u; }
    function setRoyalty(address r, uint96 bps) external onlyOwner { _setDefaultRoyalty(r, bps); }
    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
    function withdraw(address to) external onlyOwner {
        (bool ok, ) = to.call{value: address(this).balance}("");
        require(ok, "withdraw failed");
    }

    // ---- metadata ----
    function tokenURI(uint256 id) public view override returns (string memory) {
        require(_ownerOf(id) != address(0), "nonexistent");
        return bytes(baseURI).length > 0 ? string.concat(baseURI, id.toString()) : "";
    }

    function supportsInterface(bytes4 iid) public view override(ERC721, ERC2981) returns (bool) {
        return super.supportsInterface(iid);
    }
}
