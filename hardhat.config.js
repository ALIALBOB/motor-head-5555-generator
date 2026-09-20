// Hardhat config for the prototype.
// Codex/dev notes:
// - This project uses an upgradeable UUPS ERC721 so the logic can evolve later.
// - Keep storage-layout compatibility when upgrading the Solidity contract.
// - Put RPC/API keys in .env, never in the repo.

require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");
require("solidity-coverage");

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true
    }
  },
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true
    },
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : []
    },
    mainnet: {
      url: process.env.MAINNET_RPC_URL || "https://ethereum-rpc.publicnode.com",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : []
    },
    // ── MotorHeads Foundry (3D) — Robinhood Chain (Arbitrum Orbit L2, ETH gas) ──
    robinhoodTestnet: {
      url: process.env.ROBINHOOD_TESTNET_RPC_URL || "https://rpc.testnet.chain.robinhood.com/rpc",
      chainId: 46630,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : []
    },
    robinhoodMainnet: {
      url: process.env.ROBINHOOD_RPC_URL || "https://rpc.mainnet.chain.robinhood.com",
      chainId: 4663,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : []
    }
  },
  // Contract verification on Robinhood Chain — Blockscout (Etherscan-compatible API). The apiKey value is
  // ignored by Blockscout but hardhat-verify requires a non-empty string per network.
  //   npx hardhat verify --network robinhoodMainnet <address> <constructor args...>
  etherscan: {
    apiKey: {
      robinhoodMainnet: process.env.BLOCKSCOUT_API_KEY || "blockscout",
      robinhoodTestnet: process.env.BLOCKSCOUT_API_KEY || "blockscout"
    },
    customChains: [
      {
        network: "robinhoodMainnet",
        chainId: 4663,
        urls: { apiURL: "https://robinhoodchain.blockscout.com/api", browserURL: "https://robinhoodchain.blockscout.com" }
      },
      {
        network: "robinhoodTestnet",
        chainId: 46630,
        urls: { apiURL: "https://explorer.testnet.chain.robinhood.com/api", browserURL: "https://explorer.testnet.chain.robinhood.com" }
      }
    ]
  },
  sourcify: { enabled: false }
};
