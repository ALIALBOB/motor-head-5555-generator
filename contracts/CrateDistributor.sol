// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/*
    CrateDistributor — a Merkle-claim airdrop for ScrapCrates.

    Holders CLAIM their own crates (they pay their own gas), so distributing to all 5,555 costs the
    founder a single setRoot tx instead of thousands of mints. This contract holds ScrapCrates.MINTER_ROLE
    and mints the amount proven by each holder's Merkle leaf, once per round.

    Leaf encoding matches OpenZeppelin's StandardMerkleTree (JS `@openzeppelin/merkle-tree`):
        leaf = keccak256(bytes.concat(keccak256(abi.encode(account, amount))))
    Building the tree with `StandardMerkleTree.of(rows, ["address","uint256"])` yields proofs that verify here.

    Rounds: bump the round (startNewRound) to run a fresh airdrop without touching prior claim records.
*/

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

interface IScrapCrates {
    function mintCrates(address to, uint256 crateId, uint256 amount) external;
}

contract CrateDistributor is AccessControl, Pausable {
    bytes32 public constant CONFIG_ROLE = keccak256("CONFIG_ROLE");

    IScrapCrates public immutable crates; // the ScrapCrates contract (this must hold its MINTER_ROLE)
    uint256 public crateId;               // which crate tier to mint on claim
    bytes32 public merkleRoot;            // root over (address, amount) leaves for the current round
    uint256 public round;                 // bump to start a fresh airdrop; claim records are per-round

    // round => account => already claimed this round
    mapping(uint256 => mapping(address => bool)) public claimed;

    event Claimed(address indexed account, uint256 amount, uint256 indexed round);
    event RootSet(bytes32 indexed root, uint256 indexed round);
    event CrateIdSet(uint256 crateId);

    constructor(address crates_, uint256 crateId_, address admin) {
        require(crates_ != address(0) && admin != address(0), "zero addr");
        crates = IScrapCrates(crates_);
        crateId = crateId_;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(CONFIG_ROLE, admin);
    }

    /// Holder claims `amount` crates for the current round by proving membership in `merkleRoot`.
    function claim(uint256 amount, bytes32[] calldata proof) external whenNotPaused {
        require(merkleRoot != bytes32(0), "no root");
        require(amount > 0, "zero amount");
        require(!claimed[round][msg.sender], "already claimed");
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(msg.sender, amount))));
        require(MerkleProof.verifyCalldata(proof, merkleRoot, leaf), "bad proof");
        claimed[round][msg.sender] = true;
        crates.mintCrates(msg.sender, crateId, amount);
        emit Claimed(msg.sender, amount, round);
    }

    /// True if `account` can still claim `amount` this round (unclaimed + proof valid).
    function canClaim(address account, uint256 amount, bytes32[] calldata proof) external view returns (bool) {
        if (merkleRoot == bytes32(0) || amount == 0 || claimed[round][account]) return false;
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(account, amount))));
        return MerkleProof.verifyCalldata(proof, merkleRoot, leaf);
    }

    // --- admin (CONFIG_ROLE = founder) ---

    /// Set/replace the current round's root (e.g. to fix a snapshot before anyone claims).
    function setMerkleRoot(bytes32 root) external onlyRole(CONFIG_ROLE) {
        merkleRoot = root;
        emit RootSet(root, round);
    }

    /// Start a fresh airdrop round with a new root; prior-round claim records are preserved but no longer block.
    function startNewRound(bytes32 root) external onlyRole(CONFIG_ROLE) {
        round += 1;
        merkleRoot = root;
        emit RootSet(root, round);
    }

    function setCrateId(uint256 id) external onlyRole(CONFIG_ROLE) {
        crateId = id;
        emit CrateIdSet(id);
    }

    function pause() external onlyRole(CONFIG_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(CONFIG_ROLE) {
        _unpause();
    }
}
