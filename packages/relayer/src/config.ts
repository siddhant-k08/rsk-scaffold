import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  relayerPrivateKey: process.env.RELAYER_PRIVATE_KEY || "",
  rpcUrl: process.env.ROOTSTOCK_RPC_URL || "https://rpc.testnet.rootstock.io",
  forwarderAddress: (process.env.FORWARDER_ADDRESS || "") as `0x${string}`,
  exampleTargetAddress: (process.env.EXAMPLE_TARGET_ADDRESS || "") as `0x${string}`,
  chainId: 31,
};

if (!config.relayerPrivateKey) {
  console.warn("⚠️  RELAYER_PRIVATE_KEY not set in .env");
}

if (!config.forwarderAddress) {
  console.warn("⚠️  FORWARDER_ADDRESS not set in .env");
}

if (!config.exampleTargetAddress) {
  console.warn("⚠️  EXAMPLE_TARGET_ADDRESS not set in .env");
}
