// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title MHToken ($TOKEN) — the MotorHeads Foundry utility/spend currency.
/// @notice Standard ERC-20, **no transfer tax** (Uniswap-friendly, StonkBrokers model).
///         Fixed supply minted once at deploy. Real launch is via Uniswap Pools.trade
///         bonding curve on Robinhood Chain; this contract is the plain token behind it
///         (and what we deploy on local/testnet). Burnable so the fee contracts (UpgradeManager,
///         CustomizeManager) can burn the ~50% of spend that's deflationary.
/// @dev It is what you BUY to play — never paid out as a reward (rewards are ETH). See FOUNDRY_MASTERPLAN §3c/§4a.
contract MHToken is ERC20, ERC20Burnable, Ownable {
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 ether; // 1B, matches Pools.trade fixed supply

    /// @param name_/symbol_ token name + ticker (deploy-time so a test/throwaway deploy can use a neutral name)
    /// @param treasury receives the full initial supply (then seeds the Pools.trade LP)
    constructor(string memory name_, string memory symbol_, address treasury, address initialOwner)
        ERC20(name_, symbol_)
        Ownable(initialOwner)
    {
        require(treasury != address(0), "treasury=0");
        _mint(treasury, TOTAL_SUPPLY);
    }

    // No mint function after deploy: supply is fixed. Deflation comes only from burns.
}
