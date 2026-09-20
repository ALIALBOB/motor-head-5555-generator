// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

interface IRewardPot {
    function fundETH() external payable;
}

/// @title FeeRouter — splits incoming ETH (royalties, trade fees, mint slice).
/// @notice A slice → buy-and-burn $TOKEN + locked LP (later a Uniswap v4 hook; a stub sink for now),
///         then the remainder splits pool/treasury (default 70/30). See FOUNDRY_CONTRACTS_SPEC §8.
/// @dev v1 is a plain splitter anyone can poke; production will move the split into a v4 hook so it's
///      automatic on every trade. Params are owner-editable (behind timelock/multisig in prod).
contract FeeRouter is Ownable {
    IRewardPot public pot;
    address public treasury;
    address public buyBurnSink; // later: DEX buy-burn + LP; for now a plain sink
    uint16 public buyBurnBps;   // slice of the TOTAL (e.g. 500 = 5%)
    uint16 public poolBps;      // of the REMAINDER after buy-burn (e.g. 7000 = 70%)

    event Routed(uint256 total, uint256 buyBurn, uint256 toPool, uint256 toTreasury);

    constructor(
        address _pot,
        address _treasury,
        address _buyBurnSink,
        uint16 _buyBurnBps,
        uint16 _poolBps,
        address initialOwner
    ) Ownable(initialOwner) {
        require(_pot != address(0) && _treasury != address(0) && _buyBurnSink != address(0), "zero");
        require(_buyBurnBps <= 10000 && _poolBps <= 10000, "bps");
        pot = IRewardPot(_pot);
        treasury = _treasury;
        buyBurnSink = _buyBurnSink;
        buyBurnBps = _buyBurnBps;
        poolBps = _poolBps;
    }

    receive() external payable { _route(msg.value); }
    function route() external payable { _route(msg.value); }

    function _route(uint256 amt) internal {
        if (amt == 0) return;
        uint256 bb = (amt * buyBurnBps) / 10000;
        uint256 rem = amt - bb;
        uint256 toPool = (rem * poolBps) / 10000;
        uint256 toTreasury = rem - toPool;
        if (bb > 0) _send(buyBurnSink, bb);
        if (toPool > 0) pot.fundETH{value: toPool}();
        if (toTreasury > 0) _send(treasury, toTreasury);
        emit Routed(amt, bb, toPool, toTreasury);
    }

    function _send(address to, uint256 v) internal {
        (bool ok, ) = to.call{value: v}("");
        require(ok, "send failed");
    }

    // ── owner params ──
    function setSplits(uint16 _buyBurnBps, uint16 _poolBps) external onlyOwner {
        require(_buyBurnBps <= 10000 && _poolBps <= 10000, "bps");
        buyBurnBps = _buyBurnBps;
        poolBps = _poolBps;
    }
    function setSinks(address _pot, address _treasury, address _buyBurnSink) external onlyOwner {
        require(_pot != address(0) && _treasury != address(0) && _buyBurnSink != address(0), "zero");
        pot = IRewardPot(_pot);
        treasury = _treasury;
        buyBurnSink = _buyBurnSink;
    }
}
