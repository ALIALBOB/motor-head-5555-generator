// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/*
    FoundryForge — tiers and parts of the MotorHeads Foundry, on chain.

    Founder 2026-09-19: "activation and tier should be on chain so no one, not even our database, can mess with that",
    and a bought part should belong to the ROBOT the way a crate part already does, so it is sold with it.

    What this contract owns, in the open:
      - tier(tokenId)      the paid tier of a robot. ACTIVATION stays where it already is — ScrapCrates.activated() —
                           so tier 1 means "activated", and this contract only ever sells steps 2..MAX_TIER.
      - buyPart()          takes the price in ETH and mints that ScrapParts id into the ROBOT'S GARAGE (the ERC-6551
                           account ScrapCrates derives), exactly where a crate part lands. It therefore transfers with
                           the NFT, and its owner can move it to another robot only by a deliberate transfer out of
                           the garage — which is a visible transaction, not a silent strip.

    The money never rests here: every payment is forwarded to `treasury` in the same transaction, and anything over the
    price is refunded to the payer. So this contract holds no balance to steal, and `sweep()` exists only for ETH sent
    to it by accident.

    The SITE FEE (about a dollar, the founder's flat fee on every change) rides on the same payment. It is read from a
    Chainlink ETH/USD feed so it needs no upkeep; if the feed is missing, stale or out of a sane range the contract
    falls back to `feeFallbackWei`. Prices, the fee and the treasury are the owner's to set, and every change is an event.

    What it enforces on its own:
      - only the robot's current owner can upgrade it or buy a part for it;
      - a robot must be activated before it can be upgraded or given a part;
      - the tier only ever moves one step, never past MAX_TIER, and only after the step's price is paid;
      - a part that the robot's garage already holds cannot be sold to it twice;
      - a part that has no price is not for sale (crate-only parts stay crate-only);
      - every wei taken goes to the treasury, and the payer gets the change back.
*/

import {Ownable, Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

interface IScrapPartsMint {
    function mint(address to, uint256 id, uint256 amount) external;
}

interface IScrapCratesView {
    function garageOf(uint256 tokenId) external view returns (address);
    function activated(uint256 tokenId) external view returns (bool);
    // the garage derivation, read from the crates contract so this one never hard-codes it
    function registry() external view returns (address);
    function accountImplementation() external view returns (address);
    function accountSalt() external view returns (bytes32);
}

interface IERC6551Registry {
    function createAccount(address implementation, bytes32 salt, uint256 chainId, address tokenContract, uint256 tokenId) external returns (address);
}

interface IAccountProxy {
    function initialize(address implementation) external;
}

interface IEthUsdFeed {
    function latestRoundData() external view returns (uint80, int256, uint256, uint256, uint80);
}

contract FoundryForge is Ownable2Step, ReentrancyGuard, Pausable {
    uint8 public constant MAX_TIER = 5;

    IERC721 public immutable collection;      // the 5555 MotorHeads
    IScrapPartsMint public immutable parts;   // ScrapParts (this contract needs its MINTER_ROLE)
    IERC1155 public immutable partsToken;     // the same contract, read as ERC-1155
    IScrapCratesView public immutable crates; // ScrapCrates: garageOf() + activated()

    address public treasury;

    mapping(uint256 => uint8) public tier;           // tokenId -> paid tier (0 = never upgraded here)
    mapping(uint8 => uint256) public tierPriceWei;   // the price to REACH this tier (index 2..MAX_TIER)
    mapping(uint256 => uint256) public partPriceWei; // ScrapParts id -> price (0 = not for sale)

    /// The garage is a token-bound account that exists only on paper until somebody creates it — holding parts needs no
    /// account, but handing one out does. `prepareGarage` brings it to life so its owner can then allow this contract to
    /// move parts out of it. Set by the owner because the crates contract does not know which build the proxy runs.
    address public accountImpl;

    IEthUsdFeed public ethUsdFeed;      // Chainlink ETH/USD (8 decimals); address(0) = use the fallback
    uint256 public feeUsdCents;         // the site fee in cents, e.g. 100 = $1 (0 = no fee)
    uint256 public feeFallbackWei;      // used when the feed cannot be trusted
    uint256 public constant FEE_MAX_WEI = 0.01 ether;   // a hard ceiling, so a broken feed can never overcharge

    event Upgraded(uint256 indexed tokenId, uint8 indexed toTier, uint256 pricePaidWei, uint256 feePaidWei);
    event PartBought(uint256 indexed tokenId, uint256 indexed partId, address garage, uint256 pricePaidWei, uint256 feePaidWei);
    event PartMoved(uint256 indexed fromTokenId, uint256 indexed toTokenId, uint256 indexed partId, uint256 feePaidWei);
    event TierPriceSet(uint8 indexed toTier, uint256 priceWei);
    event PartPriceSet(uint256 indexed partId, uint256 priceWei);
    event TiersSeeded(uint256 count);
    event TreasurySet(address indexed treasury);
    event FeeSet(address feed, uint256 usdCents, uint256 fallbackWei);
    event Swept(address indexed to, uint256 amount);
    event GaragePrepared(uint256 indexed tokenId, address garage);
    event AccountImplSet(address accountImpl);

    error NotOwner();
    error NotActivated();
    error TierTooHigh();
    error NotForSale();
    error AlreadyHeld();
    error Underpaid(uint256 needWei);
    error BadAddress();
    error LengthMismatch();
    error TransferFailed();
    error SameRobot();
    error NotHeld();
    error NotApproved();
    error NoAccountImpl();

    constructor(address collection_, address parts_, address crates_, address treasury_, address owner_) Ownable(owner_) {
        if (collection_ == address(0) || parts_ == address(0) || crates_ == address(0) || treasury_ == address(0)) revert BadAddress();
        collection = IERC721(collection_);
        parts = IScrapPartsMint(parts_);
        partsToken = IERC1155(parts_);
        crates = IScrapCratesView(crates_);
        treasury = treasury_;
        feeFallbackWei = 0.0003 ether;
    }

    // ------------------------------------------------------------------ what a robot is worth right now

    /// tier 0 = not activated, 1 = activated, 2..MAX_TIER = paid steps. The same rule the site and the backend use.
    function tierOf(uint256 tokenId) public view returns (uint8) {
        if (!crates.activated(tokenId)) return 0;
        uint8 t = tier[tokenId];
        return t < 1 ? 1 : t;
    }

    /// the site fee in wei, from the feed when it can be trusted, else the fallback. Never above FEE_MAX_WEI.
    function siteFeeWei() public view returns (uint256) {
        if (feeUsdCents == 0) return 0;
        uint256 wei_ = feeFallbackWei;
        if (address(ethUsdFeed) != address(0)) {
            try ethUsdFeed.latestRoundData() returns (uint80, int256 answer, uint256, uint256 updatedAt, uint80) {
                // $100 .. $100,000 per ETH, and answered within a day: anything else and the fallback is safer
                if (answer > 100e8 && answer < 100000e8 && updatedAt > 0 && block.timestamp - updatedAt < 1 days) {
                    wei_ = (feeUsdCents * 1e24) / uint256(answer);
                }
            } catch {}
        }
        return wei_ > FEE_MAX_WEI ? FEE_MAX_WEI : wei_;
    }

    /// what the next tier costs a robot right now, fee included. next == 0 means there is no next tier.
    function upgradeQuote(uint256 tokenId) external view returns (uint8 next, uint256 totalWei) {
        uint8 t = tierOf(tokenId);
        if (t == 0 || t >= MAX_TIER) return (0, 0);
        next = t + 1;
        totalWei = tierPriceWei[next] + siteFeeWei();
    }

    /// what a part costs for a robot right now, fee included. forSale is false when it is crate-only or already held.
    function partQuote(uint256 tokenId, uint256 partId) external view returns (bool forSale, uint256 totalWei) {
        uint256 price = partPriceWei[partId];
        if (price == 0) return (false, 0);
        if (partsToken.balanceOf(crates.garageOf(tokenId), partId) > 0) return (false, 0);
        return (true, price + siteFeeWei());
    }

    // ------------------------------------------------------------------ paying

    function upgrade(uint256 tokenId) external payable nonReentrant whenNotPaused {
        if (collection.ownerOf(tokenId) != msg.sender) revert NotOwner();
        uint8 from = tierOf(tokenId);
        if (from == 0) revert NotActivated();
        if (from >= MAX_TIER) revert TierTooHigh();
        uint8 to = from + 1;
        uint256 price = tierPriceWei[to];
        if (price == 0) revert NotForSale();
        uint256 fee = siteFeeWei();
        _take(price + fee);
        tier[tokenId] = to;
        emit Upgraded(tokenId, to, price, fee);
    }

    function buyPart(uint256 tokenId, uint256 partId) external payable nonReentrant whenNotPaused {
        if (collection.ownerOf(tokenId) != msg.sender) revert NotOwner();
        if (!crates.activated(tokenId)) revert NotActivated();
        uint256 price = partPriceWei[partId];
        if (price == 0) revert NotForSale();
        address garage = crates.garageOf(tokenId);
        if (partsToken.balanceOf(garage, partId) > 0) revert AlreadyHeld();
        uint256 fee = siteFeeWei();
        _take(price + fee);
        parts.mint(garage, partId, 1);   // straight into the robot's own account: it is the robot's from here on
        emit PartBought(tokenId, partId, garage, price, fee);
    }

    /// Bring a robot's garage to life: create the token-bound account and point it at the account build. Permissionless —
    /// it can only ever create the one account that address already stands for, and it does nothing if it already exists.
    function prepareGarage(uint256 tokenId) public returns (address garage) {
        garage = crates.garageOf(tokenId);
        if (garage.code.length != 0) return garage;
        if (accountImpl == address(0)) revert NoAccountImpl();
        IERC6551Registry(crates.registry()).createAccount(crates.accountImplementation(), crates.accountSalt(), block.chainid, address(collection), tokenId);
        IAccountProxy(garage).initialize(accountImpl);
        emit GaragePrepared(tokenId, garage);
    }

    /// has this robot's garage been brought to life yet?
    function garageReady(uint256 tokenId) external view returns (bool) {
        return crates.garageOf(tokenId).code.length != 0;
    }

    function setAccountImpl(address impl) external onlyOwner {
        accountImpl = impl;
        emit AccountImplSet(impl);
    }

    /// Can this robot's garage hand its parts to another robot? It must have approved this contract once, which the owner
    /// does through the garage itself — this contract can never grant itself that right.
    function canMoveFrom(uint256 tokenId) external view returns (bool) {
        return partsToken.isApprovedForAll(crates.garageOf(tokenId), address(this));
    }

    /// Move a part from one of your robots to another of your robots. Both must be yours, the part must actually be on the
    /// first one and not already on the second, and the site fee is paid in the same transaction. The part stays a real
    /// token the whole way: it leaves one garage and enters the other.
    function movePart(uint256 fromTokenId, uint256 toTokenId, uint256 partId) external payable nonReentrant whenNotPaused {
        if (fromTokenId == toTokenId) revert SameRobot();
        if (collection.ownerOf(fromTokenId) != msg.sender) revert NotOwner();
        if (collection.ownerOf(toTokenId) != msg.sender) revert NotOwner();
        if (!crates.activated(toTokenId)) revert NotActivated();
        address from = prepareGarage(fromTokenId);   // a garage that was never used is created here, not left to fail
        address to = crates.garageOf(toTokenId);
        if (partsToken.balanceOf(from, partId) == 0) revert NotHeld();
        if (partsToken.balanceOf(to, partId) > 0) revert AlreadyHeld();
        if (!partsToken.isApprovedForAll(from, address(this))) revert NotApproved();
        uint256 fee = siteFeeWei();
        _take(fee);
        partsToken.safeTransferFrom(from, to, partId, 1, "");
        emit PartMoved(fromTokenId, toTokenId, partId, fee);
    }

    /// take `need`, send it to the treasury, and hand the payer back anything extra (the fee moves with the ETH price,
    /// so a payment quoted a moment ago may arrive a little over).
    function _take(uint256 need) private {
        if (msg.value < need) revert Underpaid(need);
        (bool ok, ) = payable(treasury).call{value: need}("");
        if (!ok) revert TransferFailed();
        uint256 extra = msg.value - need;
        if (extra > 0) {
            (bool back, ) = payable(msg.sender).call{value: extra}("");
            if (!back) revert TransferFailed();
        }
    }

    // ------------------------------------------------------------------ the owner's controls

    function setTierPrice(uint8 toTier, uint256 priceWei) external onlyOwner {
        if (toTier < 2 || toTier > MAX_TIER) revert TierTooHigh();
        tierPriceWei[toTier] = priceWei;
        emit TierPriceSet(toTier, priceWei);
    }

    function setPartPrice(uint256 partId, uint256 priceWei) external onlyOwner {
        partPriceWei[partId] = priceWei;
        emit PartPriceSet(partId, priceWei);
    }

    function setPartPrices(uint256[] calldata partIds, uint256[] calldata pricesWei) external onlyOwner {
        if (partIds.length != pricesWei.length) revert LengthMismatch();
        for (uint256 i = 0; i < partIds.length; i++) {
            partPriceWei[partIds[i]] = pricesWei[i];
            emit PartPriceSet(partIds[i], pricesWei[i]);
        }
    }

    /// Carry the tiers robots already paid for into this contract. Only ever raises a tier, so running it twice, or
    /// after someone has upgraded here, can never take a tier away.
    function seedTiers(uint256[] calldata tokenIds, uint8[] calldata tiers) external onlyOwner {
        if (tokenIds.length != tiers.length) revert LengthMismatch();
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint8 t = tiers[i];
            if (t > MAX_TIER) revert TierTooHigh();
            if (t > tier[tokenIds[i]]) tier[tokenIds[i]] = t;
        }
        emit TiersSeeded(tokenIds.length);
    }

    function setTreasury(address treasury_) external onlyOwner {
        if (treasury_ == address(0)) revert BadAddress();
        treasury = treasury_;
        emit TreasurySet(treasury_);
    }

    function setFee(address feed, uint256 usdCents, uint256 fallbackWei) external onlyOwner {
        if (fallbackWei > FEE_MAX_WEI) revert Underpaid(FEE_MAX_WEI);
        ethUsdFeed = IEthUsdFeed(feed);
        feeUsdCents = usdCents;
        feeFallbackWei = fallbackWei;
        emit FeeSet(feed, usdCents, fallbackWei);
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    /// nothing should ever rest here; this exists for ETH sent by accident, and it can only go to the treasury.
    function sweep() external nonReentrant {
        uint256 bal = address(this).balance;
        if (bal == 0) return;
        (bool ok, ) = payable(treasury).call{value: bal}("");
        if (!ok) revert TransferFailed();
        emit Swept(treasury, bal);
    }
}
