// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// test doubles for FoundryRewardPool

/// an ERC-721 reduced to what the pool reads: ownerOf, settable by the test
contract MockRobots {
    mapping(uint256 => address) private _owner;
    function setOwner(uint256 tokenId, address owner_) external { _owner[tokenId] = owner_; }
    function ownerOf(uint256 tokenId) external view returns (address) {
        address o = _owner[tokenId];
        require(o != address(0), "ERC721: invalid token ID");
        return o;
    }
}

interface IPool {
    function claim(uint256 roundId, uint256[] calldata tokenIds, uint256[] calldata amounts, bytes32[][] calldata proofs) external;
}

/// owns a robot and tries to claim AGAIN from inside the ETH transfer of its first claim
contract ReentrantPoolClaimer {
    IPool public pool; uint256 public roundId; uint256[] public ids; uint256[] public amts; bytes32[][] public prf; bool public tried; bool public reentered;
    function arm(address pool_, uint256 roundId_, uint256[] calldata ids_, uint256[] calldata amts_, bytes32[][] calldata prf_) external {
        pool = IPool(pool_); roundId = roundId_; ids = ids_; amts = amts_; delete prf; for (uint256 i = 0; i < prf_.length; i++) prf.push(prf_[i]);
    }
    function go() external { pool.claim(roundId, ids, amts, prf); }
    receive() external payable {
        if (!tried) { tried = true; try pool.claim(roundId, ids, amts, prf) { reentered = true; } catch { reentered = false; } }
    }
}

/// a robot owner that cannot receive ETH
contract NoEthOwner {
    function go(address pool_, uint256 roundId_, uint256[] calldata ids_, uint256[] calldata amts_, bytes32[][] calldata prf_) external { IPool(pool_).claim(roundId_, ids_, amts_, prf_); }
}
