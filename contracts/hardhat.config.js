require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000001";
const CELOSCAN_API_KEY = process.env.CELOSCAN_API_KEY || "";
const ALFAJORES_RPC_URL = process.env.ALFAJORES_RPC_URL || "";
const CELO_SEPOLIA_RPC_URL = process.env.CELO_SEPOLIA_RPC_URL || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {},
    alfajores: {
      url: ALFAJORES_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 44787,
    },
    celoSepolia: {
      url: CELO_SEPOLIA_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 11142220,
    },
    celo: {
      url: "https://forno.celo.org",
      accounts: [PRIVATE_KEY],
      chainId: 42220,
    },
  },
  sourcify: {
    enabled: true,
  },
  etherscan: {
    apiKey: {
      alfajores: CELOSCAN_API_KEY,
      celoSepolia: CELOSCAN_API_KEY,
      celo: CELOSCAN_API_KEY,
    },
    customChains: [
      {
        network: "alfajores",
        chainId: 44787,
        urls: {
          apiURL: "https://api-alfajores.celoscan.io/api",
          browserURL: "https://alfajores.celoscan.io",
        },
      },
      {
        network: "celoSepolia",
        chainId: 11142220,
        urls: {
          apiURL: "https://celo-sepolia.blockscout.com/api",
          browserURL: "https://celo-sepolia.blockscout.com",
        },
      },
      {
        network: "celo",
        chainId: 42220,
        urls: {
          apiURL: "https://api.celoscan.io/api",
          browserURL: "https://celoscan.io",
        },
      },
    ],
  },
};
