// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/*
    ScrapParts.sol — the collectible PARTS holders win from Scrap Crates.

    A standard ERC-1155: each token id is a distinct MotorHeads part (id meaning lives off-chain,
    append-only, exactly like MotorHeadsParts' catalog ids). Parts are held by a machine's ERC-6551
    "garage" (its token-bound account) — but they're normal ERC-1155s, so they can be withdrawn,
    traded, fused, or equipped like any token.

    Only addresses granted MINTER_ROLE (i.e. the ScrapCrates contract) can mint. Metadata is an
    off-chain URI with the standard {id} substitution; the image is rendered from the same drawPart
    engine the site already uses.

    NOTE: audit + full test coverage before mainnet — this mints value.
*/

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

contract ScrapParts is ERC1155, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant CONFIG_ROLE = keccak256("CONFIG_ROLE");

    string public name = "MotorHeads Scrap Parts";
    string public symbol = "MHPART";

    event URISet(string uri);

    /// @param admin   receives DEFAULT_ADMIN_ROLE + CONFIG_ROLE
    /// @param baseURI ERC-1155 metadata URI, e.g. "https://.../parts/{id}.json"
    constructor(address admin, string memory baseURI) ERC1155(baseURI) {
        require(admin != address(0), "admin=0");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(CONFIG_ROLE, admin);
    }

    // ------------------------------------------------------------------ Mint (crate contract)

    /// Mint `amount` of part `id` to `to` (a machine's garage, a wallet, anywhere).
    function mint(address to, uint256 id, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, id, amount, "");
    }

    /// Batch mint — one crate can drop several parts at once.
    function mintBatch(address to, uint256[] calldata ids, uint256[] calldata amounts)
        external
        onlyRole(MINTER_ROLE)
    {
        _mintBatch(to, ids, amounts, "");
    }

    // ------------------------------------------------------------------ Sinks (crafting/upgrades)

    /// Burn parts you own (fuse/upgrade). The token owner or an approved operator can burn.
    function burn(address from, uint256 id, uint256 amount) external {
        require(from == msg.sender || isApprovedForAll(from, msg.sender), "not approved");
        _burn(from, id, amount);
    }

    function burnBatch(address from, uint256[] calldata ids, uint256[] calldata amounts) external {
        require(from == msg.sender || isApprovedForAll(from, msg.sender), "not approved");
        _burnBatch(from, ids, amounts);
    }

    // ------------------------------------------------------------------ Admin

    function setURI(string calldata newuri) external onlyRole(CONFIG_ROLE) {
        _setURI(newuri);
        emit URISet(newuri);
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
