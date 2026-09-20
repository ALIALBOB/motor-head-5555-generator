// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/*
    FoundryRewardPool — the ETH reward pool of the MotorHeads Foundry.

    The founder FUNDS it by sending ETH to this address (a plain transfer). A reward ROUND reserves part of that ETH and
    commits to a Merkle root over (roundId, tokenId, amount) leaves: the backend takes a snapshot of every activated
    robot's weight (tier, 333 Archives, parts) and splits the round's pot by weight, so a robot's amount is fixed the
    moment the round opens. Whoever OWNS the robot when it is claimed receives its amount — an unclaimed share travels
    with the NFT.

    The owner keeps control of the money, in the open:
      - withdraw()   takes out anything NOT reserved by an open round;
      - closeRound() ends a round and frees whatever was not claimed, which can then be withdrawn.
    So the owner can always get every wei back (close, then withdraw), and every step is an event on chain.

    Safety properties this contract enforces on its own, whatever root it is given:
      - a round can never pay out more than the total it was opened with;
      - open rounds can never reserve more than the contract holds;
      - a (round, robot) pair is paid at most once;
      - nothing is paid for a robot the caller does not own at that moment.

    Leaf encoding = OpenZeppelin StandardMerkleTree (`@openzeppelin/merkle-tree`):
        leaf = keccak256(bytes.concat(keccak256(abi.encode(roundId, tokenId, amount))))
    built with StandardMerkleTree.of(rows, ["uint256","uint256","uint256"]).
*/

import {Ownable, Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

interface IRobotOwner {
    function ownerOf(uint256 tokenId) external view returns (address);
}

contract FoundryRewardPool is Ownable2Step, ReentrancyGuard {
    struct Round {
        bytes32 root;    // Merkle root over (roundId, tokenId, amount)
        uint128 total;   // ETH reserved for this round when it was opened
        uint128 claimed; // ETH paid out so far
        bool open;       // false once closed: no more claims
    }

    IRobotOwner public immutable robots; // the MotorHeads ERC-721: claims are paid to the robot's current owner
    Round[] private _rounds;             // round id = index + 1 (0 is never a round)
    uint256 public reserved;             // ETH owed to open rounds and not claimed yet

    // roundId => (tokenId / 256) => bitmap of claimed robots
    mapping(uint256 => mapping(uint256 => uint256)) private _claimedBits;

    event Funded(address indexed from, uint256 amount);
    event RoundOpened(uint256 indexed roundId, bytes32 root, uint256 total);
    event RoundClosed(uint256 indexed roundId, uint256 unclaimed);
    event Claimed(uint256 indexed roundId, address indexed account, uint256 robots, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);

    constructor(address robots_, address owner_) Ownable(owner_) {
        require(robots_ != address(0), "robots=0");
        robots = IRobotOwner(robots_);
    }

    // ------------------------------------------------------------------ funding

    receive() external payable {
        emit Funded(msg.sender, msg.value);
    }

    /// ETH in the pool that no open round has a claim on: what a new round can use and what the owner can withdraw.
    function available() public view returns (uint256) {
        return address(this).balance - reserved;
    }

    // ------------------------------------------------------------------ owner

    /// Open a round of `total` wei over `root`. The ETH must already be in the pool and not reserved by another round.
    /// `expectedRoundId` is the id the leaves were built with (roundCount() + 1): a tree built for another id is refused.
    function openRound(bytes32 root, uint256 total, uint256 expectedRoundId) external onlyOwner returns (uint256 roundId) {
        require(expectedRoundId == _rounds.length + 1, "wrong round id");
        require(root != bytes32(0), "root=0");
        require(total > 0 && total <= type(uint128).max, "bad total");
        require(total <= available(), "pool not funded");
        _rounds.push(Round({root: root, total: uint128(total), claimed: 0, open: true}));
        roundId = _rounds.length;
        reserved += total;
        emit RoundOpened(roundId, root, total);
    }

    /// End a round: no more claims, and whatever was not claimed is no longer reserved (it can be withdrawn or reused).
    function closeRound(uint256 roundId) external onlyOwner {
        Round storage r = _round(roundId);
        require(r.open, "round closed");
        r.open = false;
        uint256 unclaimed = uint256(r.total) - uint256(r.claimed);
        reserved -= unclaimed;
        emit RoundClosed(roundId, unclaimed);
    }

    /// Take ETH that is not reserved by an open round back out of the pool.
    function withdraw(address payable to, uint256 amount) external onlyOwner nonReentrant {
        require(to != address(0), "to=0");
        require(amount > 0 && amount <= available(), "exceeds available");
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "transfer failed");
        emit Withdrawn(to, amount);
    }

    // ------------------------------------------------------------------ claims

    /// Claim the shares of several robots of one round in a single transaction. The caller must own every robot.
    function claim(uint256 roundId, uint256[] calldata tokenIds, uint256[] calldata amounts, bytes32[][] calldata proofs)
        external
        nonReentrant
    {
        uint256 n = tokenIds.length;
        require(n > 0 && n == amounts.length && n == proofs.length, "bad arrays");
        Round storage r = _round(roundId);
        require(r.open, "round closed");

        uint256 sum = 0;
        for (uint256 i = 0; i < n; i++) {
            uint256 tokenId = tokenIds[i];
            require(robots.ownerOf(tokenId) == msg.sender, "not the owner");
            require(!_isClaimed(roundId, tokenId), "already claimed");
            bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(roundId, tokenId, amounts[i]))));
            require(MerkleProof.verifyCalldata(proofs[i], r.root, leaf), "bad proof");
            _setClaimed(roundId, tokenId);
            sum += amounts[i];
        }

        uint256 claimedAfter = uint256(r.claimed) + sum;
        require(claimedAfter <= r.total, "round exhausted"); // a round never pays more than it was opened with
        r.claimed = uint128(claimedAfter);
        reserved -= sum;

        (bool ok, ) = payable(msg.sender).call{value: sum}("");
        require(ok, "transfer failed");
        emit Claimed(roundId, msg.sender, n, sum);
    }

    // ------------------------------------------------------------------ views

    function roundCount() external view returns (uint256) {
        return _rounds.length;
    }

    function roundInfo(uint256 roundId) external view returns (bytes32 root, uint256 total, uint256 claimed, bool open) {
        Round storage r = _round(roundId);
        return (r.root, r.total, r.claimed, r.open);
    }

    function isClaimed(uint256 roundId, uint256 tokenId) external view returns (bool) {
        return _isClaimed(roundId, tokenId);
    }

    // ------------------------------------------------------------------ internals

    function _round(uint256 roundId) private view returns (Round storage) {
        require(roundId > 0 && roundId <= _rounds.length, "no such round");
        return _rounds[roundId - 1];
    }

    function _isClaimed(uint256 roundId, uint256 tokenId) private view returns (bool) {
        return (_claimedBits[roundId][tokenId >> 8] >> (tokenId & 0xff)) & 1 == 1;
    }

    function _setClaimed(uint256 roundId, uint256 tokenId) private {
        _claimedBits[roundId][tokenId >> 8] |= (uint256(1) << (tokenId & 0xff));
    }
}
