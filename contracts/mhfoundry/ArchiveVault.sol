// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

/// @title ArchiveVault — ETHEREUM escrow that LOCKS a 333 while it's attached to a Robinhood robot.
/// @notice Founder rule: a holder must NOT be able to sell a 333 while it powers a robot. Since the 333 is on
///         Ethereum and the robot is on Robinhood, the only way to enforce that is to hold the 333 here:
///           • deposit(id)  — pulls the 333 in (needs approval). While it's here the holder CANNOT sell it. The
///                            backend sees Deposited and signs the Robinhood attach voucher.
///           • withdraw(id) — returns it, but ONLY with a backend voucher issued AFTER the 333 is DETACHED on
///                            Robinhood — so a robot can never keep earning for a 333 that has left the vault.
/// @dev The `signer` is the same backend attestor that watches Robinhood. Anti-replay via nonces. adminReturn is a
///      last-resort escape (e.g. signer key lost) so a deposit can never be permanently stuck.
contract ArchiveVault is AccessControl, EIP712, IERC721Receiver {
    IERC721 public immutable archive; // the 333 Archive collection
    address public signer;

    mapping(uint256 => address) public depositorOf; // archiveId => who locked it (address(0) = not escrowed)
    mapping(bytes32 => bool) public usedNonce;

    bytes32 private constant WITHDRAW_TYPEHASH =
        keccak256("Withdraw(address depositor,uint256 archiveId,bytes32 nonce,uint256 deadline)");

    event Deposited(address indexed depositor, uint256 indexed archiveId);
    event Withdrawn(address indexed depositor, uint256 indexed archiveId);
    event SignerSet(address signer);

    constructor(address admin, address signer_, address archive_) EIP712("MHArchiveVault", "1") {
        require(admin != address(0) && signer_ != address(0) && archive_ != address(0), "zero");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        signer = signer_;
        archive = IERC721(archive_);
    }

    function setSigner(address s) external onlyRole(DEFAULT_ADMIN_ROLE) { require(s != address(0), "zero"); signer = s; emit SignerSet(s); }

    /// Lock a 333 (needs prior approval / setApprovalForAll to this vault). After this the holder cannot sell it.
    function deposit(uint256 archiveId) external {
        require(depositorOf[archiveId] == address(0), "already escrowed");
        archive.transferFrom(msg.sender, address(this), archiveId); // reverts unless msg.sender owns/approved it
        depositorOf[archiveId] = msg.sender;
        emit Deposited(msg.sender, archiveId);
    }

    /// Retrieve a 333 — only the original depositor, and only with a backend voucher (signed AFTER it's detached on Robinhood).
    function withdraw(uint256 archiveId, bytes32 nonce, uint256 deadline, bytes calldata sig) external {
        require(block.timestamp <= deadline, "expired");
        require(depositorOf[archiveId] == msg.sender, "not your deposit");
        require(!usedNonce[nonce], "nonce used"); usedNonce[nonce] = true;
        bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(WITHDRAW_TYPEHASH, msg.sender, archiveId, nonce, deadline)));
        require(ECDSA.recover(digest, sig) == signer, "bad sig");
        depositorOf[archiveId] = address(0);
        archive.safeTransferFrom(address(this), msg.sender, archiveId);
        emit Withdrawn(msg.sender, archiveId);
    }

    /// Last-resort admin escape (e.g. the signer key is lost): return a stuck deposit to its depositor. No new destination.
    function adminReturn(uint256 archiveId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        address d = depositorOf[archiveId];
        require(d != address(0), "not escrowed");
        depositorOf[archiveId] = address(0);
        archive.safeTransferFrom(address(this), d, archiveId);
        emit Withdrawn(d, archiveId);
    }

    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return this.onERC721Received.selector;
    }
}
