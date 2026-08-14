// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";
import {ERC1155Holder} from "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";

/// Minimal VRF v2.5 coordinator mock — matches the requestRandomWords selector the consumer calls,
/// records the caller as the consumer, and lets a test fulfil with EXACT random words. The consumer
/// under test still uses the real Chainlink VRFConsumerBaseV2Plus + VRFV2PlusClient, so the request
/// encoding + rawFulfillRandomWords msg.sender gate are exercised for real.
contract MockVRFCoordinator {
    uint256 public nextRequestId = 1;
    mapping(uint256 => address) public consumerOf;

    event RandomWordsRequested(uint256 indexed requestId, address indexed sender, uint32 numWords);

    function requestRandomWords(VRFV2PlusClient.RandomWordsRequest calldata req)
        external
        returns (uint256 requestId)
    {
        requestId = nextRequestId++;
        consumerOf[requestId] = msg.sender;
        emit RandomWordsRequested(requestId, msg.sender, req.numWords);
    }

    /// Deliver `words` to the consumer for `requestId` (as the coordinator, so the gate passes).
    function fulfill(uint256 requestId, uint256[] calldata words) external {
        IRawFulfill(consumerOf[requestId]).rawFulfillRandomWords(requestId, words);
    }
}

interface IRawFulfill {
    function rawFulfillRandomWords(uint256 requestId, uint256[] memory randomWords) external;
}

/// Test-only ERC-6551 registry: deterministic EOA-like garage per token (no code -> ERC-1155 mint
/// succeeds without the receiver check — the counterfactual case that dominates at launch).
contract Mock6551Registry {
    function account(
        address implementation,
        bytes32 salt,
        uint256 chainId,
        address tokenContract,
        uint256 tokenId
    ) external pure returns (address) {
        return address(uint160(uint256(keccak256(abi.encode(implementation, salt, chainId, tokenContract, tokenId)))));
    }
}

/// A DEPLOYED garage that accepts ERC-1155 (to exercise the receiver-callback path).
contract MockGarageAccount is ERC1155Holder {}

/// A registry that always returns a single fixed (deployed) garage.
contract Fixed6551Registry {
    address public immutable fixedAccount;
    constructor(address fixedAccount_) {
        fixedAccount = fixedAccount_;
    }
    function account(address, bytes32, uint256, address, uint256) external view returns (address) {
        return fixedAccount;
    }
}

/// VRF coordinator that forwards a BOUNDED gas budget to the callback — simulates the real DON only
/// giving the consumer `callbackGasLimit` gas, so the failure-safe catch can be tested under pressure.
contract GasCappedVRFCoordinator {
    uint256 public nextRequestId = 1;
    mapping(uint256 => address) public consumerOf;

    function requestRandomWords(VRFV2PlusClient.RandomWordsRequest calldata) external returns (uint256 requestId) {
        requestId = nextRequestId++;
        consumerOf[requestId] = msg.sender;
    }

    function fulfillCapped(uint256 requestId, uint256[] calldata words, uint256 gasBudget) external {
        IRawFulfill(consumerOf[requestId]).rawFulfillRandomWords{gas: gasBudget}(requestId, words);
    }
}

/// A DEPLOYED garage whose ERC-1155 receiver burns far more gas than the bounded callback mint budget,
/// forcing the in-callback mint to run out of gas — exercises the failure-safe catch (must record a
/// redeemable claim, never lose the crate).
contract GasHeavyRejectGarage {
    uint256[] private junk;

    function onERC1155Received(address, address, uint256, uint256, bytes calldata) external returns (bytes4) {
        for (uint256 i = 0; i < 60; i++) {
            junk.push(i); // ~60 cold SSTOREs — well past the bounded mint gas, so the mint OOGs
        }
        return 0xf23a6e61;
    }
}

/// VRF coordinator whose requestRandomWords reverts — proves openCrate does NOT burn the crate on a VRF failure.
contract RevertingVRFCoordinator {
    function requestRandomWords(VRFV2PlusClient.RandomWordsRequest calldata) external pure returns (uint256) {
        revert("vrf down");
    }
}

interface IActivate {
    function activate(uint256 tokenId) external payable;
}

/// Owns a machine but rejects ETH (no receive/fallback) — makes the activation overpay refund fail.
contract RejectEthOwner {
    function doActivate(address crates, uint256 tokenId) external payable {
        IActivate(crates).activate{value: msg.value}(tokenId);
    }
}

/// Owns a machine and re-enters activate() on receiving its overpay refund — proves it can't re-activate.
contract ReentrantActivator {
    address public cratesAddr;
    uint256 public tokenId;
    function doActivate(address c, uint256 t) external payable {
        cratesAddr = c;
        tokenId = t;
        IActivate(c).activate{value: msg.value}(t);
    }
    receive() external payable {
        try IActivate(cratesAddr).activate{value: 0}(tokenId) {} catch {}
    }
}

interface IRewardVaultClaim {
    function claim(uint256 tokenId, bool toGarage) external returns (uint256);
}

/// Owns a machine and tries to re-enter RewardVault.claim on receiving ETH — proves nonReentrant holds.
contract ReentrantClaimer {
    IRewardVaultClaim public immutable vault;
    uint256 public tokenId;
    bool public reenteredOk;

    constructor(address vault_) {
        vault = IRewardVaultClaim(vault_);
    }
    function setToken(uint256 t) external {
        tokenId = t;
    }
    function claim() external {
        vault.claim(tokenId, false);
    }
    receive() external payable {
        try vault.claim(tokenId, false) {
            reenteredOk = true;
        } catch {}
    }
}
