// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/*
    RewardVault.sol — ETH rewards for MotorHeads, claimable per-NFT.

    ETH sent to this contract (activation fees, crate-sale revenue, royalties, or a top-up) is split
    EQUALLY across the collection's `totalTokens` machines. Each machine accrues its share; the
    current owner pulls it whenever they like:

        claim(tokenId, toGarage)      -> owner pulls that machine's ETH to their wallet or its garage
        claimMany(tokenIds[], toGarage) -> batch for holders with many machines

    Pull-based, transfer-safe (rewards follow the token; only the current owner can claim), and
    sub-wei remainders are carried forward, not lost.

    INVARIANT (deploy-time): `totalTokens` MUST equal the collection's FINAL, non-growing, non-burnable
    supply. claim() gates on collection.ownerOf(tokenId) (which reverts for non-existent ids), so the
    set of claimants is bounded by the minted supply; as long as that supply <= totalTokens the vault is
    provably solvent. Setting totalTokens too LOW would over-promise and brick late claimers — the deploy
    script sets it to the exact fixed supply. Immutable, so choose correctly.

    Only un-accounted ETH (force-fed via selfdestruct/coinbase — never through deposit()) can be swept,
    via rescueSurplus; holder-owed balances are never touched.

    NOTE: distributing ETH revenue to holders can resemble a dividend/security — get counsel before
    mainnet. Audit + tests required (custodies + disburses ETH).
*/

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IERC6551Registry {
    function account(address implementation, bytes32 salt, uint256 chainId, address tokenContract, uint256 tokenId)
        external
        view
        returns (address);
}

contract RewardVault is AccessControl, ReentrancyGuard {
    bytes32 public constant CONFIG_ROLE = keccak256("CONFIG_ROLE");
    uint256 private constant ACC = 1e18; // fixed-point scale for accPerToken

    IERC721 public immutable collection;
    uint256 public immutable totalTokens; // the collection's fixed, non-growable supply

    // ERC-6551 garage derivation — canonical constants (immutable: cannot be repointed to steal claims)
    IERC6551Registry public immutable registry;
    address public immutable accountImplementation;
    bytes32 public immutable accountSalt;

    uint256 public accPerToken; // scaled by ACC: cumulative ETH accrued per machine
    mapping(uint256 => uint256) public rewardDebt; // scaled: accPerToken already accounted per machine
    uint256 public totalDeposited;
    uint256 public totalClaimed;

    event Deposited(address indexed from, uint256 amount, uint256 accPerToken);
    event Claimed(uint256 indexed tokenId, address indexed to, uint256 amount);
    event SurplusRescued(address indexed to, uint256 amount);

    constructor(
        address admin,
        address collection_,
        uint256 totalTokens_,
        address registry_,
        address accountImplementation_,
        bytes32 accountSalt_
    ) {
        require(admin != address(0) && collection_ != address(0) && registry_ != address(0), "zero addr");
        require(accountImplementation_ != address(0), "impl=0");
        require(totalTokens_ > 0, "supply=0");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(CONFIG_ROLE, admin);
        collection = IERC721(collection_);
        totalTokens = totalTokens_;
        registry = IERC6551Registry(registry_);
        accountImplementation = accountImplementation_;
        accountSalt = accountSalt_;
    }

    // -------------------------------------------------------------------- Fund

    receive() external payable {
        _accrue(msg.value);
    }

    /// Explicit funding entrypoint (same effect as sending ETH directly).
    function deposit() external payable {
        _accrue(msg.value);
    }

    function _accrue(uint256 amount) internal {
        if (amount == 0) return;
        accPerToken += (amount * ACC) / totalTokens; // sub-wei remainder stays in the contract
        totalDeposited += amount;
        emit Deposited(msg.sender, amount, accPerToken);
    }

    // -------------------------------------------------------------------- Claim

    function garageOf(uint256 tokenId) public view returns (address) {
        return registry.account(accountImplementation, accountSalt, block.chainid, address(collection), tokenId);
    }

    /// ETH currently claimable by `tokenId`.
    function claimable(uint256 tokenId) public view returns (uint256) {
        return (accPerToken - rewardDebt[tokenId]) / ACC;
    }

    /// Claim `tokenId`'s accrued ETH — to the caller, or into the machine's garage.
    function claim(uint256 tokenId, bool toGarage) public nonReentrant returns (uint256 amount) {
        require(collection.ownerOf(tokenId) == msg.sender, "not owner");
        amount = (accPerToken - rewardDebt[tokenId]) / ACC;
        require(amount > 0, "nothing to claim");
        rewardDebt[tokenId] += amount * ACC; // carry sub-wei remainder forward
        totalClaimed += amount;
        address to = toGarage ? garageOf(tokenId) : msg.sender;
        (bool ok, ) = payable(to).call{value: amount}("");
        require(ok, "send failed");
        emit Claimed(tokenId, to, amount);
    }

    /// Batch-claim many machines (e.g. a whale with 100). All must be owned by the caller.
    function claimMany(uint256[] calldata tokenIds, bool toGarage) external nonReentrant returns (uint256 total) {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            require(collection.ownerOf(tokenId) == msg.sender, "not owner");
            uint256 amount = (accPerToken - rewardDebt[tokenId]) / ACC;
            if (amount == 0) continue;
            rewardDebt[tokenId] += amount * ACC;
            total += amount;
            address to = toGarage ? garageOf(tokenId) : msg.sender;
            (bool ok, ) = payable(to).call{value: amount}("");
            require(ok, "send failed");
            emit Claimed(tokenId, to, amount);
        }
        totalClaimed += total;
    }

    // -------------------------------------------------------------------- Admin

    /// Sweep ONLY un-accounted ETH (force-fed via selfdestruct/coinbase, never counted in totalDeposited).
    /// Holder-owed balances (totalDeposited - totalClaimed) are never touched.
    function rescueSurplus(address to) external onlyRole(CONFIG_ROLE) nonReentrant {
        require(to != address(0), "to=0");
        uint256 owed = totalDeposited - totalClaimed;
        uint256 bal = address(this).balance;
        uint256 surplus = bal > owed ? bal - owed : 0;
        require(surplus > 0, "no surplus");
        (bool ok, ) = payable(to).call{value: surplus}("");
        require(ok, "send failed");
        emit SurplusRescued(to, surplus);
    }
}
