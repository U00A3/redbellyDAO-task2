import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "solidity-coverage";
import "dotenv/config";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    hardhat: {
      accounts: { count: 20 },
    },
    redbellyTestnet: {
      url:
        process.env.REDBELLY_TESTNET_RPC ||
        "https://rpc-testnet.redbelly.network",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 153,
    },
  },
};

export default config;
