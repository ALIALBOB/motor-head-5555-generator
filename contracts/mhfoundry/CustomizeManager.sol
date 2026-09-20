// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface IBurnableToken2 is IERC20 {
    function burn(uint256 amount) external;
}
interface IWeightRegC {
    function weightOf(uint256 tokenId) external view returns (uint256);
    function baseWeightOf(uint256 tokenId) external view returns (uint256);
    function bonusWeightOf(uint256 tokenId) external view returns (uint256);
    function setBonus(uint256 tokenId, uint96 bonusWeight) external;
}
interface IPotC {
    function onWeightChange(uint256 tokenId, uint256 oldWeight, uint256 newWeight) external;
}

/// @title CustomizeManager (M3.6) — a priced item CATALOG with USD-stable pricing + capped weight + custom 1-of-1s.
/// @notice Each item has a price in USD (so token-price swings don't break your pricing) and an optional CAPPED
///         weight bonus. Buying charges $TOKEN at the live admin rate, burns ~50%, rest→treasury, and (for weighted
///         items) nudges the robot's bonus weight up to the cap. Recolor = cosmetic. Custom 1-of-1s are team-granted
///         after you build the art. See FOUNDRY_MASTERPLAN §4g. Parts+custom share one capped lane (default +10% of base).
contract CustomizeManager is Ownable, Pausable {
    using SafeERC20 for IERC20;

    IBurnableToken2 public token;
    IERC721 public robot;
    IWeightRegC public reg;
    IPotC public pot;
    address public treasury;
    uint16 public burnBps;        // 5000 = 50% of each fee burned
    uint16 public bonusCapBps;    // parts+custom combined weight cap = this % of base (default 1000 = 10%)
    uint256 public tokenPerUsd;   // $TOKEN wei charged per 1 USD (admin "rate" — set as market moves). 0 = free/paused pricing.
    uint32 public recolorPriceUsdCents; // cosmetic recolor price (no weight)

    struct Item { uint32 priceUsdCents; uint16 weightBps; bool active; } // weightBps = % of base weight this item adds
    mapping(uint256 => Item) public items; // itemId => Item

    event ItemSet(uint256 indexed itemId, uint32 priceUsdCents, uint16 weightBps, bool active);
    event Bought(uint256 indexed tokenId, uint256 indexed itemId, uint256 paidToken, uint256 newBonusWeight);
    event CustomGranted(uint256 indexed tokenId, string ref, uint16 weightBps, uint256 newBonusWeight);
    event Recolored(uint256 indexed tokenId, string colorway, uint256 paidToken);

    constructor(
        address _token, address _robot, address _reg, address _pot,
        address _treasury, uint16 _burnBps, uint256 _tokenPerUsd, address initialOwner
    ) Ownable(initialOwner) {
        require(_treasury != address(0), "treasury");
        require(_burnBps <= 10000, "bps");
        token = IBurnableToken2(_token);
        robot = IERC721(_robot);
        reg = IWeightRegC(_reg);
        pot = IPotC(_pot);
        treasury = _treasury;
        burnBps = _burnBps;
        tokenPerUsd = _tokenPerUsd;
        bonusCapBps = 1000; // +10% (parts +5% + custom +5%) — editable
    }

    /// @notice $TOKEN cost of an item at the current USD rate.
    function costOf(uint256 itemId) public view returns (uint256) {
        return (uint256(items[itemId].priceUsdCents) * tokenPerUsd) / 100;
    }

    /// @notice Buy a catalog item for your robot → pay $TOKEN, burn, and (if weighted) add capped bonus weight.
    function buyItem(uint256 tokenId, uint256 itemId) external whenNotPaused {
        require(robot.ownerOf(tokenId) == msg.sender, "not owner");
        Item memory it = items[itemId];
        require(it.active, "item inactive");
        uint256 cost = (uint256(it.priceUsdCents) * tokenPerUsd) / 100;
        _charge(cost);
        if (it.weightBps > 0) _addBonus(tokenId, it.weightBps);
        emit Bought(tokenId, itemId, cost, reg.bonusWeightOf(tokenId));
    }

    /// @notice Team grants a bespoke 1-of-1 (after the holder paid + you built the art) — binds the ref + capped weight.
    function grantCustom(uint256 tokenId, string calldata ref, uint16 weightBps) external onlyOwner {
        if (weightBps > 0) _addBonus(tokenId, weightBps);
        emit CustomGranted(tokenId, ref, weightBps, reg.bonusWeightOf(tokenId));
    }

    /// @notice Recolor — cosmetic, priced in USD, NO weight.
    function recolor(uint256 tokenId, string calldata colorway) external whenNotPaused {
        require(robot.ownerOf(tokenId) == msg.sender, "not owner");
        uint256 cost = (uint256(recolorPriceUsdCents) * tokenPerUsd) / 100;
        _charge(cost);
        emit Recolored(tokenId, colorway, cost);
    }

    // ── internal ──
    function _charge(uint256 cost) internal {
        if (cost == 0) return;
        IERC20(address(token)).safeTransferFrom(msg.sender, address(this), cost);
        uint256 burnAmt = (cost * burnBps) / 10000;
        if (burnAmt > 0) token.burn(burnAmt);
        uint256 rest = cost - burnAmt;
        if (rest > 0) IERC20(address(token)).safeTransfer(treasury, rest);
    }

    function _addBonus(uint256 tokenId, uint16 addBps) internal {
        uint256 base = reg.baseWeightOf(tokenId);
        if (base == 0) return; // must be activated to earn bonus weight
        uint256 cap = (base * bonusCapBps) / 10000;
        uint256 cur = reg.bonusWeightOf(tokenId);
        if (cur >= cap) return;
        uint256 next = cur + (base * addBps) / 10000;
        if (next > cap) next = cap;
        uint256 oldW = reg.weightOf(tokenId);
        pot.onWeightChange(tokenId, oldW, base + next); // settle before weight change
        reg.setBonus(tokenId, uint96(next));
    }

    // ── owner / catalog admin ──
    function setItem(uint256 itemId, uint32 priceUsdCents, uint16 weightBps, bool active) external onlyOwner {
        items[itemId] = Item(priceUsdCents, weightBps, active);
        emit ItemSet(itemId, priceUsdCents, weightBps, active);
    }
    function setTokenPerUsd(uint256 rate) external onlyOwner { tokenPerUsd = rate; } // change as token price moves
    function setRecolorPrice(uint32 usdCents) external onlyOwner { recolorPriceUsdCents = usdCents; }
    function setBonusCap(uint16 capBps) external onlyOwner { require(capBps <= 10000, "bps"); bonusCapBps = capBps; }
    function setBurnBps(uint16 _bps) external onlyOwner { require(_bps <= 10000, "bps"); burnBps = _bps; }
    function setTreasury(address _t) external onlyOwner { require(_t != address(0), "zero"); treasury = _t; }
    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}
