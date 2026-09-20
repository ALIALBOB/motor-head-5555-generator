// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface IBurnableToken is IERC20 {
    function burn(uint256 amount) external;
}
interface IWeightReg {
    function weightOf(uint256 tokenId) external view returns (uint256);
    function bonusWeightOf(uint256 tokenId) external view returns (uint256);
    function tierOf(uint256 tokenId) external view returns (uint8);
    function setTier(uint256 tokenId, uint8 tier, uint96 baseWeight) external;
}
interface IRewardPotSettle {
    function onWeightChange(uint256 tokenId, uint256 oldWeight, uint256 newWeight) external;
}

/// @title UpgradeManager — activate/upgrade a robot by spending $TOKEN.
/// @notice Pulls the $TOKEN fee, **burns ~50%** (deflation), sends the rest to treasury, and sets the
///         robot's tier+weight — atomically settling its RewardPot position first (so weight changes
///         never corrupt accrual). This is the "spend $TOKEN → gain reward weight → earn ETH" engine.
///         Replaces the test MockUpgrader. Reward ETH is NOT touched here (pool is fed by ETH fees).
/// @dev Tier tables are editable params (timelock/multisig in prod). Start LOW. See FOUNDRY_CONTRACTS_SPEC §5.
contract UpgradeManager is Ownable, Pausable {
    using SafeERC20 for IERC20;

    IBurnableToken public token;
    IERC721 public robot;
    IWeightReg public reg;
    IRewardPotSettle public pot;
    address public treasury;
    uint16 public burnBps; // 5000 = 50% of each fee burned

    // index 1..maxTier ; index 0 = un-activated (cost 0, weight 0)
    uint256[] public tierCostCumulative; // $TOKEN wei, cumulative from T1
    uint96[] public tierWeight;          // integer weight units (T1=100, ... T5=2200)

    event Activated(uint256 indexed tokenId, uint8 tier, uint96 weight, uint256 paid);
    event Upgraded(uint256 indexed tokenId, uint8 fromTier, uint8 toTier, uint96 weight, uint256 paid);

    constructor(
        address _token,
        address _robot,
        address _reg,
        address _pot,
        address _treasury,
        uint16 _burnBps,
        uint256[] memory _costs,
        uint96[] memory _weights,
        address initialOwner
    ) Ownable(initialOwner) {
        require(_costs.length == _weights.length && _costs.length >= 2, "tiers");
        require(_costs[0] == 0 && _weights[0] == 0, "tier0");
        require(_burnBps <= 10000, "bps");
        require(_treasury != address(0), "treasury");
        token = IBurnableToken(_token);
        robot = IERC721(_robot);
        reg = IWeightReg(_reg);
        pot = IRewardPotSettle(_pot);
        treasury = _treasury;
        burnBps = _burnBps;
        tierCostCumulative = _costs;
        tierWeight = _weights;
    }

    function maxTier() public view returns (uint8) {
        return uint8(tierWeight.length - 1);
    }

    function activate(uint256 tokenId) external whenNotPaused {
        require(robot.ownerOf(tokenId) == msg.sender, "not owner");
        require(reg.tierOf(tokenId) == 0, "already active");
        uint256 cost = tierCostCumulative[1];
        _charge(cost);
        _setTier(tokenId, 1);
        emit Activated(tokenId, 1, tierWeight[1], cost);
    }

    function upgrade(uint256 tokenId, uint8 toTier) external whenNotPaused {
        require(robot.ownerOf(tokenId) == msg.sender, "not owner");
        uint8 cur = reg.tierOf(tokenId);
        require(cur >= 1, "activate first");
        require(toTier > cur && toTier <= maxTier(), "bad tier");
        uint256 cost = tierCostCumulative[toTier] - tierCostCumulative[cur];
        _charge(cost);
        _setTier(tokenId, toTier);
        emit Upgraded(tokenId, cur, toTier, tierWeight[toTier], cost);
    }

    // ── internal ──
    function _charge(uint256 cost) internal {
        if (cost == 0) return;
        IERC20(address(token)).safeTransferFrom(msg.sender, address(this), cost);
        uint256 burnAmt = (cost * burnBps) / 10000;
        if (burnAmt > 0) token.burn(burnAmt); // burns from this contract's own balance
        uint256 rest = cost - burnAmt;
        if (rest > 0) IERC20(address(token)).safeTransfer(treasury, rest);
    }

    function _setTier(uint256 tokenId, uint8 tier) internal {
        uint256 oldW = reg.weightOf(tokenId);
        uint96 base = tierWeight[tier];
        uint256 newW = uint256(base) + reg.bonusWeightOf(tokenId); // preserve the customization bonus through upgrades
        pot.onWeightChange(tokenId, oldW, newW); // settle at current acc BEFORE weight moves
        reg.setTier(tokenId, tier, base);
    }

    // ── owner params (timelock/multisig in prod) ──
    function setTierTables(uint256[] calldata _costs, uint96[] calldata _weights) external onlyOwner {
        require(_costs.length == _weights.length && _costs.length >= 2, "tiers");
        require(_costs[0] == 0 && _weights[0] == 0, "tier0");
        tierCostCumulative = _costs;
        tierWeight = _weights;
    }
    function setBurnBps(uint16 _bps) external onlyOwner { require(_bps <= 10000, "bps"); burnBps = _bps; }
    function setTreasury(address _t) external onlyOwner { require(_t != address(0), "zero"); treasury = _t; }
    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}
