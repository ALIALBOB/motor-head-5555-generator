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
    }
  }
};
