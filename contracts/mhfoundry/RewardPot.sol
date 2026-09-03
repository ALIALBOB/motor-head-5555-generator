// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface IWeightRegistry {
    function totalWeight() external view returns (uint256);
    function weightOf(uint256 tokenId) external view returns (uint256);
}

/// @title RewardPot — autonomous ETH accumulator (MasterChef-style). THE trust anchor.
/// @notice Holds the reward ETH. Distributes by weight. The normal ETH-out path is `claim()` by the
///         robot's owner (payout-choice swaps land in a later milestone). See FOUNDRY_CONTRACTS_SPEC §7.
/// @dev acc = ETH-per-unit-weight, scaled by ACC(1e18). A robot's rewardDebt is set to
///      weight*acc at each settle, so it earns ONLY from when it activated forward (anti-snipe).
///
/// @dev TWO-PHASE TRUST MODEL.
///   • CONTROLLED phase (an admin/DEFAULT_ADMIN_ROLE exists): the team can pause and RECOVER the ETH. The intended path is
///     telegraphed — `signalRescue()` (emits) → wait an immutable `rescueDelay` → `pause()` → `emergencyWithdraw()` — but be
///     honest: a present admin ultimately has recovery levers, so this phase means "trust the admin" (which is what you want
///     early / for the throwaway pool). `emergencyWithdraw` is TERMINAL — it sets `drained`, retiring the pot so it can never
///     be re-funded or claimed again (reuse would double-pay from stale accrual); you migrate survivors to a fresh pot.
///   • AUTONOMOUS phase (after `lockRescueForever()`): it unpauses, then RENOUNCES the admin role — afterward NOBODY (team
///     included) can pause, grant SETTLER_ROLE, or move ETH; only claim/fund/settle-by-existing-managers remain.
///   Deploy the throwaway/test pool with `rescueDelay = 0` (instant control); deploy the real pool with a long delay
///   (e.g. 7 days) and call lockRescueForever() once proven.
///   ⚠ PRE-REAL-LAUNCH HARDENING (unaudited): before a real launch also lock SETTLER_ROLE's admin + read the old weight from
///   the registry inside onWeightChange, so even the CONTROLLED phase is telegraphed-only, and get a proper audit.
contract RewardPot is AccessControl, ReentrancyGuard, Pausable {
    /// UpgradeManager holds this — it settles a robot before its weight changes.
    bytes32 public constant SETTLER_ROLE = keccak256("SETTLER_ROLE");

    uint256 private constant ACC = 1e18;

    uint256 public accRewardPerWeight; // scaled by ACC
    uint256 public undistributed;      // ETH that arrived while totalWeight==0 (parked, credited on next fund)
    uint256 public totalClaimed;

    mapping(uint256 => uint256) public rewardDebt; // wei: weight*acc/ACC at last settle
    mapping(uint256 => uint256) public pending;    // wei: settled but unclaimed

    IWeightRegistry public immutable reg;
    IERC721 public immutable robot;

    // ── rescue hatch ──
    uint256 public immutable rescueDelay; // timelock between signal and withdraw (0 = instant, for the test pool)
    bool public rescueLocked;             // one-way: once true, the hatch is gone AND admin is renounced (fully autonomous)
    uint256 public rescueReadyAt;         // 0 = not signalled; else the earliest timestamp emergencyWithdraw is allowed
    bool public drained;                  // one-way TERMINAL: set by emergencyWithdraw — this pot is retired, migrate to a fresh one

    event Funded(uint256 amount, uint256 accRewardPerWeight);
    event Settled(uint256 indexed tokenId, uint256 pending);
    event Claimed(uint256 indexed tokenId, address indexed to, uint256 amount);
    event RescueSignalled(uint256 readyAt);
    event RescueCancelled();
    event RescueLockedForever();
    event EmergencyWithdraw(address indexed to, uint256 amount);

    constructor(address admin, address registry, address robotNft, uint256 rescueDelay_) {
        require(admin != address(0) && registry != address(0) && robotNft != address(0), "zero");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        reg = IWeightRegistry(registry);
        robot = IERC721(robotNft);
        rescueDelay = rescueDelay_;
    }

    // ── funding (permissionless: FeeRouter, royalties, anyone) ──
    receive() external payable { _fund(msg.value); }
    function fundETH() external payable { _fund(msg.value); }

    function _fund(uint256 amount) internal {
        if (amount == 0) return;
        require(!drained, "retired");   // never re-fund a rescued pot (its accrual state is stale → would double-pay)
        uint256 tw = reg.totalWeight();
        if (tw == 0) { undistributed += amount; return; }
        uint256 total = amount + undistributed;
        undistributed = 0;
        accRewardPerWeight += (total * ACC) / tw;
        emit Funded(total, accRewardPerWeight);
    }

    // ── settle (SETTLER_ROLE = UpgradeManager), called with the weight BEFORE and AFTER the change ──
    function onWeightChange(uint256 tokenId, uint256 oldWeight, uint256 newWeight) external onlyRole(SETTLER_ROLE) {
        uint256 acc = accRewardPerWeight;
        pending[tokenId] += (oldWeight * acc) / ACC - rewardDebt[tokenId];
        rewardDebt[tokenId] = (newWeight * acc) / ACC;
        emit Settled(tokenId, pending[tokenId]);
    }

    // ── views ──
    function pendingOf(uint256 tokenId) public view returns (uint256) {
        uint256 w = reg.weightOf(tokenId);
        return pending[tokenId] + (w * accRewardPerWeight) / ACC - rewardDebt[tokenId];
    }

    // ── claim (owner-only; the normal ETH-out path) ──
    function claim(uint256 tokenId) external nonReentrant whenNotPaused returns (uint256 owed) {
        require(!drained, "retired");
        require(robot.ownerOf(tokenId) == msg.sender, "not owner");
        owed = pendingOf(tokenId);
        require(owed > 0, "nothing to claim");
        // rounding-dust guard: integer division at settle boundaries can make the SUM of
        // entitlements exceed the balance by a few wei — never try to send more than we hold,
        // so a claim can't revert (or drain) on rounding. The last claimer eats the tiny dust.
        uint256 bal = address(this).balance;
        if (owed > bal) owed = bal;
        pending[tokenId] = 0;
        rewardDebt[tokenId] = (reg.weightOf(tokenId) * accRewardPerWeight) / ACC;
        totalClaimed += owed;
        (bool ok, ) = msg.sender.call{value: owed}("");
        require(ok, "send failed");
        emit Claimed(tokenId, msg.sender, owed);
    }

    // ── pause (admin kill-switch for claims; also required before a rescue) ──
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) { _pause(); }
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) { _unpause(); }

    // ── rescue hatch: TELEGRAPHED recovery of the pot's ETH (see contract-level doc) ──

    /// Start the rescue timelock. Emits so holders can see it coming. Re-callable (resets the clock).
    function signalRescue() external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(!rescueLocked, "rescue locked");
        rescueReadyAt = block.timestamp + rescueDelay;
        emit RescueSignalled(rescueReadyAt);
    }

    /// Abort a pending rescue.
    function cancelRescue() external onlyRole(DEFAULT_ADMIN_ROLE) {
        rescueReadyAt = 0;
        emit RescueCancelled();
    }

    /// One-way, TRUSTLESS hand-off: locks the rescue hatch AND renounces the admin role entirely, so afterward NObody
    /// — including the team — can pause, grant SETTLER_ROLE, or move ETH. Only claim()/fund()/settle-by-existing-managers
    /// remain. Unpauses first so it can never renounce into a permanently-frozen (unclaimable) state. Cannot be undone.
    function lockRescueForever() external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(!drained, "retired");
        rescueLocked = true;
        rescueReadyAt = 0;
        if (paused()) _unpause();                          // never hand off into a claims-frozen state (funds would be stranded)
        emit RescueLockedForever();
        _revokeRole(DEFAULT_ADMIN_ROLE, msg.sender);       // hand off: no admin left to self-grant SETTLER_ROLE or forge a drain
    }

    /// Recover the pot's ETH to `to`. Only after: not locked, a signal + its timelock elapsed, AND paused (so the action
    /// is loud + deliberate). TERMINAL: marks the pot `drained` — it can never be re-funded or claimed again (reusing a
    /// rescued pot would double-pay from stale accrual state). Migrate survivors to a freshly-deployed pot.
    function emergencyWithdraw(address to) external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant whenPaused {
        require(!rescueLocked, "rescue locked");
        require(!drained, "retired");
        require(rescueReadyAt != 0 && block.timestamp >= rescueReadyAt, "not ready");
        require(to != address(0), "zero");
        rescueReadyAt = 0;                          // effects before interaction (re-arm requires a fresh signal)
        drained = true;                             // terminal: retire the pot so it can't be reused into a double-pay
        undistributed = 0;                          // parked ETH is leaving too — don't let a later fund re-credit phantom entitlements
        uint256 amount = address(this).balance;
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "send failed");
        emit EmergencyWithdraw(to, amount);
    }
}
