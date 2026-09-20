// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// test doubles for FoundryForge

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

/// ScrapParts reduced to what the forge uses: an ERC-1155 anyone may mint (the real one gates it by MINTER_ROLE)
contract ForgeParts is ERC1155 {
    constructor() ERC1155("") {}
    function mint(address to, uint256 id, uint256 amount) external { _mint(to, id, amount, ""); }
    // the real garage approves through its own ERC-6551 execute(); the test needs the same effect without one
    function setApprovalForAllFrom(address garage, address operator, bool ok) external { _setApprovalForAll(garage, operator, ok); }
}

/// a stand-in ERC-6551 registry + account, enough to prove the forge brings a garage to life
contract ForgeAccount {
    address public impl;
    bool public inited;
    function initialize(address i) external { require(!inited, "already"); inited = true; impl = i; }
    function onERC1155Received(address, address, uint256, uint256, bytes calldata) external pure returns (bytes4) { return 0xf23a6e61; }
}

contract ForgeRegistry {
    mapping(address => bool) public made;
    address public lastImplementation;
    function createAccount(address implementation, bytes32, uint256, address, uint256) external returns (address) {
        lastImplementation = implementation;
        return address(0);   // the forge uses the address it already derived; this only records the call
    }
}

/// ScrapCrates reduced to garageOf() + activated(), both settable by the test
contract ForgeCrates {
    mapping(uint256 => bool) public activated;
    mapping(uint256 => address) private _garage;
    address public registry;
    address public accountImplementation;
    bytes32 public accountSalt;
    function setDerivation(address r, address impl, bytes32 salt) external { registry = r; accountImplementation = impl; accountSalt = salt; }
    function setActivated(uint256 tokenId, bool on) external { activated[tokenId] = on; }
    function setGarage(uint256 tokenId, address g) external { _garage[tokenId] = g; }
    function garageOf(uint256 tokenId) external view returns (address) {
        address g = _garage[tokenId];
        return g == address(0) ? address(uint160(uint256(keccak256(abi.encode("garage", tokenId))))) : g;
    }
}

/// a Chainlink ETH/USD feed the test can move, break or stale
contract ForgeFeed {
    int256 public answer = 2500e8;
    uint256 public updatedAt = block.timestamp;
    bool public reverts;
    function set(int256 a, uint256 t) external { answer = a; updatedAt = t; }
    function setReverts(bool r) external { reverts = r; }
    function latestRoundData() external view returns (uint80, int256, uint256, uint256, uint80) {
        require(!reverts, "feed down");
        return (1, answer, updatedAt, updatedAt, 1);
    }
}

/// a treasury that refuses ETH, to prove a payment cannot half-succeed
contract RejectingTreasury {
    receive() external payable { revert("no thanks"); }
}

interface IForge {
    function upgrade(uint256 tokenId) external payable;
}

/// owns a robot and tries to upgrade AGAIN from inside the refund of its first upgrade
contract ReentrantForgeBuyer {
    IForge public forge;
    uint256 public tokenId;
    bool public tried;
    bool public reentered;
    function arm(address forge_, uint256 tokenId_) external { forge = IForge(forge_); tokenId = tokenId_; }
    // only an ARMED contract strikes back, so merely funding it does not count as re-entering
    function go(uint256 value) external { forge.upgrade{value: value}(tokenId); }
    receive() external payable {
        if (address(forge) != address(0) && !tried) { tried = true; try forge.upgrade{value: 0.05 ether}(tokenId) { reentered = true; } catch { reentered = false; } }
    }
}
